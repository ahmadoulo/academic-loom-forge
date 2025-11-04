import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Checking for sessions that need absence notifications...');

    // Get current time
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000); // 1 minute ago
    const tenMinutesAgo = new Date(now.getTime() - 600000); // 10 minutes ago

    // Find assignments (sessions) that ended between 1-10 minutes ago
    // AND where absence notifications haven't been sent yet
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        session_date,
        start_time,
        end_time,
        class_id,
        subject_id,
        absence_notification_sent,
        classes!inner(
          id,
          name,
          school_id
        ),
        subjects(
          id,
          name
        )
      `)
      .not('session_date', 'is', null)
      .not('end_time', 'is', null)
      .eq('absence_notification_sent', false)
      .gte('session_date', tenMinutesAgo.toISOString().split('T')[0])
      .lte('session_date', now.toISOString().split('T')[0]);

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      throw assignmentsError;
    }

    console.log(`📋 Found ${assignments?.length || 0} assignments to check`);

    if (!assignments || assignments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No assignments to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let processedCount = 0;
    let notificationsSent = 0;

    for (const assignment of assignments) {
      console.log(`📝 Checking assignment ${assignment.id}: ${assignment.title}`);
      console.log(`   Session date: ${assignment.session_date}, End time: ${assignment.end_time}`);
      
      // Check if session has ended more than 1 minute ago
      const [hours, minutes] = assignment.end_time.split(':').map(Number);
      const sessionEnd = new Date(assignment.session_date);
      sessionEnd.setHours(hours, minutes, 0, 0);
      const notificationTime = new Date(sessionEnd.getTime() + 60000);

      console.log(`   Session ended at: ${sessionEnd.toISOString()}`);
      console.log(`   Notification time: ${notificationTime.toISOString()}`);
      console.log(`   Current time: ${now.toISOString()}`);
      console.log(`   Can send notification: ${now >= notificationTime}`);

      if (now < notificationTime) {
        console.log(`⏳ Skipping - session hasn't ended + 1 minute yet`);
        continue;
      }

      // Get list of students who already received notifications for this session
      const { data: existingLogs } = await supabase
        .from('absence_notifications_log')
        .select('student_id, sent_count')
        .eq('assignment_id', assignment.id)
        .eq('session_date', assignment.session_date)
        .not('student_id', 'is', null);

      const notifiedStudentIds = new Set(
        existingLogs?.filter(log => log.sent_count && log.sent_count > 0).map(log => log.student_id) || []
      );
      console.log(`📋 Already notified ${notifiedStudentIds.size} students for this session`);

      // Get all students in the class via student_school junction table
      const { data: studentSchool, error: studentsError } = await supabase
        .from('student_school')
        .select(`
          student_id,
          students!inner(
            id,
            firstname,
            lastname,
            email,
            tutor_email,
            tutor_name,
            archived
          )
        `)
        .eq('class_id', assignment.class_id)
        .eq('is_active', true)
        .eq('students.archived', false);

      const students = studentSchool?.map(ss => ss.students).flat() || [];
      
      console.log(`👥 Found ${students.length} active students in class ${assignment.class_id}`);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        continue;
      }

      if (!students || students.length === 0) {
        console.log(`⚠️ No students found for class ${assignment.class_id}`);
        continue;
      }

      // Get attendance records for this session
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('assignment_id', assignment.id)
        .eq('date', assignment.session_date);

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        continue;
      }

      console.log(`📊 Attendance records: ${attendance?.length || 0} out of ${students.length} students`);

      // Check if all students have been marked
      const markedCount = attendance?.length || 0;
      console.log(`   Marked students: ${markedCount}/${students.length}`);
      if (markedCount !== students.length) {
        console.log(`⏳ Not all students marked yet for assignment ${assignment.id} (${markedCount}/${students.length})`);
        continue;
      }
      console.log(`✅ All students marked, proceeding...`);

      // Find absent students who haven't been notified yet
      const absentStudents = students.filter(student => {
        const record = attendance?.find(a => a.student_id === student.id);
        const isAbsent = record?.status === 'absent';
        const alreadyNotified = notifiedStudentIds.has(student.id);
        return isAbsent && !alreadyNotified;
      });

      console.log(`📋 Found ${absentStudents.length} absent students not yet notified`);

      if (absentStudents.length === 0) {
        console.log(`✅ No new absences to notify for assignment ${assignment.id}`);
        continue;
      }

      console.log(`📧 Sending ${absentStudents.length} absence notifications for assignment ${assignment.id}`);

      let successCount = 0;

      // Send notifications for each absent student
      for (const student of absentStudents) {
        if (!student.email && !student.tutor_email) {
          console.log(`⚠️ No email for student ${student.firstname} ${student.lastname}`);
          
          // Log failed attempt (no email available) to prevent retries
          await supabase
            .from('absence_notifications_log')
            .insert({
              assignment_id: assignment.id,
              session_date: assignment.session_date,
              student_id: student.id,
              sent_count: 0,
              school_id: assignment.classes.school_id
            });
          
          continue;
        }

        let emailsSent = 0;

        try {
          const { data: notificationResult, error: notificationError } = await supabase.functions.invoke('send-absence-notification', {
            body: {
              studentId: student.id,
              studentName: `${student.firstname} ${student.lastname}`,
              studentEmail: student.email || '',
              tutorEmail: student.tutor_email || '',
              tutorName: student.tutor_name || '',
              schoolId: assignment.classes.school_id,
              subjectName: assignment.subjects?.name || 'Cours',
              sessionDate: assignment.session_date,
              startTime: assignment.start_time || '',
              endTime: assignment.end_time,
              className: assignment.classes.name
            }
          });

          if (notificationError) {
            console.error(`❌ Error sending notification for ${student.firstname} ${student.lastname}:`, notificationError);
            // Log failed attempt to prevent retries
            await supabase
              .from('absence_notifications_log')
              .insert({
                assignment_id: assignment.id,
                session_date: assignment.session_date,
                student_id: student.id,
                sent_count: 0,
                school_id: assignment.classes.school_id
              });
          } else {
            emailsSent = notificationResult?.sent || 0;
            console.log(`✅ Sent ${emailsSent} email(s) for ${student.firstname} ${student.lastname}`);
            successCount += emailsSent;
            
            // ONLY log if notification was successfully sent
            await supabase
              .from('absence_notifications_log')
              .insert({
                assignment_id: assignment.id,
                session_date: assignment.session_date,
                student_id: student.id,
                sent_count: emailsSent,
                school_id: assignment.classes.school_id
              });
            console.log(`📝 Logged notification success for ${student.firstname} ${student.lastname} (sent: ${emailsSent})`);
          }
        } catch (error) {
          console.error(`❌ Exception sending notification for ${student.firstname} ${student.lastname}:`, error);
          // Log failed attempt to prevent retries
          await supabase
            .from('absence_notifications_log')
            .insert({
              assignment_id: assignment.id,
              session_date: assignment.session_date,
              student_id: student.id,
              sent_count: 0,
              school_id: assignment.classes.school_id
            });
        }
      }

      // Marquer l'assignment comme ayant eu ses notifications envoyées
      // Cela empêche l'envoi répété lors des prochaines exécutions
      await supabase
        .from('assignments')
        .update({ absence_notification_sent: true })
        .eq('id', assignment.id);

      processedCount++;
      notificationsSent += successCount;

      console.log(`✅ Sent ${successCount} notifications for assignment ${assignment.id}`);
      console.log(`📌 Marked assignment ${assignment.id} as notification sent`);
    }

    const message = `Processed ${processedCount} sessions, sent ${notificationsSent} absence notifications`;
    console.log(`✅ ${message}`);

    return new Response(
      JSON.stringify({ message, processedCount, notificationsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in auto-send-absence-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  teacher_id: string;
  date: string;
  status: 'present' | 'absent';
  marked_at: string;
  method: 'manual' | 'qr_scan';
  students?: {
    id: string;
    firstname: string;
    lastname: string;
  };
}

interface AttendanceSession {
  id: string;
  class_id: string;
  teacher_id: string;
  session_code: string;
  date: string;
  expires_at: string;
  is_active: boolean;
}

interface CreateAttendanceData {
  student_id: string;
  class_id: string;
  teacher_id: string;
  status: 'present' | 'absent';
  method?: 'manual' | 'qr_scan';
  date?: string;
}

export const useAttendance = (classId?: string, teacherId?: string, date?: string) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false });

      if (classId) {
        query = query.eq('class_id', classId);
      }
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }
      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch student details separately
      const attendanceWithStudents = await Promise.all(
        (data || []).map(async (record: any) => {
          const { data: student } = await supabase
            .from('students')
            .select('id, firstname, lastname')
            .eq('id', record.student_id)
            .single();
          
          return {
            ...record,
            students: student
          };
        })
      );
      
      setAttendance(attendanceWithStudents as AttendanceRecord[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des présences');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceSessions = async () => {
    if (!classId || !teacherId) return;

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('class_id', classId)
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttendanceSessions(data || []);
    } catch (err) {
      console.error('Error fetching attendance sessions:', err);
    }
  };

  const markAttendance = async (attendanceData: CreateAttendanceData) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .upsert({
          ...attendanceData,
          date: attendanceData.date || new Date().toISOString().split('T')[0],
          method: attendanceData.method || 'manual'
        }, {
          onConflict: 'student_id, class_id, date'
        })
        .select();

      if (error) throw error;

      toast({
        title: "Présence mise à jour",
        description: `L'étudiant a été marqué ${attendanceData.status === 'present' ? 'présent' : 'absent'}`,
      });

      await fetchAttendance();
      
      // Déclencher une mise à jour des sessions pour rafraîchir l'affichage
      if (attendanceData.method === 'qr_scan') {
        await fetchAttendanceSessions();
      }
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la présence';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }
  };

  const createAttendanceSession = async (classId: string, teacherId: string) => {
    try {
      const sessionCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Expire dans 30 minutes

      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert({
          class_id: classId,
          teacher_id: teacherId,
          session_code: sessionCode,
          expires_at: expiresAt.toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Session de présence créée",
        description: `Code QR généré avec succès`,
      });

      await fetchAttendanceSessions();
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la session';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }
  };

  const deactivateAttendanceSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('attendance_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Session fermée",
        description: "La session de présence a été désactivée",
      });

      await fetchAttendanceSessions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la fermeture de la session';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const scanQRCode = async (sessionCode: string, studentId: string) => {
    try {
      // Vérifier si la session est valide
      const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('session_code', sessionCode)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        throw new Error('Code QR invalide ou expiré');
      }

      // Vérifier si la session n'a pas expiré
      if (new Date(session.expires_at) < new Date()) {
        throw new Error('La session a expiré');
      }

      // SÉCURITÉ: Vérifier que l'étudiant appartient bien à la classe de la session
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('class_id, school_id')
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        throw new Error('Étudiant non trouvé');
      }

      // Vérifier que l'étudiant est bien dans la classe de la session
      if (student.class_id !== session.class_id) {
        throw new Error('Vous n\'êtes pas autorisé à marquer votre présence pour cette classe');
      }

      // Optionnel: Vérifier aussi l'école pour plus de sécurité
      const { data: sessionClass, error: classError } = await supabase
        .from('classes')
        .select('school_id')
        .eq('id', session.class_id)
        .single();

      if (classError || !sessionClass || student.school_id !== sessionClass.school_id) {
        throw new Error('Accès non autorisé - école différente');
      }

      // Marquer la présence
      const result = await markAttendance({
        student_id: studentId,
        class_id: session.class_id,
        teacher_id: session.teacher_id,
        status: 'present',
        method: 'qr_scan'
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du scan QR';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchAttendanceSessions();

    // Setup realtime subscription for attendance changes
    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance'
        },
        (payload) => {
          console.log('Attendance change:', payload);
          fetchAttendance();
        }
      )
      .subscribe();

    // Setup realtime subscription for attendance sessions changes
    const sessionsChannel = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_sessions'
        },
        (payload) => {
          console.log('Session change:', payload);
          fetchAttendanceSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, [classId, teacherId, date]);

  return {
    attendance,
    attendanceSessions,
    loading,
    error,
    markAttendance,
    createAttendanceSession,
    deactivateAttendanceSession,
    scanQRCode,
    refetch: fetchAttendance
  };
};
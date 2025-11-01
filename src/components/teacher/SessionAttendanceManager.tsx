import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle2, XCircle, Calendar, Clock, QrCode, Lock, Bell } from "lucide-react";
import { useAttendance } from "@/hooks/useAttendance";
import { QRCodeGenerator } from "./QRCodeGenerator";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Student {
  id: string;
  firstname: string;
  lastname: string;
  email?: string | null;
  tutor_email?: string | null;
  tutor_name?: string | null;
  class_id: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  type: string;
  subject_id?: string;
  subjects?: {
    id: string;
    name: string;
  } | null;
}

interface SessionAttendanceManagerProps {
  assignment: Assignment;
  students: Student[];
  teacherId: string;
  classId: string;
  onBack: () => void;
}

export function SessionAttendanceManager({
  assignment,
  students,
  teacherId,
  classId,
  onBack,
}: SessionAttendanceManagerProps) {
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const { selectedYear } = useAcademicYear();
  
  // Clé unique pour cette séance dans localStorage
  const notificationKey = `notification_sent_${assignment.id}_${assignment.session_date}`;
  const [autoNotificationSent, setAutoNotificationSent] = useState(() => {
    return localStorage.getItem(notificationKey) === 'true';
  });
  
  // Vérifier si l'année sélectionnée est l'année courante
  const isCurrentYear = selectedYear?.is_current === true;
  
  // Utiliser subject_id en priorité, sinon subjects?.id
  const subjectId = assignment.subject_id || assignment.subjects?.id;
  
  const { attendance, markAttendance, loading, createAttendanceSession, attendanceSessions } = useAttendance(
    classId,
    teacherId,
    assignment.session_date || undefined,
    assignment.id,
    subjectId
  );

  const handleAttendanceChange = async (studentId: string, status: 'present' | 'absent') => {
    await markAttendance({
      student_id: studentId,
      class_id: classId,
      teacher_id: teacherId,
      assignment_id: assignment.id,
      subject_id: subjectId,
      status,
      date: assignment.session_date || undefined,
    });
  };

  const handleGenerateQR = async () => {
    const result = await createAttendanceSession(classId, teacherId);
    if (result.data) {
      setShowQRGenerator(true);
    }
  };

  const handleMarkAllPresent = async () => {
    for (const student of students) {
      await handleAttendanceChange(student.id, 'present');
    }
  };

  const handleMarkAllAbsent = async () => {
    for (const student of students) {
      await handleAttendanceChange(student.id, 'absent');
    }
  };

  const getAttendanceStatus = (studentId: string): 'present' | 'absent' | null => {
    const record = attendance.find(a => a.student_id === studentId);
    return record?.status || null;
  };

  const getAttendanceMethod = (studentId: string): 'manual' | 'qr_scan' | null => {
    const record = attendance.find(a => a.student_id === studentId);
    return record?.method || null;
  };

  const presentCount = students.filter(s => getAttendanceStatus(s.id) === 'present').length;
  const absentCount = students.filter(s => getAttendanceStatus(s.id) === 'absent').length;
  const allMarked = students.length > 0 && (presentCount + absentCount) === students.length;

  // Notification automatique 1 minute après la fin de la séance
  useEffect(() => {
    if (!assignment.session_date || !assignment.end_time || !isCurrentYear || autoNotificationSent) {
      return;
    }

    const checkAndSendNotifications = () => {
      // Ne vérifier que si tous les étudiants sont marqués et qu'il y a des absents
      if (!allMarked || absentCount === 0) {
        return;
      }

      const now = new Date();
      const [hours, minutes] = assignment.end_time!.split(':').map(Number);
      const sessionEnd = new Date(assignment.session_date!);
      sessionEnd.setHours(hours, minutes, 0, 0);
      
      // Ajouter 1 minute après la fin de la séance
      const notificationTime = new Date(sessionEnd.getTime() + 60000);
      
      // Vérifier si nous sommes dans le créneau d'envoi (entre fin+1min et fin+2min)
      const maxNotificationTime = new Date(sessionEnd.getTime() + 120000);
      
      if (now >= notificationTime && now <= maxNotificationTime) {
        console.log('🔔 Auto-notification: Fin de séance + 1 minute, envoi des notifications...');
        handleNotifyAbsences(true);
      }
    };

    // Ne PAS vérifier immédiatement au chargement
    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkAndSendNotifications, 30000);

    return () => clearInterval(interval);
  }, [assignment.session_date, assignment.end_time, absentCount, allMarked, autoNotificationSent, isCurrentYear]);

  const handleNotifyAbsences = async (isAutomatic = false) => {
    const absentStudents = students.filter(s => getAttendanceStatus(s.id) === 'absent');
    
    if (absentStudents.length === 0) {
      toast.error("Aucun étudiant absent à notifier");
      return;
    }

    setNotifying(true);
    try {
      // Get school_id and class name
      const { data: classData } = await supabase
        .from('classes')
        .select('school_id, name')
        .eq('id', classId)
        .single();

      if (!classData) throw new Error('Classe non trouvée');

      let successCount = 0;
      let failCount = 0;

      for (const student of absentStudents) {
        if (!student.email && !student.tutor_email) {
          console.log(`Skipping ${student.firstname} ${student.lastname} - no email`);
          continue;
        }

        try {
          const response = await supabase.functions.invoke('send-absence-notification', {
            body: {
              studentId: student.id,
              studentName: `${student.firstname} ${student.lastname}`,
              studentEmail: student.email || '',
              tutorEmail: student.tutor_email || '',
              tutorName: student.tutor_name || '',
              schoolId: classData.school_id,
              subjectName: assignment.subjects?.name || 'Cours',
              sessionDate: assignment.session_date || '',
              startTime: assignment.start_time || '',
              endTime: assignment.end_time || '',
              className: classData.name
            }
          });

          if (response.error) {
            console.error('Error notifying:', response.error);
            failCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Error notifying student:', error);
          failCount++;
        }
      }

      if (successCount > 0) {
        if (isAutomatic) {
          toast.success(`✅ Notifications d'absence envoyées automatiquement (${successCount})`);
          setAutoNotificationSent(true);
          localStorage.setItem(notificationKey, 'true');
        } else {
          toast.success(`${successCount} notification(s) d'absence envoyée(s)`);
        }
      }
      if (failCount > 0) {
        toast.warning(`${failCount} notification(s) échouée(s)`);
      }
    } catch (error) {
      console.error('Error notifying absences:', error);
      if (!isAutomatic) {
        toast.error("Erreur lors de l'envoi des notifications");
      }
    } finally {
      setNotifying(false);
    }
  };

  if (showQRGenerator && attendanceSessions.length > 0) {
    const session = attendanceSessions[0];
    return (
      <QRCodeGenerator
        session={{
          id: session.id,
          session_code: session.session_code,
          expires_at: session.expires_at,
          class_id: session.class_id,
          teacher_id: session.teacher_id
        }}
        classData={{
          id: classId,
          name: assignment.title
        }}
        onBack={() => setShowQRGenerator(false)}
      />
    );
  }

  return (
    <>
      {/* Alert pour année non-courante */}
      {!isCurrentYear && (
        <Alert className="mb-6">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Vous consultez une année scolaire non active. La prise de présence est désactivée pour préserver l'intégrité des données historiques. Seule l'année scolaire active peut être modifiée.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="shadow-lg mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle>Présence - {assignment.title}</CardTitle>
              </div>
              {assignment.subjects && (
                <Badge variant="outline">{assignment.subjects.name}</Badge>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {assignment.session_date && new Date(assignment.session_date).toLocaleDateString('fr-FR')}
                </div>
                {assignment.start_time && assignment.end_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {assignment.start_time} - {assignment.end_time}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerateQR} variant="outline" size="sm" disabled={!isCurrentYear}>
                <QrCode className="h-4 w-4 mr-2" />
                Générer QR Code
              </Button>
              <Button 
                onClick={() => handleNotifyAbsences(false)} 
                variant="outline" 
                size="sm" 
                disabled={!isCurrentYear || notifying || absentCount === 0}
              >
                <Bell className="h-4 w-4 mr-2" />
                {notifying ? 'Envoi...' : 'Notifier Absences'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-medium">{presentCount} Présent(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="font-medium">{absentCount} Absent(s)</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleMarkAllPresent} variant="outline" size="sm" disabled={!isCurrentYear}>
                Tout marquer présent
              </Button>
              <Button onClick={handleMarkAllAbsent} variant="outline" size="sm" disabled={!isCurrentYear}>
                Tout marquer absent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Liste des Étudiants</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun étudiant dans cette classe</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const status = getAttendanceStatus(student.id);
                const method = getAttendanceMethod(student.id);
                
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {student.firstname} {student.lastname}
                      </span>
                      {method === 'qr_scan' && (
                        <Badge variant="secondary" className="gap-1">
                          <QrCode className="h-3 w-3" />
                          QR Scan
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAttendanceChange(student.id, 'present')}
                        variant={status === 'present' ? 'default' : 'outline'}
                        size="sm"
                        className={status === 'present' ? 'bg-success hover:bg-success/90' : ''}
                        disabled={!isCurrentYear}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Présent
                      </Button>
                      <Button
                        onClick={() => handleAttendanceChange(student.id, 'absent')}
                        variant={status === 'absent' ? 'default' : 'outline'}
                        size="sm"
                        className={status === 'absent' ? 'bg-destructive hover:bg-destructive/90' : ''}
                        disabled={!isCurrentYear}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Absent
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
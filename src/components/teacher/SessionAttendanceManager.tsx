import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, Calendar, Clock, QrCode } from "lucide-react";
import { useAttendance } from "@/hooks/useAttendance";
import { QRCodeGenerator } from "./QRCodeGenerator";

interface Student {
  id: string;
  firstname: string;
  lastname: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  type: string;
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
  const { attendance, markAttendance, loading, createAttendanceSession, attendanceSessions } = useAttendance(
    classId,
    teacherId,
    assignment.session_date || undefined,
    assignment.id,
    assignment.subjects?.id
  );

  const handleAttendanceChange = async (studentId: string, status: 'present' | 'absent') => {
    await markAttendance({
      student_id: studentId,
      class_id: classId,
      teacher_id: teacherId,
      assignment_id: assignment.id,
      subject_id: assignment.subjects?.id || undefined,
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
            <Button onClick={handleGenerateQR} variant="outline" size="sm">
              <QrCode className="h-4 w-4 mr-2" />
              Générer QR Code
            </Button>
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
              <Button onClick={handleMarkAllPresent} variant="outline" size="sm">
                Tout marquer présent
              </Button>
              <Button onClick={handleMarkAllAbsent} variant="outline" size="sm">
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
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Présent
                      </Button>
                      <Button
                        onClick={() => handleAttendanceChange(student.id, 'absent')}
                        variant={status === 'absent' ? 'default' : 'outline'}
                        size="sm"
                        className={status === 'absent' ? 'bg-destructive hover:bg-destructive/90' : ''}
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
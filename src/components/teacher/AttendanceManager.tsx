import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Users, 
  CheckCircle, 
  XCircle, 
  QrCode,
  Calendar,
  Clock
} from "lucide-react";
import { useAttendance } from "@/hooks/useAttendance";
import { QRCodeGenerator } from "./QRCodeGenerator";

interface AttendanceManagerProps {
  classData: {
    id: string;
    name: string;
  };
  students: Array<{
    id: string;
    firstname: string;
    lastname: string;
  }>;
  teacherId: string;
  onBack: () => void;
}

export const AttendanceManager = ({ 
  classData, 
  students, 
  teacherId, 
  onBack 
}: AttendanceManagerProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  
  const { 
    attendance, 
    loading, 
    markAttendance,
    createAttendanceSession,
    attendanceSessions
  } = useAttendance(classData.id, teacherId, selectedDate);

  const handleAttendanceChange = async (studentId: string, status: 'present' | 'absent') => {
    await markAttendance({
      student_id: studentId,
      class_id: classData.id,
      teacher_id: teacherId,
      status,
      date: selectedDate
    });
  };

  const handleGenerateQR = async () => {
    await createAttendanceSession(classData.id, teacherId);
    setShowQRGenerator(true);
  };

  const handleMarkAllPresent = async () => {
    for (const student of students) {
      await markAttendance({
        student_id: student.id,
        class_id: classData.id,
        teacher_id: teacherId,
        status: 'present',
        date: selectedDate
      });
    }
  };

  const handleMarkAllAbsent = async () => {
    for (const student of students) {
      await markAttendance({
        student_id: student.id,
        class_id: classData.id,
        teacher_id: teacherId,
        status: 'absent',
        date: selectedDate
      });
    }
  };

  // Obtenir le statut de présence pour un étudiant
  const getAttendanceStatus = (studentId: string) => {
    const record = attendance.find(a => 
      a.student_id === studentId && 
      a.date === selectedDate
    );
    return record?.status || 'absent';
  };

  const presentCount = attendance.filter(a => 
    a.status === 'present' && a.date === selectedDate
  ).length;

  const absentCount = students.length - presentCount;

  if (showQRGenerator && attendanceSessions.length > 0) {
    return (
      <QRCodeGenerator
        session={attendanceSessions[0]}
        classData={classData}
        onBack={() => setShowQRGenerator(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Présence - {classData.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Gérer les présences des étudiants
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="date">Date:</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  {presentCount} présents
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-600" />
                  {absentCount} absents
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleMarkAllPresent} variant="outline" size="sm" className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Tout présent
              </Button>
              <Button onClick={handleMarkAllAbsent} variant="outline" size="sm" className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-600" />
                Tout absent
              </Button>
              <Button onClick={handleGenerateQR} className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Générer QR Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des étudiants ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucun étudiant dans cette classe</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student, index) => {
                const attendanceStatus = getAttendanceStatus(student.id);
                const isPresent = attendanceStatus === 'present';
                
                return (
                  <div key={student.id}>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {student.firstname} {student.lastname}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={isPresent ? "default" : "secondary"}
                              className={isPresent ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                            >
                              {isPresent ? 'Présent' : 'Absent'}
                            </Badge>
                            {attendance.find(a => a.student_id === student.id && a.date === selectedDate)?.method === 'qr_scan' && (
                              <Badge variant="outline" className="text-xs">
                                <QrCode className="h-3 w-3 mr-1" />
                                QR Scan
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={isPresent ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleAttendanceChange(student.id, 'present')}
                          className={isPresent ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Présent
                        </Button>
                        <Button
                          variant={!isPresent ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleAttendanceChange(student.id, 'absent')}
                          className={!isPresent ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Absent
                        </Button>
                      </div>
                    </div>
                    {index < students.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
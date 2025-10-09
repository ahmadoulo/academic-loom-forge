import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Download, Loader2, CheckCircle, XCircle } from "lucide-react";
import { generateSchoolAttendanceReport } from "@/utils/attendancePdfExport";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  firstname: string;
  lastname: string;
  class_id: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  teacher_id: string;
  date: string;
  status: 'present' | 'absent';
  method: 'manual' | 'qr_scan';
}

interface Class {
  id: string;
  name: string;
}

interface SchoolAttendanceViewProps {
  classes: Class[];
  students: Student[];
  attendance: AttendanceRecord[];
  loading: boolean;
}

export function SchoolAttendanceView({ classes, students, attendance, loading }: SchoolAttendanceViewProps) {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const filteredStudents = selectedClass === "all" 
    ? students 
    : students.filter(s => s.class_id === selectedClass);

  const getAttendanceForStudent = (studentId: string) => {
    return attendance.find(a => 
      a.student_id === studentId && 
      a.date === selectedDate
    );
  };

  const getAttendanceStats = (studentId: string) => {
    const studentAttendance = attendance.filter(a => a.student_id === studentId);
    const present = studentAttendance.filter(a => a.status === 'present').length;
    const absent = studentAttendance.filter(a => a.status === 'absent').length;
    const total = present + absent;
    const rate = total > 0 ? ((present / total) * 100).toFixed(0) : "0";
    
    return { present, absent, total, rate };
  };

  const handleExportPDF = async () => {
    setGenerating(true);
    try {
      const classData = selectedClass === "all" 
        ? { id: "all", name: "Toutes les classes" }
        : classes.find(c => c.id === selectedClass) || { id: "", name: "" };

      await generateSchoolAttendanceReport(
        classData,
        filteredStudents,
        attendance,
        selectedDate
      );
      
      toast({
        title: "PDF généré",
        description: "Le rapport de présence a été téléchargé avec succès",
      });
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const presentCount = filteredStudents.filter(s => {
    const record = getAttendanceForStudent(s.id);
    return record?.status === 'present';
  }).length;

  const absentCount = filteredStudents.filter(s => {
    const record = getAttendanceForStudent(s.id);
    return record?.status === 'absent';
  }).length;

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Présences et Absences
            </CardTitle>
            
            <Button 
              onClick={handleExportPDF}
              disabled={generating || filteredStudents.length === 0}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {generating ? "Génération..." : "Exporter PDF"}
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <div className="flex-1">
              <Label htmlFor="class-filter">Classe</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="Filtrer par classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-4">
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
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">Chargement...</span>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-lg">Aucun étudiant trouvé</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Étudiant</TableHead>
                      <TableHead className="min-w-[120px]">Classe</TableHead>
                      <TableHead className="min-w-[120px] text-center">Statut du jour</TableHead>
                      <TableHead className="min-w-[100px] text-center">Total Présent</TableHead>
                      <TableHead className="min-w-[100px] text-center">Total Absent</TableHead>
                      <TableHead className="min-w-[120px] text-center">Taux Présence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const studentClass = classes.find(c => c.id === student.class_id);
                      const todayRecord = getAttendanceForStudent(student.id);
                      const stats = getAttendanceStats(student.id);
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {student.firstname} {student.lastname}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline">
                              {studentClass?.name || "Non assignée"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            {todayRecord ? (
                              <Badge 
                                variant={todayRecord.status === 'present' ? 'default' : 'destructive'}
                                className={todayRecord.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                              >
                                {todayRecord.status === 'present' ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Présent
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Absent
                                  </>
                                )}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Non marqué</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {stats.present}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {stats.absent}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <Badge 
                              variant={Number(stats.rate) >= 75 ? "default" : "destructive"}
                            >
                              {stats.rate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
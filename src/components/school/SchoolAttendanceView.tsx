import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Filter } from "lucide-react";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { useSubjects } from "@/hooks/useSubjects";
import { useAttendance } from "@/hooks/useAttendance";
import { generateSchoolAttendanceReport } from "@/utils/attendancePdfExport";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface SchoolAttendanceViewProps {
  schoolId: string;
}

export function SchoolAttendanceView({ schoolId }: SchoolAttendanceViewProps) {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  
  const { classes, loading: classesLoading } = useClasses(schoolId);
  const { students } = useStudents(schoolId);
  const { subjects } = useSubjects(schoolId, selectedClass !== "all" ? selectedClass : undefined);
  const { attendance, loading: attendanceLoading } = useAttendance(
    selectedClass !== "all" ? selectedClass : undefined,
    undefined,
    selectedDate,
    undefined,
    selectedSubject !== "all" ? selectedSubject : undefined
  );

  // Filtrer les étudiants selon la classe sélectionnée
  const filteredStudents = selectedClass === "all" 
    ? students 
    : students.filter(s => s.class_id === selectedClass);

  // Créer un mapping des présences
  const attendanceMap = new Map(
    attendance.map(a => [`${a.student_id}-${a.date}`, a])
  );

  const handleExportPDF = () => {
    if (selectedClass === "all") {
      toast.error("Veuillez sélectionner une classe spécifique pour exporter");
      return;
    }

    const classData = classes.find(c => c.id === selectedClass);
    if (!classData) return;

    try {
      generateSchoolAttendanceReport(
        classData,
        filteredStudents,
        attendance,
        selectedDate
      );
      toast.success("Rapport exporté avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'export du rapport");
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    const key = `${studentId}-${selectedDate}`;
    const record = attendanceMap.get(key);
    return record?.status;
  };

  const getSubjectName = (studentId: string) => {
    const key = `${studentId}-${selectedDate}`;
    const record = attendanceMap.get(key);
    if (!record?.subject_id) return "-";
    
    const subject = subjects.find(s => s.id === record.subject_id);
    return subject?.name || "-";
  };

  const presentCount = filteredStudents.filter(s => getAttendanceStatus(s.id) === 'present').length;
  const absentCount = filteredStudents.filter(s => getAttendanceStatus(s.id) === 'absent').length;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Historique des Présences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <label className="text-sm font-medium mb-2 block">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Classe</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue />
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

          <div>
            <label className="text-sm font-medium mb-2 block">Matière</label>
            <Select 
              value={selectedSubject} 
              onValueChange={setSelectedSubject}
              disabled={selectedClass === "all"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les matières</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={handleExportPDF} 
              variant="outline" 
              className="w-full"
              disabled={selectedClass === "all"}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-lg">
            <span className="text-sm font-medium">Présents:</span>
            <Badge variant="default" className="bg-success">
              {presentCount}
            </Badge>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 rounded-lg">
            <span className="text-sm font-medium">Absents:</span>
            <Badge variant="destructive">
              {absentCount}
            </Badge>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <span className="text-sm font-medium">Total:</span>
            <Badge variant="outline">
              {filteredStudents.length}
            </Badge>
          </div>
        </div>

        {/* Tableau */}
        {attendanceLoading || classesLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun étudiant trouvé</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const status = getAttendanceStatus(student.id);
                  const subjectName = getSubjectName(student.id);
                  const studentClass = classes.find(c => c.id === student.class_id);

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.lastname}</TableCell>
                      <TableCell>{student.firstname}</TableCell>
                      <TableCell>{studentClass?.name || "-"}</TableCell>
                      <TableCell>{subjectName}</TableCell>
                      <TableCell>
                        {status === 'present' && (
                          <Badge variant="default" className="bg-success">
                            Présent
                          </Badge>
                        )}
                        {status === 'absent' && (
                          <Badge variant="destructive">
                            Absent
                          </Badge>
                        )}
                        {!status && (
                          <Badge variant="outline">
                            Non marqué
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

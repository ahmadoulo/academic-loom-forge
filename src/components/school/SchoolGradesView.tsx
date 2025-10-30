import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, Loader2, ArrowLeft, FileDown } from "lucide-react";
import { generateSchoolGradesReport } from "@/utils/schoolGradesPdfExport";
import { useToast } from "@/hooks/use-toast";
import { useSchools } from "@/hooks/useSchools";
import { imageUrlToBase64 } from "@/utils/imageToBase64";
import { useSchoolSemesters } from "@/hooks/useSchoolSemesters";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useGrades } from "@/hooks/useGrades";

interface Student {
  id: string;
  firstname: string;
  lastname: string;
  class_id: string;
}

interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  teacher_id: string;
  grade: number;
  grade_type: string;
  comment?: string;
  created_at: string;
  exam_date?: string;
}

interface Subject {
  id: string;
  name: string;
  class_id: string;
}

interface Class {
  id: string;
  name: string;
}

interface SchoolGradesViewProps {
  schoolId: string;
  classes: Class[];
  students: Student[];
  grades: Grade[];
  subjects: Subject[];
  loading: boolean;
}

export function SchoolGradesView({ schoolId, classes, students, grades, subjects, loading }: SchoolGradesViewProps) {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { getSchoolById } = useSchools();
  const [school, setSchool] = useState<any>(null);
  const [logoBase64, setLogoBase64] = useState<string>();
  const { selectedYear } = useAcademicYear();
  const { semesters } = useSchoolSemesters(schoolId, selectedYear?.id);
  const { grades: filteredGrades } = useGrades(undefined, undefined, undefined, selectedYear?.id, selectedSemester || undefined);
  
  // Définir le semestre actuel par défaut
  React.useEffect(() => {
    const currentSemester = semesters.find(s => s.is_actual);
    if (currentSemester && !selectedSemester) {
      setSelectedSemester(currentSemester.id);
    }
  }, [semesters]);

  React.useEffect(() => {
    const loadSchool = async () => {
      const schoolData = await getSchoolById(schoolId);
      setSchool(schoolData);
      if (schoolData?.logo_url) {
        try {
          const base64 = await imageUrlToBase64(schoolData.logo_url);
          setLogoBase64(base64);
        } catch (error) {
          console.error("Erreur conversion logo:", error);
        }
      }
    };
    loadSchool();
  }, [schoolId]);

  const displayGrades = filteredGrades.length > 0 ? filteredGrades : grades;

  const filteredStudents = selectedClass === "all" 
    ? students 
    : students.filter(s => s.class_id === selectedClass);

  const getStudentGrades = (studentId: string) => {
    return displayGrades.filter(g => g.student_id === studentId);
  };

  const calculateAverage = (studentId: string) => {
    const studentGrades = getStudentGrades(studentId);
    if (studentGrades.length === 0) return "N/A";
    
    const total = studentGrades.reduce((sum, grade) => sum + Number(grade.grade), 0);
    return (total / studentGrades.length).toFixed(1);
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || "Inconnu";
  };

  const handleExportPDF = async () => {
    setGenerating(true);
    try {
      const classData = selectedClass === "all" 
        ? { id: "all", name: "Toutes les classes" }
        : classes.find(c => c.id === selectedClass) || { id: "", name: "" };

      const semesterData = !selectedSemester 
        ? { name: "Tous les semestres" }
        : semesters.find(s => s.id === selectedSemester);

      await generateSchoolGradesReport(
        classData,
        filteredStudents,
        displayGrades,
        subjects,
        school?.name || 'École',
        logoBase64,
        school?.academic_year,
        semesterData?.name
      );
      
      toast({
        title: "PDF généré",
        description: "Le rapport des notes a été téléchargé avec succès",
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

  const handleExportCSV = () => {
    try {
      const csvData = filteredStudents.map(student => {
        const studentClass = classes.find(c => c.id === student.class_id);
        const studentGrades = getStudentGrades(student.id);
        const average = calculateAverage(student.id);
        
        return {
          'Prénom': student.firstname,
          'Nom': student.lastname,
          'Classe': studentClass?.name || 'N/A',
          'Nombre de notes': studentGrades.length,
          'Moyenne': average
        };
      });

      const headers = Object.keys(csvData[0] || {});
      const csv = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `notes_${selectedClass === "all" ? "toutes_classes" : classes.find(c => c.id === selectedClass)?.name}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      
      toast({
        title: "CSV exporté",
        description: "Les données ont été exportées avec succès",
      });
    } catch (error) {
      console.error('Erreur export CSV:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter en CSV",
        variant: "destructive"
      });
    }
  };

  // Vue détaillée d'un étudiant
  if (selectedStudent) {
    const studentGrades = getStudentGrades(selectedStudent.id);
    const studentClass = classes.find(c => c.id === selectedStudent.class_id);
    const average = calculateAverage(selectedStudent.id);
    
    // Grouper les notes par matière
    const gradesBySubject = subjects.reduce((acc, subject) => {
      const subjectGrades = studentGrades.filter(g => g.subject_id === subject.id);
      if (subjectGrades.length > 0) {
        const subjectAverage = subjectGrades.reduce((sum, g) => sum + Number(g.grade), 0) / subjectGrades.length;
        acc.push({
          subject,
          grades: subjectGrades,
          average: subjectAverage
        });
      }
      return acc;
    }, [] as Array<{ subject: Subject; grades: Grade[]; average: number }>);

    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedStudent(null)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <CardTitle className="text-xl">
              Détail des notes - {selectedStudent.firstname} {selectedStudent.lastname}
            </CardTitle>
            <div className="w-24" />
          </div>
          <CardDescription>
            {studentClass?.name} - {studentGrades.length} note(s) - Moyenne: {average}/20
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {gradesBySubject.map(({ subject, grades: subjectGrades, average: subjectAvg }) => (
              <div key={subject.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{subject.name}</h3>
                  <Badge variant={subjectAvg >= 10 ? "default" : "destructive"}>
                    Moyenne: {subjectAvg.toFixed(2)}/20
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subjectGrades.map(grade => (
                    <div key={grade.id} className="border rounded p-3 bg-accent/10">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {grade.grade_type === 'examen' ? 'Examen' : 
                           grade.grade_type === 'controle' ? 'Contrôle' : 
                           'Devoir'}
                        </Badge>
                        <span className={`font-bold text-lg ${Number(grade.grade) >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                          {Number(grade.grade).toFixed(1)}/20
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {grade.exam_date 
                          ? new Date(grade.exam_date).toLocaleDateString('fr-FR')
                          : new Date(grade.created_at).toLocaleDateString('fr-FR')
                        }
                      </p>
                      {grade.comment && (
                        <p className="text-sm mt-2 text-muted-foreground italic">
                          "{grade.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {gradesBySubject.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune note disponible pour cet étudiant</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Notes des Étudiants
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrer par semestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les semestres</SelectItem>
                {semesters.map((sem) => (
                  <SelectItem key={sem.id} value={sem.id}>
                    {sem.name} {sem.is_actual && "(Actuel)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
            
            <Button 
              onClick={handleExportCSV}
              disabled={filteredStudents.length === 0}
              variant="outline"
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              CSV
            </Button>

            <Button 
              onClick={handleExportPDF}
              disabled={generating || filteredStudents.length === 0}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {generating ? "..." : "PDF"}
            </Button>
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
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-lg">Aucun étudiant trouvé</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Étudiant</TableHead>
                      <TableHead className="min-w-[120px]">Classe</TableHead>
                      <TableHead className="min-w-[100px] text-center">Nombre Notes</TableHead>
                      <TableHead className="min-w-[100px] text-center">Moyenne</TableHead>
                      <TableHead className="min-w-[300px]">Dernières notes</TableHead>
                      <TableHead className="min-w-[100px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const studentClass = classes.find(c => c.id === student.class_id);
                      const studentGrades = getStudentGrades(student.id);
                      const lastGrades = studentGrades.slice(-3).reverse();
                      const average = calculateAverage(student.id);
                      
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
                            <Badge variant="secondary">{studentGrades.length}</Badge>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <Badge 
                              variant={average === "N/A" ? "outline" : Number(average) >= 10 ? "default" : "destructive"}
                            >
                              {average === "N/A" ? "N/A" : `${average}/20`}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex gap-2 flex-wrap">
                              {lastGrades.length > 0 ? (
                                lastGrades.map((grade) => (
                                  <Badge 
                                    key={grade.id} 
                                    variant="outline" 
                                    className="text-xs"
                                  >
                                    {getSubjectName(grade.subject_id)}: {Number(grade.grade).toFixed(1)}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">Aucune note</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedStudent(student)}
                              disabled={studentGrades.length === 0}
                            >
                              Détails
                            </Button>
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
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, Loader2, ArrowLeft, FileDown, Search } from "lucide-react";
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
  school_semester_id?: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { getSchoolById } = useSchools();
  const [school, setSchool] = useState<any>(null);
  const [logoBase64, setLogoBase64] = useState<string>();
  const { selectedYear } = useAcademicYear();
  // Charger TOUS les semestres de l'école (pas filtrés par année)
  const { semesters } = useSchoolSemesters(schoolId, undefined);
  const { grades: filteredGrades } = useGrades(
    undefined, 
    undefined, 
    undefined, 
    selectedYear?.id, 
    selectedSemester && selectedSemester !== "all" ? selectedSemester : undefined
  );

  // Set current semester as default
  React.useEffect(() => {
    if (semesters.length > 0 && !selectedSemester) {
      const currentSemester = semesters.find(s => s.is_actual);
      if (currentSemester) {
        setSelectedSemester(currentSemester.id);
      }
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

  // Filter by class and search query
  const filteredStudents = students
    .filter((s) => {
      const matchesClass = selectedClass === "all" || s.class_id === selectedClass;
      const matchesSearch =
        searchQuery === "" ||
        s.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.lastname.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesSearch;
    });

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
    
    // Déterminer quel semestre afficher
    const currentSemesterInfo = selectedSemester === "all" || !selectedSemester
      ? null
      : semesters.find(s => s.id === selectedSemester);
    
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
      <div className="space-y-4">
        <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-background to-accent/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedStudent(null)}
                className="gap-2 hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <div className="flex flex-col items-center">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {selectedStudent.firstname} {selectedStudent.lastname}
                </CardTitle>
                {currentSemesterInfo && (
                  <Badge variant="outline" className="mt-2 border-primary/40 text-primary font-medium">
                    {currentSemesterInfo.name}
                  </Badge>
                )}
              </div>
              <div className="w-24" />
            </div>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Badge variant="secondary" className="text-base px-4 py-1.5">
                {studentClass?.name}
              </Badge>
              <Badge variant="outline" className="text-base px-4 py-1.5">
                {studentGrades.length} note(s)
              </Badge>
              <Badge 
                variant={Number(average) >= 10 ? "default" : "destructive"}
                className="text-lg px-5 py-1.5 font-bold"
              >
                Moyenne: {average}/20
              </Badge>
            </div>
          </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-6">
            {gradesBySubject.map(({ subject, grades: subjectGrades, average: subjectAvg }) => (
              <Card key={subject.id} className="border-primary/10 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-xl flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {subject.name}
                    </h3>
                    <Badge 
                      variant={subjectAvg >= 10 ? "default" : "destructive"}
                      className="text-base px-4 py-1.5 font-semibold"
                    >
                      Moyenne: {subjectAvg.toFixed(2)}/20
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjectGrades.map(grade => (
                      <div 
                        key={grade.id} 
                        className="group relative border-2 rounded-xl p-4 bg-gradient-to-br from-background to-accent/5 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="text-xs font-medium">
                            {grade.grade_type === 'examen' ? 'Examen' : 
                             grade.grade_type === 'controle' ? 'Contrôle' : 
                             'Devoir'}
                          </Badge>
                          <span className={`font-bold text-2xl ${Number(grade.grade) >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {Number(grade.grade).toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">
                          {grade.exam_date 
                            ? new Date(grade.exam_date).toLocaleDateString('fr-FR', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric' 
                              })
                            : new Date(grade.created_at).toLocaleDateString('fr-FR', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric' 
                              })
                          }
                        </p>
                        {grade.comment && (
                          <p className="text-sm mt-3 pt-3 border-t text-muted-foreground italic">
                            "{grade.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
            {gradesBySubject.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">Aucune note disponible</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Les notes apparaîtront ici une fois ajoutées
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    );
  }

  // Préparer les données pour l'affichage par semestre
  const displayGradesBySemester = () => {
    if (selectedSemester !== "all" && selectedSemester) {
      // Un seul semestre sélectionné
      return [{
        semester: semesters.find(s => s.id === selectedSemester),
        grades: displayGrades.filter(g => (g as any).school_semester_id === selectedSemester)
      }];
    } else {
      // Tous les semestres - grouper par semestre
      return semesters.map(semester => ({
        semester,
        grades: displayGrades.filter(g => (g as any).school_semester_id === semester.id)
      })).filter(item => item.grades.length > 0);
    }
  };

  const semesterData = displayGradesBySemester();

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-background to-accent/5">
        <CardHeader className="pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                Notes des Étudiants
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Consultez et exportez les notes de vos étudiants
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un étudiant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-primary/20 focus:border-primary/40 transition-colors"
                />
              </div>
              
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-full sm:w-[220px] border-primary/20 hover:border-primary/40 transition-colors">
                  <SelectValue placeholder="Filtrer par semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les semestres</SelectItem>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id}>
                      {sem.name}{sem.is_actual && " (Actuel)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-[220px] border-primary/20 hover:border-primary/40 transition-colors">
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
              className="gap-2 border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
            >
              <FileDown className="h-4 w-4" />
              CSV
            </Button>

            <Button 
              onClick={handleExportPDF}
              disabled={generating || filteredStudents.length === 0}
              variant="default"
              className="gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Download className="h-4 w-4" />
              {generating ? "..." : "PDF"}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <span className="text-lg font-medium">Chargement des données...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">Aucun étudiant trouvé</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Essayez de modifier vos filtres
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {semesterData.map((semesterInfo) => {
              const semesterGrades = semesterInfo.grades;
              const semesterStudents = filteredStudents.filter(student => 
                semesterGrades.some(g => g.student_id === student.id)
              );

              if (semesterStudents.length === 0) return null;

              return (
                <Card key={semesterInfo.semester?.id || 'unknown'} className="border-primary/10 shadow-md">
                  {selectedSemester === "all" && semesterInfo.semester && (
                    <div className="px-6 pt-6 pb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="default" className="text-base px-4 py-1.5">
                          {semesterInfo.semester.name}
                        </Badge>
                        {semesterInfo.semester.is_actual && (
                          <Badge variant="secondary" className="text-sm">
                            Actuel
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="border rounded-xl overflow-hidden bg-background shadow-sm">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                              <TableHead className="min-w-[180px] font-semibold">Étudiant</TableHead>
                              <TableHead className="min-w-[130px] font-semibold">Classe</TableHead>
                              <TableHead className="min-w-[120px] text-center font-semibold">Notes</TableHead>
                              <TableHead className="min-w-[120px] text-center font-semibold">Moyenne</TableHead>
                              <TableHead className="min-w-[320px] font-semibold">Dernières notes</TableHead>
                              <TableHead className="min-w-[100px] text-center font-semibold">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {semesterStudents.map((student) => {
                              const studentClass = classes.find(c => c.id === student.class_id);
                              const studentGrades = semesterGrades.filter(g => g.student_id === student.id);
                              const lastGrades = studentGrades.slice(-3).reverse();
                              const studentTotal = studentGrades.reduce((sum, g) => sum + Number(g.grade), 0);
                              const average = studentGrades.length > 0 
                                ? (studentTotal / studentGrades.length).toFixed(1)
                                : "N/A";
                              
                              return (
                                <TableRow key={student.id} className="hover:bg-accent/5 transition-colors">
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold">
                                        {student.firstname[0]}{student.lastname[0]}
                                      </div>
                                      <span>{student.firstname} {student.lastname}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="font-medium">
                                      {studentClass?.name || "Non assignée"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="secondary" className="font-bold text-base px-3 py-1">
                                      {studentGrades.length}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge 
                                      variant={average === "N/A" ? "outline" : Number(average) >= 10 ? "default" : "destructive"}
                                      className="font-bold text-base px-3 py-1"
                                    >
                                      {average === "N/A" ? "N/A" : `${average}/20`}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2 flex-wrap">
                                      {lastGrades.length > 0 ? (
                                        lastGrades.map((grade) => (
                                          <Badge 
                                            key={grade.id} 
                                            variant="outline" 
                                            className="text-xs font-medium"
                                          >
                                            {getSubjectName(grade.subject_id)}: {Number(grade.grade).toFixed(1)}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-sm text-muted-foreground italic">Aucune note</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setSelectedStudent(student)}
                                      disabled={studentGrades.length === 0}
                                      className="hover:bg-primary/10 hover:text-primary font-medium"
                                    >
                                      Voir détails
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
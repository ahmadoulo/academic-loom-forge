import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Award, Download, ArrowLeft, Users } from "lucide-react";
import { generateStudentBulletin, generateStudentBulletinInDoc } from "@/utils/bulletinPdfExport";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { imageUrlToBase64 } from "@/utils/imageToBase64";
import { useSchoolSemesters } from "@/hooks/useSchoolSemesters";
import { useAcademicYear } from "@/hooks/useAcademicYear";

interface BulletinSectionProps {
  schoolId: string;
  schoolName: string;
  schoolLogoUrl?: string;
  academicYear?: string;
  students: any[];
  classes: any[];
  grades: any[];
  subjects: any[];
  loading: boolean;
}

export const BulletinSection = ({
  schoolId,
  schoolName,
  schoolLogoUrl,
  academicYear,
  students,
  classes,
  grades,
  subjects,
  loading,
}: BulletinSectionProps) => {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);
  const { selectedYear } = useAcademicYear();
  const { semesters } = useSchoolSemesters(schoolId, selectedYear?.id);
  
  // Définir le semestre actuel par défaut
  React.useEffect(() => {
    const currentSemester = semesters.find(s => s.is_actual);
    if (currentSemester && !selectedSemester) {
      setSelectedSemester(currentSemester.id);
    }
  }, [semesters, selectedSemester]);
  
  // Convertir le logo en base64 au chargement
  React.useEffect(() => {
    const convertLogo = async () => {
      if (schoolLogoUrl) {
        try {
          const base64 = await imageUrlToBase64(schoolLogoUrl);
          setLogoBase64(base64);
        } catch (error) {
          console.error("Erreur conversion logo:", error);
        }
      }
    };
    convertLogo();
  }, [schoolLogoUrl]);

  // Filtrer les notes selon le semestre et l'année scolaire sélectionnés
  const displayGrades = useMemo(() => {
    return grades.filter(grade => {
      const matchesYear = !selectedYear || grade.school_year_id === selectedYear.id;
      const matchesSemester = !selectedSemester || selectedSemester === 'all' || grade.school_semester_id === selectedSemester;
      return matchesYear && matchesSemester;
    });
  }, [grades, selectedYear, selectedSemester]);

  // Grouper les étudiants par classe
  const studentsByClass = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    students.forEach((student) => {
      const classId = student.class_id;
      if (!grouped[classId]) {
        grouped[classId] = [];
      }
      
      // Calculer les notes de l'étudiant
      const studentGrades = displayGrades.filter(g => g.student_id === student.id);
      const average = studentGrades.length > 0
        ? studentGrades.reduce((sum, g) => sum + Number(g.grade), 0) / studentGrades.length
        : 0;
      
      grouped[classId].push({
        ...student,
        totalGrades: studentGrades.length,
        average: average,
      });
    });
    
    // Trier les étudiants par moyenne dans chaque classe
    Object.keys(grouped).forEach(classId => {
      grouped[classId].sort((a, b) => b.average - a.average);
    });
    
    return grouped;
  }, [students, displayGrades]);

  // Calculer les détails de notes d'un étudiant
  const getStudentGradeDetails = (studentId: string) => {
    const studentGrades = displayGrades.filter(g => g.student_id === studentId);
    
    // Grouper les notes par matière
    const gradesBySubject: Record<string, any[]> = {};
    studentGrades.forEach(grade => {
      if (!gradesBySubject[grade.subject_id]) {
        gradesBySubject[grade.subject_id] = [];
      }
      gradesBySubject[grade.subject_id].push(grade);
    });
    
    // Calculer la moyenne par matière
    const subjectGrades = Object.keys(gradesBySubject).map(subjectId => {
      const subject = subjects.find(s => s.id === subjectId);
      const subjectGradesList = gradesBySubject[subjectId];
      const average = subjectGradesList.reduce((sum, g) => sum + Number(g.grade), 0) / subjectGradesList.length;
      
      return {
        subjectId,
        subjectName: subject?.name || 'Matière inconnue',
        grades: subjectGradesList,
        average,
        hasGrades: subjectGradesList.length > 0,
      };
    });
    
    const overallAverage = subjectGrades.length > 0
      ? subjectGrades.reduce((sum, s) => sum + s.average, 0) / subjectGrades.length
      : 0;
    
    return { subjectGrades, overallAverage };
  };

  // Calculer le rang d'un étudiant dans sa classe
  const getStudentRank = (student: any) => {
    const classStudents = studentsByClass[student.class_id] || [];
    return classStudents.findIndex(s => s.id === student.id) + 1;
  };

  const handleGeneratePDF = async (student: any) => {
    try {
      const { subjectGrades, overallAverage } = getStudentGradeDetails(student.id);
      const studentClass = classes.find(c => c.id === student.class_id);
      const semesterData = !selectedSemester 
        ? { name: "Tous les semestres" }
        : semesters.find(s => s.id === selectedSemester);
      
      const studentData = {
        id: student.id,
        firstname: student.firstname,
        lastname: student.lastname,
        email: student.email,
        cin_number: student.cin_number,
        class_id: student.class_id,
        school_id: student.school_id,
        classes: studentClass,
        schools: { name: schoolName },
      };
      
      await generateStudentBulletin(studentData, subjectGrades, overallAverage, logoBase64, academicYear, semesterData?.name);
      toast.success("Bulletin généré avec succès");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération du bulletin");
    }
  };

  const handleGenerateClassBulletins = async (classId: string) => {
    try {
      const classStudents = studentsByClass[classId] || [];
      if (classStudents.length === 0) {
        toast.error("Aucun étudiant dans cette classe");
        return;
      }

      const doc = new jsPDF();
      const studentClass = classes.find(c => c.id === classId);
      const semesterData = !selectedSemester 
        ? { name: "Tous les semestres" }
        : semesters.find(s => s.id === selectedSemester);

      for (let index = 0; index < classStudents.length; index++) {
        const student = classStudents[index];
        if (index > 0) {
          doc.addPage();
        }

        const { subjectGrades, overallAverage } = getStudentGradeDetails(student.id);
        
        const studentData = {
          id: student.id,
          firstname: student.firstname,
          lastname: student.lastname,
          email: student.email,
          cin_number: student.cin_number,
          class_id: student.class_id,
          school_id: student.school_id,
          classes: studentClass,
          schools: { name: schoolName },
        };

        // Générer le bulletin pour cet étudiant dans le doc existant
        await generateStudentBulletinInDoc(doc, studentData, subjectGrades, overallAverage, logoBase64, academicYear, semesterData?.name);
      }

      const className = studentClass?.name || 'Classe';
      const fileName = `Bulletins_${className}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      
      toast.success(`${classStudents.length} bulletins générés avec succès`);
    } catch (error) {
      console.error("Erreur génération PDF groupé:", error);
      toast.error("Erreur lors de la génération des bulletins");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Vue détaillée d'un étudiant
  if (selectedStudent) {
    const { subjectGrades, overallAverage } = getStudentGradeDetails(selectedStudent.id);
    const studentClass = classes.find(c => c.id === selectedStudent.class_id);
    const rank = getStudentRank(selectedStudent);
    const totalStudents = studentsByClass[selectedStudent.class_id]?.length || 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedStudent(null)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Button>
          <Button 
            onClick={() => handleGeneratePDF(selectedStudent)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Télécharger le Bulletin PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Étudiant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {selectedStudent.firstname} {selectedStudent.lastname}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{studentClass?.name}</p>
              <p className="text-xs text-muted-foreground mt-1">CIN: {selectedStudent.cin_number || 'N/A'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Moyenne Générale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{overallAverage.toFixed(2)}</p>
                <p className="text-muted-foreground">/20</p>
              </div>
              <Badge 
                variant={overallAverage >= 14 ? "default" : overallAverage >= 10 ? "outline" : "destructive"}
                className="mt-2"
              >
                {overallAverage >= 14 ? "Excellent" : overallAverage >= 10 ? "Bien" : "À améliorer"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Classement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{rank}</p>
                <p className="text-muted-foreground">/ {totalStudents}</p>
              </div>
              {rank === 1 && (
                <Badge variant="default" className="mt-2">
                  Premier de la classe
                </Badge>
              )}
              {rank > 1 && rank <= 3 && (
                <Badge variant="secondary" className="mt-2">
                  Parmi les meilleurs
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notes par Matière</CardTitle>
            <CardDescription>Détail des performances académiques</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectGrades.map((subjectGrade) => (
                <div key={subjectGrade.subjectId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg">{subjectGrade.subjectName}</h4>
                    {subjectGrade.hasGrades && (
                      <Badge variant={subjectGrade.average >= 10 ? "default" : "destructive"}>
                        Moyenne: {subjectGrade.average.toFixed(2)}/20
                      </Badge>
                    )}
                  </div>
                  
                    {subjectGrade.hasGrades ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {subjectGrade.grades.map((grade: any, index: number) => (
                          <div 
                            key={grade.id} 
                            className="flex flex-col p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                          >
                            <span className="text-xs text-muted-foreground mb-1">
                              {grade.grade_type === 'examen' ? 'Examen' : 
                               grade.grade_type === 'controle' ? 'Contrôle' : 
                               'Devoir'}
                            </span>
                            <span className="font-bold text-lg">{Number(grade.grade).toFixed(1)}<span className="text-sm text-muted-foreground">/20</span></span>
                          </div>
                        ))}
                      </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucune note enregistrée</p>
                  )}
                  
                  {subjectGrade.grades.length > 0 && subjectGrade.grades[0].comment && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <span className="font-medium">Commentaire:</span> {subjectGrade.grades[0].comment}
                    </div>
                  )}
                </div>
              ))}
              
              {subjectGrades.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune note disponible pour cet étudiant</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vue liste des étudiants par classe
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                Bulletins de Notes
              </CardTitle>
              <CardDescription className="mt-2">
                Consultez et téléchargez les bulletins des étudiants par classe
              </CardDescription>
            </div>
            
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-full sm:w-[240px]">
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
          </div>
        </CardHeader>
        <CardContent>

      <Tabs defaultValue={classes[0]?.id} className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          {classes.map((classItem) => (
            <TabsTrigger key={classItem.id} value={classItem.id}>
              {classItem.name}
              <Badge variant="secondary" className="ml-2">
                {studentsByClass[classItem.id]?.length || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {!selectedYear && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Veuillez sélectionner une année scolaire pour afficher les bulletins
            </p>
          </div>
        )}

        {classes.map((classItem) => (
          <TabsContent key={classItem.id} value={classItem.id} className="space-y-4">
            {selectedYear && studentsByClass[classItem.id]?.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{studentsByClass[classItem.id].length} étudiant{studentsByClass[classItem.id].length > 1 ? 's' : ''}</span>
                  </div>
                  <Button 
                    onClick={() => handleGenerateClassBulletins(classItem.id)}
                    className="gap-2"
                    variant="default"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger tous les bulletins
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentsByClass[classItem.id].map((student, index) => (
                    <Card 
                      key={student.id} 
                      className="group hover:shadow-md hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-base truncate">
                                {student.firstname} {student.lastname}
                              </CardTitle>
                              {index === 0 && (
                                <Badge variant="default" className="shrink-0 h-5">
                                  Top 1
                                </Badge>
                              )}
                              {index > 0 && index < 3 && (
                                <Badge variant="secondary" className="shrink-0 h-5">
                                  Top {index + 1}
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-xs truncate">
                              {student.email || 'Pas d\'email'}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span className="text-sm font-medium text-muted-foreground">Moyenne</span>
                            <span className="text-xl font-bold text-foreground">
                              {student.average > 0 ? student.average.toFixed(2) : '--'}<span className="text-sm text-muted-foreground">/20</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{student.totalGrades} note{student.totalGrades > 1 ? 's' : ''}</span>
                            <Badge 
                              variant={student.average >= 14 ? "default" : student.average >= 10 ? "secondary" : "destructive"}
                              className="h-5"
                            >
                              {student.average >= 14 ? "Excellent" : student.average >= 10 ? "Bien" : "À améliorer"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucun étudiant</h3>
                <p className="text-sm text-muted-foreground">
                  {!selectedYear 
                    ? "Veuillez sélectionner une année scolaire" 
                    : "Aucun étudiant dans cette classe pour l'année et le semestre sélectionnés"}
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

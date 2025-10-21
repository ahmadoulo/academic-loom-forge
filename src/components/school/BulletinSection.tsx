import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, Award, TrendingUp, Download, ArrowLeft, Users } from "lucide-react";
import { generateStudentBulletin } from "@/utils/bulletinPdfExport";
import { toast } from "sonner";

interface BulletinSectionProps {
  schoolId: string;
  schoolName: string;
  students: any[];
  classes: any[];
  grades: any[];
  subjects: any[];
  loading: boolean;
}

export const BulletinSection = ({
  schoolId,
  schoolName,
  students,
  classes,
  grades,
  subjects,
  loading,
}: BulletinSectionProps) => {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Grouper les étudiants par classe
  const studentsByClass = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    students.forEach((student) => {
      const classId = student.class_id;
      if (!grouped[classId]) {
        grouped[classId] = [];
      }
      
      // Calculer les notes de l'étudiant
      const studentGrades = grades.filter(g => g.student_id === student.id);
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
  }, [students, grades]);

  // Calculer les détails de notes d'un étudiant
  const getStudentGradeDetails = (studentId: string) => {
    const studentGrades = grades.filter(g => g.student_id === studentId);
    
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

  const handleGeneratePDF = (student: any) => {
    try {
      const { subjectGrades, overallAverage } = getStudentGradeDetails(student.id);
      const studentClass = classes.find(c => c.id === student.class_id);
      
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
      
      generateStudentBulletin(studentData, subjectGrades, overallAverage);
      toast.success("Bulletin généré avec succès");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération du bulletin");
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
              <p className="text-sm text-muted-foreground mt-2">
                {rank === 1 ? "🏆 Premier de la classe" : 
                 rank <= 3 ? "🥈 Parmi les meilleurs" : 
                 ""}
              </p>
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
                          className="flex items-center justify-between p-2 border rounded bg-accent/50"
                        >
                          <span className="text-sm text-muted-foreground">
                            {grade.grade_type === 'examen' ? '📝 Examen' : 
                             grade.grade_type === 'controle' ? '📋 Contrôle' : 
                             '✏️ Devoir'}
                          </span>
                          <span className="font-semibold">{Number(grade.grade).toFixed(1)}/20</span>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6" />
            Bulletins de Notes
          </h2>
          <p className="text-muted-foreground mt-1">
            Consultez et téléchargez les bulletins des étudiants par classe
          </p>
        </div>
      </div>

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

        {classes.map((classItem) => (
          <TabsContent key={classItem.id} value={classItem.id} className="space-y-4">
            {studentsByClass[classItem.id]?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studentsByClass[classItem.id].map((student, index) => (
                  <Card 
                    key={student.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {student.firstname} {student.lastname}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {student.email || 'Pas d\'email'}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={index === 0 ? "default" : index < 3 ? "outline" : "secondary"}
                          className="shrink-0"
                        >
                          #{index + 1}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Moyenne</span>
                          <span className="font-bold text-lg">
                            {student.average > 0 ? student.average.toFixed(2) : '--'}/20
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Notes</span>
                          <Badge variant="outline">{student.totalGrades}</Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Voir le bulletin
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun étudiant dans cette classe</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

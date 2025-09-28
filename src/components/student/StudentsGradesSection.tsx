import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, TrendingUp, Calendar, User, Download, FileText } from "lucide-react";
import { useCurrentStudent } from "@/hooks/useCurrentStudent";
import { useGrades } from "@/hooks/useGrades";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudentsGradesSectionProps {
  studentId?: string;
}

interface SubjectGrade {
  subjectId: string;
  subjectName: string;
  grades: any[];
  average?: number;
  hasGrades: boolean;
}

export const StudentsGradesSection = ({ studentId }: StudentsGradesSectionProps) => {
  const { student, loading: studentLoading } = useCurrentStudent(studentId);
  const { grades, loading: gradesLoading } = useGrades(undefined, student?.id);
  
  console.log('DEBUG StudentGradesSection:', { 
    studentId, 
    student, 
    classId: student?.class_id,
    gradesCount: grades?.length,
    grades: grades
  });

  // Créer une liste de matières basée sur les notes existantes et les matières de la classe
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!student?.class_id) return;
      
      try {
        // Récupérer toutes les matières de la classe
        const { data: classSubjects } = await supabase
          .from('subjects')
          .select('*')
          .eq('class_id', student.class_id);
          
        console.log('DEBUG: Matières de la classe:', classSubjects);
        setAllSubjects(classSubjects || []);
      } catch (error) {
        console.error('Erreur chargement matières:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubjects();
  }, [student?.class_id]);

  // Organiser les données par matière
  const subjectGrades: SubjectGrade[] = allSubjects.map(subject => {
    const subjectGradesData = grades.filter(grade => grade.subject_id === subject.id);
    const average = subjectGradesData.length > 0 
      ? subjectGradesData.reduce((sum, grade) => sum + grade.grade, 0) / subjectGradesData.length
      : undefined;

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      grades: subjectGradesData,
      average,
      hasGrades: subjectGradesData.length > 0
    };
  });

  console.log('DEBUG: SubjectGrades calculées:', subjectGrades);

  // Calculer la moyenne générale
  const overallAverage = grades.length > 0 
    ? grades.reduce((sum, grade) => sum + grade.grade, 0) / grades.length 
    : 0;

  const handleExportPDF = async () => {
    if (!student) return;
    
    try {
      console.log('DEBUG: Génération PDF demandée pour:', student.firstname, student.lastname);
      const { generateStudentBulletin } = await import("@/utils/bulletinPdfExport");
      generateStudentBulletin(student, subjectGrades, overallAverage);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du PDF",
        variant: "destructive"
      });
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 16) return "text-green-600";
    if (grade >= 12) return "text-blue-600";
    if (grade >= 10) return "text-orange-600";
    return "text-red-600";
  };

  const getGradeBadgeVariant = (grade: number) => {
    if (grade >= 16) return "default";
    if (grade >= 12) return "secondary";
    return "destructive";
  };

  const getBadgeVariant = (average: number) => {
    if (average >= 16) return "default";
    if (average >= 12) return "secondary";
    return "destructive";
  };

  const getGradeTypeLabel = (type: string) => {
    switch (type) {
      case "controle": return "Contrôle";
      case "devoir": return "Devoir";
      case "exposé": return "Exposé";
      case "examen": return "Examen";
      default: return type;
    }
  };

  if (studentLoading || gradesLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Mes Notes</h1>
          <p className="text-muted-foreground">Aucune information d'étudiant trouvée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes Notes - Bulletin</h1>
          <p className="text-muted-foreground">
            {student.firstname} {student.lastname} - {student.classes.name} - {student.schools.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {grades.length > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className={`text-xl font-bold ${getGradeColor(overallAverage)}`}>
                {overallAverage.toFixed(1)}/20
              </span>
              <span className="text-sm text-muted-foreground">Moyenne générale</span>
            </div>
          )}
          <Button onClick={handleExportPDF} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Télécharger le bulletin PDF
          </Button>
        </div>
      </div>

      {/* Bulletin de notes sous forme de tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Bulletin de Notes - Semestre en cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allSubjects.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Aucune matière assignée</h2>
              <p className="text-muted-foreground">
                Les matières apparaîtront ici une fois qu'elles seront assignées à votre classe.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Intitulé Module</TableHead>
                    <TableHead className="text-center">Note/20</TableHead>
                    <TableHead className="text-center">Validation</TableHead>
                    <TableHead className="text-center">Nb. Notes</TableHead>
                    <TableHead>Détails des Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectGrades.map((subject) => (
                    <TableRow key={subject.subjectId}>
                      <TableCell className="font-medium">
                        {subject.subjectName}
                      </TableCell>
                      <TableCell className="text-center">
                        {subject.hasGrades ? (
                          <Badge 
                            variant={getBadgeVariant(subject.average || 0)}
                            className="text-lg font-bold"
                          >
                            {subject.average?.toFixed(2)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-sm">
                            Pas encore publié
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {subject.hasGrades ? (
                          <Badge variant={subject.average && subject.average >= 10 ? "default" : "destructive"}>
                            {subject.average && subject.average >= 10 ? "Validé" : "Non Validé"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            En attente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {subject.grades.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subject.hasGrades ? (
                          <div className="space-y-1">
                            {subject.grades.map((grade) => (
                              <div key={grade.id} className="flex items-center gap-2 text-sm">
                                <Badge variant="outline" className="text-xs">
                                  {getGradeTypeLabel(grade.grade_type)}
                                </Badge>
                                <span className={`font-medium ${getGradeColor(grade.grade)}`}>
                                  {grade.grade}/20
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {grade.exam_date 
                                    ? new Date(grade.exam_date).toLocaleDateString('fr-FR')
                                    : new Date(grade.created_at).toLocaleDateString('fr-FR')
                                  }
                                </span>
                                {grade.comment && (
                                  <span className="text-muted-foreground text-xs truncate max-w-[100px]" title={grade.comment}>
                                    "{grade.comment}"
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-sm">
                            Aucune note saisie
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Moyenne du semestre */}
              {grades.length > 0 && (
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Moyenne du Semestre :</span>
                    <Badge 
                      variant={getBadgeVariant(overallAverage)}
                      className="text-xl font-bold px-4 py-2"
                    >
                      {overallAverage.toFixed(2)}/20
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    * V-Validé, NV-Non Validé, VC-Validé par Compensation, VR-Validé après Rattrapage
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
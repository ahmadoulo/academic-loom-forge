import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, TrendingUp, Calendar, User } from "lucide-react";
import { useCurrentStudent } from "@/hooks/useCurrentStudent";
import { useGrades } from "@/hooks/useGrades";

interface StudentsGradesSectionProps {
  studentId?: string;
}

export const StudentsGradesSection = ({ studentId }: StudentsGradesSectionProps) => {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  
  const { student, loading: studentLoading } = useCurrentStudent(studentId);
  const { grades, loading: gradesLoading } = useGrades(undefined, student?.id);

  // Filtrer les notes par matière sélectionnée
  const filteredGrades = selectedSubject === "all" 
    ? grades 
    : grades.filter(grade => grade.subject_id === selectedSubject);

  // Calculer la moyenne générale
  const overallAverage = grades.length > 0 
    ? grades.reduce((sum, grade) => sum + grade.grade, 0) / grades.length 
    : 0;

  // Calculer les moyennes par matière
  const subjects = [...new Set(grades.map(grade => ({
    id: grade.subject_id,
    name: grade.subjects.name
  })))];
  const subjectAverages = subjects.map(subject => {
    const subjectGrades = grades.filter(grade => grade.subject_id === subject.id);
    const average = subjectGrades.reduce((sum, grade) => sum + grade.grade, 0) / subjectGrades.length;
    return { subject: subject.name, subjectId: subject.id, average, count: subjectGrades.length };
  });

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

  if (studentLoading || gradesLoading) {
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
          <h1 className="text-2xl font-bold">Mes Notes</h1>
          <p className="text-muted-foreground">Consultez vos résultats scolaires</p>
        </div>
        {grades.length > 0 && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className={`text-xl font-bold ${getGradeColor(overallAverage)}`}>
              {overallAverage.toFixed(1)}/20
            </span>
            <span className="text-sm text-muted-foreground">Moyenne générale</span>
          </div>
        )}
      </div>

      {grades.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Aucune note disponible</h2>
              <p className="text-muted-foreground">
                Vos notes apparaîtront ici une fois que vos professeurs les auront saisies.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Subject Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Filtrer par matière" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les matières</SelectItem>
                    {subjects.map((subject) => {
                      const avg = subjectAverages.find(s => s.subjectId === subject.id);
                      return (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} {avg && `- ${avg.average.toFixed(1)}/20`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  {filteredGrades.length} note{filteredGrades.length > 1 ? 's' : ''} 
                  {selectedSubject !== "all" && ` en ${subjects.find(s => s.id === selectedSubject)?.name}`}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Averages */}
          {selectedSubject === "all" && subjectAverages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Moyennes par Matière
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjectAverages.map((subjectAvg) => (
                    <div key={subjectAvg.subjectId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{subjectAvg.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {subjectAvg.count} note{subjectAvg.count > 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge 
                          variant={getBadgeVariant(subjectAvg.average)}
                          className="text-lg font-bold"
                        >
                          {subjectAvg.average.toFixed(1)}/20
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grades List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {selectedSubject === "all" ? "Toutes mes notes" : `Notes en ${subjects.find(s => s.id === selectedSubject)?.name}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredGrades.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Aucune note trouvée pour cette matière</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredGrades.map((grade) => (
                    <div key={grade.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{grade.subjects.name}</h3>
                            <Badge variant="outline">
                              {getGradeTypeLabel(grade.grade_type)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{grade.teachers.firstname} {grade.teachers.lastname}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {grade.exam_date 
                                  ? new Date(grade.exam_date).toLocaleDateString('fr-FR')
                                  : new Date(grade.created_at).toLocaleDateString('fr-FR')
                                }
                              </span>
                            </div>
                          </div>
                          
                          {grade.comment && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                              <strong>Commentaire :</strong> {grade.comment}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getGradeColor(grade.grade)}`}>
                            {grade.grade}/20
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(grade.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
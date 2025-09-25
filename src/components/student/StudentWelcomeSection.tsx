import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Calendar, Clock, TrendingUp } from "lucide-react";
import { useCurrentStudent } from "@/hooks/useCurrentStudent";
import { useGrades } from "@/hooks/useGrades";

export const StudentWelcomeSection = () => {
  const { student, loading: studentLoading } = useCurrentStudent();
  const { grades, loading: gradesLoading } = useGrades(undefined, student?.id);

  // Calculate stats from real data
  const totalSubjects = [...new Set(grades.map(g => g.subject_id))].length;
  const averageGrade = grades.length > 0 
    ? grades.reduce((sum, grade) => sum + grade.grade, 0) / grades.length 
    : 0;
  
  // Mock data for attendance and last activity (would need real implementation)
  const attendanceRate = 96;
  const lastActivity = "Hier à 14:30";

  const recentGrades = [
    { subject: "Mathématiques", grade: 18, date: "2024-01-15", teacher: "Mme Martin" },
    { subject: "Français", grade: 16, date: "2024-01-14", teacher: "M. Dupont" },
    { subject: "Sciences", grade: 14, date: "2024-01-12", teacher: "Mme Bernard" },
  ];

  const upcomingTests = [
    { subject: "Histoire", date: "2024-01-20", teacher: "M. Durand" },
    { subject: "Géographie", date: "2024-01-22", teacher: "Mme Petit" },
  ];

  if (studentLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
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
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Bienvenue ! 👋
          </h1>
          <p className="text-muted-foreground">
            Aucune information d'étudiant trouvée
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Bonjour, {student.firstname} {student.lastname}! 👋
        </h1>
        <p className="text-muted-foreground">
          Classe {student.classes.name} - {student.schools.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Matières</p>
                <p className="text-2xl font-bold">{totalSubjects}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Moyenne générale</p>
                <p className="text-2xl font-bold text-green-600">
                  {averageGrade > 0 ? `${averageGrade.toFixed(1)}/20` : 'N/A'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assiduité</p>
                <p className="text-2xl font-bold text-blue-600">{attendanceRate}%</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dernière activité</p>
                <p className="text-sm font-medium">{lastActivity}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Dernières Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gradesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))
              ) : grades.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Aucune note disponible</p>
                </div>
              ) : (
                grades.slice(0, 3).map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{grade.subjects.name}</p>
                      <p className="text-sm text-muted-foreground">{grade.teachers.firstname} {grade.teachers.lastname}</p>
                      <p className="text-xs text-muted-foreground">
                        {grade.exam_date ? new Date(grade.exam_date).toLocaleDateString() : new Date(grade.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={grade.grade >= 16 ? "default" : grade.grade >= 12 ? "secondary" : "destructive"}
                      className="text-lg font-bold"
                    >
                      {grade.grade}/20
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Prochains Contrôles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{test.subject}</p>
                    <p className="text-sm text-muted-foreground">{test.teacher}</p>
                  </div>
                  <Badge variant="outline">
                    {new Date(test.date).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
              {upcomingTests.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Aucun contrôle prévu prochainement</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
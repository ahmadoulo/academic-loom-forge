import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, TrendingUp, Calendar, User } from "lucide-react";
import { useGrades } from "@/hooks/useGrades";

export const StudentsGradesSection = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  
  // Utilisation du hook existant pour récupérer les notes
  // Pour l'instant, on utilise des données mock car l'authentification n'est pas encore complète
  const { grades, loading } = useGrades();

  // Mock data pour l'étudiant connecté - à remplacer par les vraies données
  const mockGrades = [
    {
      id: "1",
      subject: "Mathématiques",
      grade: 18,
      grade_type: "controle",
      comment: "Excellent travail, continue ainsi !",
      exam_date: "2024-01-15",
      teacher: "Mme Martin",
      created_at: "2024-01-15T10:00:00Z"
    },
    {
      id: "2", 
      subject: "Français",
      grade: 16,
      grade_type: "devoir",
      comment: "Très bonne expression écrite",
      exam_date: "2024-01-14",
      teacher: "M. Dupont",
      created_at: "2024-01-14T14:30:00Z"
    },
    {
      id: "3",
      subject: "Sciences",
      grade: 14,
      grade_type: "controle",
      comment: "Bien mais peut mieux faire",
      exam_date: "2024-01-12",
      teacher: "Mme Bernard",
      created_at: "2024-01-12T09:15:00Z"
    },
    {
      id: "4",
      subject: "Histoire",
      grade: 17,
      grade_type: "exposé",
      comment: "Présentation claire et documentée",
      exam_date: "2024-01-10",
      teacher: "M. Durand",
      created_at: "2024-01-10T11:00:00Z"
    },
    {
      id: "5",
      subject: "Mathématiques",
      grade: 15,
      grade_type: "devoir",
      comment: "Quelques erreurs de calcul à éviter",
      exam_date: "2024-01-08",
      teacher: "Mme Martin",
      created_at: "2024-01-08T16:00:00Z"
    },
    {
      id: "6",
      subject: "Géographie",
      grade: 19,
      grade_type: "controle",
      comment: "Parfaite maîtrise du sujet",
      exam_date: "2024-01-05",
      teacher: "Mme Petit",
      created_at: "2024-01-05T13:45:00Z"
    }
  ];

  // Filtrer les notes par matière
  const filteredGrades = selectedSubject === "all" 
    ? mockGrades 
    : mockGrades.filter(grade => grade.subject === selectedSubject);

  // Calculer la moyenne générale
  const overallAverage = mockGrades.reduce((sum, grade) => sum + grade.grade, 0) / mockGrades.length;

  // Calculer la moyenne par matière
  const subjectAverages = mockGrades.reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = { sum: 0, count: 0 };
    }
    acc[grade.subject].sum += grade.grade;
    acc[grade.subject].count += 1;
    return acc;
  }, {} as Record<string, { sum: number; count: number }>);

  const subjects = Object.keys(subjectAverages);

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

  const getGradeTypeLabel = (type: string) => {
    switch (type) {
      case "controle": return "Contrôle";
      case "devoir": return "Devoir";
      case "exposé": return "Exposé";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes Notes</h1>
          <p className="text-muted-foreground">Consultez vos résultats scolaires</p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <span className="text-xl font-bold text-green-600">
            {overallAverage.toFixed(1)}/20
          </span>
          <span className="text-sm text-muted-foreground">Moyenne générale</span>
        </div>
      </div>

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
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject} - {(subjectAverages[subject].sum / subjectAverages[subject].count).toFixed(1)}/20
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {filteredGrades.length} note{filteredGrades.length > 1 ? 's' : ''} 
              {selectedSubject !== "all" && ` en ${selectedSubject}`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Averages */}
      {selectedSubject === "all" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Moyennes par Matière
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => {
                const average = subjectAverages[subject].sum / subjectAverages[subject].count;
                return (
                  <div key={subject} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {subjectAverages[subject].count} note{subjectAverages[subject].count > 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge 
                        variant={getGradeBadgeVariant(average)}
                        className="text-lg font-bold"
                      >
                        {average.toFixed(1)}/20
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grades List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {selectedSubject === "all" ? "Toutes mes notes" : `Notes en ${selectedSubject}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGrades.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Aucune note disponible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGrades.map((grade) => (
                <div key={grade.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{grade.subject}</h3>
                        <Badge variant="outline">
                          {getGradeTypeLabel(grade.grade_type)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{grade.teacher}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(grade.exam_date).toLocaleDateString()}</span>
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
                        {new Date(grade.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
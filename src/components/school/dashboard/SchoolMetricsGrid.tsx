import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  GraduationCap, 
  School, 
  BookOpen, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface SchoolMetricsGridProps {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  avgGrade: number;
  successRate: number;
  attendanceRate: number;
  studentsInDifficulty: number;
  avgStudentsPerClass: number;
  totalGrades: number;
}

export function SchoolMetricsGrid({
  totalStudents,
  totalTeachers,
  totalClasses,
  totalSubjects,
  avgGrade,
  successRate,
  attendanceRate,
  studentsInDifficulty,
  avgStudentsPerClass,
  totalGrades
}: SchoolMetricsGridProps) {
  const metrics = [
    {
      category: "Effectifs",
      items: [
        {
          title: "Étudiants",
          value: totalStudents,
          icon: Users,
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          detail: `~${avgStudentsPerClass} par classe`
        },
        {
          title: "Professeurs",
          value: totalTeachers,
          icon: GraduationCap,
          color: "text-purple-600",
          bgColor: "bg-purple-50 dark:bg-purple-950/30",
          detail: `${totalSubjects} matières`
        },
        {
          title: "Classes",
          value: totalClasses,
          icon: School,
          color: "text-emerald-600",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
          detail: "Actives"
        },
        {
          title: "Matières",
          value: totalSubjects,
          icon: BookOpen,
          color: "text-amber-600",
          bgColor: "bg-amber-50 dark:bg-amber-950/30",
          detail: "Enseignées"
        }
      ]
    },
    {
      category: "Performance",
      items: [
        {
          title: "Moyenne générale",
          value: `${avgGrade.toFixed(1)}/20`,
          icon: avgGrade >= 10 ? TrendingUp : TrendingDown,
          color: avgGrade >= 14 ? "text-green-600" : avgGrade >= 10 ? "text-amber-600" : "text-red-600",
          bgColor: avgGrade >= 14 ? "bg-green-50 dark:bg-green-950/30" : avgGrade >= 10 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-red-50 dark:bg-red-950/30",
          detail: `${totalGrades} notes saisies`
        },
        {
          title: "Taux de réussite",
          value: `${successRate}%`,
          icon: CheckCircle2,
          color: successRate >= 80 ? "text-green-600" : successRate >= 60 ? "text-amber-600" : "text-red-600",
          bgColor: successRate >= 80 ? "bg-green-50 dark:bg-green-950/30" : successRate >= 60 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-red-50 dark:bg-red-950/30",
          detail: "Moyenne ≥ 10"
        },
        {
          title: "Assiduité",
          value: `${attendanceRate}%`,
          icon: Clock,
          color: attendanceRate >= 90 ? "text-green-600" : attendanceRate >= 75 ? "text-amber-600" : "text-red-600",
          bgColor: attendanceRate >= 90 ? "bg-green-50 dark:bg-green-950/30" : attendanceRate >= 75 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-red-50 dark:bg-red-950/30",
          detail: "Taux de présence"
        },
        {
          title: "Alertes",
          value: studentsInDifficulty,
          icon: AlertCircle,
          color: studentsInDifficulty === 0 ? "text-green-600" : studentsInDifficulty <= 5 ? "text-amber-600" : "text-red-600",
          bgColor: studentsInDifficulty === 0 ? "bg-green-50 dark:bg-green-950/30" : studentsInDifficulty <= 5 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-red-50 dark:bg-red-950/30",
          detail: "En difficulté"
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {metrics.map((section) => (
        <div key={section.category}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {section.category}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {section.items.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.title} className="relative overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{metric.title}</p>
                        <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                        <p className="text-xs text-muted-foreground">{metric.detail}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                        <Icon className={`h-5 w-5 ${metric.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  GraduationCap, 
  School, 
  BookOpen
} from "lucide-react";

interface SchoolMetricsGridProps {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  avgStudentsPerClass: number;
}

export function SchoolMetricsGrid({
  totalStudents,
  totalTeachers,
  totalClasses,
  totalSubjects,
  avgStudentsPerClass
}: SchoolMetricsGridProps) {
  const metrics = [
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
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
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
  );
}

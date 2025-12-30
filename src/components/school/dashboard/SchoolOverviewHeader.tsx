import { Badge } from "@/components/ui/badge";
import { CalendarDays, Building2 } from "lucide-react";

interface SchoolOverviewHeaderProps {
  schoolName: string;
  academicYear?: string;
  totalStudents: number;
  totalClasses: number;
}

export function SchoolOverviewHeader({
  schoolName,
  academicYear,
  totalStudents,
  totalClasses
}: SchoolOverviewHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-6 mb-6">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Vue d'ensemble</h1>
                <p className="text-muted-foreground text-sm">
                  Résumé complet de votre établissement
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {academicYear && (
              <Badge variant="outline" className="gap-2 py-1.5 px-3 bg-background/80">
                <CalendarDays className="h-3.5 w-3.5" />
                {academicYear}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
            <p className="text-xs text-muted-foreground mt-1">Étudiants inscrits</p>
          </div>
          <div className="text-center border-l border-border/50">
            <p className="text-3xl font-bold text-foreground">{totalClasses}</p>
            <p className="text-xs text-muted-foreground mt-1">Classes actives</p>
          </div>
        </div>
      </div>
    </div>
  );
}

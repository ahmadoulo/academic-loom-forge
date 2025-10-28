import { Calendar } from "lucide-react";
import { useAcademicYear } from "@/hooks/useAcademicYear";

export const AcademicYearDisplay = () => {
  const { selectedYear, currentYear, loading } = useAcademicYear();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  const displayYear = selectedYear || currentYear;

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <Calendar className="h-4 w-4 text-primary" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground leading-none">Année</span>
        <span className="font-semibold text-foreground leading-tight">
          {displayYear?.name || 'Aucune année'}
        </span>
      </div>
      {displayYear?.is_current && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">Actuel</span>
      )}
    </div>
  );
};

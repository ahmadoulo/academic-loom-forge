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
    <div className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md bg-muted/50">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">
        {displayYear?.name || 'Aucune année'}
      </span>
      {displayYear?.is_current && (
        <span className="text-xs text-primary">(Actuel)</span>
      )}
    </div>
  );
};

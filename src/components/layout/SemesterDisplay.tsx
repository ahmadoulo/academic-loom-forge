import { Calendar } from "lucide-react";
import { useOptionalSemester } from "@/hooks/useSemester";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const SemesterDisplay = () => {
  const semesterContext = useOptionalSemester();
  
  // Si pas de provider, ne rien afficher
  if (!semesterContext) {
    return null;
  }
  
  const { currentSemester, loading } = semesterContext;

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  if (!currentSemester) {
    return null;
  }

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
      <Calendar className="h-4 w-4 text-accent" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground leading-none">Semestre</span>
        <span className="font-semibold text-foreground leading-tight">
          {currentSemester.name}
        </span>
      </div>
      <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent font-medium">Actuel</span>
    </div>
  );
};

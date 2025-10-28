import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Check } from "lucide-react";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export const AcademicYearSidebarSection = () => {
  const { selectedYear, setSelectedYear, availableYears, currentYear, loading } = useAcademicYear();
  const [tempYear, setTempYear] = useState<string>(selectedYear?.id || currentYear?.id || "");
  const [isOpen, setIsOpen] = useState(false);

  const handleValidate = () => {
    const year = availableYears.find(y => y.id === tempYear);
    if (year) {
      setSelectedYear(year);
      toast.success(`Année scolaire changée: ${year.name}`);
      // Recharger la page pour afficher les données de la nouvelle année
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const hasChanged = tempYear !== (selectedYear?.id || currentYear?.id);

  if (loading) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground animate-pulse" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="px-3 py-2">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md hover:bg-accent px-2 py-1.5">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">Année scolaire</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-3">
        <div className="space-y-2">
          <Select value={tempYear} onValueChange={setTempYear}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner une année" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  <span className="flex items-center gap-2">
                    {year.name}
                    {year.is_current && <span className="text-xs text-primary">(Actuel)</span>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {hasChanged && (
            <Button
              onClick={handleValidate}
              size="sm"
              className="w-full"
            >
              <Check className="h-3 w-3 mr-1" />
              Valider le changement
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

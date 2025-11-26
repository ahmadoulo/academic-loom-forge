import { useState, useEffect } from "react";
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

interface AcademicYearSidebarSectionProps {
  context?: string;
}

export const AcademicYearSidebarSection = ({ context }: AcademicYearSidebarSectionProps) => {
  const { selectedYear, setSelectedYear, availableYears, currentYear, loading } = useAcademicYear();
  const [tempYear, setTempYear] = useState<string>(selectedYear?.id || currentYear?.id || "");
  const [isOpen, setIsOpen] = useState(false);

  // Synchroniser tempYear avec selectedYear quand il change
  useEffect(() => {
    if (selectedYear?.id) {
      setTempYear(selectedYear.id);
    }
  }, [selectedYear?.id]);

  const handleValidate = () => {
    const year = availableYears.find(y => y.id === tempYear);
    if (year) {
      setSelectedYear(year);
      toast.success(`Année scolaire changée vers ${year.name}`);
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="px-3 py-2 bg-muted/30 rounded-lg">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md hover:bg-accent px-2 py-1.5 transition-colors">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground leading-none">Année scolaire</span>
            <span className="text-sm font-semibold leading-tight">
              {availableYears.find(y => y.id === tempYear)?.name || 'Sélectionner'}
            </span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform text-muted-foreground ${isOpen ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-3">
        <div className="space-y-2">
          <Select value={tempYear} onValueChange={setTempYear}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Sélectionner une année" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {availableYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  <span className="flex items-center gap-2">
                    {year.name}
                    {year.is_current && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                        Actuel
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {hasChanged && (
            <Button
              onClick={handleValidate}
              size="sm"
              className="w-full gap-2"
            >
              <Check className="h-4 w-4" />
              Valider le changement
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

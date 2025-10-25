import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcademicYear } from "@/hooks/useAcademicYear";

export function AcademicYearSelector() {
  const { selectedYear, setSelectedYear, availableYears } = useAcademicYear();

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedYear} onValueChange={setSelectedYear}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Année scolaire" />
        </SelectTrigger>
        <SelectContent>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

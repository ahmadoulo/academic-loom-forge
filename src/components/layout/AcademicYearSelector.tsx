import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { useAcademicYear } from "@/hooks/useAcademicYear";

export const AcademicYearSelector = () => {
  const { selectedYear, setSelectedYear, availableYears, currentYear, loading } = useAcademicYear();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground animate-pulse" />
        <div className="w-[180px] h-9 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedYear?.id || ""}
        onValueChange={(value) => {
          if (value === "all") {
            setSelectedYear({ id: 'all', name: 'Toutes les années', start_date: '', end_date: '', is_current: false, created_at: '', updated_at: '' });
          } else {
            const year = availableYears.find(y => y.id === value);
            setSelectedYear(year || null);
          }
        }}
      >
        <SelectTrigger className="w-[180px] bg-background">
          <SelectValue placeholder="Année scolaire" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          <SelectItem value="all">Toutes les années</SelectItem>
          {availableYears.map((year) => (
            <SelectItem key={year.id} value={year.id}>
              <span className="flex items-center gap-2">
                {year.name}
                {year.is_current && <span className="font-bold text-primary">(Actuel)</span>}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

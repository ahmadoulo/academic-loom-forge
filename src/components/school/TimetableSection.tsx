import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useTimetable } from "@/hooks/useTimetable";
import { useClasses } from "@/hooks/useClasses";
import { exportTimetableToPDF } from "@/utils/timetablePdfExport";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TimetableSectionProps {
  schoolId: string;
  schoolName: string;
}

export function TimetableSection({ schoolId, schoolName }: TimetableSectionProps) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);

  const { classes, loading: classesLoading } = useClasses(schoolId);
  const { data: timetableEntries, isLoading: timetableLoading } = useTimetable(
    schoolId,
    selectedClassId,
    selectedWeek
  );

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // Grouper par jour
  const groupedEntries = timetableEntries?.reduce((acc, entry) => {
    const key = `${entry.day} ${entry.date}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(entry);
    return acc;
  }, {} as Record<string, typeof timetableEntries>);

  const handleWeekSelect = (date: Date | undefined) => {
    if (date) {
      const weekStart = startOfWeek(date, { locale: fr, weekStartsOn: 1 });
      setSelectedWeek(weekStart);
    }
  };

  const handleExportPDF = () => {
    if (!timetableEntries || timetableEntries.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    if (!selectedClass || !selectedWeek) {
      toast.error("Veuillez sélectionner une classe et une semaine");
      return;
    }

    try {
      exportTimetableToPDF(timetableEntries, selectedClass.name, schoolName, selectedWeek);
      toast.success("Emploi du temps exporté avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'export du PDF");
      console.error(error);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Génération d'Emploi du Temps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sélection de classe */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Classe</label>
              <Select value={selectedClassId || ""} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {classesLoading ? (
                    <SelectItem value="loading" disabled>
                      Chargement...
                    </SelectItem>
                  ) : (
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Sélection de semaine */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Semaine</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedWeek
                      ? `Semaine du ${format(selectedWeek, "dd/MM/yyyy", { locale: fr })}`
                      : "Sélectionner une semaine"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedWeek || undefined}
                    onSelect={handleWeekSelect}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Bouton Export */}
          <Button
            onClick={handleExportPDF}
            disabled={!selectedClassId || !selectedWeek || timetableLoading}
            className="w-full md:w-auto"
          >
            {timetableLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exporter en PDF
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Aperçu de l'emploi du temps */}
      {selectedClassId && selectedWeek && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Aperçu - {schoolName} - {selectedClass?.name}
              <span className="block text-sm font-normal text-muted-foreground mt-1">
                Du {format(selectedWeek, "dd/MM/yyyy", { locale: fr })} au{" "}
                {format(addDays(selectedWeek, 6), "dd/MM/yyyy", { locale: fr })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timetableLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : !timetableEntries || timetableEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune séance programmée pour cette semaine
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="font-bold text-primary-foreground">Jour</TableHead>
                      <TableHead className="font-bold text-primary-foreground">Matière</TableHead>
                      <TableHead className="text-center font-bold text-primary-foreground">Salle</TableHead>
                      <TableHead className="text-center font-bold text-primary-foreground">
                        Horaire
                      </TableHead>
                      <TableHead className="font-bold text-primary-foreground">Enseignant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedEntries || {}).map(([dayDate, entries]) =>
                      entries.map((entry, index) => (
                        <TableRow key={entry.id} className="hover:bg-muted/50">
                          {index === 0 && (
                            <TableCell 
                              rowSpan={entries.length}
                              className="bg-blue-50 dark:bg-blue-950/20 font-semibold align-middle border-r border-border"
                            >
                              {dayDate}
                            </TableCell>
                          )}
                          <TableCell className="font-medium">{entry.subject}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="font-normal">
                              {entry.classroom}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center bg-yellow-50 dark:bg-yellow-950/20 font-semibold">
                            {entry.startTime} - {entry.endTime}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{entry.teacher}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

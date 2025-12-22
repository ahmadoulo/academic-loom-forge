import { useState, useMemo } from "react";
import { useClassrooms } from "@/hooks/useClassrooms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, Users, Calendar, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface ClassroomAvailabilityWidgetProps {
  schoolId: string;
}

export function ClassroomAvailabilityWidget({ schoolId }: ClassroomAvailabilityWidgetProps) {
  const { classrooms, assignments: classroomAssignments } = useClassrooms(schoolId);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Calculer la disponibilité des salles pour la date sélectionnée
  const roomsAvailability = useMemo(() => {
    const available: typeof classrooms = [];
    const occupied: { classroom: typeof classrooms[0]; sessions: any[] }[] = [];
    const partial: { classroom: typeof classrooms[0]; sessions: any[]; freeSlots: { start: string; end: string }[] }[] = [];

    const dayStart = "08:00";
    const dayEnd = "18:00";

    classrooms.forEach(classroom => {
      if (!classroom.is_active) return;

      // Trouver toutes les séances pour cette salle ce jour-là
      const dayAssignments = classroomAssignments.filter(ca => {
        if (ca.classroom_id !== classroom.id) return false;
        if (!ca.assignments) return false;
        return ca.assignments.session_date === selectedDate;
      });

      const sessions = dayAssignments.map(ca => ca.assignments).filter(Boolean);

      if (sessions.length === 0) {
        available.push(classroom);
      } else {
        // Calculer les créneaux libres
        const sortedSessions = [...sessions].sort((a, b) => 
          (a?.start_time || "").localeCompare(b?.start_time || "")
        );

        const freeSlots: { start: string; end: string }[] = [];
        let currentStart = dayStart;

        for (const session of sortedSessions) {
          if (session?.start_time && session.start_time > currentStart) {
            freeSlots.push({ start: currentStart, end: session.start_time });
          }
          if (session?.end_time && session.end_time > currentStart) {
            currentStart = session.end_time;
          }
        }

        if (currentStart < dayEnd) {
          freeSlots.push({ start: currentStart, end: dayEnd });
        }

        if (freeSlots.length > 0) {
          partial.push({ classroom, sessions, freeSlots });
        } else {
          occupied.push({ classroom, sessions });
        }
      }
    });

    return { available, occupied, partial };
  }, [classrooms, classroomAssignments, selectedDate]);

  const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");
  const totalRooms = classrooms.filter(c => c.is_active).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Disponibilité des Salles
            </CardTitle>
            <CardDescription>
              {isToday ? "Aujourd'hui" : format(parseISO(selectedDate), "EEEE dd MMMM", { locale: fr })}
            </CardDescription>
          </div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-36 h-8 text-xs"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Résumé rapide */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {roomsAvailability.available.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Libres</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {roomsAvailability.partial.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Partielles</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {roomsAvailability.occupied.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Occupées</p>
          </div>
        </div>

        {/* Liste des salles */}
        {totalRooms === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune salle configurée</p>
          </div>
        ) : (
          <ScrollArea className="h-[180px]">
            <div className="space-y-2 pr-3">
              {/* Salles libres */}
              {roomsAvailability.available.map(room => (
                <div key={room.id} className="flex items-center justify-between p-2 rounded-lg border bg-green-50/50 dark:bg-green-950/20 border-green-200/50 dark:border-green-900/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium text-sm">{room.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Users className="h-3 w-3" />
                      {room.capacity}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                    Toute la journée
                  </Badge>
                </div>
              ))}

              {/* Salles partiellement libres */}
              {roomsAvailability.partial.map(({ classroom, freeSlots }) => (
                <div key={classroom.id} className="flex items-center justify-between p-2 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-medium text-sm">{classroom.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Users className="h-3 w-3" />
                      {classroom.capacity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {freeSlots.map(s => `${s.start}-${s.end}`).join(", ")}
                    </span>
                  </div>
                </div>
              ))}

              {/* Salles occupées */}
              {roomsAvailability.occupied.map(({ classroom }) => (
                <div key={classroom.id} className="flex items-center justify-between p-2 rounded-lg border bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="font-medium text-sm">{classroom.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Users className="h-3 w-3" />
                      {classroom.capacity}
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">
                    Occupée
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useMemo } from "react";
import { useClassrooms } from "@/hooks/useClassrooms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, Users, CheckCircle2, Clock, XCircle, CalendarDays } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";
import { fr } from "date-fns/locale";

interface ClassroomAvailabilityWidgetProps {
  schoolId: string;
}

export function ClassroomAvailabilityWidget({ schoolId }: ClassroomAvailabilityWidgetProps) {
  const { classrooms, assignments: classroomAssignments } = useClassrooms(schoolId);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Calculate room availability for the selected date
  const roomsAvailability = useMemo(() => {
    const available: typeof classrooms = [];
    const occupied: { classroom: typeof classrooms[0]; sessions: any[] }[] = [];
    const partial: { classroom: typeof classrooms[0]; sessions: any[]; freeSlots: { start: string; end: string }[] }[] = [];

    const dayStart = "08:00";
    const dayEnd = "18:00";

    classrooms.forEach(classroom => {
      if (!classroom.is_active) return;

      // Find all sessions for this room on this day
      const dayAssignments = classroomAssignments.filter(ca => {
        if (ca.classroom_id !== classroom.id) return false;
        if (!ca.assignments) return false;
        return ca.assignments.session_date === selectedDate;
      });

      const sessions = dayAssignments.map(ca => ca.assignments).filter(Boolean);

      if (sessions.length === 0) {
        available.push(classroom);
      } else {
        // Calculate free slots
        const sortedSessions = [...sessions].sort((a, b) => 
          (a?.start_time || "").localeCompare(b?.start_time || "")
        );

        const freeSlots: { start: string; end: string }[] = [];
        let currentEnd = dayStart;

        for (const session of sortedSessions) {
          if (session?.start_time && session.start_time > currentEnd) {
            freeSlots.push({ start: currentEnd, end: session.start_time });
          }
          if (session?.end_time && session.end_time > currentEnd) {
            currentEnd = session.end_time;
          }
        }

        if (currentEnd < dayEnd) {
          freeSlots.push({ start: currentEnd, end: dayEnd });
        }

        // Filter valid slots
        const validFreeSlots = freeSlots.filter(s => s.start < s.end);

        if (validFreeSlots.length > 0) {
          partial.push({ classroom, sessions, freeSlots: validFreeSlots });
        } else {
          occupied.push({ classroom, sessions });
        }
      }
    });

    return { available, occupied, partial };
  }, [classrooms, classroomAssignments, selectedDate]);

  const totalRooms = classrooms.filter(c => c.is_active).length;
  const dateIsToday = isToday(parseISO(selectedDate));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Building2 className="h-4 w-4 text-primary" />
            Salles de cours
          </CardTitle>
          <div className="relative">
            <CalendarDays className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-32 h-7 text-xs pl-8"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {dateIsToday ? "Aujourd'hui" : format(parseISO(selectedDate), "EEEE d MMMM", { locale: fr })}
        </p>
      </CardHeader>
      
      <CardContent className="pt-3">
        {totalRooms === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucune salle</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {roomsAvailability.available.length}
                </span>
                <span className="text-[10px] text-muted-foreground">Libres</span>
              </div>
              <div className="flex flex-col items-center p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mb-1" />
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {roomsAvailability.partial.length}
                </span>
                <span className="text-[10px] text-muted-foreground">Partielles</span>
              </div>
              <div className="flex flex-col items-center p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30">
                <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 mb-1" />
                <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {roomsAvailability.occupied.length}
                </span>
                <span className="text-[10px] text-muted-foreground">Occupées</span>
              </div>
            </div>

            {/* Rooms list */}
            <ScrollArea className="h-[160px]">
              <div className="space-y-1.5 pr-2">
                {/* Available rooms */}
                {roomsAvailability.available.slice(0, 4).map(room => (
                  <div 
                    key={room.id} 
                    className="flex items-center justify-between p-2 rounded-md bg-emerald-50/60 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-medium text-sm truncate">{room.name}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                        <Users className="h-2.5 w-2.5" />
                        {room.capacity}
                      </span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="text-[9px] h-4 px-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 shrink-0"
                    >
                      Libre
                    </Badge>
                  </div>
                ))}
                {roomsAvailability.available.length > 4 && (
                  <p className="text-[10px] text-muted-foreground text-center py-1">
                    +{roomsAvailability.available.length - 4} autres libres
                  </p>
                )}

                {/* Partial rooms */}
                {roomsAvailability.partial.slice(0, 3).map(({ classroom, freeSlots }) => (
                  <div 
                    key={classroom.id} 
                    className="flex items-center justify-between p-2 rounded-md bg-amber-50/60 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="font-medium text-sm truncate">{classroom.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                      <Clock className="h-2.5 w-2.5" />
                      <span className="max-w-[80px] truncate">
                        {freeSlots.slice(0, 2).map(s => `${s.start.substring(0,5)}-${s.end.substring(0,5)}`).join(", ")}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Occupied rooms */}
                {roomsAvailability.occupied.slice(0, 2).map(({ classroom }) => (
                  <div 
                    key={classroom.id} 
                    className="flex items-center justify-between p-2 rounded-md bg-rose-50/60 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-medium text-sm truncate">{classroom.name}</span>
                    </div>
                    <Badge variant="destructive" className="text-[9px] h-4 px-1.5 shrink-0">
                      Occupée
                    </Badge>
                  </div>
                ))}
                {roomsAvailability.occupied.length > 2 && (
                  <p className="text-[10px] text-muted-foreground text-center py-1">
                    +{roomsAvailability.occupied.length - 2} autres occupées
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useMemo } from "react";
import { useClassrooms } from "@/hooks/useClassrooms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, Users, CheckCircle2, Clock, XCircle, CalendarDays, Sparkles } from "lucide-react";
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
  const availabilityPercent = totalRooms > 0 ? Math.round((roomsAvailability.available.length / totalRooms) * 100) : 0;

  if (totalRooms === 0) {
    return (
      <Card className="h-full bg-gradient-to-br from-background to-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            Salles de cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">Aucune salle configurée</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Ajoutez des salles dans la section dédiée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-gradient-to-br from-background to-muted/20 overflow-hidden">
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="block truncate">Salles de cours</span>
              <span className="text-xs font-normal text-muted-foreground">
                {dateIsToday ? "Aujourd'hui" : format(parseISO(selectedDate), "EEE d MMM", { locale: fr })}
              </span>
            </div>
          </CardTitle>
          <div className="relative shrink-0">
            <CalendarDays className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[120px] h-8 text-xs pl-7 bg-background/50"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-3 space-y-4">
        {/* Visual summary bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Disponibilité</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              {availabilityPercent >= 70 && <Sparkles className="h-3 w-3" />}
              {availabilityPercent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden flex">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(roomsAvailability.available.length / totalRooms) * 100}%` }}
            />
            <div 
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${(roomsAvailability.partial.length / totalRooms) * 100}%` }}
            />
            <div 
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${(roomsAvailability.occupied.length / totalRooms) * 100}%` }}
            />
          </div>
        </div>

        {/* Compact stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="relative overflow-hidden rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5">
            <CheckCircle2 className="absolute -right-1 -top-1 h-8 w-8 text-emerald-500/10" />
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {roomsAvailability.available.length}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">Libres</div>
          </div>
          <div className="relative overflow-hidden rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5">
            <Clock className="absolute -right-1 -top-1 h-8 w-8 text-amber-500/10" />
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {roomsAvailability.partial.length}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">Partielles</div>
          </div>
          <div className="relative overflow-hidden rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5">
            <XCircle className="absolute -right-1 -top-1 h-8 w-8 text-rose-500/10" />
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {roomsAvailability.occupied.length}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">Occupées</div>
          </div>
        </div>

        {/* Rooms list */}
        <ScrollArea className="h-[140px]">
          <div className="space-y-1 pr-2">
            {/* Available rooms - show first 3 */}
            {roomsAvailability.available.slice(0, 3).map(room => (
              <div 
                key={room.id} 
                className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <span className="font-medium text-sm truncate">{room.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Users className="h-2.5 w-2.5" />
                    {room.capacity}
                  </span>
                  <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-0">
                    Libre
                  </Badge>
                </div>
              </div>
            ))}
            {roomsAvailability.available.length > 3 && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium text-center py-1">
                +{roomsAvailability.available.length - 3} autres libres
              </p>
            )}

            {/* Partial rooms - show first 2 */}
            {roomsAvailability.partial.slice(0, 2).map(({ classroom, freeSlots }) => (
              <div 
                key={classroom.id} 
                className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/20 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-medium text-sm truncate">{classroom.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded font-medium">
                    {freeSlots[0].start.substring(0,5)}-{freeSlots[0].end.substring(0,5)}
                  </span>
                  {freeSlots.length > 1 && (
                    <span className="text-[9px] text-muted-foreground">+{freeSlots.length - 1}</span>
                  )}
                </div>
              </div>
            ))}

            {/* Occupied rooms - show first 2 */}
            {roomsAvailability.occupied.slice(0, 2).map(({ classroom, sessions }) => (
              <div 
                key={classroom.id} 
                className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/30 dark:border-rose-800/20"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-medium text-sm truncate">{classroom.name}</span>
                </div>
                <Badge variant="destructive" className="text-[9px] h-4 px-1.5">
                  {sessions.length} séance{sessions.length > 1 ? 's' : ''}
                </Badge>
              </div>
            ))}
            {roomsAvailability.occupied.length > 2 && (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium text-center py-1">
                +{roomsAvailability.occupied.length - 2} autres occupées
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
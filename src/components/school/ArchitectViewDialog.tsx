import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Building2, Users, Calendar, Clock, Eye, 
  CheckCircle2, AlertTriangle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface OccupancySlot {
  start: string;
  end: string;
  session: any;
}

interface Classroom {
  id: string;
  name: string;
  capacity: number;
  building?: string;
  floor?: string;
  equipment?: string[];
  is_active: boolean;
}

interface ClassroomAssignment {
  id: string;
  classroom_id: string;
  assignment_id: string;
  assignments?: {
    session_date: string;
    start_time: string;
    end_time: string;
    title: string;
    classes?: {
      name: string;
    };
  };
}

interface ArchitectViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classrooms: Classroom[];
  classroomAssignments: ClassroomAssignment[];
}

export function ArchitectViewDialog({ 
  open, 
  onOpenChange, 
  classrooms, 
  classroomAssignments 
}: ArchitectViewDialogProps) {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; start: string; end: string } | null>(null);
  const [architectDate, setArchitectDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [architectStartTime, setArchitectStartTime] = useState("08:00");
  const [architectEndTime, setArchitectEndTime] = useState("18:00");

  // Get room occupancy slots for a given time range
  const getRoomOccupancySlots = useCallback((
    classroomId: string,
    date: string,
    startTime: string,
    endTime: string
  ): OccupancySlot[] => {
    const slots: OccupancySlot[] = [];
    
    classroomAssignments.forEach(ca => {
      if (ca.classroom_id !== classroomId) return;
      if (!ca.assignments) return;
      if (ca.assignments.session_date !== date) return;
      
      const sessionStart = ca.assignments.start_time;
      const sessionEnd = ca.assignments.end_time;
      
      if (sessionStart < endTime && sessionEnd > startTime) {
        slots.push({
          start: sessionStart,
          end: sessionEnd,
          session: ca.assignments
        });
      }
    });
    
    return slots.sort((a, b) => a.start.localeCompare(b.start));
  }, [classroomAssignments]);

  // Calculate free slots for a room in a given time range
  const getFreeSlots = useCallback((
    occupancySlots: OccupancySlot[],
    startTime: string,
    endTime: string
  ): { start: string; end: string }[] => {
    if (occupancySlots.length === 0) {
      return [{ start: startTime, end: endTime }];
    }
    
    const sortedSlots = [...occupancySlots].sort((a, b) => a.start.localeCompare(b.start));
    const freeSlots: { start: string; end: string }[] = [];
    let currentEnd = startTime;
    
    for (const slot of sortedSlots) {
      // Slot start within our range
      const effectiveStart = slot.start < startTime ? startTime : slot.start;
      const effectiveEnd = slot.end > endTime ? endTime : slot.end;
      
      // If there's a gap before this slot
      if (effectiveStart > currentEnd) {
        freeSlots.push({ start: currentEnd, end: effectiveStart });
      }
      
      // Move currentEnd forward
      if (effectiveEnd > currentEnd) {
        currentEnd = effectiveEnd;
      }
    }
    
    // Check for remaining time after last slot
    if (currentEnd < endTime) {
      freeSlots.push({ start: currentEnd, end: endTime });
    }
    
    // Filter out zero-duration or invalid slots
    return freeSlots.filter(slot => slot.start < slot.end);
  }, []);

  // Get available rooms with details
  const roomsWithDetails = useMemo(() => {
    if (!selectedTimeSlot) {
      return { 
        available: classrooms.filter(c => c.is_active).map(c => ({ classroom: c, freeSlots: [], occupancySlots: [] })), 
        partial: [], 
        occupied: [] 
      };
    }

    const available: { classroom: Classroom; freeSlots: { start: string; end: string }[]; occupancySlots: OccupancySlot[] }[] = [];
    const partial: { classroom: Classroom; freeSlots: { start: string; end: string }[]; occupancySlots: OccupancySlot[] }[] = [];
    const occupied: { classroom: Classroom; freeSlots: { start: string; end: string }[]; occupancySlots: OccupancySlot[] }[] = [];

    classrooms.forEach(classroom => {
      if (!classroom.is_active) return;

      const occupancySlots = getRoomOccupancySlots(
        classroom.id,
        selectedTimeSlot.date,
        selectedTimeSlot.start,
        selectedTimeSlot.end
      );

      const freeSlots = getFreeSlots(occupancySlots, selectedTimeSlot.start, selectedTimeSlot.end);

      if (occupancySlots.length === 0) {
        available.push({ classroom, freeSlots, occupancySlots });
      } else if (freeSlots.length > 0) {
        partial.push({ classroom, freeSlots, occupancySlots });
      } else {
        occupied.push({ classroom, freeSlots, occupancySlots });
      }
    });

    return { available, partial, occupied };
  }, [classrooms, selectedTimeSlot, getRoomOccupancySlots, getFreeSlots]);

  // Group classrooms by building and floor
  const buildingsWithFloors = useMemo(() => {
    const buildings: Record<string, { floors: Record<string, Classroom[]>; maxFloor: number }> = {};
    
    classrooms.forEach(classroom => {
      if (!classroom.is_active) return;
      const buildingName = classroom.building || "Bâtiment Principal";
      const floorName = classroom.floor || "RDC";
      
      if (!buildings[buildingName]) {
        buildings[buildingName] = { floors: {}, maxFloor: 0 };
      }
      if (!buildings[buildingName].floors[floorName]) {
        buildings[buildingName].floors[floorName] = [];
      }
      buildings[buildingName].floors[floorName].push(classroom);
      
      const floorNum = parseInt(floorName.replace(/\D/g, '')) || 0;
      buildings[buildingName].maxFloor = Math.max(buildings[buildingName].maxFloor, floorNum);
    });

    return buildings;
  }, [classrooms]);

  const handleApplySlot = () => {
    setSelectedTimeSlot({
      date: architectDate,
      start: architectStartTime,
      end: architectEndTime
    });
  };

  const getRoomStatus = (roomId: string): "available" | "partial" | "occupied" | "neutral" => {
    if (!selectedTimeSlot) return "neutral";
    
    if (roomsWithDetails.available.find(r => r.classroom.id === roomId)) return "available";
    if (roomsWithDetails.partial.find(r => r.classroom.id === roomId)) return "partial";
    return "occupied";
  };

  const getRoomDetails = (roomId: string) => {
    return roomsWithDetails.available.find(r => r.classroom.id === roomId) ||
           roomsWithDetails.partial.find(r => r.classroom.id === roomId) ||
           roomsWithDetails.occupied.find(r => r.classroom.id === roomId);
  };

  const buildingEntries = Object.entries(buildingsWithFloors);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Building2 className="h-5 w-5 text-primary" />
            Vue Architecte
          </DialogTitle>
          <DialogDescription className="text-sm">
            Visualisez la disponibilité des salles par bâtiment
          </DialogDescription>
        </DialogHeader>

        {/* Time slot selector */}
        <div className="px-6 py-4 bg-muted/40 border-b shrink-0">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={architectDate}
                onChange={(e) => setArchitectDate(e.target.value)}
                className="w-36 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Début</Label>
              <Input
                type="time"
                value={architectStartTime}
                onChange={(e) => setArchitectStartTime(e.target.value)}
                className="w-28 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fin</Label>
              <Input
                type="time"
                value={architectEndTime}
                onChange={(e) => setArchitectEndTime(e.target.value)}
                className="w-28 h-9 text-sm"
              />
            </div>
            <Button onClick={handleApplySlot} size="sm" className="gap-2 h-9">
              <Eye className="h-4 w-4" />
              Analyser
            </Button>
          </div>

          {selectedTimeSlot ? (
            <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {format(parseISO(selectedTimeSlot.date), "EEE dd MMM", { locale: fr })}
                </span>
                <span className="text-muted-foreground">
                  {selectedTimeSlot.start} - {selectedTimeSlot.end}
                </span>
              </div>
              <div className="flex items-center gap-4 ml-auto text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="font-medium">{roomsWithDetails.available.length}</span>
                  <span className="text-muted-foreground hidden sm:inline">libres</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="font-medium">{roomsWithDetails.partial.length}</span>
                  <span className="text-muted-foreground hidden sm:inline">partielles</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="font-medium">{roomsWithDetails.occupied.length}</span>
                  <span className="text-muted-foreground hidden sm:inline">occupées</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Sélectionnez une date et une plage horaire puis cliquez sur "Analyser" pour voir la disponibilité
              </p>
            </div>
          )}
        </div>

        {/* Buildings view with proper scroll - touch-friendly */}
        <div className="flex-1 min-h-0 overflow-auto overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="p-6 space-y-8 pb-10">
            {buildingEntries.map(([buildingName, buildingData]) => {
              const floorNames = Object.keys(buildingData.floors).sort((a, b) => {
                const numA = parseInt(a.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.replace(/\D/g, '')) || 0;
                return numB - numA;
              });
              
              const allRooms = Object.values(buildingData.floors).flat();

              return (
                <div key={buildingName} className="space-y-3">
                  {/* Building header */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{buildingName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {allRooms.length} salle(s) • {floorNames.length} niveau(x)
                      </p>
                    </div>
                  </div>

                  {/* Building structure - Clean card-based design */}
                  <div className="relative rounded-xl overflow-hidden border bg-card shadow-sm">
                    {/* Floors */}
                    {floorNames.map((floorName, floorIndex) => {
                      const rooms = buildingData.floors[floorName];
                      
                      return (
                        <div key={floorName} className={floorIndex > 0 ? "border-t" : ""}>
                          <div className="flex">
                            {/* Floor label */}
                            <div className="w-14 shrink-0 bg-muted/50 flex items-center justify-center border-r py-4">
                              <span className="font-medium text-xs text-muted-foreground -rotate-90 whitespace-nowrap">
                                {floorName}
                              </span>
                            </div>

                            {/* Rooms grid */}
                            <div className="flex-1 p-3 flex flex-wrap gap-2">
                              {rooms.map((room) => {
                                const status = getRoomStatus(room.id);
                                const roomDetails = getRoomDetails(room.id);

                                const statusStyles = {
                                  neutral: "bg-muted/50 border-border hover:border-muted-foreground/50",
                                  available: "bg-emerald-50 border-emerald-300 hover:border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-700",
                                  partial: "bg-amber-50 border-amber-300 hover:border-amber-400 dark:bg-amber-950/30 dark:border-amber-700",
                                  occupied: "bg-rose-50 border-rose-300 hover:border-rose-400 dark:bg-rose-950/30 dark:border-rose-700"
                                };

                                const statusBadge = {
                                  neutral: { color: "bg-muted-foreground/40", icon: Building2 },
                                  available: { color: "bg-emerald-500", icon: CheckCircle2 },
                                  partial: { color: "bg-amber-500", icon: Clock },
                                  occupied: { color: "bg-rose-500", icon: AlertTriangle }
                                };

                                const StatusIcon = statusBadge[status].icon;

                                return (
                                  <Popover key={room.id}>
                                    <PopoverTrigger asChild>
                                      <div 
                                        className={`
                                          relative min-w-[110px] max-w-[140px] p-3 rounded-lg border-2 cursor-pointer
                                          transition-all duration-150 hover:shadow-md active:scale-[0.98]
                                          ${statusStyles[status]}
                                        `}
                                      >
                                        {/* Status indicator */}
                                        <div className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full ${statusBadge[status].color} flex items-center justify-center`}>
                                          <StatusIcon className="h-2.5 w-2.5 text-white" />
                                        </div>

                                        {/* Room info */}
                                        <div className="pr-4">
                                          <p className="font-semibold text-sm truncate">{room.name}</p>
                                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                            <Users className="h-3 w-3" />
                                            <span>{room.capacity}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </PopoverTrigger>
                                    <PopoverContent 
                                      side="top" 
                                      className="w-72 p-0"
                                      align="center"
                                    >
                                      <div className="p-3 space-y-2">
                                        {/* Header */}
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="font-semibold">{room.name}</span>
                                          <Badge 
                                            variant={status === "available" ? "default" : status === "partial" ? "secondary" : status === "occupied" ? "destructive" : "outline"}
                                            className="text-[10px] h-5"
                                          >
                                            {status === "available" ? "Libre" : status === "partial" ? "Partiel" : status === "occupied" ? "Occupée" : "—"}
                                          </Badge>
                                        </div>

                                        {/* Info */}
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {room.capacity} places
                                          </span>
                                          {room.building && (
                                            <span>{room.building}</span>
                                          )}
                                        </div>

                                        {/* Availability details */}
                                        {selectedTimeSlot && roomDetails && (
                                          <div className="border-t pt-2 space-y-1.5">
                                            {roomDetails.occupancySlots.length > 0 && (
                                              <div>
                                                <p className="text-[10px] font-medium text-rose-600 dark:text-rose-400 mb-1">
                                                  Occupé :
                                                </p>
                                                <div className="space-y-1">
                                                  {roomDetails.occupancySlots.map((slot, i) => (
                                                    <div key={i} className="text-[10px] bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded">
                                                      <span className="font-medium">{slot.start.substring(0, 5)} - {slot.end.substring(0, 5)}</span>
                                                      {slot.session && (
                                                        <span className="block text-rose-600 dark:text-rose-400">
                                                          {slot.session.subjects?.name || slot.session.title} • {slot.session.classes?.name}
                                                        </span>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            {roomDetails.freeSlots.length > 0 && (
                                              <div>
                                                <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                                                  Disponible :
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                  {roomDetails.freeSlots.map((slot, i) => (
                                                    <span key={i} className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                                                      {slot.start.substring(0, 5)} - {slot.end.substring(0, 5)}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                  </div>
                </div>
              );
            })}

            {buildingEntries.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="font-medium text-muted-foreground">Aucune salle configurée</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Créez des salles avec leur bâtiment et étage
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/30 shrink-0 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

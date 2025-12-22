import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Building, Building2, Users, Calendar, Clock, Eye, 
  CheckCircle2, AlertTriangle, MapPin, DoorOpen,
  Armchair, BookOpen, Monitor, Wifi
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
    let currentStart = startTime;
    
    for (const slot of sortedSlots) {
      // Clamp slot times to the query range
      const slotStart = slot.start < startTime ? startTime : slot.start;
      const slotEnd = slot.end > endTime ? endTime : slot.end;
      
      if (slotStart > currentStart) {
        freeSlots.push({ start: currentStart, end: slotStart });
      }
      if (slotEnd > currentStart) {
        currentStart = slotEnd;
      }
    }
    
    if (currentStart < endTime) {
      freeSlots.push({ start: currentStart, end: endTime });
    }
    
    // Filter out invalid slots (zero duration or start >= end)
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

  const getRoomStatus = (roomId: string): "available" | "partial" | "occupied" => {
    if (!selectedTimeSlot) return "available";
    
    if (roomsWithDetails.available.find(r => r.classroom.id === roomId)) return "available";
    if (roomsWithDetails.partial.find(r => r.classroom.id === roomId)) return "partial";
    return "occupied";
  };

  const getRoomDetails = (roomId: string) => {
    return roomsWithDetails.available.find(r => r.classroom.id === roomId) ||
           roomsWithDetails.partial.find(r => r.classroom.id === roomId) ||
           roomsWithDetails.occupied.find(r => r.classroom.id === roomId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building className="h-6 w-6 text-primary" />
            Vue Architecte - Coupe Transversale
          </DialogTitle>
          <DialogDescription>
            Visualisez vos bâtiments en coupe et la disponibilité des salles en temps réel
          </DialogDescription>
        </DialogHeader>

        {/* Time slot selector */}
        <div className="px-6 py-4 bg-muted/30 border-b">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={architectDate}
                onChange={(e) => setArchitectDate(e.target.value)}
                className="w-40 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Heure début</Label>
              <Input
                type="time"
                value={architectStartTime}
                onChange={(e) => setArchitectStartTime(e.target.value)}
                className="w-32 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Heure fin</Label>
              <Input
                type="time"
                value={architectEndTime}
                onChange={(e) => setArchitectEndTime(e.target.value)}
                className="w-32 h-10"
              />
            </div>
            <Button onClick={handleApplySlot} className="gap-2 h-10 px-6">
              <Eye className="h-4 w-4" />
              Analyser
            </Button>
          </div>

          {selectedTimeSlot && (
            <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {format(parseISO(selectedTimeSlot.date), "EEEE dd MMMM yyyy", { locale: fr })}
                </span>
                <span className="text-muted-foreground text-sm">
                  de {selectedTimeSlot.start} à {selectedTimeSlot.end}
                </span>
              </div>
              <div className="flex items-center gap-5 ml-auto">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm" />
                  <span className="text-sm font-medium">{roomsWithDetails.available.length} libre(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500 shadow-sm" />
                  <span className="text-sm font-medium">{roomsWithDetails.partial.length} partielle(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-rose-500 shadow-sm" />
                  <span className="text-sm font-medium">{roomsWithDetails.occupied.length} occupée(s)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buildings view - Cross section style */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-6 space-y-12">
            {Object.entries(buildingsWithFloors).map(([buildingName, buildingData]) => {
              const floorNames = Object.keys(buildingData.floors).sort((a, b) => {
                const numA = parseInt(a.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.replace(/\D/g, '')) || 0;
                return numB - numA;
              });
              
              const allRooms = Object.values(buildingData.floors).flat();

              return (
                <div key={buildingName} className="space-y-4">
                  {/* Building header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center shadow-sm">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{buildingName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {allRooms.length} salle(s) • {floorNames.length} étage(s)
                      </p>
                    </div>
                  </div>

                  {/* Cross-section building view */}
                  <div className="relative">
                    {/* Sky background */}
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-sky-200 to-sky-100 dark:from-sky-900 dark:to-sky-800 rounded-t-2xl -z-10" />
                    
                    {/* Trees on sides */}
                    <div className="absolute left-4 bottom-0 z-10">
                      <div className="w-12 h-16 bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-800 dark:to-emerald-600 rounded-full" />
                      <div className="w-3 h-8 bg-amber-800 dark:bg-amber-900 mx-auto -mt-2" />
                    </div>
                    <div className="absolute right-4 bottom-0 z-10">
                      <div className="w-10 h-14 bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-800 dark:to-emerald-600 rounded-full" />
                      <div className="w-2.5 h-6 bg-amber-800 dark:bg-amber-900 mx-auto -mt-1" />
                    </div>

                    {/* Building structure */}
                    <div className="mx-20 relative">
                      {/* Roof */}
                      <div className="relative h-8 flex items-end justify-center">
                        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-b from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600 rounded-t-lg" />
                        <div className="absolute inset-x-4 top-0 h-4 bg-gradient-to-b from-slate-500 to-slate-600 dark:from-slate-400 dark:to-slate-500 rounded-t" />
                      </div>

                      {/* Floors */}
                      <div className="border-x-4 border-slate-600 dark:border-slate-500 bg-gradient-to-b from-stone-100 to-stone-200 dark:from-slate-800 dark:to-slate-850">
                        {floorNames.map((floorName, floorIndex) => {
                          const rooms = buildingData.floors[floorName];
                          
                          return (
                            <div key={floorName}>
                              {/* Floor separator */}
                              {floorIndex > 0 && (
                                <div className="h-1.5 bg-slate-500 dark:bg-slate-400" />
                              )}
                              
                              <div className="flex min-h-[120px]">
                                {/* Floor label */}
                                <div className="w-16 shrink-0 bg-slate-200 dark:bg-slate-700 border-r-2 border-slate-400 dark:border-slate-500 flex items-center justify-center">
                                  <span className="font-bold text-xs text-slate-600 dark:text-slate-300 -rotate-90 whitespace-nowrap">
                                    {floorName}
                                  </span>
                                </div>

                                {/* Rooms */}
                                <div className="flex-1 flex items-stretch p-3 gap-3">
                                  {rooms.map((room) => {
                                    const status = getRoomStatus(room.id);
                                    const roomDetails = getRoomDetails(room.id);

                                    const bgColor = status === "available" 
                                      ? "from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/30" 
                                      : status === "partial"
                                      ? "from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30"
                                      : "from-rose-100 to-rose-50 dark:from-rose-900/50 dark:to-rose-800/30";

                                    const borderColor = status === "available" 
                                      ? "border-emerald-400 dark:border-emerald-600" 
                                      : status === "partial"
                                      ? "border-amber-400 dark:border-amber-600"
                                      : "border-rose-400 dark:border-rose-600";

                                    return (
                                      <Popover key={room.id}>
                                        <PopoverTrigger asChild>
                                          <div 
                                            className={`
                                              relative flex-1 min-w-[100px] max-w-[160px] rounded-lg cursor-pointer
                                              bg-gradient-to-b ${bgColor}
                                              border-2 ${borderColor}
                                              shadow-md hover:shadow-lg transition-all duration-200
                                              hover:scale-105 hover:z-10
                                              overflow-hidden
                                            `}
                                          >
                                            {/* Window effect */}
                                            <div className="absolute inset-2 bg-gradient-to-br from-sky-200/60 to-transparent dark:from-sky-600/20 rounded pointer-events-none" />
                                            
                                            {/* Room interior decorations */}
                                            <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between opacity-40">
                                              <Armchair className="h-4 w-4" />
                                              <Monitor className="h-4 w-4" />
                                              <BookOpen className="h-4 w-4" />
                                            </div>

                                            {/* Room info */}
                                            <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 text-center">
                                              <span className="font-bold text-sm mb-1">{room.name}</span>
                                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Users className="h-3 w-3" />
                                                <span>{room.capacity}</span>
                                              </div>
                                            </div>

                                            {/* Status indicator */}
                                            <div className={`
                                              absolute top-2 right-2 w-5 h-5 rounded-full shadow-md
                                              flex items-center justify-center
                                              ${status === "available" ? "bg-emerald-500" :
                                                status === "partial" ? "bg-amber-500" : "bg-rose-500"
                                              }
                                            `}>
                                              {status === "available" && <CheckCircle2 className="h-3 w-3 text-white" />}
                                              {status === "partial" && <Clock className="h-3 w-3 text-white" />}
                                              {status === "occupied" && <AlertTriangle className="h-3 w-3 text-white" />}
                                            </div>
                                          </div>
                                        </PopoverTrigger>
                                        <PopoverContent side="top" className="w-72 p-0" align="center">
                                          <div className="p-4 space-y-3">
                                            {/* Header */}
                                            <div className="flex items-center justify-between">
                                              <h4 className="font-bold text-lg">{room.name}</h4>
                                              <Badge 
                                                variant={status === "available" ? "default" : status === "partial" ? "secondary" : "destructive"}
                                                className="text-xs"
                                              >
                                                {status === "available" ? "Libre" : status === "partial" ? "Partiel" : "Occupée"}
                                              </Badge>
                                            </div>

                                            {/* Room info */}
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                              <div className="flex items-center gap-2 text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                <span>{room.capacity} places</span>
                                              </div>
                                              {room.building && (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                  <Building2 className="h-4 w-4" />
                                                  <span>{room.building}</span>
                                                </div>
                                              )}
                                              {room.floor && (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                  <MapPin className="h-4 w-4" />
                                                  <span>Étage {room.floor}</span>
                                                </div>
                                              )}
                                              {room.equipment && room.equipment.length > 0 && (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                  <Wifi className="h-4 w-4" />
                                                  <span>{room.equipment.length} équip.</span>
                                                </div>
                                              )}
                                            </div>

                                            {/* Availability details */}
                                            {selectedTimeSlot && roomDetails && (
                                              <div className="border-t pt-3 space-y-2">
                                                {roomDetails.occupancySlots.length > 0 && (
                                                  <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                                      <AlertTriangle className="h-3 w-3" /> Créneaux occupés:
                                                    </p>
                                                    {roomDetails.occupancySlots.map((slot, i) => (
                                                      <div key={i} className="text-xs bg-rose-50 dark:bg-rose-900/20 rounded px-2 py-1">
                                                        <span className="font-medium">{slot.start.substring(0, 5)} - {slot.end.substring(0, 5)}</span>
                                                        <span className="text-muted-foreground ml-1">
                                                          {slot.session?.classes?.name || slot.session?.title || "Séance"}
                                                        </span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                                {roomDetails.freeSlots.length > 0 && (
                                                  <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                      <CheckCircle2 className="h-3 w-3" /> Créneaux libres:
                                                    </p>
                                                    {roomDetails.freeSlots.map((slot, i) => (
                                                      <div key={i} className="text-xs bg-emerald-50 dark:bg-emerald-900/20 rounded px-2 py-1 font-medium">
                                                        {slot.start.substring(0, 5)} - {slot.end.substring(0, 5)}
                                                      </div>
                                                    ))}
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

                                {/* Stairs / corridor on right */}
                                <div className="w-12 shrink-0 bg-slate-300 dark:bg-slate-600 border-l-2 border-slate-400 dark:border-slate-500 flex items-center justify-center">
                                  <div className="space-y-1">
                                    <div className="w-6 h-1 bg-slate-500 dark:bg-slate-400" />
                                    <div className="w-6 h-1 bg-slate-500 dark:bg-slate-400" />
                                    <div className="w-6 h-1 bg-slate-500 dark:bg-slate-400" />
                                    <div className="w-6 h-1 bg-slate-500 dark:bg-slate-400" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Ground floor entrance */}
                      <div className="flex justify-center bg-slate-600 dark:bg-slate-500 py-1">
                        <div className="w-16 h-10 bg-gradient-to-b from-amber-700 to-amber-900 dark:from-amber-600 dark:to-amber-800 rounded-t-lg flex items-center justify-center shadow-inner">
                          <DoorOpen className="h-5 w-5 text-amber-200" />
                        </div>
                      </div>

                      {/* Foundation */}
                      <div className="h-3 bg-gradient-to-b from-stone-500 to-stone-600 dark:from-slate-600 dark:to-slate-700" />
                    </div>

                    {/* Ground */}
                    <div className="h-6 bg-gradient-to-b from-emerald-600 to-emerald-700 dark:from-emerald-800 dark:to-emerald-900 rounded-b-xl mx-4" />
                  </div>
                </div>
              );
            })}

            {Object.keys(buildingsWithFloors).length === 0 && (
              <div className="text-center py-16">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="font-semibold text-lg">Aucune salle configurée</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Créez des salles avec leur bâtiment et étage pour les visualiser ici
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

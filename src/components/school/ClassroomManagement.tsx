import { useState, useMemo, useCallback } from "react";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useAssignments } from "@/hooks/useAssignments";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { useSchoolYears } from "@/hooks/useSchoolYears";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, Building2, Users, MapPin, Trash2, Calendar, Clock, 
  Wand2, CheckCircle2, AlertTriangle, Filter,
  Sparkles, LayoutGrid, List, Lightbulb, ArrowRight, X,
  CalendarRange, Search, Check, Building, Eye, DoorOpen, XCircle
} from "lucide-react";
import { format, addDays, startOfDay, endOfDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface ClassroomManagementProps {
  schoolId: string;
}

interface AutoAssignmentResult {
  assignment: any;
  classroom: any;
  className: string;
  studentCount: number;
  reason: string;
  efficiency?: number;
  manualOverrideClassroomId?: string;
}

interface ProblemResult {
  assignment: any;
  className: string;
  studentCount: number;
  reason: string;
  solutions: Solution[];
}

interface Solution {
  id: string;
  label: string;
  description: string;
  action: () => void;
  type: "primary" | "secondary";
}

interface OccupancySlot {
  start: string;
  end: string;
  session: any;
}

export function ClassroomManagement({ schoolId }: ClassroomManagementProps) {
  const { classrooms, assignments: classroomAssignments, createClassroom, deleteClassroom, assignClassroom, unassignClassroom } = useClassrooms(schoolId);
  const { assignments } = useAssignments({ schoolId });
  const { classes } = useClasses(schoolId);
  const { students } = useStudents(schoolId);
  const { schoolYears } = useSchoolYears();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isAutoAssignDialogOpen, setIsAutoAssignDialogOpen] = useState(false);
  const [isArchitectViewOpen, setIsArchitectViewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoAssignStep, setAutoAssignStep] = useState<"preview" | "processing" | "complete">("preview");
  
  // Vue architecte
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; start: string; end: string } | null>(null);
  const [architectDate, setArchitectDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [architectStartTime, setArchitectStartTime] = useState("08:00");
  const [architectEndTime, setArchitectEndTime] = useState("18:00");
  
  // Filtres pour l'assignation automatique
  const [filterClassId, setFilterClassId] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<"7" | "14" | "30" | "all">("7");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"valid" | "invalid">("valid");
  
  // State pour gérer les changements manuels de salle
  const [manualOverrides, setManualOverrides] = useState<Record<string, string>>({});
  
  const [newClassroom, setNewClassroom] = useState({
    name: "",
    capacity: 30,
    building: "",
    floor: "",
    equipment: [] as string[],
  });

  const [assignmentForm, setAssignmentForm] = useState({
    classroom_id: "",
    assignment_id: "",
  });

  // Récupérer l'année scolaire courante
  const currentYear = useMemo(() => {
    return schoolYears.find(y => y.is_current);
  }, [schoolYears]);

  // Filtrer les classes de l'année en cours uniquement
  const currentYearClasses = useMemo(() => {
    if (!currentYear) return classes;
    return classes.filter(c => (c as any).school_year_id === currentYear.id);
  }, [classes, currentYear]);

  // Calculer le nombre d'étudiants par classe
  const studentCountByClass = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(student => {
      counts[student.class_id] = (counts[student.class_id] || 0) + 1;
    });
    return counts;
  }, [students]);

  // Sessions non assignées à une salle avec filtres
  const today = startOfDay(new Date());
  
  const getDateRangeEnd = useCallback(() => {
    if (filterDateRange === "all") return null;
    return endOfDay(addDays(today, parseInt(filterDateRange)));
  }, [filterDateRange, today]);

  const unassignedSessions = useMemo(() => {
    const assignedSessionIds = new Set(classroomAssignments.map(ca => ca.assignment_id));
    const dateEnd = getDateRangeEnd();
    
    return assignments.filter((assignment) => {
      if (assignment.type !== "course") return false;
      if (!assignment.session_date || !assignment.start_time || !assignment.end_time) return false;
      
      const sessionDate = parseISO(assignment.session_date);
      if (sessionDate < today) return false;
      if (dateEnd && sessionDate > dateEnd) return false;
      if (assignedSessionIds.has(assignment.id)) return false;
      if (filterClassId !== "all" && assignment.class_id !== filterClassId) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchTitle = assignment.title?.toLowerCase().includes(query);
        const matchClass = assignment.classes?.name?.toLowerCase().includes(query);
        if (!matchTitle && !matchClass) return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Trier du plus proche au plus lointain
      const dateA = parseISO(a.session_date!);
      const dateB = parseISO(b.session_date!);
      return dateA.getTime() - dateB.getTime();
    });
  }, [assignments, classroomAssignments, today, getDateRangeEnd, filterClassId, searchQuery, currentYear]);

  const availableSessions = useMemo(() => {
    return assignments.filter(
      (assignment) =>
        assignment.type === "course" &&
        assignment.session_date &&
        assignment.start_time &&
        assignment.end_time &&
        parseISO(assignment.session_date) >= today
    );
  }, [assignments, today]);

  // Fonction pour vérifier la disponibilité d'une salle
  const checkRoomAvailability = useCallback((
    classroomId: string,
    sessionDate: string,
    startTime: string,
    endTime: string,
    excludeAssignmentId?: string,
    tempAssignments?: Map<string, { date: string; start: string; end: string; assignmentId: string }[]>
  ): boolean => {
    // Vérifier les assignations existantes en base
    const existingConflict = classroomAssignments.some(ca => {
      if (ca.classroom_id !== classroomId) return false;
      if (excludeAssignmentId && ca.assignment_id === excludeAssignmentId) return false;
      if (!ca.assignments) return false;
      
      return ca.assignments.session_date === sessionDate &&
        ca.assignments.start_time < endTime &&
        ca.assignments.end_time > startTime;
    });

    if (existingConflict) return false;

    // Vérifier les assignations temporaires (pour l'algo d'assignation auto)
    if (tempAssignments) {
      const slots = tempAssignments.get(classroomId) || [];
      const tempConflict = slots.some(slot => 
        slot.date === sessionDate &&
        slot.start < endTime &&
        slot.end > startTime &&
        slot.assignmentId !== excludeAssignmentId
      );
      if (tempConflict) return false;
    }

    return true;
  }, [classroomAssignments]);

  // Récupérer les créneaux d'occupation d'une salle pour une plage horaire donnée
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
      
      // Vérifier si la séance chevauche la plage demandée
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
    
    // Trier par heure de début
    return slots.sort((a, b) => a.start.localeCompare(b.start));
  }, [classroomAssignments]);

  // Calculer les plages libres pour une salle sur un créneau donné
  const getFreeSlots = useCallback((
    occupancySlots: OccupancySlot[],
    startTime: string,
    endTime: string
  ): { start: string; end: string }[] => {
    if (occupancySlots.length === 0) {
      return [{ start: startTime, end: endTime }];
    }
    
    // Trier les créneaux par heure de début
    const sortedSlots = [...occupancySlots].sort((a, b) => a.start.localeCompare(b.start));
    
    const freeSlots: { start: string; end: string }[] = [];
    let currentStart = startTime;
    
    for (const slot of sortedSlots) {
      // S'il y a un espace libre avant le créneau occupé
      if (slot.start > currentStart) {
        freeSlots.push({ start: currentStart, end: slot.start });
      }
      // Avancer le curseur à la fin de ce créneau occupé (s'il est plus tard)
      if (slot.end > currentStart) {
        currentStart = slot.end;
      }
    }
    
    // S'il reste du temps libre après le dernier créneau occupé
    if (currentStart < endTime) {
      freeSlots.push({ start: currentStart, end: endTime });
    }
    
    // Filtrer les créneaux invalides (durée nulle)
    return freeSlots.filter(slot => slot.start < slot.end);
  }, []);

  // Algorithme d'assignation automatique OPTIMISÉ avec support des changements manuels
  const { validAssignments, problemAssignments } = useMemo(() => {
    const valid: AutoAssignmentResult[] = [];
    const problems: ProblemResult[] = [];
    const tempAssignments = new Map<string, { date: string; start: string; end: string; assignmentId: string }[]>();

    // Initialiser les créneaux occupés par salle
    classroomAssignments.forEach(ca => {
      if (ca.assignments) {
        const slots = tempAssignments.get(ca.classroom_id) || [];
        slots.push({
          date: ca.assignments.session_date,
          start: ca.assignments.start_time,
          end: ca.assignments.end_time,
          assignmentId: ca.assignment_id,
        });
        tempAssignments.set(ca.classroom_id, slots);
      }
    });

    // Trier les séances par nombre d'étudiants décroissant (les plus grandes classes en premier)
    const sortedSessions = [...unassignedSessions].sort((a, b) => {
      const countA = studentCountByClass[a.class_id] || 0;
      const countB = studentCountByClass[b.class_id] || 0;
      return countB - countA;
    });

    // Pour chaque séance non assignée
    for (const session of sortedSessions) {
      const classInfo = classes.find(c => c.id === session.class_id);
      const studentCount = studentCountByClass[session.class_id] || 0;
      const className = classInfo?.name || "Classe inconnue";

      // Vérifier si une salle a été manuellement sélectionnée
      const manualRoomId = manualOverrides[session.id];
      
      if (manualRoomId) {
        const manualRoom = classrooms.find(c => c.id === manualRoomId);
        if (manualRoom) {
          const isAvailable = checkRoomAvailability(
            manualRoomId,
            session.session_date!,
            session.start_time!,
            session.end_time!,
            session.id,
            tempAssignments
          );

          if (isAvailable) {
            // Marquer ce créneau comme occupé
            const slots = tempAssignments.get(manualRoomId) || [];
            slots.push({
              date: session.session_date!,
              start: session.start_time!,
              end: session.end_time!,
              assignmentId: session.id,
            });
            tempAssignments.set(manualRoomId, slots);

            valid.push({
              assignment: session,
              classroom: manualRoom,
              className,
              studentCount,
              reason: `${manualRoom.capacity} places (sélection manuelle)`,
              efficiency: Math.round((studentCount / manualRoom.capacity) * 100),
              manualOverrideClassroomId: manualRoomId
            });
            continue;
          } else {
            // La salle manuelle n'est pas disponible
            problems.push({
              assignment: session,
              className,
              studentCount,
              reason: `La salle ${manualRoom.name} sélectionnée est occupée à cet horaire`,
              solutions: [{
                id: "clear_selection",
                label: "Annuler la sélection",
                description: "Laisser l'algorithme choisir automatiquement",
                action: () => {
                  setManualOverrides(prev => {
                    const next = { ...prev };
                    delete next[session.id];
                    return next;
                  });
                },
                type: "primary"
              }]
            });
            continue;
          }
        }
      }

      // Trouver toutes les salles avec capacité suffisante
      // Best fit = la salle la plus proche de la capacité nécessaire (moins de gaspillage)
      const suitableClassrooms = [...classrooms]
        .filter(c => c.is_active && c.capacity >= studentCount)
        .map(c => ({
          ...c,
          waste: c.capacity - studentCount,
          efficiency: Math.round((studentCount / c.capacity) * 100)
        }))
        .sort((a, b) => a.waste - b.waste);

      let bestClassroom = null;
      let assignmentReason = "";
      let efficiency = 0;

      for (const classroom of suitableClassrooms) {
        const isAvailable = checkRoomAvailability(
          classroom.id,
          session.session_date!,
          session.start_time!,
          session.end_time!,
          session.id,
          tempAssignments
        );

        if (isAvailable) {
          bestClassroom = classroom;
          efficiency = classroom.efficiency;
          assignmentReason = `${classroom.capacity} places • ${efficiency}% utilisé`;
          
          // Marquer ce créneau comme occupé
          const slots = tempAssignments.get(classroom.id) || [];
          slots.push({
            date: session.session_date!,
            start: session.start_time!,
            end: session.end_time!,
            assignmentId: session.id,
          });
          tempAssignments.set(classroom.id, slots);
          break;
        }
      }

      if (bestClassroom) {
        valid.push({
          assignment: session,
          classroom: bestClassroom,
          className,
          studentCount,
          reason: assignmentReason,
          efficiency
        });
      } else {
        // Créer les solutions pour les problèmes
        const solutions: Solution[] = [];
        
        if (suitableClassrooms.length === 0) {
          // Aucune salle avec capacité suffisante
          const largestRoom = classrooms.reduce((max, c) => 
            c.is_active && c.capacity > (max?.capacity || 0) ? c : max, 
            null as typeof classrooms[0] | null
          );
          
          if (largestRoom) {
            solutions.push({
              id: "use_largest",
              label: `Utiliser ${largestRoom.name}`,
              description: `Salle de ${largestRoom.capacity} places (capacité insuffisante de ${studentCount - largestRoom.capacity} places)`,
              action: () => {
                assignClassroom({
                  classroom_id: largestRoom.id,
                  assignment_id: session.id,
                });
              },
              type: "secondary"
            });
          }
          
          solutions.push({
            id: "create_room",
            label: "Créer une nouvelle salle",
            description: `Créer une salle avec au moins ${studentCount} places`,
            action: () => {
              setNewClassroom(prev => ({ ...prev, capacity: studentCount + 5 }));
              setIsAutoAssignDialogOpen(false);
              setIsAddDialogOpen(true);
            },
            type: "primary"
          });
          
          problems.push({
            assignment: session,
            className,
            studentCount,
            reason: `Aucune salle disponible avec ${studentCount}+ places`,
            solutions
          });
        } else {
          // Toutes les salles sont occupées
          solutions.push({
            id: "reschedule",
            label: "Reporter la séance",
            description: "Déplacer cette séance à un autre créneau horaire",
            action: () => {
              toast.info("Utilisez le calendrier pour reporter cette séance");
              setIsAutoAssignDialogOpen(false);
            },
            type: "secondary"
          });

          const nextAvailableRoom = suitableClassrooms[0];
          if (nextAvailableRoom) {
            solutions.push({
              id: "wait_slot",
              label: `Consulter le planning`,
              description: `Voir quand ${nextAvailableRoom.name} sera disponible`,
              action: () => {
                setIsAutoAssignDialogOpen(false);
                setIsArchitectViewOpen(true);
                setArchitectDate(session.session_date!);
                setArchitectStartTime(session.start_time!);
                setArchitectEndTime(session.end_time!);
              },
              type: "primary"
            });
          }

          problems.push({
            assignment: session,
            className,
            studentCount,
            reason: `Toutes les salles adaptées sont occupées le ${format(parseISO(session.session_date!), "EEEE dd MMMM", { locale: fr })} de ${session.start_time} à ${session.end_time}`,
            solutions
          });
        }
      }
    }

    return { validAssignments: valid, problemAssignments: problems };
  }, [unassignedSessions, classrooms, classroomAssignments, classes, studentCountByClass, assignClassroom, manualOverrides, checkRoomAvailability]);

  const handleCreateClassroom = () => {
    createClassroom({
      ...newClassroom,
      school_id: schoolId,
      is_active: true,
    });
    setIsAddDialogOpen(false);
    setNewClassroom({ name: "", capacity: 30, building: "", floor: "", equipment: [] });
  };

  const handleAssignClassroom = async () => {
    // Vérifier la disponibilité avant d'assigner
    const session = assignments.find(a => a.id === assignmentForm.assignment_id);
    if (session) {
      const isAvailable = checkRoomAvailability(
        assignmentForm.classroom_id,
        session.session_date!,
        session.start_time!,
        session.end_time!
      );

      if (!isAvailable) {
        toast.error("Cette salle est déjà occupée à cet horaire");
        return;
      }
    }

    assignClassroom({
      classroom_id: assignmentForm.classroom_id,
      assignment_id: assignmentForm.assignment_id,
    });
    setIsAssignDialogOpen(false);
    setAssignmentForm({ classroom_id: "", assignment_id: "" });
  };

  const handleAutoAssign = async () => {
    setAutoAssignStep("processing");
    setIsProcessing(true);

    let successCount = 0;

    for (const result of validAssignments) {
      try {
        const classroomId = result.manualOverrideClassroomId || result.classroom.id;
        
        await new Promise<void>((resolve, reject) => {
          assignClassroom({
            classroom_id: classroomId,
            assignment_id: result.assignment.id,
          }, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          } as any);
          setTimeout(resolve, 300);
        });
        successCount++;
      } catch (error) {
        console.error("Erreur assignation:", error);
      }
    }

    setIsProcessing(false);
    setAutoAssignStep("complete");
    setManualOverrides({});
    toast.success(`${successCount} séance(s) assignée(s) automatiquement`);
  };

  const openAutoAssignDialog = () => {
    // Réinitialiser les filtres et l'état pour permettre une nouvelle assignation
    setAutoAssignStep("preview");
    setManualOverrides({});
    setActiveTab(problemAssignments.length > 0 ? "invalid" : "valid");
    setIsAutoAssignDialogOpen(true);
  };

  const handleManualRoomChange = (assignmentId: string, newClassroomId: string) => {
    setManualOverrides(prev => ({
      ...prev,
      [assignmentId]: newClassroomId
    }));
  };

  // Récupérer les salles disponibles pour un créneau donné dans la vue architecte avec détails
  const getAvailableRoomsForSlotDetailed = useMemo(() => {
    if (!selectedTimeSlot) {
      return { 
        available: classrooms.filter(c => c.is_active).map(c => ({ classroom: c, freeSlots: [], occupancySlots: [] })), 
        partial: [], 
        occupied: [] 
      };
    }

    const available: { classroom: typeof classrooms[0]; freeSlots: { start: string; end: string }[]; occupancySlots: OccupancySlot[] }[] = [];
    const partial: { classroom: typeof classrooms[0]; freeSlots: { start: string; end: string }[]; occupancySlots: OccupancySlot[] }[] = [];
    const occupied: { classroom: typeof classrooms[0]; freeSlots: { start: string; end: string }[]; occupancySlots: OccupancySlot[] }[] = [];

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
        // Entièrement libre
        available.push({ classroom, freeSlots, occupancySlots });
      } else if (freeSlots.length > 0) {
        // Partiellement occupée
        partial.push({ classroom, freeSlots, occupancySlots });
      } else {
        // Entièrement occupée sur la plage
        occupied.push({ classroom, freeSlots, occupancySlots });
      }
    });

    return { available, partial, occupied };
  }, [classrooms, classroomAssignments, selectedTimeSlot, getRoomOccupancySlots, getFreeSlots]);

  // Grouper les salles par bâtiment pour la vue architecte
  const classroomsByBuilding = useMemo(() => {
    const grouped: Record<string, typeof classrooms> = {};
    
    classrooms.forEach(classroom => {
      if (!classroom.is_active) return;
      const building = classroom.building || "Sans bâtiment";
      if (!grouped[building]) {
        grouped[building] = [];
      }
      grouped[building].push(classroom);
    });

    // Trier les salles par étage puis par nom
    Object.keys(grouped).forEach(building => {
      grouped[building].sort((a, b) => {
        const floorA = a.floor || "0";
        const floorB = b.floor || "0";
        if (floorA !== floorB) return floorA.localeCompare(floorB);
        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  }, [classrooms]);

  // Grouper les salles par bâtiment et étage pour la vue architecte 3D
  const buildingsWithFloors = useMemo(() => {
    const buildings: Record<string, { floors: Record<string, typeof classrooms>; maxFloor: number }> = {};
    
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
      
      // Calculer le nombre d'étages
      const floorNum = parseInt(floorName.replace(/\D/g, '')) || 0;
      buildings[buildingName].maxFloor = Math.max(buildings[buildingName].maxFloor, floorNum);
    });

    return buildings;
  }, [classrooms]);

  const handleApplyArchitectSlot = () => {
    setSelectedTimeSlot({
      date: architectDate,
      start: architectStartTime,
      end: architectEndTime
    });
  };

  const getClassroomStatus = (classroomId: string) => {
    const now = new Date();
    const currentTime = format(now, "HH:mm");
    const currentDate = format(now, "yyyy-MM-dd");

    const activeAssignment = classroomAssignments.find(
      (ca) =>
        ca.classroom_id === classroomId &&
        ca.assignments?.session_date === currentDate &&
        ca.assignments?.start_time <= currentTime &&
        ca.assignments?.end_time >= currentTime
    );

    return activeAssignment ? "occupée" : "libre";
  };

  const getClassroomAssignments = (classroomId: string) => {
    return classroomAssignments.filter((ca) => ca.classroom_id === classroomId);
  };

  const getOccupancyRate = (classroomId: string) => {
    const roomAssignments = getClassroomAssignments(classroomId);
    const futureAssignments = roomAssignments.filter(
      ca => ca.assignments && parseISO(ca.assignments.session_date) >= today
    );
    return Math.min((futureAssignments.length / 20) * 100, 100);
  };

  // Fonction pour obtenir le statut d'une salle dans la vue architecte
  const getArchitectRoomStatus = (classroomId: string) => {
    const available = getAvailableRoomsForSlotDetailed.available.find(r => r.classroom.id === classroomId);
    if (available) return "available";
    
    const partial = getAvailableRoomsForSlotDetailed.partial.find(r => r.classroom.id === classroomId);
    if (partial) return "partial";
    
    return "occupied";
  };

  const totalProblems = problemAssignments.length;
  const totalAssignable = validAssignments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Salles</h2>
          <p className="text-muted-foreground text-sm">
            {classrooms.length} salle(s) • {unassignedSessions.length} séance(s) non assignée(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {totalProblems > 0 && (
            <Button 
              variant="destructive"
              size="sm"
              onClick={openAutoAssignDialog}
              className="gap-2 animate-pulse"
            >
              <AlertTriangle className="h-4 w-4" />
              {totalProblems} problème(s)
            </Button>
          )}

          <Button 
            variant="outline"
            onClick={() => {
              setSelectedTimeSlot(null);
              setIsArchitectViewOpen(true);
            }}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Vue Architecte
          </Button>

          <Button 
            variant="default" 
            onClick={openAutoAssignDialog}
            disabled={classrooms.length === 0}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Assignation Auto
            {totalAssignable > 0 && (
              <Badge variant="secondary" className="ml-1 bg-background/20">
                {totalAssignable}
              </Badge>
            )}
          </Button>

          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Assigner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assigner une Salle</DialogTitle>
                <DialogDescription>
                  Sélectionnez une salle et une séance pour l'assignation manuelle
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Salle de cours</Label>
                  <Select
                    value={assignmentForm.classroom_id}
                    onValueChange={(value) => setAssignmentForm({ ...assignmentForm, classroom_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une salle" />
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms.filter(c => c.is_active).map((classroom) => (
                        <SelectItem key={classroom.id} value={classroom.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {classroom.name}
                            <span className="text-muted-foreground text-xs">
                              ({classroom.capacity} places)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Séance</Label>
                  <Select
                    value={assignmentForm.assignment_id}
                    onValueChange={(value) => setAssignmentForm({ ...assignmentForm, assignment_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une séance" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSessions.map((session) => {
                        const studentCount = studentCountByClass[session.class_id] || 0;
                        return (
                          <SelectItem key={session.id} value={session.id}>
                            <div className="flex flex-col">
                              <span>{session.title} - {session.classes?.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(session.session_date!), "dd/MM/yyyy", { locale: fr })} • {session.start_time}-{session.end_time} • {studentCount} étudiants
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAssignClassroom} disabled={!assignmentForm.classroom_id || !assignmentForm.assignment_id}>
                  Assigner
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle Salle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une Salle</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle salle de cours à votre établissement
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: A101"
                      value={newClassroom.name}
                      onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacité *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={newClassroom.capacity}
                      onChange={(e) => setNewClassroom({ ...newClassroom, capacity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="building">Bâtiment</Label>
                    <Input
                      id="building"
                      placeholder="Ex: Bâtiment A"
                      value={newClassroom.building}
                      onChange={(e) => setNewClassroom({ ...newClassroom, building: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor">Étage</Label>
                    <Input
                      id="floor"
                      placeholder="Ex: 1er"
                      value={newClassroom.floor}
                      onChange={(e) => setNewClassroom({ ...newClassroom, floor: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateClassroom} disabled={!newClassroom.name}>
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog Vue Architecte Immersive */}
      <Dialog open={isArchitectViewOpen} onOpenChange={setIsArchitectViewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Vue Architecte - Bâtiments
            </DialogTitle>
            <DialogDescription>
              Visualisez vos bâtiments et la disponibilité des salles en temps réel
            </DialogDescription>
          </DialogHeader>

          {/* Sélection du créneau */}
          <div className="flex flex-wrap items-end gap-3 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Date</Label>
              <Input
                type="date"
                value={architectDate}
                onChange={(e) => setArchitectDate(e.target.value)}
                className="w-36 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Heure début</Label>
              <Input
                type="time"
                value={architectStartTime}
                onChange={(e) => setArchitectStartTime(e.target.value)}
                className="w-28 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Heure fin</Label>
              <Input
                type="time"
                value={architectEndTime}
                onChange={(e) => setArchitectEndTime(e.target.value)}
                className="w-28 h-9"
              />
            </div>
            <Button onClick={handleApplyArchitectSlot} className="gap-2 h-9 bg-primary hover:bg-primary/90">
              <Eye className="h-4 w-4" />
              Analyser
            </Button>
          </div>

          {selectedTimeSlot && (
            <div className="flex flex-wrap gap-3 p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{format(parseISO(selectedTimeSlot.date), "EEEE dd MMMM yyyy", { locale: fr })}</span>
                <span className="text-muted-foreground">de {selectedTimeSlot.start} à {selectedTimeSlot.end}</span>
              </div>
              <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs">{getAvailableRoomsForSlotDetailed.available.length} libre(s)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs">{getAvailableRoomsForSlotDetailed.partial.length} partielle(s)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs">{getAvailableRoomsForSlotDetailed.occupied.length} occupée(s)</span>
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-10 py-4">
              {Object.entries(buildingsWithFloors).map(([buildingName, buildingData]) => {
                const floorNames = Object.keys(buildingData.floors).sort((a, b) => {
                  const numA = parseInt(a.replace(/\D/g, '')) || 0;
                  const numB = parseInt(b.replace(/\D/g, '')) || 0;
                  return numB - numA; // Trier du plus haut au plus bas
                });
                
                const allRooms = Object.values(buildingData.floors).flat();
                const maxRoomsPerFloor = Math.max(...Object.values(buildingData.floors).map(r => r.length));

                return (
                  <div key={buildingName} className="space-y-4">
                    {/* En-tête du bâtiment */}
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{buildingName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {allRooms.length} salles • {floorNames.length} étage(s)
                        </p>
                      </div>
                    </div>

                    {/* Vue du bâtiment - Façade réaliste */}
                    <div className="relative mx-auto" style={{ maxWidth: `${Math.max(maxRoomsPerFloor * 100 + 80, 400)}px` }}>
                      {/* Toit en triangle */}
                      <div className="relative mx-4">
                        <div 
                          className="h-0 w-0 mx-auto"
                          style={{
                            borderLeft: `${Math.max(maxRoomsPerFloor * 50 + 40, 200)}px solid transparent`,
                            borderRight: `${Math.max(maxRoomsPerFloor * 50 + 40, 200)}px solid transparent`,
                            borderBottom: '40px solid',
                            borderBottomColor: 'hsl(var(--muted))',
                          }}
                        />
                        {/* Ligne du toit */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-600 dark:bg-slate-500" />
                      </div>

                      {/* Corps du bâtiment */}
                      <div className="relative bg-gradient-to-b from-stone-200 via-stone-100 to-stone-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 border-4 border-slate-500 dark:border-slate-400 shadow-2xl mx-4">
                        {/* Texture de briques subtile */}
                        <div className="absolute inset-0 opacity-10 dark:opacity-5" 
                          style={{
                            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 21px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.05) 40px, rgba(0,0,0,0.05) 41px)',
                          }}
                        />
                        
                        {/* Étages */}
                        {floorNames.map((floorName, floorIndex) => {
                          const rooms = buildingData.floors[floorName];
                          const isGroundFloor = floorName.toLowerCase() === "rdc" || floorName === "0";
                          
                          return (
                            <div key={floorName} className="relative">
                              {/* Séparation entre étages */}
                              {floorIndex > 0 && (
                                <div className="h-2 bg-gradient-to-b from-slate-400 to-slate-300 dark:from-slate-500 dark:to-slate-600 border-y border-slate-500 dark:border-slate-400" />
                              )}
                              
                              <div className="flex items-stretch py-4 px-3 gap-1">
                                {/* Label d'étage sur le côté */}
                                <div className="w-10 flex items-center justify-center shrink-0">
                                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 -rotate-90 whitespace-nowrap bg-stone-300/80 dark:bg-slate-600/80 px-2 py-0.5 rounded">
                                    {floorName}
                                  </span>
                                </div>
                                
                                {/* Fenêtres/Salles */}
                                <div className="flex-1 flex flex-wrap gap-3 justify-center">
                                  {rooms.map((room) => {
                                    const status = selectedTimeSlot ? getArchitectRoomStatus(room.id) : "available";
                                    const roomDetails = 
                                      getAvailableRoomsForSlotDetailed.available.find(r => r.classroom.id === room.id) ||
                                      getAvailableRoomsForSlotDetailed.partial.find(r => r.classroom.id === room.id) ||
                                      getAvailableRoomsForSlotDetailed.occupied.find(r => r.classroom.id === room.id);
                                    
                                    // Couleur de la fenêtre selon le statut
                                    const windowColor = status === "available" 
                                      ? "from-green-200 to-green-300 dark:from-green-800 dark:to-green-900" 
                                      : status === "partial"
                                      ? "from-amber-200 to-amber-300 dark:from-amber-800 dark:to-amber-900"
                                      : "from-red-200 to-red-300 dark:from-red-800 dark:to-red-900";
                                    
                                    const borderColor = status === "available" 
                                      ? "border-green-500" 
                                      : status === "partial"
                                      ? "border-amber-500"
                                      : "border-red-500";
                                    
                                    return (
                                      <div 
                                        key={room.id}
                                        className={`
                                          relative group cursor-pointer transition-all duration-300
                                          hover:scale-110 hover:z-20
                                        `}
                                      >
                                        {/* Fenêtre avec cadre */}
                                        <div className={`
                                          relative w-[80px] h-[70px] rounded-t-lg
                                          bg-gradient-to-b ${windowColor}
                                          border-4 ${borderColor}
                                          shadow-lg
                                          flex flex-col items-center justify-center text-center p-1
                                        `}>
                                          {/* Reflet de vitre */}
                                          <div className="absolute inset-2 bg-gradient-to-br from-white/40 to-transparent rounded-t pointer-events-none" />
                                          
                                          {/* Croisillon de fenêtre */}
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="absolute w-0.5 h-full bg-slate-600/30 dark:bg-slate-400/30" />
                                            <div className="absolute w-full h-0.5 bg-slate-600/30 dark:bg-slate-400/30" style={{ top: '50%' }} />
                                          </div>
                                          
                                          {/* Contenu */}
                                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 relative z-10 drop-shadow-sm">{room.name}</span>
                                          <span className="text-[9px] text-slate-600 dark:text-slate-300 flex items-center gap-0.5 relative z-10">
                                            <Users className="h-2.5 w-2.5" />
                                            {room.capacity}
                                          </span>
                                        </div>
                                        
                                        {/* Rebord de fenêtre */}
                                        <div className="h-2 bg-slate-500 dark:bg-slate-400 rounded-b shadow-md" />
                                        
                                        {/* Indicateur de statut */}
                                        <div className={`
                                          absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-lg z-10
                                          flex items-center justify-center
                                          ${status === "available" ? "bg-green-500" :
                                            status === "partial" ? "bg-amber-500" : "bg-red-500"
                                          }
                                        `}>
                                          {status === "available" && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                                          {status === "partial" && <Clock className="h-2.5 w-2.5 text-white" />}
                                          {status === "occupied" && <AlertTriangle className="h-2.5 w-2.5 text-white" />}
                                        </div>

                                        {/* Tooltip détaillé au survol */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 p-3 bg-popover border rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                              <span className="font-bold">{room.name}</span>
                                              <Badge variant={status === "available" ? "default" : status === "partial" ? "secondary" : "destructive"} className="text-[10px]">
                                                {status === "available" ? "Libre" : status === "partial" ? "Partiellement libre" : "Occupée"}
                                              </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground space-y-0.5">
                                              <p className="flex items-center gap-1"><Users className="h-3 w-3" /> {room.capacity} places</p>
                                              {room.building && <p className="flex items-center gap-1"><Building className="h-3 w-3" /> {room.building}</p>}
                                              {room.floor && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Étage {room.floor}</p>}
                                            </div>
                                            
                                            {selectedTimeSlot && roomDetails && (
                                              <div className="border-t pt-2 mt-2 space-y-1.5">
                                                {roomDetails.occupancySlots.length > 0 && (
                                                  <div>
                                                    <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                                                      <XCircle className="h-3 w-3" /> Occupée:
                                                    </p>
                                                    {roomDetails.occupancySlots.map((slot, i) => (
                                                      <p key={i} className="text-[10px] text-muted-foreground ml-4">
                                                        {slot.start.substring(0, 5)} - {slot.end.substring(0, 5)}: {slot.session?.classes?.name || slot.session?.title || "Séance"}
                                                      </p>
                                                    ))}
                                                  </div>
                                                )}
                                                {roomDetails.freeSlots.length > 0 && (
                                                  <div>
                                                    <p className="text-[10px] font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                                                      <CheckCircle2 className="h-3 w-3" /> Disponible:
                                                    </p>
                                                    {roomDetails.freeSlots.map((slot, i) => (
                                                      <p key={i} className="text-[10px] text-muted-foreground ml-4">
                                                        {slot.start.substring(0, 5)} - {slot.end.substring(0, 5)}
                                                      </p>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          {/* Flèche du tooltip */}
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                            <div className="border-8 border-transparent border-t-popover" />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Entrée du bâtiment (RDC) */}
                        {floorNames.length > 0 && (
                          <div className="flex justify-center pb-0">
                            <div className="w-16 h-8 bg-gradient-to-b from-amber-800 to-amber-900 dark:from-amber-700 dark:to-amber-800 border-t-4 border-x-4 border-amber-950 dark:border-amber-600 rounded-t-lg flex items-center justify-center">
                              <DoorOpen className="h-4 w-4 text-amber-200" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fondations */}
                      <div className="h-4 bg-gradient-to-b from-stone-500 to-stone-600 dark:from-slate-600 dark:to-slate-700 mx-2 rounded-b" />
                      
                      {/* Sol / Pelouse */}
                      <div className="h-3 bg-gradient-to-b from-emerald-600 to-emerald-700 dark:from-emerald-800 dark:to-emerald-900 rounded-b-lg mx-1" />
                    </div>
                  </div>
                );
              })}

              {Object.keys(buildingsWithFloors).length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Aucune salle configurée</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Créez des salles avec leur bâtiment et étage pour les visualiser ici
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsArchitectViewOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Assignation Automatique */}
      <Dialog open={isAutoAssignDialogOpen} onOpenChange={setIsAutoAssignDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Assignation Automatique des Salles
            </DialogTitle>
            <DialogDescription>
              Optimisation intelligente basée sur la capacité et le nombre d'étudiants
            </DialogDescription>
          </DialogHeader>

          {autoAssignStep === "preview" && (
            <>
              {/* Barre de filtres */}
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <Select value={filterClassId} onValueChange={setFilterClassId}>
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder="Toutes les classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les classes</SelectItem>
                    {currentYearClasses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterDateRange} onValueChange={(v: any) => setFilterDateRange(v)}>
                  <SelectTrigger className="w-[140px] h-8">
                    <CalendarRange className="h-3 w-3 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 prochains jours</SelectItem>
                    <SelectItem value="14">14 prochains jours</SelectItem>
                    <SelectItem value="30">30 prochains jours</SelectItem>
                    <SelectItem value="all">Toutes les dates</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative flex-1 min-w-[150px]">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-7 text-sm"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Alerte problèmes visible si on est sur l'onglet valid */}
              {problemAssignments.length > 0 && activeTab === "valid" && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{problemAssignments.length} séance(s) avec problème nécessitent votre attention</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveTab("invalid")}
                      className="ml-2 bg-background"
                    >
                      Voir les problèmes
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="valid" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Assignables ({validAssignments.length})
                  </TabsTrigger>
                  <TabsTrigger value="invalid" className="gap-2 relative">
                    <AlertTriangle className="h-4 w-4" />
                    Problèmes ({problemAssignments.length})
                    {problemAssignments.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="valid" className="flex-1 overflow-hidden mt-4">
                  <ScrollArea className="h-[320px] pr-4">
                    {validAssignments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="font-medium">Aucune séance à assigner</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Modifiez les filtres ou vérifiez les problèmes
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {validAssignments.map((result, index) => {
                          const currentRoomId = result.manualOverrideClassroomId || result.classroom.id;
                          const currentRoom = classrooms.find(c => c.id === currentRoomId) || result.classroom;

                          return (
                            <div
                              key={index}
                              className="p-3 rounded-lg border bg-card hover:bg-accent/30 transition-all group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm truncate">
                                      {result.assignment.title}
                                    </p>
                                    {result.efficiency && result.efficiency >= 80 && (
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        Optimal
                                      </Badge>
                                    )}
                                    {result.manualOverrideClassroomId && (
                                      <Badge variant="outline" className="text-xs">
                                        Manuel
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {result.className} • <Users className="h-3 w-3 inline" /> {result.studentCount}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <Badge variant="outline" className="text-xs font-normal">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {format(parseISO(result.assignment.session_date), "EEE dd MMM", { locale: fr })}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs font-normal">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {result.assignment.start_time} - {result.assignment.end_time}
                                    </Badge>
                                  </div>
                                </div>

                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />

                                <div className="text-right min-w-[140px]">
                                  <Select
                                    value={currentRoomId}
                                    onValueChange={(v) => handleManualRoomChange(result.assignment.id, v)}
                                  >
                                    <SelectTrigger className="h-8 w-auto border-0 bg-primary/10 hover:bg-primary/20">
                                      <div className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        <span className="font-medium">{currentRoom.name}</span>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {classrooms
                                        .filter(c => c.is_active && c.capacity >= result.studentCount)
                                        .map(c => {
                                          const isAvail = checkRoomAvailability(
                                            c.id,
                                            result.assignment.session_date,
                                            result.assignment.start_time,
                                            result.assignment.end_time,
                                            result.assignment.id
                                          );
                                          return (
                                            <SelectItem 
                                              key={c.id} 
                                              value={c.id}
                                              disabled={!isAvail && c.id !== currentRoomId}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span>{c.name} ({c.capacity} places)</span>
                                                {!isAvail && c.id !== currentRoomId && (
                                                  <Badge variant="destructive" className="text-[10px] py-0">
                                                    Occupée
                                                  </Badge>
                                                )}
                                              </div>
                                            </SelectItem>
                                          );
                                        })}
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {currentRoom.capacity} places • {Math.round((result.studentCount / currentRoom.capacity) * 100)}% utilisé
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="invalid" className="flex-1 overflow-hidden mt-4">
                  <ScrollArea className="h-[320px] pr-4">
                    {problemAssignments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                        <p className="font-medium text-green-600">Aucun problème détecté</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Toutes les séances peuvent être assignées automatiquement
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {problemAssignments.map((problem, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-lg border-2 border-destructive/30 bg-destructive/5"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium">{problem.assignment.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {problem.className} • {problem.studentCount} étudiants
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Badge variant="outline" className="text-xs border-destructive/30">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(parseISO(problem.assignment.session_date), "EEEE dd MMM yyyy", { locale: fr })}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs border-destructive/30">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {problem.assignment.start_time} - {problem.assignment.end_time}
                                  </Badge>
                                </div>
                                <p className="text-sm text-destructive mt-2 font-medium">
                                  {problem.reason}
                                </p>
                              </div>
                            </div>

                            {problem.solutions.length > 0 && (
                              <div className="bg-background rounded-lg p-3 border">
                                <div className="flex items-center gap-2 mb-2">
                                  <Lightbulb className="h-4 w-4 text-amber-500" />
                                  <span className="text-sm font-medium">Solutions proposées</span>
                                </div>
                                <div className="space-y-2">
                                  {problem.solutions.map((solution) => (
                                    <div 
                                      key={solution.id}
                                      className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{solution.label}</p>
                                        <p className="text-xs text-muted-foreground">{solution.description}</p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant={solution.type === "primary" ? "default" : "outline"}
                                        onClick={solution.action}
                                        className="shrink-0 gap-1"
                                      >
                                        <Check className="h-3 w-3" />
                                        Appliquer
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <DialogFooter className="gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsAutoAssignDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleAutoAssign} 
                  disabled={validAssignments.length === 0}
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Assigner {validAssignments.length} séance(s)
                </Button>
              </DialogFooter>
            </>
          )}

          {autoAssignStep === "processing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Assignation en cours...</p>
              <Progress value={66} className="w-48" />
            </div>
          )}

          {autoAssignStep === "complete" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-lg">Assignation terminée</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Les séances ont été assignées avec succès
                </p>
              </div>
              {problemAssignments.length > 0 && (
                <Alert className="max-w-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {problemAssignments.length} séance(s) nécessitent une attention manuelle
                  </AlertDescription>
                </Alert>
              )}
              <Button onClick={() => setIsAutoAssignDialogOpen(false)} className="mt-2">
                Fermer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Liste des Salles */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((classroom) => {
            const status = getClassroomStatus(classroom.id);
            const roomAssignments = getClassroomAssignments(classroom.id);
            const occupancyRate = getOccupancyRate(classroom.id);

            return (
              <Card key={classroom.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {classroom.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {classroom.capacity} places
                        </span>
                        {classroom.building && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {classroom.building}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={status === "libre" ? "secondary" : "destructive"} className="text-xs">
                      {status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Occupation</span>
                      <span className="font-medium">{roomAssignments.length} séances</span>
                    </div>
                    <Progress value={occupancyRate} className="h-1.5" />
                  </div>

                  {roomAssignments.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Prochaines séances</p>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {roomAssignments.slice(0, 3).map((assignment) => {
                          const session = assignment.assignments;
                          if (!session) return null;

                          return (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between p-1.5 bg-muted/50 rounded text-xs"
                            >
                              <span className="truncate flex-1">{session.classes?.name}</span>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <span>{format(parseISO(session.session_date), "dd/MM", { locale: fr })}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => unassignClassroom(assignment.id)}
                                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        {roomAssignments.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{roomAssignments.length - 3} autres
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteClassroom(classroom.id)}
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Supprimer
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {classrooms.map((classroom) => {
                const status = getClassroomStatus(classroom.id);
                const roomAssignments = getClassroomAssignments(classroom.id);

                return (
                  <div key={classroom.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{classroom.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {classroom.capacity} places
                          </span>
                          {classroom.building && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {classroom.building}
                            </span>
                          )}
                          <span>{roomAssignments.length} séances</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={status === "libre" ? "secondary" : "destructive"}>
                        {status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteClassroom(classroom.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {classrooms.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">Aucune salle configurée</h3>
            <p className="text-muted-foreground text-sm text-center mb-4">
              Ajoutez vos premières salles de cours pour commencer à les gérer
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Créer une salle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

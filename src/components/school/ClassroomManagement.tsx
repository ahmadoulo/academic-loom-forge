import { useState, useMemo, useCallback } from "react";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useAssignments } from "@/hooks/useAssignments";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
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
  Wand2, CheckCircle2, AlertTriangle, ChevronRight, Filter,
  Sparkles, LayoutGrid, List, Lightbulb, ArrowRight, X,
  CalendarRange, Search, Edit2, Check
} from "lucide-react";
import { format, addDays, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns";
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
  efficiency?: number; // % d'efficacité de la salle
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

export function ClassroomManagement({ schoolId }: ClassroomManagementProps) {
  const { classrooms, assignments: classroomAssignments, createClassroom, deleteClassroom, assignClassroom, unassignClassroom } = useClassrooms(schoolId);
  const { assignments } = useAssignments({ schoolId });
  const { classes } = useClasses(schoolId);
  const { students } = useStudents(schoolId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isAutoAssignDialogOpen, setIsAutoAssignDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoAssignStep, setAutoAssignStep] = useState<"preview" | "processing" | "complete">("preview");
  
  // Filtres pour l'assignation automatique
  const [filterClassId, setFilterClassId] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<"7" | "14" | "30" | "all">("7");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"valid" | "invalid">("valid");
  
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
    });
  }, [assignments, classroomAssignments, today, getDateRangeEnd, filterClassId, searchQuery]);

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

  // Algorithme d'assignation automatique OPTIMISÉ
  const { validAssignments, problemAssignments } = useMemo(() => {
    const valid: AutoAssignmentResult[] = [];
    const problems: ProblemResult[] = [];
    const tempAssignments = new Map<string, { date: string; start: string; end: string }[]>();

    // Initialiser les créneaux occupés par salle
    classroomAssignments.forEach(ca => {
      if (ca.assignments) {
        const slots = tempAssignments.get(ca.classroom_id) || [];
        slots.push({
          date: ca.assignments.session_date,
          start: ca.assignments.start_time,
          end: ca.assignments.end_time,
        });
        tempAssignments.set(ca.classroom_id, slots);
      }
    });

    // Trier les séances par nombre d'étudiants décroissant (les plus grandes classes en premier)
    const sortedSessions = [...unassignedSessions].sort((a, b) => {
      const countA = studentCountByClass[a.class_id] || 0;
      const countB = studentCountByClass[b.class_id] || 0;
      return countB - countA; // Plus grand en premier
    });

    // Pour chaque séance non assignée
    for (const session of sortedSessions) {
      const classInfo = classes.find(c => c.id === session.class_id);
      const studentCount = studentCountByClass[session.class_id] || 0;
      const className = classInfo?.name || "Classe inconnue";

      // Trouver toutes les salles avec capacité suffisante, triées par "best fit"
      // Best fit = la salle la plus proche de la capacité nécessaire (moins de gaspillage)
      const suitableClassrooms = [...classrooms]
        .filter(c => c.is_active && c.capacity >= studentCount)
        .map(c => ({
          ...c,
          waste: c.capacity - studentCount, // Gaspillage de places
          efficiency: Math.round((studentCount / c.capacity) * 100)
        }))
        .sort((a, b) => a.waste - b.waste); // Moins de gaspillage en premier

      let bestClassroom = null;
      let assignmentReason = "";
      let efficiency = 0;

      for (const classroom of suitableClassrooms) {
        const slots = tempAssignments.get(classroom.id) || [];
        const hasConflict = slots.some(slot => 
          slot.date === session.session_date &&
          slot.start < session.end_time! &&
          slot.end > session.start_time!
        );

        if (!hasConflict) {
          bestClassroom = classroom;
          efficiency = classroom.efficiency;
          assignmentReason = `${classroom.capacity} places • ${efficiency}% utilisé`;
          
          // Marquer ce créneau comme occupé
          slots.push({
            date: session.session_date!,
            start: session.start_time!,
            end: session.end_time!,
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
          const conflictingRooms = suitableClassrooms.map(classroom => {
            const slots = tempAssignments.get(classroom.id) || [];
            const conflictSlot = slots.find(slot => 
              slot.date === session.session_date &&
              slot.start < session.end_time! &&
              slot.end > session.start_time!
            );
            return { classroom, conflictSlot };
          }).filter(r => r.conflictSlot);

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

          // Si une salle sera libre bientôt
          const nextAvailableRoom = suitableClassrooms[0];
          if (nextAvailableRoom) {
            solutions.push({
              id: "wait_slot",
              label: `Attendre un créneau libre`,
              description: `${nextAvailableRoom.name} sera disponible à un autre horaire`,
              action: () => {
                toast.info(`Consultez le planning de ${nextAvailableRoom.name}`);
              },
              type: "secondary"
            });
          }

          problems.push({
            assignment: session,
            className,
            studentCount,
            reason: `Toutes les salles adaptées sont occupées le ${format(parseISO(session.session_date!), "dd/MM à HH:mm", { locale: fr })}`,
            solutions
          });
        }
      }
    }

    return { validAssignments: valid, problemAssignments: problems };
  }, [unassignedSessions, classrooms, classroomAssignments, classes, studentCountByClass, assignClassroom]);

  const handleCreateClassroom = () => {
    createClassroom({
      ...newClassroom,
      school_id: schoolId,
      is_active: true,
    });
    setIsAddDialogOpen(false);
    setNewClassroom({ name: "", capacity: 30, building: "", floor: "", equipment: [] });
  };

  const handleAssignClassroom = () => {
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
        await new Promise<void>((resolve, reject) => {
          assignClassroom({
            classroom_id: result.classroom.id,
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
    toast.success(`${successCount} séance(s) assignée(s) automatiquement`);
  };

  const openAutoAssignDialog = () => {
    setAutoAssignStep("preview");
    setActiveTab(problemAssignments.length > 0 ? "invalid" : "valid");
    setIsAutoAssignDialogOpen(true);
  };

  const handleManualRoomChange = (assignmentId: string, newClassroomId: string) => {
    // Trouver et mettre à jour dans la liste des résultats
    const result = validAssignments.find(r => r.assignment.id === assignmentId);
    if (result) {
      const newRoom = classrooms.find(c => c.id === newClassroomId);
      if (newRoom) {
        result.classroom = newRoom;
        result.reason = `${newRoom.capacity} places (manuel)`;
      }
    }
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

  // Stats pour le header
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
          {/* Alerte problèmes si présents */}
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

          {/* Bouton Assignation Automatique */}
          <Button 
            variant="default" 
            onClick={openAutoAssignDialog}
            disabled={unassignedSessions.length === 0 || classrooms.length === 0}
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

      {/* Dialog Assignation Automatique Amélioré */}
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
                    {classes.map(c => (
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

              {/* Alerte si problèmes */}
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
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full animate-pulse" />
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
                        {validAssignments.map((result, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg border bg-card hover:bg-accent/30 transition-all group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              {/* Info séance */}
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

                              {/* Arrow */}
                              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />

                              {/* Salle assignée */}
                              <div className="text-right min-w-[120px]">
                                <Select
                                  value={result.classroom.id}
                                  onValueChange={(v) => handleManualRoomChange(result.assignment.id, v)}
                                >
                                  <SelectTrigger className="h-8 w-auto border-0 bg-primary/10 hover:bg-primary/20">
                                    <div className="flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      <span className="font-medium">{result.classroom.name}</span>
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {classrooms.filter(c => c.is_active && c.capacity >= result.studentCount).map(c => (
                                      <SelectItem key={c.id} value={c.id}>
                                        <span>{c.name} ({c.capacity} places)</span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {result.reason}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
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
                            {/* Info problème */}
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
                                    {format(parseISO(problem.assignment.session_date), "EEE dd MMM yyyy", { locale: fr })}
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

                            {/* Solutions */}
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
                  {validAssignments.length} séance(s) ont été assignées avec succès
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
                  {/* Taux d'occupation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Occupation</span>
                      <span className="font-medium">{roomAssignments.length} séances</span>
                    </div>
                    <Progress value={occupancyRate} className="h-1.5" />
                  </div>

                  {/* Prochaines séances */}
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
                        <p className="text-sm text-muted-foreground">
                          {classroom.capacity} places • {classroom.building || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{roomAssignments.length} séances</p>
                        <Badge variant={status === "libre" ? "secondary" : "destructive"} className="text-xs">
                          {status}
                        </Badge>
                      </div>
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
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune salle de cours</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Créez vos salles de cours pour pouvoir les assigner automatiquement à vos séances
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Créer une Salle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

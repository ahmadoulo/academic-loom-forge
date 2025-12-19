import { useState, useMemo } from "react";
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
import { 
  Plus, Building2, Users, MapPin, Trash2, Calendar, Clock, 
  Wand2, CheckCircle2, AlertTriangle, ChevronRight, Settings2,
  Sparkles, LayoutGrid, List
} from "lucide-react";
import { format } from "date-fns";
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
  const [autoAssignResults, setAutoAssignResults] = useState<AutoAssignmentResult[]>([]);
  const [autoAssignStep, setAutoAssignStep] = useState<"preview" | "processing" | "complete">("preview");
  
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

  // Sessions non assignées à une salle
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const unassignedSessions = useMemo(() => {
    const assignedSessionIds = new Set(classroomAssignments.map(ca => ca.assignment_id));
    return assignments.filter(
      (assignment) =>
        assignment.type === "course" &&
        assignment.session_date &&
        assignment.start_time &&
        assignment.end_time &&
        new Date(assignment.session_date) >= today &&
        !assignedSessionIds.has(assignment.id)
    );
  }, [assignments, classroomAssignments]);

  const availableSessions = assignments.filter(
    (assignment) =>
      assignment.type === "course" &&
      assignment.session_date &&
      assignment.start_time &&
      assignment.end_time &&
      new Date(assignment.session_date) >= today
  );

  // Algorithme d'assignation automatique
  const calculateAutoAssignments = useMemo(() => {
    const results: AutoAssignmentResult[] = [];
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

    // Pour chaque séance non assignée
    for (const session of unassignedSessions) {
      const classInfo = classes.find(c => c.id === session.class_id);
      const studentCount = studentCountByClass[session.class_id] || 0;
      const className = classInfo?.name || "Classe inconnue";

      // Trouver la salle optimale
      const sortedClassrooms = [...classrooms]
        .filter(c => c.is_active && c.capacity >= studentCount)
        .sort((a, b) => a.capacity - b.capacity); // Préférer la plus petite salle adaptée

      let bestClassroom = null;
      let assignmentReason = "";

      for (const classroom of sortedClassrooms) {
        const slots = tempAssignments.get(classroom.id) || [];
        const hasConflict = slots.some(slot => 
          slot.date === session.session_date &&
          slot.start < session.end_time! &&
          slot.end > session.start_time!
        );

        if (!hasConflict) {
          bestClassroom = classroom;
          assignmentReason = `Capacité ${classroom.capacity} places pour ${studentCount} étudiants`;
          
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
        results.push({
          assignment: session,
          classroom: bestClassroom,
          className,
          studentCount,
          reason: assignmentReason,
        });
      } else if (sortedClassrooms.length === 0) {
        // Aucune salle avec capacité suffisante
        results.push({
          assignment: session,
          classroom: null,
          className,
          studentCount,
          reason: `Aucune salle avec capacité ≥ ${studentCount} places disponible`,
        });
      } else {
        // Toutes les salles sont occupées
        results.push({
          assignment: session,
          classroom: null,
          className,
          studentCount,
          reason: "Toutes les salles adaptées sont occupées à cet horaire",
        });
      }
    }

    return results;
  }, [unassignedSessions, classrooms, classroomAssignments, classes, studentCountByClass]);

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

    const validAssignments = autoAssignResults.filter(r => r.classroom !== null);
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
          // Fallback si pas de callback
          setTimeout(resolve, 500);
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
    setAutoAssignResults(calculateAutoAssignments);
    setAutoAssignStep("preview");
    setIsAutoAssignDialogOpen(true);
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
      ca => ca.assignments && new Date(ca.assignments.session_date) >= today
    );
    return Math.min((futureAssignments.length / 20) * 100, 100); // Max 20 séances
  };

  const validAutoAssignments = autoAssignResults.filter(r => r.classroom !== null);
  const invalidAutoAssignments = autoAssignResults.filter(r => r.classroom === null);

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
          {/* Bouton Assignation Automatique */}
          <Button 
            variant="default" 
            onClick={openAutoAssignDialog}
            disabled={unassignedSessions.length === 0 || classrooms.length === 0}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Assignation Auto
            {unassignedSessions.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-background/20">
                {unassignedSessions.length}
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
                                {format(new Date(session.session_date!), "dd/MM/yyyy", { locale: fr })} • {session.start_time}-{session.end_time} • {studentCount} étudiants
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

      {/* Dialog Assignation Automatique */}
      <Dialog open={isAutoAssignDialogOpen} onOpenChange={setIsAutoAssignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Assignation Automatique des Salles
            </DialogTitle>
            <DialogDescription>
              Optimisation basée sur la capacité des salles et le nombre d'étudiants par classe
            </DialogDescription>
          </DialogHeader>

          {autoAssignStep === "preview" && (
            <>
              <Tabs defaultValue="valid" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="valid" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Assignables ({validAutoAssignments.length})
                  </TabsTrigger>
                  <TabsTrigger value="invalid" className="gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Problèmes ({invalidAutoAssignments.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="valid" className="flex-1 overflow-hidden mt-4">
                  <ScrollArea className="h-[300px] pr-4">
                    {validAutoAssignments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Aucune séance à assigner</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {validAutoAssignments.map((result, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {result.assignment.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {result.className} • {result.studentCount} étudiants
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {format(new Date(result.assignment.session_date), "dd MMM", { locale: fr })}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {result.assignment.start_time} - {result.assignment.end_time}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                <div className="text-right">
                                  <p className="font-medium text-sm">{result.classroom.name}</p>
                                  <p className="text-xs text-muted-foreground">{result.reason}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="invalid" className="flex-1 overflow-hidden mt-4">
                  <ScrollArea className="h-[300px] pr-4">
                    {invalidAutoAssignments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                        <p className="text-sm text-muted-foreground">Toutes les séances peuvent être assignées</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {invalidAutoAssignments.map((result, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                          >
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{result.assignment.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {result.className} • {result.studentCount} étudiants
                                </p>
                                <p className="text-xs text-destructive mt-1">{result.reason}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsAutoAssignDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleAutoAssign} 
                  disabled={validAutoAssignments.length === 0}
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Assigner {validAutoAssignments.length} séance(s)
                </Button>
              </DialogFooter>
            </>
          )}

          {autoAssignStep === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Assignation en cours...</p>
            </div>
          )}

          {autoAssignStep === "complete" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium">Assignation terminée</p>
                <p className="text-sm text-muted-foreground">
                  {validAutoAssignments.length} séance(s) ont été assignées avec succès
                </p>
              </div>
              <Button onClick={() => setIsAutoAssignDialogOpen(false)}>
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
                                <span>{format(new Date(session.session_date), "dd/MM", { locale: fr })}</span>
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

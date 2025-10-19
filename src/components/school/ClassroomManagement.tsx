import { useState } from "react";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useAssignments } from "@/hooks/useAssignments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Users, MapPin, Trash2, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ClassroomManagementProps {
  schoolId: string;
}

export function ClassroomManagement({ schoolId }: ClassroomManagementProps) {
  const { classrooms, assignments: classroomAssignments, createClassroom, deleteClassroom, assignClassroom, unassignClassroom } = useClassrooms(schoolId);
  const { assignments } = useAssignments({ schoolId });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  
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

  // Filtrer les séances non assignées ou les séances du type "course"
  const availableSessions = assignments.filter(
    (assignment) =>
      assignment.type === "course" &&
      assignment.session_date &&
      assignment.start_time &&
      assignment.end_time
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Salles</h2>
          <p className="text-muted-foreground">
            Gérez les salles de cours et leurs assignations aux séances
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Salle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une Salle de Cours</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la salle *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: A101, Amphithéâtre A..."
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
                    placeholder="Ex: 1er étage"
                    value={newClassroom.floor}
                    onChange={(e) => setNewClassroom({ ...newClassroom, floor: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateClassroom} className="w-full">
                  Créer la Salle
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Assigner une Salle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assigner une Salle à une Séance</DialogTitle>
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
                      {classrooms.map((classroom) => (
                        <SelectItem key={classroom.id} value={classroom.id}>
                          {classroom.name} - Capacité: {classroom.capacity}
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
                      {availableSessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.title} - {session.classes?.name} ({format(new Date(session.session_date!), "dd/MM/yyyy", { locale: fr })} {session.start_time}-{session.end_time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAssignClassroom} className="w-full">
                  Assigner
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Liste des Salles */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classrooms.map((classroom) => {
          const status = getClassroomStatus(classroom.id);
          const roomAssignments = getClassroomAssignments(classroom.id);

          return (
            <Card key={classroom.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {classroom.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {classroom.capacity} places
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant={status === "libre" ? "default" : "destructive"}>
                    {status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {classroom.building && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {classroom.building} {classroom.floor && `- ${classroom.floor}`}
                  </div>
                )}

                {/* Assignations */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Séances assignées ({roomAssignments.length})</h4>
                  {roomAssignments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucune séance assignée</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {roomAssignments.map((assignment) => {
                        const session = assignment.assignments;
                        if (!session) return null;

                        const sessionDate = new Date(session.session_date);
                        const isToday = format(sessionDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                        return (
                          <div
                            key={assignment.id}
                            className="p-2 bg-muted rounded-lg text-xs space-y-1"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium">{session.title}</p>
                                <p className="text-muted-foreground">
                                  {session.classes?.name} - {session.subjects?.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={isToday ? "default" : "outline"} className="text-xs">
                                    {format(sessionDate, "dd MMM", { locale: fr })}
                                  </Badge>
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {session.start_time} - {session.end_time}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => unassignClassroom(assignment.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteClassroom(classroom.id)}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Supprimer la Salle
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {classrooms.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune salle de cours</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Commencez par créer votre première salle de cours
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer une Salle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

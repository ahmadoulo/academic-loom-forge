import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Info, Building2, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSubjects } from "@/hooks/useSubjects";
import { useOptionalSemester } from "@/hooks/useSemester";
import { useClassrooms } from "@/hooks/useClassrooms";
import { toast } from "sonner";

interface SessionFormProps {
  onSubmit: (data: SessionFormData) => void;
  onCancel: () => void;
  classes: Array<{ id: string; name: string }>;
  teachers: Array<{ id: string; firstname: string; lastname: string }>;
  loading?: boolean;
  schoolId: string;
}

export interface SessionFormData {
  title: string;
  description: string;
  class_id: string;
  teacher_id: string;
  subject_id?: string;
  session_date: Date;
  start_time: string;
  end_time: string;
  type: 'course' | 'exam' | 'assignment';
  is_recurring?: boolean;
  recurrence_pattern?: 'weekly' | 'monthly' | 'none';
  recurrence_day?: number;
  classroom_id?: string;
}

export function SessionForm({ onSubmit, onCancel, classes, teachers, loading, schoolId }: SessionFormProps) {
  const [formData, setFormData] = useState<Partial<SessionFormData>>({
    type: 'course',
    is_recurring: false,
    recurrence_pattern: 'none',
  });
  
  const { subjects } = useSubjects(schoolId, formData.class_id, formData.teacher_id);
  const semesterContext = useOptionalSemester();
  const currentSemester = semesterContext?.currentSemester;
  const { classrooms, assignments: classroomAssignments } = useClassrooms(schoolId);
  
  // Filtrer les subjects en fonction de la classe et du professeur sélectionnés
  const availableSubjects = subjects.filter(subject => {
    if (!formData.class_id || !formData.teacher_id) return false;
    return subject.class_id === formData.class_id && subject.teacher_id === formData.teacher_id;
  });

  // Calculer les salles disponibles pour le créneau sélectionné
  const availableClassrooms = useMemo(() => {
    if (!formData.session_date || !formData.start_time || !formData.end_time) {
      return classrooms.filter(c => c.is_active);
    }

    const dateStr = format(formData.session_date, "yyyy-MM-dd");
    
    return classrooms.filter(classroom => {
      if (!classroom.is_active) return false;
      
      // Vérifier si la salle est libre sur ce créneau
      const conflictingAssignments = classroomAssignments.filter(ca => {
        if (ca.classroom_id !== classroom.id) return false;
        if (!ca.assignments) return false;
        if (ca.assignments.session_date !== dateStr) return false;
        
        const sessionStart = ca.assignments.start_time;
        const sessionEnd = ca.assignments.end_time;
        
        // Check for overlap
        return sessionStart < formData.end_time! && sessionEnd > formData.start_time!;
      });
      
      return conflictingAssignments.length === 0;
    });
  }, [classrooms, classroomAssignments, formData.session_date, formData.start_time, formData.end_time]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des horaires
    if (formData.start_time && formData.end_time) {
      const [startHour, startMin] = formData.start_time.split(':').map(Number);
      const [endHour, endMin] = formData.end_time.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (startMinutes >= endMinutes) {
        toast.error("L'heure de début doit être avant l'heure de fin");
        return;
      }
    }

    // Validation récurrence
    if (formData.is_recurring) {
      if (!formData.recurrence_pattern || formData.recurrence_pattern === 'none') {
        toast.error("Veuillez sélectionner une fréquence de récurrence");
        return;
      }
      if (formData.recurrence_day === undefined) {
        toast.error("Veuillez sélectionner un jour de la semaine");
        return;
      }
    }
    
    if (
      formData.title &&
      formData.class_id &&
      formData.teacher_id &&
      formData.session_date &&
      formData.start_time &&
      formData.end_time
    ) {
      onSubmit(formData as SessionFormData);
    }
  };

  const showClassroomSelector = formData.session_date && formData.start_time && formData.end_time;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Titre de la séance *</Label>
        <Input
          id="title"
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Cours de Mathématiques"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Détails de la séance..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="type">Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value: 'course' | 'exam' | 'assignment') => 
            setFormData({ ...formData, type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="course">Cours</SelectItem>
            <SelectItem value="exam">Examen</SelectItem>
            <SelectItem value="assignment">Devoir</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="class">Classe *</Label>
          <Select
            value={formData.class_id}
            onValueChange={(value) => setFormData({ ...formData, class_id: value, subject_id: undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une classe" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="teacher">Professeur *</Label>
          <Select
            value={formData.teacher_id}
            onValueChange={(value) => setFormData({ ...formData, teacher_id: value, subject_id: undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un professeur" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.firstname} {teacher.lastname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.class_id && formData.teacher_id && (
        <div>
          <Label htmlFor="subject">Matière</Label>
          <Select
            value={formData.subject_id}
            onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une matière (optionnel)" />
            </SelectTrigger>
            <SelectContent>
              {availableSubjects.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  Aucune matière disponible pour cette classe et ce professeur
                </div>
              ) : (
                availableSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label>Date de la séance *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.session_date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.session_date ? (
                format(formData.session_date, "PPP", { locale: fr })
              ) : (
                <span>Choisir une date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.session_date}
              onSelect={(date) => date && setFormData({ ...formData, session_date: date, classroom_id: undefined })}
              locale={fr}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_time">Heure de début *</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time || ""}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value, classroom_id: undefined })}
            required
          />
        </div>

        <div>
          <Label htmlFor="end_time">Heure de fin *</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time || ""}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value, classroom_id: undefined })}
            required
          />
        </div>
      </div>

      {/* Salle de cours (optionnel) */}
      {showClassroomSelector && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Salle de cours (optionnel)</Label>
          </div>
          
          <Select
            value={formData.classroom_id || "none"}
            onValueChange={(value) => setFormData({ ...formData, classroom_id: value === "none" ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Aucune salle assignée" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">Aucune salle assignée</span>
              </SelectItem>
              {availableClassrooms.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  Aucune salle disponible sur ce créneau
                </div>
              ) : (
                availableClassrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span>{classroom.name}</span>
                      <span className="text-muted-foreground text-xs flex items-center gap-0.5">
                        <Users className="h-2.5 w-2.5" />
                        {classroom.capacity}
                      </span>
                      {classroom.building && (
                        <span className="text-muted-foreground text-xs">• {classroom.building}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          <p className="text-xs text-muted-foreground">
            {availableClassrooms.length} salle(s) disponible(s) pour ce créneau
          </p>
        </div>
      )}

      {/* Section Récurrence */}
      <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="recurring" className="text-base font-semibold">
              Répéter cette séance
            </Label>
            <p className="text-sm text-muted-foreground">
              Créer automatiquement cette séance de façon récurrente
            </p>
          </div>
          <Switch
            id="recurring"
            checked={formData.is_recurring || false}
            onCheckedChange={(checked) => 
              setFormData({ 
                ...formData, 
                is_recurring: checked,
                recurrence_pattern: checked ? 'weekly' : 'none'
              })
            }
          />
        </div>

        {formData.is_recurring && (
          <div className="space-y-4 pl-4 border-l-2 border-primary/20">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pattern">Fréquence *</Label>
                <Select
                  value={formData.recurrence_pattern}
                  onValueChange={(value: 'weekly' | 'monthly') => 
                    setFormData({ ...formData, recurrence_pattern: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Chaque semaine</SelectItem>
                    <SelectItem value="monthly">Chaque mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="day">Jour de la semaine *</Label>
                <Select
                  value={formData.recurrence_day?.toString()}
                  onValueChange={(value) => 
                    setFormData({ ...formData, recurrence_day: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un jour" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Lundi</SelectItem>
                    <SelectItem value="2">Mardi</SelectItem>
                    <SelectItem value="3">Mercredi</SelectItem>
                    <SelectItem value="4">Jeudi</SelectItem>
                    <SelectItem value="5">Vendredi</SelectItem>
                    <SelectItem value="6">Samedi</SelectItem>
                    <SelectItem value="0">Dimanche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {currentSemester && (
              <div className="flex items-start gap-2 rounded-md bg-primary/10 p-3 text-sm">
                <Info className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Période de récurrence</p>
                  <p className="text-muted-foreground">
                    Du {format(new Date(formData.session_date || new Date()), "d MMM yyyy", { locale: fr })} au{" "}
                    {format(new Date(currentSemester.end_date), "d MMM yyyy", { locale: fr })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Les séances seront créées automatiquement selon le semestre actuel
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer la séance"}
        </Button>
      </div>
    </form>
  );
}
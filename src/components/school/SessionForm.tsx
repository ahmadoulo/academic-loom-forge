import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSubjects } from "@/hooks/useSubjects";

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
}

export function SessionForm({ onSubmit, onCancel, classes, teachers, loading, schoolId }: SessionFormProps) {
  const [formData, setFormData] = useState<Partial<SessionFormData>>({
    type: 'course',
  });
  
  const { subjects } = useSubjects(schoolId, formData.class_id, formData.teacher_id);
  
  // Filtrer les subjects en fonction de la classe et du professeur sélectionnés
  const availableSubjects = subjects.filter(subject => {
    if (!formData.class_id || !formData.teacher_id) return false;
    return subject.class_id === formData.class_id && subject.teacher_id === formData.teacher_id;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
              onSelect={(date) => date && setFormData({ ...formData, session_date: date })}
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
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="end_time">Heure de fin *</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time || ""}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            required
          />
        </div>
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
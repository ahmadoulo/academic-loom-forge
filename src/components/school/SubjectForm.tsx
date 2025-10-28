import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubjectWithDetails } from "@/hooks/useSubjects";

interface Class {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  firstname: string;
  lastname: string;
}

interface SubjectFormProps {
  onSubmit: (subjectData: {
    name: string;
    class_id?: string | null;
    teacher_id?: string | null;
  }) => void;
  onCancel?: () => void;
  classes?: Class[];
  teachers?: Teacher[];
  initialData?: SubjectWithDetails;
  isEditing?: boolean;
}

export const SubjectForm = ({ 
  onSubmit, 
  onCancel, 
  classes = [], 
  teachers = [],
  initialData,
  isEditing = false
}: SubjectFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    class_id: initialData?.class_id || undefined as string | undefined,
    teacher_id: initialData?.teacher_id || undefined as string | undefined,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        class_id: initialData.class_id || undefined,
        teacher_id: initialData.teacher_id || undefined,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onSubmit({
      name: formData.name.trim(),
      class_id: formData.class_id || null,
      teacher_id: formData.teacher_id || null,
    });
    
    if (!isEditing) {
      setFormData({ name: "", class_id: undefined, teacher_id: undefined });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nom de la matière *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Mathématiques, Français..."
          required
        />
      </div>

      <div>
        <Label htmlFor="class">Classe (optionnel)</Label>
        <Select
          value={formData.class_id}
          onValueChange={(value) => setFormData({ ...formData, class_id: value })}
        >
          <SelectTrigger id="class">
            <SelectValue placeholder="Sélectionner une classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucune classe</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="teacher">Professeur (optionnel)</Label>
        <Select
          value={formData.teacher_id}
          onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
        >
          <SelectTrigger id="teacher">
            <SelectValue placeholder="Sélectionner un professeur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun professeur</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.firstname} {teacher.lastname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit">
          {isEditing ? "Mettre à jour" : "Créer la matière"}
        </Button>
      </div>
    </form>
  );
};

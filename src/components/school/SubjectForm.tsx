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
    coefficient: number;
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
    coefficient: initialData?.coefficient || 1,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        class_id: initialData.class_id || undefined,
        teacher_id: initialData.teacher_id || undefined,
        coefficient: initialData.coefficient || 1,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (formData.coefficient < 0.5 || formData.coefficient > 10) {
      return;
    }
    
    onSubmit({
      name: formData.name.trim(),
      class_id: formData.class_id || null,
      teacher_id: formData.teacher_id || null,
      coefficient: formData.coefficient,
    });
    
    if (!isEditing) {
      setFormData({ name: "", class_id: undefined, teacher_id: undefined, coefficient: 1 });
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
        <Label htmlFor="coefficient">Coefficient *</Label>
        <Input
          id="coefficient"
          type="number"
          step="0.5"
          min="0.5"
          max="10"
          value={formData.coefficient}
          onChange={(e) => setFormData({ ...formData, coefficient: parseFloat(e.target.value) || 1 })}
          placeholder="Ex: 2"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Coefficient entre 0.5 et 10 pour le calcul des moyennes
        </p>
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
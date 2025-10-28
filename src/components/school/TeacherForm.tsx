import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useTeachers } from "@/hooks/useTeachers";

interface Teacher {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  school_id: string;
}

interface TeacherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  teacher?: Teacher | null;
  onSuccess?: () => void;
}

export function TeacherForm({ open, onOpenChange, schoolId, teacher, onSuccess }: TeacherFormProps) {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createTeacher, updateTeacher } = useTeachers();
  const isEditing = !!teacher;

  useEffect(() => {
    if (teacher) {
      setFirstname(teacher.firstname || "");
      setLastname(teacher.lastname || "");
      setEmail(teacher.email || "");
    } else {
      setFirstname("");
      setLastname("");
      setEmail("");
    }
  }, [teacher, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstname.trim() || !lastname.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateTeacher(teacher.id, {
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          email: email.trim() || undefined,
        });
      } else {
        await createTeacher({
          school_id: schoolId,
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          email: email.trim() || undefined,
        });
      }
      
      setFirstname("");
      setLastname("");
      setEmail("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du professeur:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le Professeur" : "Ajouter un Professeur"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstname">Prénom *</Label>
            <Input
              id="firstname"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              placeholder="Prénom du professeur"
              required
            />
          </div>
          <div>
            <Label htmlFor="lastname">Nom *</Label>
            <Input
              id="lastname"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              placeholder="Nom du professeur"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email (optionnel)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

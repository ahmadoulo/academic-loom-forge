import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface StudentWithClass {
  id: string;
  firstname: string;
  lastname: string;
  email?: string | null;
  cin_number?: string | null;
  student_phone?: string | null;
  parent_phone?: string | null;
  birth_date?: string | null;
  class_id: string;
  classes?: { name: string };
}

interface Class {
  id: string;
  name: string;
}

interface StudentEditDialogProps {
  student: StudentWithClass | null;
  classes: Class[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: Partial<StudentWithClass>) => Promise<void>;
}

export function StudentEditDialog({ student, classes, open, onOpenChange, onSave }: StudentEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    cin_number: "",
    birth_date: "",
    student_phone: "",
    parent_phone: "",
    class_id: "",
  });

  useEffect(() => {
    if (student) {
      setFormData({
        firstname: student.firstname || "",
        lastname: student.lastname || "",
        email: student.email || "",
        cin_number: student.cin_number || "",
        birth_date: student.birth_date || "",
        student_phone: student.student_phone || "",
        parent_phone: student.parent_phone || "",
        class_id: student.class_id || "",
      });
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setLoading(true);
    try {
      await onSave(student.id, formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating student:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Modifier les informations de l'étudiant
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstname">Prénom *</Label>
              <Input
                id="firstname"
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                required
                placeholder="Prénom de l'étudiant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastname">Nom *</Label>
              <Input
                id="lastname"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                required
                placeholder="Nom de l'étudiant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cin_number">Numéro CIN *</Label>
              <Input
                id="cin_number"
                value={formData.cin_number}
                onChange={(e) => setFormData({ ...formData, cin_number: e.target.value })}
                required
                placeholder="Ex: AB123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Date de naissance</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Classe *</Label>
              <Select
                value={formData.class_id}
                onValueChange={(value) => setFormData({ ...formData, class_id: value })}
              >
                <SelectTrigger id="class">
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

            <div className="space-y-2">
              <Label htmlFor="student_phone">Téléphone étudiant</Label>
              <Input
                id="student_phone"
                type="tel"
                value={formData.student_phone}
                onChange={(e) => setFormData({ ...formData, student_phone: e.target.value })}
                placeholder="Ex: +212 6XX XXX XXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_phone">Téléphone parent</Label>
              <Input
                id="parent_phone"
                type="tel"
                value={formData.parent_phone}
                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                placeholder="Ex: +212 6XX XXX XXX"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

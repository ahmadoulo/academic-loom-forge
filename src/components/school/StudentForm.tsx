import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (student: {
    firstname: string;
    lastname: string;
    email?: string;
    class_id: string;
  }) => void;
  classes: { id: string; name: string; }[];
}

export const StudentForm = ({ isOpen, onClose, onSubmit, classes }: StudentFormProps) => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    class_id: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstname.trim() || !formData.lastname.trim() || !formData.class_id) return;
    
    onSubmit({
      firstname: formData.firstname.trim(),
      lastname: formData.lastname.trim(),
      email: formData.email.trim() || undefined,
      class_id: formData.class_id
    });
    
    // Reset form
    setFormData({ firstname: "", lastname: "", email: "", class_id: "" });
    onClose();
  };

  const handleClose = () => {
    setFormData({ firstname: "", lastname: "", email: "", class_id: "" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un étudiant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstname">Prénom *</Label>
            <Input
              id="firstname"
              value={formData.firstname}
              onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
              placeholder="Prénom de l'étudiant"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="lastname">Nom *</Label>
            <Input
              id="lastname"
              value={formData.lastname}
              onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
              placeholder="Nom de l'étudiant"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemple.com (optionnel)"
            />
          </div>
          
          <div>
            <Label htmlFor="class_id">Classe *</Label>
            <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
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
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit">
              Ajouter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
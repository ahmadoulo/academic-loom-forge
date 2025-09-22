import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface ClassFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (classData: {
    name: string;
    selectedSubjects: string[];
  }) => void;
  subjects: Subject[];
}

export const ClassForm = ({ isOpen, onClose, onSubmit, subjects }: ClassFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    selectedSubjects: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onSubmit({
      name: formData.name.trim(),
      selectedSubjects: formData.selectedSubjects
    });
    
    // Reset form
    setFormData({ name: "", selectedSubjects: [] });
    onClose();
  };

  const handleClose = () => {
    setFormData({ name: "", selectedSubjects: [] });
    onClose();
  };

  const handleSubjectToggle = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter(id => id !== subjectId)
        : [...prev.selectedSubjects, subjectId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle classe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Nom de la classe *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: 6ème A, Terminale S1..."
              required
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Matières de la classe
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Sélectionnez les matières qui seront enseignées dans cette classe
              </p>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune matière disponible. Créez d'abord des matières.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={subject.id}
                        checked={formData.selectedSubjects.includes(subject.id)}
                        onCheckedChange={() => handleSubjectToggle(subject.id)}
                      />
                      <Label
                        htmlFor={subject.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {subject.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit">
              Créer la classe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
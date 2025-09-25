import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAssignments } from "@/hooks/useAssignments";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { useAuth } from "@/hooks/useAuth";
import { CalendarIcon, BookOpen } from "lucide-react";

export const AssignmentForm = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { createAssignment } = useAssignments();
  const { teacherClasses } = useTeacherClasses();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'exam' as 'exam' | 'test' | 'homework',
    class_id: '',
    due_date: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Profil utilisateur non trouvé"
      });
      return;
    }

    if (!formData.title || !formData.class_id) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await createAssignment({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        class_id: formData.class_id,
        due_date: formData.due_date || undefined,
        school_id: profile.school_id || '',
        teacher_id: profile.id
      });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Succès",
        description: "Devoir créé avec succès"
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'exam',
        class_id: '',
        due_date: ''
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création du devoir"
      });
    } finally {
      setLoading(false);
    }
  };

  const typeLabels = {
    exam: 'Examen',
    test: 'Contrôle',
    homework: 'Devoir'
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Publier un Devoir
        </h1>
        <p className="text-muted-foreground">
          Créez et assignez des examens, contrôles ou devoirs à vos classes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau Devoir</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Contrôle de Mathématiques"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'exam' | 'test' | 'homework' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Examen</SelectItem>
                    <SelectItem value="test">Contrôle</SelectItem>
                    <SelectItem value="homework">Devoir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class_id">Classe *</Label>
                <Select 
                  value={formData.class_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, class_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherClasses.map((teacherClass) => (
                      <SelectItem key={teacherClass.classes.id} value={teacherClass.classes.id}>
                        {teacherClass.classes.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Date d'échéance</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du devoir, instructions spéciales..."
                rows={4}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Création en cours..." : "Créer le Devoir"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
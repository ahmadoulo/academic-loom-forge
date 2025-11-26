import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudentFormProps {
  onSubmit: (student: {
    firstname: string;
    lastname: string;
    email?: string;
    class_id: string;
    birth_date?: string;
    cin_number: string;
    student_phone?: string;
    parent_phone?: string;
    tutor_name?: string;
    tutor_email?: string;
  }) => void;
  classes: { id: string; name: string; }[];
  schoolId: string;
}

export const StudentForm = ({ onSubmit, classes, schoolId }: StudentFormProps) => {
  const { canAddStudent, loading: limitsLoading } = useSubscriptionLimits(schoolId);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    class_id: "",
    birth_date: "",
    cin_number: "",
    student_phone: "",
    parent_phone: "",
    tutor_name: "",
    tutor_email: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canAddStudent) {
      toast({
        title: "Limite atteinte",
        description: "Limite étudiant atteint. Contactez le support",
        variant: "destructive"
      });
      return;
    }
    
    // Validation
    if (!formData.firstname.trim()) {
      toast({
        title: "Erreur",
        description: "Le prénom est requis",
        variant: "destructive"
      });
      return;
    }
    if (!formData.lastname.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom est requis",
        variant: "destructive"
      });
      return;
    }
    if (!formData.class_id) {
      toast({
        title: "Erreur",
        description: "La classe est requise",
        variant: "destructive"
      });
      return;
    }
    if (!formData.cin_number.trim()) {
      toast({
        title: "Erreur",
        description: "Le numéro CIN est requis",
        variant: "destructive"
      });
      return;
    }
    
    const studentData = {
      firstname: formData.firstname.trim(),
      lastname: formData.lastname.trim(),
      email: formData.email.trim() || undefined,
      class_id: formData.class_id,
      birth_date: formData.birth_date || undefined,
      cin_number: formData.cin_number.trim(),
      student_phone: formData.student_phone.trim() || undefined,
      parent_phone: formData.parent_phone.trim() || undefined,
      tutor_name: formData.tutor_name.trim() || undefined,
      tutor_email: formData.tutor_email.trim() || undefined,
    };
    
    onSubmit(studentData);
    
    // Reset form
    setFormData({ 
      firstname: "", 
      lastname: "", 
      email: "", 
      class_id: "",
      birth_date: "",
      cin_number: "",
      student_phone: "",
      parent_phone: "",
      tutor_name: "",
      tutor_email: ""
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Ajouter un Étudiant
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!limitsLoading && !canAddStudent && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Limite étudiant atteint. Contactez le support pour augmenter votre capacité.
            </AlertDescription>
          </Alert>
        )}
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
            <Label htmlFor="birth_date">Date de naissance</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="cin_number">Numéro CIN *</Label>
            <Input
              id="cin_number"
              value={formData.cin_number}
              onChange={(e) => setFormData({ ...formData, cin_number: e.target.value })}
              placeholder="Numéro de carte d'identité (utilisé comme mot de passe)"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="student_phone">Téléphone étudiant</Label>
            <Input
              id="student_phone"
              type="tel"
              value={formData.student_phone}
              onChange={(e) => setFormData({ ...formData, student_phone: e.target.value })}
              placeholder="+33 1 23 45 67 89"
            />
          </div>
          
          <div>
            <Label htmlFor="parent_phone">Téléphone parent</Label>
            <Input
              id="parent_phone"
              type="tel"
              value={formData.parent_phone}
              onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
              placeholder="+33 1 23 45 67 89"
            />
          </div>
          
          <div>
            <Label htmlFor="tutor_name">Nom du tuteur/parent</Label>
            <Input
              id="tutor_name"
              value={formData.tutor_name}
              onChange={(e) => setFormData({ ...formData, tutor_name: e.target.value })}
              placeholder="Nom complet du tuteur"
            />
          </div>
          
          <div>
            <Label htmlFor="tutor_email">Email du tuteur/parent</Label>
            <Input
              id="tutor_email"
              type="email"
              value={formData.tutor_email}
              onChange={(e) => setFormData({ ...formData, tutor_email: e.target.value })}
              placeholder="email@exemple.com"
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
            <Button type="submit" disabled={!canAddStudent || limitsLoading}>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter l'étudiant
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudentFormProps {
  onSubmit: (student: {
    firstname: string;
    lastname: string;
    email?: string;
    class_id: string;
    birth_date?: string;
    cin_number?: string;
    student_phone?: string;
    parent_phone?: string;
  }) => void;
  classes: { id: string; name: string; }[];
}

export const StudentForm = ({ onSubmit, classes }: StudentFormProps) => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    class_id: "",
    birth_date: "",
    cin_number: "",
    student_phone: "",
    parent_phone: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    console.log('=== StudentForm handleSubmit DÉBUT ===');
    e.preventDefault();
    
    console.log('Données du formulaire:', formData);
    
    // Validation
    if (!formData.firstname.trim()) {
      console.log('❌ Validation échouée: Prénom manquant');
      return;
    }
    if (!formData.lastname.trim()) {
      console.log('❌ Validation échouée: Nom manquant');
      return;
    }
    if (!formData.class_id) {
      console.log('❌ Validation échouée: Classe manquante');
      return;
    }
    if (!formData.cin_number.trim()) {
      console.log('❌ Validation échouée: CIN manquant');
      return;
    }
    
    console.log('✅ Validation réussie, préparation des données...');
    
    const studentData = {
      firstname: formData.firstname.trim(),
      lastname: formData.lastname.trim(),
      email: formData.email.trim() || undefined,
      class_id: formData.class_id,
      birth_date: formData.birth_date || undefined,
      cin_number: formData.cin_number.trim(),
      student_phone: formData.student_phone.trim() || undefined,
      parent_phone: formData.parent_phone.trim() || undefined,
    };
    
    console.log('Données préparées pour onSubmit:', studentData);
    console.log('Appel de onSubmit...');
    
    try {
      onSubmit(studentData);
      console.log('✅ onSubmit appelé avec succès');
      
      // Reset form
      setFormData({ 
        firstname: "", 
        lastname: "", 
        email: "", 
        class_id: "",
        birth_date: "",
        cin_number: "",
        student_phone: "",
        parent_phone: ""
      });
      console.log('✅ Formulaire réinitialisé');
    } catch (error) {
      console.error('❌ Erreur lors de l\'appel onSubmit:', error);
    }
    
    console.log('=== StudentForm handleSubmit FIN ===');
  };

  return (
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
        <Button type="submit">
          Ajouter l'étudiant
        </Button>
      </div>
    </form>
  );
};
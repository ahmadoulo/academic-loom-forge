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
  gender?: string;
  mobile?: string;
  birth_date?: string;
  qualification?: string;
  address?: string;
  salary?: number;
  join_date?: string;
  status?: string;
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
  const [gender, setGender] = useState("");
  const [mobile, setMobile] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [qualification, setQualification] = useState("");
  const [address, setAddress] = useState("");
  const [salary, setSalary] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [status, setStatus] = useState("active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createTeacher, updateTeacher } = useTeachers();
  const isEditing = !!teacher;

  useEffect(() => {
    if (teacher) {
      setFirstname(teacher.firstname || "");
      setLastname(teacher.lastname || "");
      setEmail(teacher.email || "");
      setGender(teacher.gender || "");
      setMobile(teacher.mobile || "");
      setBirthDate(teacher.birth_date || "");
      setQualification(teacher.qualification || "");
      setAddress(teacher.address || "");
      setSalary(teacher.salary?.toString() || "");
      setJoinDate(teacher.join_date || "");
      setStatus(teacher.status || "active");
    } else {
      setFirstname("");
      setLastname("");
      setEmail("");
      setGender("");
      setMobile("");
      setBirthDate("");
      setQualification("");
      setAddress("");
      setSalary("");
      setJoinDate("");
      setStatus("active");
    }
  }, [teacher, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstname.trim() || !lastname.trim()) return;

    setIsSubmitting(true);
    try {
      const teacherData = {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim() || undefined,
        gender: gender || undefined,
        mobile: mobile.trim() || undefined,
        birth_date: birthDate || undefined,
        qualification: qualification.trim() || undefined,
        address: address.trim() || undefined,
        salary: salary ? parseFloat(salary) : undefined,
        join_date: joinDate || undefined,
        status: status || "active",
      };

      if (isEditing) {
        await updateTeacher(teacher.id, teacherData);
      } else {
        await createTeacher({
          school_id: schoolId,
          ...teacherData,
        });
      }
      
      setFirstname("");
      setLastname("");
      setEmail("");
      setGender("");
      setMobile("");
      setBirthDate("");
      setQualification("");
      setAddress("");
      setSalary("");
      setJoinDate("");
      setStatus("active");
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
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Genre *</Label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Sélectionner</option>
                <option value="male">Masculin</option>
                <option value="female">Féminin</option>
              </select>
            </div>
            <div>
              <Label htmlFor="mobile">Mobile *</Label>
              <Input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+212 6XX XXX XXX"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthDate">Date de naissance *</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="qualification">Qualification *</Label>
              <Input
                id="qualification"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="Ex: Licence en Mathématiques"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresse complète"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary">Salaire</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="joinDate">Date d'adhésion</Label>
              <Input
                id="joinDate"
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Statut *</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
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

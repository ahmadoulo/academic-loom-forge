import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User, Mail, Phone, Calendar, GraduationCap, MapPin, DollarSign, Briefcase } from "lucide-react";
import { Teacher } from "@/hooks/useTeachers";

interface TeacherDetailsDialogProps {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (teacherId: string, data: Partial<Teacher>) => Promise<void>;
}

export function TeacherDetailsDialog({ 
  teacher, 
  open, 
  onOpenChange, 
  onSave 
}: TeacherDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Teacher>>({});

  useEffect(() => {
    if (teacher) {
      setFormData({
        firstname: teacher.firstname || "",
        lastname: teacher.lastname || "",
        email: teacher.email || "",
        gender: teacher.gender || "",
        mobile: teacher.mobile || "",
        birth_date: teacher.birth_date || "",
        qualification: teacher.qualification || "",
        address: teacher.address || "",
        salary: teacher.salary || undefined,
        join_date: teacher.join_date || "",
        status: teacher.status || "active"
      });
    }
  }, [teacher]);

  const handleSave = async () => {
    if (!teacher) return;
    
    setLoading(true);
    try {
      await onSave(teacher.id, formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving teacher:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Détails du Professeur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">
                  Prénom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstname"
                  value={formData.firstname || ""}
                  onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                  placeholder="Prénom"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastname">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastname"
                  value={formData.lastname || ""}
                  onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                  placeholder="Nom"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Genre</Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculin</SelectItem>
                    <SelectItem value="female">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de naissance
                </Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date || ""}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Mobile
                </Label>
                <Input
                  id="mobile"
                  value={formData.mobile || ""}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresse
              </Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adresse complète"
              />
            </div>
          </div>

          {/* Informations professionnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Informations professionnelles
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qualification" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Qualification
                </Label>
                <Input
                  id="qualification"
                  value={formData.qualification || ""}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="Diplôme, certification..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="join_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date d'adhésion
                </Label>
                <Input
                  id="join_date"
                  type="date"
                  value={formData.join_date || ""}
                  onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Salaire
                </Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary || ""}
                  onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || undefined })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status || "active"}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Label>Classes assignées:</Label>
                <Badge variant="outline" className="text-base font-semibold">
                  {teacher.assigned_classes_count || 0}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !formData.firstname || !formData.lastname}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

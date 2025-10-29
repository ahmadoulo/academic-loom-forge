import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useSchoolSemesters } from "@/hooks/useSchoolSemesters";
import { useSchoolYears } from "@/hooks/useSchoolYears";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SemesterManagementProps {
  schoolId: string;
}

export const SemesterManagement = ({ schoolId }: SemesterManagementProps) => {
  const { semesters, loading, createSemester, setCurrentSemester, deleteSemester } = useSchoolSemesters(schoolId);
  const { schoolYears } = useSchoolYears();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    school_year_id: "",
    start_date: "",
    end_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSemester({
        school_id: schoolId,
        ...formData,
      });
      setIsDialogOpen(false);
      setFormData({
        name: "",
        school_year_id: "",
        start_date: "",
        end_date: "",
      });
    } catch (error) {
      console.error('Error creating semester:', error);
    }
  };

  const handleSetCurrent = async (semesterId: string) => {
    try {
      await setCurrentSemester(semesterId);
    } catch (error) {
      console.error('Error setting current semester:', error);
    }
  };

  const handleDelete = async (semesterId: string) => {
    try {
      await deleteSemester(semesterId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting semester:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Semestres</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currentSemester = semesters.find(s => s.is_actual);
  const nextSemester = semesters.find(s => s.is_next);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Gestion des Semestres
              </CardTitle>
              <CardDescription>
                Créez et gérez les semestres scolaires avec automatisation des transitions
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Semestre
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un Semestre</DialogTitle>
                  <DialogDescription>
                    Définissez les informations du nouveau semestre
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du Semestre</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Semestre 1, Semestre 2"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school_year">Année Scolaire</Label>
                    <Select
                      value={formData.school_year_id}
                      onValueChange={(value) => setFormData({ ...formData, school_year_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une année" />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolYears.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                            {year.is_current && <span className="ml-2 text-primary">(Actuelle)</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Date de Début</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_date">Date de Fin</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      Créer le Semestre
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentSemester && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Semestre Actuel:</strong> {currentSemester.name} 
                <span className="text-muted-foreground ml-2">
                  ({format(new Date(currentSemester.start_date), 'dd MMM yyyy', { locale: fr })} - {format(new Date(currentSemester.end_date), 'dd MMM yyyy', { locale: fr })})
                </span>
              </AlertDescription>
            </Alert>
          )}

          {!currentSemester && semesters.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                Aucun semestre actif. Veuillez définir un semestre comme actuel.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {semesters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun semestre créé. Commencez par créer votre premier semestre.
              </div>
            ) : (
              semesters.map((semester) => (
                <Card key={semester.id} className={semester.is_actual ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{semester.name}</h4>
                          {semester.is_actual && (
                            <Badge className="bg-primary">Actuel</Badge>
                          )}
                          {semester.is_next && (
                            <Badge variant="outline">Suivant</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(semester.start_date), 'dd MMM yyyy', { locale: fr })} - {format(new Date(semester.end_date), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!semester.is_actual && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetCurrent(semester.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Définir comme Actuel
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(semester.id)}
                          disabled={semester.is_actual}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Automatisation:</strong> Le système vérifie automatiquement les dates et passe au semestre suivant quand le semestre actuel se termine.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce semestre ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

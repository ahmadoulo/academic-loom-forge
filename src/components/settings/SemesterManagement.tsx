import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Archive, CheckCircle2, Edit, ArchiveRestore } from "lucide-react";
import { useSchoolSemesters } from "@/hooks/useSchoolSemesters";
import { useSchoolYears } from "@/hooks/useSchoolYears";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import type { SchoolSemester } from "@/hooks/useSchoolSemesters";
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
  canEdit?: boolean;
}

export const SemesterManagement = ({ schoolId, canEdit = true }: SemesterManagementProps) => {
  const { selectedYear } = useAcademicYear();
  // Ne plus filtrer par année - afficher TOUS les semestres de l'école
  const { semesters, loading, createSemester, setCurrentSemester, updateSemester, archiveSemester, restoreSemester } = useSchoolSemesters(schoolId, undefined);
  const { schoolYears } = useSchoolYears();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [archivedSemesters, setArchivedSemesters] = useState<SchoolSemester[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    school_year_id: "",
    start_date: "",
    end_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && editingSemesterId) {
        await updateSemester(editingSemesterId, formData);
      } else {
        await createSemester({
          school_id: schoolId,
          ...formData,
        });
      }
      setIsDialogOpen(false);
      setIsEditMode(false);
      setEditingSemesterId(null);
      setFormData({
        name: "",
        school_year_id: "",
        start_date: "",
        end_date: "",
      });
    } catch (error) {
      console.error('Error saving semester:', error);
    }
  };

  const handleEdit = (semester: any) => {
    setIsEditMode(true);
    setEditingSemesterId(semester.id);
    setFormData({
      name: semester.name,
      school_year_id: semester.school_year_id,
      start_date: semester.start_date,
      end_date: semester.end_date,
    });
    setIsDialogOpen(true);
  };

  const handleSetCurrent = async (semesterId: string) => {
    try {
      await setCurrentSemester(semesterId);
    } catch (error) {
      console.error('Error setting current semester:', error);
    }
  };

  const handleArchive = async (semesterId: string) => {
    try {
      await archiveSemester(semesterId);
      setArchiveConfirmId(null);
      fetchArchivedSemesters();
    } catch (error) {
      console.error('Error archiving semester:', error);
    }
  };

  const handleRestore = async (semesterId: string) => {
    try {
      await restoreSemester(semesterId);
      fetchArchivedSemesters();
    } catch (error) {
      console.error('Error restoring semester:', error);
    }
  };

  const fetchArchivedSemesters = async () => {
    try {
      const { data, error } = await supabase
        .from('school_semester' as any)
        .select('*')
        .eq('school_id', schoolId)
        .eq('archived', true)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setArchivedSemesters((data as unknown as SchoolSemester[]) || []);
    } catch (error) {
      console.error('Error fetching archived semesters:', error);
    }
  };

  useEffect(() => {
    if (showArchived) {
      fetchArchivedSemesters();
    }
  }, [showArchived, schoolId]);

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
            {canEdit && (
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setIsEditMode(false);
                  setEditingSemesterId(null);
                  setFormData({
                    name: "",
                    school_year_id: "",
                    start_date: "",
                    end_date: "",
                  });
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Semestre
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isEditMode ? 'Modifier le Semestre' : 'Créer un Semestre'}</DialogTitle>
                  <DialogDescription>
                    {isEditMode ? 'Modifiez les informations du semestre' : 'Définissez les informations du nouveau semestre'}
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
                      {isEditMode ? 'Modifier' : 'Créer le Semestre'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
              </Dialog>
            )}
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
                        {canEdit && !semester.is_actual && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetCurrent(semester.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Définir comme Actuel
                          </Button>
                        )}
                        {canEdit && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(semester)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setArchiveConfirmId(semester.id)}
                              disabled={semester.is_actual}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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

      {/* Section des semestres archivés */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Semestres Archivés
              </CardTitle>
              <CardDescription>
                Consultez et restaurez les semestres archivés
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowArchived(!showArchived);
                if (!showArchived) fetchArchivedSemesters();
              }}
            >
              {showArchived ? 'Masquer' : 'Afficher'}
            </Button>
          </div>
        </CardHeader>
        {showArchived && (
          <CardContent className="space-y-3">
            {archivedSemesters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun semestre archivé
              </div>
            ) : (
              archivedSemesters.map((semester) => (
                <Card key={semester.id} className="border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-muted-foreground">{semester.name}</h4>
                          <Badge variant="secondary">Archivé</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(semester.start_date), 'dd MMM yyyy', { locale: fr })} - {format(new Date(semester.end_date), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(semester.id)}
                      >
                        <ArchiveRestore className="h-4 w-4 mr-1" />
                        Restaurer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        )}
      </Card>

      <AlertDialog open={!!archiveConfirmId} onOpenChange={() => setArchiveConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'archivage</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir archiver ce semestre ? Les notes associées seront conservées mais le semestre ne sera plus sélectionnable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => archiveConfirmId && handleArchive(archiveConfirmId)}>
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

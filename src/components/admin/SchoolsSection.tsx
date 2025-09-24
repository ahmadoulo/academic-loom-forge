import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, School, Trash2, Loader2 } from "lucide-react";
import { useSchools } from "@/hooks/useSchools";
import { useTeachers } from "@/hooks/useTeachers";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { SchoolCard } from "@/components/admin/SchoolCard";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function SchoolsSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: "", identifier: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; schoolId?: string; schoolName?: string }>({ open: false });

  const { schools, loading, createSchool, updateSchool, deleteSchool } = useSchools();
  const { teachers } = useTeachers();
  const { students } = useStudents();
  const { classes } = useClasses();

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name.trim()) return;

    console.log('DEBUG: Formulaire soumis avec:', newSchool);
    
    setIsSubmitting(true);
    try {
      const identifier = newSchool.identifier.trim() || `SCH${String(schools.length + 1).padStart(3, '0')}`;
      
      console.log('DEBUG: Identifier généré:', identifier);
      
      await createSchool({
        name: newSchool.name,
        identifier
      });
      
      setNewSchool({ name: "", identifier: "" });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("DEBUG: Erreur lors de la création de l'école:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (!deleteDialog.schoolId) return;
    
    try {
      await deleteSchool(deleteDialog.schoolId);
      setDeleteDialog({ open: false });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const handleViewSchool = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      window.location.href = `/school/${school.identifier}`;
    }
  };

  const handleEditSchool = (schoolId: string) => {
    // Implement edit functionality - for now just show the school info
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      setNewSchool({ name: school.name, identifier: school.identifier });
      setIsDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement des écoles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Écoles</h2>
          <p className="text-muted-foreground">Administrez tous les établissements du système</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle École
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schools.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune école enregistrée</h3>
                <p className="text-muted-foreground mb-4">
                  Commencez par créer votre première école pour gérer les étudiants et les professeurs.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une école
                </Button>
              </div>
            ) : (
              schools.map((school) => {
                const schoolTeachers = teachers.filter(t => t.school_id === school.id);
                const schoolStudents = students.filter(s => s.school_id === school.id);
                const schoolClasses = classes.filter(c => c.school_id === school.id);
                
                return (
                  <div key={school.id} className="relative">
                    <SchoolCard 
                      school={{
                        id: school.id,
                        name: school.name,
                        identifier: school.identifier,
                        studentsCount: schoolStudents.length,
                        teachersCount: schoolTeachers.length,
                        classesCount: schoolClasses.length,
                        createdAt: school.created_at
                      }}
                      onView={handleViewSchool}
                      onEdit={handleEditSchool}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteDialog({ 
                        open: true, 
                        schoolId: school.id, 
                        schoolName: school.name 
                      })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create School Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un Nouvel Établissement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSchool} className="space-y-4">
            <div>
              <Label htmlFor="school-name">Nom de l'établissement</Label>
              <Input
                id="school-name"
                value={newSchool.name}
                onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                placeholder="Ex: Lycée Victor Hugo"
                required
              />
            </div>
            <div>
              <Label htmlFor="school-identifier">Identifiant (optionnel)</Label>
              <Input
                id="school-identifier"
                value={newSchool.identifier}
                onChange={(e) => setNewSchool({ ...newSchool, identifier: e.target.value })}
                placeholder="Ex: LVH2024 (généré automatiquement si vide)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer l'École
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Supprimer l'école"
        description={`Êtes-vous sûr de vouloir supprimer l'école "${deleteDialog.schoolName}" ? Cette action est irréversible et supprimera toutes les données associées (étudiants, professeurs, classes, etc.).`}
        onConfirm={handleDeleteSchool}
      />
    </div>
  );
}
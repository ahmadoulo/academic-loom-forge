import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { useCycles } from "@/hooks/useCycles";
import { CycleForm } from "./CycleForm";
import { Badge } from "@/components/ui/badge";

interface CyclesManagementProps {
  schoolId: string;
  canEdit?: boolean;
}

export const CyclesManagement = ({ schoolId, canEdit = true }: CyclesManagementProps) => {
  const { cycles, loading, createCycle, updateCycle, deleteCycle } = useCycles(schoolId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<any>(null);

  const handleCreate = async (data: any) => {
    await createCycle(data, schoolId);
    setIsCreateOpen(false);
  };

  const handleUpdate = async (data: any) => {
    if (editingCycle) {
      await updateCycle(editingCycle.id, data);
      setEditingCycle(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce cycle ?")) {
      await deleteCycle(id);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Cycles</h2>
          <p className="text-muted-foreground">
            Créez et gérez les cycles académiques de votre établissement
          </p>
        </div>
        {canEdit && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau cycle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau cycle</DialogTitle>
              </DialogHeader>
              <CycleForm onSubmit={handleCreate} onCancel={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cycles.map((cycle) => (
          <Card key={cycle.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{cycle.name}</CardTitle>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <Dialog open={editingCycle?.id === cycle.id} onOpenChange={(open) => !open && setEditingCycle(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCycle(cycle)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Modifier le cycle</DialogTitle>
                        </DialogHeader>
                        <CycleForm
                          cycle={cycle}
                          onSubmit={handleUpdate}
                          onCancel={() => setEditingCycle(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cycle.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {cycle.level && (
                <Badge variant="secondary">{cycle.level}</Badge>
              )}
              {cycle.duration_years && (
                <p className="text-sm text-muted-foreground">
                  Durée: {cycle.duration_years} an{cycle.duration_years > 1 ? 's' : ''}
                </p>
              )}
              {cycle.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {cycle.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {cycles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Aucun cycle créé pour le moment
            </p>
            {canEdit && (
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier cycle
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

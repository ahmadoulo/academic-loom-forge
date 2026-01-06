import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Layers, AlertCircle } from "lucide-react";
import { useOptions } from "@/hooks/useOptions";
import { useCycles } from "@/hooks/useCycles";
import { OptionForm } from "./OptionForm";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OptionsManagementProps {
  schoolId: string;
  canEdit?: boolean;
}

export const OptionsManagement = ({ schoolId, canEdit = true }: OptionsManagementProps) => {
  const { options, loading, createOption, updateOption, deleteOption } = useOptions(schoolId);
  const { cycles } = useCycles(schoolId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any>(null);

  const handleCreate = async (data: any) => {
    await createOption(data, schoolId);
    setIsCreateOpen(false);
  };

  const handleUpdate = async (data: any) => {
    if (editingOption) {
      await updateOption(editingOption.id, data);
      setEditingOption(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette option ?")) {
      await deleteOption(id);
    }
  };

  const getCycleName = (cycleId: string) => {
    const cycle = cycles.find((c) => c.id === cycleId);
    return cycle ? cycle.name : "Cycle inconnu";
  };

  if (loading) {
    return <div className="text-muted-foreground">Chargement...</div>;
  }

  if (cycles.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Vous devez d'abord créer des cycles avant de pouvoir créer des options.
          Allez dans l'onglet "Cycles" pour commencer.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Options</h2>
          <p className="text-muted-foreground">
            Créez et gérez les options pour chaque cycle
          </p>
        </div>
        {canEdit && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle option
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle option</DialogTitle>
              </DialogHeader>
              <OptionForm
                cycles={cycles}
                onSubmit={handleCreate}
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <Card key={option.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{option.name}</CardTitle>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <Dialog open={editingOption?.id === option.id} onOpenChange={(open) => !open && setEditingOption(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingOption(option)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Modifier l'option</DialogTitle>
                        </DialogHeader>
                        <OptionForm
                          option={option}
                          cycles={cycles}
                          onSubmit={handleUpdate}
                          onCancel={() => setEditingOption(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(option.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="outline">{getCycleName(option.cycle_id)}</Badge>
              {option.code && (
                <Badge variant="secondary" className="ml-2">
                  {option.code}
                </Badge>
              )}
              {option.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {option.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {options.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Aucune option créée pour le moment
            </p>
            {canEdit && (
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer votre première option
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

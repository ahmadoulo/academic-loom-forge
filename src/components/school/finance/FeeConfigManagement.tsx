import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FeeConfigDialog } from './FeeConfigDialog';
import { useFinance, FeeConfig } from '@/hooks/useFinance';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FeeConfigManagementProps {
  schoolId: string;
}

export const FeeConfigManagement = ({ schoolId }: FeeConfigManagementProps) => {
  const { feeConfigs, loading, deleteFeeConfig } = useFinance(schoolId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<FeeConfig | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);

  const handleEdit = (config: FeeConfig) => {
    setEditingConfig(config);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (configToDelete) {
      await deleteFeeConfig(configToDelete);
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      monthly: 'Mensuel',
      yearly: 'Annuel',
      once: 'Ponctuel'
    };
    return labels[frequency] || frequency;
  };

  const getFrequencyColor = (frequency: string) => {
    const colors: Record<string, string> = {
      monthly: 'bg-blue-100 text-blue-800',
      yearly: 'bg-purple-100 text-purple-800',
      once: 'bg-green-100 text-green-800'
    };
    return colors[frequency] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Configuration des Types de Frais</CardTitle>
            <Button onClick={() => {
              setEditingConfig(undefined);
              setDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un type de frais
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : feeConfigs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun type de frais configuré. Commencez par en créer un.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Montant par défaut</TableHead>
                  <TableHead>Fréquence</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeConfigs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell>{Number(config.amount_default).toFixed(2)} MAD</TableCell>
                    <TableCell>
                      <Badge className={getFrequencyColor(config.frequency)}>
                        {getFrequencyLabel(config.frequency)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {config.description || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setConfigToDelete(config.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <FeeConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        schoolId={schoolId}
        editingConfig={editingConfig}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce type de frais ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClassesByYear } from '@/hooks/useClassesByYear';
import { useYearTransition } from '@/hooks/useYearTransition';
import { ArrowRight, ArrowLeft, Link2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ClassMappingStepProps {
  schoolId: string;
  currentYearId: string;
  nextYearId: string;
  preparationId: string;
  onComplete: () => void;
  onBack: () => void;
}

interface Mapping {
  id?: string;
  from_class_id: string;
  to_class_id: string;
}

export const ClassMappingStep = ({
  schoolId,
  currentYearId,
  nextYearId,
  preparationId,
  onComplete,
  onBack
}: ClassMappingStepProps) => {
  const { classes: currentClasses } = useClassesByYear(schoolId, currentYearId);
  const { classes: nextClasses } = useClassesByYear(schoolId, nextYearId);
  const {
    createClassMapping,
    getClassMappings,
    deleteClassMapping,
    loading
  } = useYearTransition(schoolId);

  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [pendingMapping, setPendingMapping] = useState<{
    from_class_id: string;
    to_class_id: string;
  } | null>(null);

  useEffect(() => {
    loadMappings();
  }, [preparationId]);

  const loadMappings = async () => {
    const existingMappings = await getClassMappings(preparationId);
    setMappings(existingMappings);
  };

  const handleAddMapping = async () => {
    if (!pendingMapping?.from_class_id || !pendingMapping?.to_class_id) {
      toast.error('Veuillez sélectionner les deux classes');
      return;
    }

    // Vérifier si un mapping existe déjà pour cette classe source
    const existingMapping = mappings.find(
      m => m.from_class_id === pendingMapping.from_class_id
    );

    if (existingMapping) {
      toast.error('Cette classe a déjà un mapping');
      return;
    }

    try {
      await createClassMapping(
        preparationId,
        pendingMapping.from_class_id,
        pendingMapping.to_class_id
      );
      await loadMappings();
      setPendingMapping(null);
      toast.success('Mapping créé avec succès');
    } catch (error) {
      console.error('Error creating mapping:', error);
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    try {
      await deleteClassMapping(mappingId);
      await loadMappings();
      toast.success('Mapping supprimé');
    } catch (error) {
      console.error('Error deleting mapping:', error);
    }
  };

  const getClassName = (classId: string, isNext: boolean) => {
    const classList = isNext ? nextClasses : currentClasses;
    return classList?.find(c => c.id === classId)?.name || 'Classe inconnue';
  };

  const canProceed = currentClasses && mappings.length === currentClasses.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Définir les transitions de classes</CardTitle>
          <CardDescription>
            Mappez chaque classe actuelle vers une classe de la nouvelle année
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Mappings */}
          {mappings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Mappings définis</h4>
              {mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {getClassName(mapping.from_class_id, false)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-primary">
                      {getClassName(mapping.to_class_id, true)}
                    </span>
                  </div>
                  {mapping.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMapping(mapping.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Mapping */}
          {currentClasses && mappings.length < currentClasses.length && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm">Ajouter un mapping</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Classe actuelle</label>
                  <Select
                    value={pendingMapping?.from_class_id || ''}
                    onValueChange={(value) =>
                      setPendingMapping({
                        ...pendingMapping,
                        from_class_id: value,
                        to_class_id: pendingMapping?.to_class_id || ''
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentClasses
                        ?.filter(c => !mappings.find(m => m.from_class_id === c.id))
                        .map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nouvelle classe</label>
                  <Select
                    value={pendingMapping?.to_class_id || ''}
                    onValueChange={(value) =>
                      setPendingMapping({
                        ...pendingMapping,
                        from_class_id: pendingMapping?.from_class_id || '',
                        to_class_id: value
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {nextClasses?.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleAddMapping}
                disabled={loading || !pendingMapping?.from_class_id || !pendingMapping?.to_class_id}
                className="w-full"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Créer le mapping
              </Button>
            </div>
          )}

          {canProceed && (
            <p className="text-sm text-primary font-medium">
              ✓ Toutes les classes ont été mappées
            </p>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button
          onClick={onComplete}
          disabled={!canProceed || loading}
        >
          Continuer
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

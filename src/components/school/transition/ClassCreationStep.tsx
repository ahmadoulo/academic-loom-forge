import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClassesByYear } from '@/hooks/useClassesByYear';
import { useYearTransition } from '@/hooks/useYearTransition';
import { Plus, Copy, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ClassCreationStepProps {
  schoolId: string;
  currentYearId: string;
  nextYearId: string;
  preparationId: string;
  onComplete: () => void;
  onBack: () => void;
}

export const ClassCreationStep = ({
  schoolId,
  currentYearId,
  nextYearId,
  preparationId,
  onComplete,
  onBack
}: ClassCreationStepProps) => {
  const { classes: currentClasses, loading: loadingCurrentClasses } = useClassesByYear(schoolId, currentYearId);
  const { classes: nextClasses, refetch: refetchNextClasses } = useClassesByYear(schoolId, nextYearId);
  const { createClassForNewYear, duplicateCurrentClasses, loading } = useYearTransition(schoolId);
  
  const [newClassName, setNewClassName] = useState('');

  const handleDuplicateAll = async () => {
    try {
      await duplicateCurrentClasses(currentYearId, nextYearId);
      await refetchNextClasses();
    } catch (error) {
      console.error('Error duplicating classes:', error);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      toast.error('Veuillez entrer un nom de classe');
      return;
    }

    try {
      await createClassForNewYear(newClassName, nextYearId);
      setNewClassName('');
      await refetchNextClasses();
      toast.success('Classe créée avec succès');
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const canProceed = nextClasses && nextClasses.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Current Year Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Classes actuelles</CardTitle>
            <CardDescription>
              Classes de l'année en cours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCurrentClasses ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : currentClasses && currentClasses.length > 0 ? (
              <div className="space-y-2">
                {currentClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <span className="font-medium">{cls.name}</span>
                  </div>
                ))}
                <Button
                  onClick={handleDuplicateAll}
                  disabled={loading || (nextClasses && nextClasses.length > 0)}
                  variant="outline"
                  className="w-full mt-4"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Dupliquer toutes les classes
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune classe trouvée
              </p>
            )}
          </CardContent>
        </Card>

        {/* Next Year Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Nouvelles classes</CardTitle>
            <CardDescription>
              Classes pour la nouvelle année
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nextClasses && nextClasses.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {nextClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-2 bg-primary/10 rounded-md"
                    >
                      <span className="font-medium">{cls.name}</span>
                      <Badge variant="default">Nouvelle</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  Aucune classe créée pour l'instant
                </p>
              )}

              {/* Create new class form */}
              <div className="space-y-2">
                <Label htmlFor="className">Créer une nouvelle classe</Label>
                <div className="flex gap-2">
                  <Input
                    id="className"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Ex: 6ème A, 5ème B..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateClass();
                      }
                    }}
                  />
                  <Button
                    onClick={handleCreateClass}
                    disabled={loading || !newClassName.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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

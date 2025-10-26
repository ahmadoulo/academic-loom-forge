import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClassesByYear } from '@/hooks/useClassesByYear';
import { useYearTransition } from '@/hooks/useYearTransition';
import { Plus, Copy, ArrowRight, ArrowLeft, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  // Récupérer TOUTES les classes de l'école (toutes années confondues)
  const { classes: allClasses, loading: loadingAllClasses } = useClassesByYear(schoolId, undefined, true);
  const { classes: nextClasses, refetch: refetchNextClasses } = useClassesByYear(schoolId, nextYearId);
  const { createClassForNewYear, duplicateCurrentClasses, loading } = useYearTransition(schoolId);
  
  const [newClassName, setNewClassName] = useState('');
  const [duplicatingClassId, setDuplicatingClassId] = useState<string | null>(null);

  const handleDuplicateAll = async () => {
    try {
      await duplicateCurrentClasses(currentYearId, nextYearId);
      await refetchNextClasses();
      toast.success('Toutes les classes ont été dupliquées');
    } catch (error) {
      console.error('Error duplicating classes:', error);
      toast.error('Erreur lors de la duplication');
    }
  };

  const handleDuplicateClass = async (className: string, classId: string) => {
    try {
      setDuplicatingClassId(classId);
      await createClassForNewYear(className, nextYearId);
      await refetchNextClasses();
      toast.success(`Classe "${className}" dupliquée avec succès`);
    } catch (error) {
      console.error('Error duplicating class:', error);
      toast.error('Erreur lors de la duplication');
    } finally {
      setDuplicatingClassId(null);
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

  // Vérifier si une classe existe déjà dans l'année suivante
  const isClassDuplicated = (className: string) => {
    return nextClasses?.some(cls => cls.name === className);
  };

  const canProceed = nextClasses && nextClasses.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* All School Classes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Toutes les classes de l'école</CardTitle>
                <CardDescription>
                  Historique complet - toutes années scolaires
                </CardDescription>
              </div>
              <Button
                onClick={handleDuplicateAll}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <Copy className="mr-2 h-4 w-4" />
                Tout dupliquer (année actuelle)
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAllClasses ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : allClasses && allClasses.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {allClasses.map((cls) => {
                    const isDuplicated = isClassDuplicated(cls.name);
                    return (
                      <div
                        key={cls.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-md gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{cls.name}</span>
                            {cls.school_year?.is_current && (
                              <Badge variant="default" className="text-xs">Actuelle</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{cls.school_year?.name}</span>
                            {cls.student_count !== undefined && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{cls.student_count} élèves</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDuplicateClass(cls.name, cls.id)}
                          disabled={loading || duplicatingClassId === cls.id || isDuplicated}
                          variant="ghost"
                          size="sm"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
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
            <CardTitle className="text-sm">Classes de la nouvelle année</CardTitle>
            <CardDescription>
              {nextClasses && nextClasses.length > 0 
                ? `${nextClasses.length} classe(s) créée(s)`
                : 'Aucune classe créée'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nextClasses && nextClasses.length > 0 ? (
                <ScrollArea className="h-[300px] pr-4 mb-4">
                  <div className="space-y-2">
                    {nextClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="flex items-center justify-between p-3 bg-primary/10 rounded-md"
                      >
                        <span className="font-medium">{cls.name}</span>
                        <Badge variant="default">✓ Créée</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-4 bg-muted/50 rounded-md mb-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Commencez par dupliquer les classes existantes ou créez-en de nouvelles
                  </p>
                </div>
              )}

              {/* Create new class form */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="className">Créer une classe personnalisée</Label>
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

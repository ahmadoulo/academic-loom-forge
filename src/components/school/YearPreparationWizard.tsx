import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAcademicYear } from '@/hooks/useAcademicYear';
import { useYearTransition } from '@/hooks/useYearTransition';
import { useClassesByYear } from '@/hooks/useClassesByYear';
import { Calendar, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ClassCreationStep } from './transition/ClassCreationStep';
import { ClassMappingStep } from './transition/ClassMappingStep';
import { StudentPromotionStep } from './transition/StudentPromotionStep';

interface YearPreparationWizardProps {
  schoolId: string;
}

export const YearPreparationWizard = ({ schoolId }: YearPreparationWizardProps) => {
  const { currentYear, availableYears, refetch: refetchYears } = useAcademicYear();
  const { 
    loading,
    currentPreparation,
    getOrCreatePreparation,
    updatePreparationStatus
  } = useYearTransition(schoolId);
  
  const { classes: currentClasses } = useClassesByYear(schoolId, currentYear?.id);
  const [currentStep, setCurrentStep] = useState(1);
  const [nextYear, setNextYear] = useState<any>(null);

  useEffect(() => {
    // Trouver l'année suivante (is_next ou la prochaine par date)
    if (currentYear && availableYears.length > 0) {
      // D'abord chercher une année marquée is_next
      const nextMarked = availableYears.find(y => y.is_next);
      if (nextMarked) {
        setNextYear(nextMarked);
        return;
      }
      
      // Sinon, trouver l'année suivante par date
      const currentYearDate = new Date(currentYear.start_date);
      const nextYearCandidate = availableYears.find(y => {
        const yDate = new Date(y.start_date);
        return yDate > currentYearDate;
      });
      setNextYear(nextYearCandidate || null);
    }
  }, [currentYear, availableYears]);

  const handleInitialize = async () => {
    if (!currentYear) return;
    
    try {
      // La fonction getOrCreatePreparation va créer automatiquement l'année suivante
      const prep = await getOrCreatePreparation(currentYear.id, nextYear?.id);
      if (prep) {
        // Rafraîchir les années pour voir la nouvelle année créée
        await refetchYears();
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Error initializing preparation:', error);
    }
  };

  const handleClassesCreated = async () => {
    if (!currentPreparation) return;
    
    try {
      await updatePreparationStatus(
        currentPreparation.id,
        'classes_created',
        'classes_created_at'
      );
      setCurrentStep(3);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleMappingCompleted = async () => {
    if (!currentPreparation) return;
    
    try {
      await updatePreparationStatus(
        currentPreparation.id,
        'mapping_done',
        'mapping_completed_at'
      );
      setCurrentStep(4);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handlePromotionCompleted = async () => {
    if (!currentPreparation) return;
    
    try {
      await updatePreparationStatus(
        currentPreparation.id,
        'completed',
        'students_promoted_at'
      );
      // Rafraîchir les années disponibles pour inclure la nouvelle année
      await refetchYears();
      setCurrentStep(5);
    } catch (error) {
      console.error('Error completing promotion:', error);
    }
  };

  const steps = [
    { number: 1, title: 'Initialisation', status: currentStep >= 1 ? 'completed' : 'pending' },
    { number: 2, title: 'Création des classes', status: currentStep >= 2 ? (currentStep === 2 ? 'current' : 'completed') : 'pending' },
    { number: 3, title: 'Mapping des classes', status: currentStep >= 3 ? (currentStep === 3 ? 'current' : 'completed') : 'pending' },
    { number: 4, title: 'Promotion des étudiants', status: currentStep >= 4 ? (currentStep === 4 ? 'current' : 'completed') : 'pending' },
    { number: 5, title: 'Terminé', status: currentStep === 5 ? 'completed' : 'pending' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Préparer une nouvelle année scolaire
          </CardTitle>
          <CardDescription>
            Gérez la transition vers l'année scolaire suivante en 4 étapes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      step.status === 'completed'
                        ? 'bg-primary border-primary text-primary-foreground'
                        : step.status === 'current'
                        ? 'border-primary text-primary'
                        : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className="text-xs mt-2 text-center max-w-[100px]">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-12 mx-2 ${
                      step.status === 'completed' ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Année actuelle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{currentYear?.name}</p>
                    <Badge variant="default" className="mt-2">Actuel</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Année suivante</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {nextYear ? (
                      <>
                        <p className="font-semibold">{nextYear.name}</p>
                        <Badge variant="outline" className="mt-2">
                          {nextYear.is_next ? 'Prête' : 'À préparer'}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          L'année suivante sera créée automatiquement
                        </p>
                        <Badge variant="secondary" className="mt-2">Auto-création</Badge>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleInitialize}
                  disabled={loading || !currentClasses || currentClasses.length === 0}
                >
                  Démarrer la préparation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && currentPreparation && nextYear && (
            <ClassCreationStep
              schoolId={schoolId}
              currentYearId={currentYear?.id || ''}
              nextYearId={nextYear.id}
              preparationId={currentPreparation.id}
              onComplete={handleClassesCreated}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && currentPreparation && nextYear && (
            <ClassMappingStep
              schoolId={schoolId}
              currentYearId={currentYear?.id || ''}
              nextYearId={nextYear.id}
              preparationId={currentPreparation.id}
              onComplete={handleMappingCompleted}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && currentPreparation && nextYear && (
            <StudentPromotionStep
              schoolId={schoolId}
              currentYearId={currentYear?.id || ''}
              nextYearId={nextYear.id}
              preparationId={currentPreparation.id}
              onComplete={handlePromotionCompleted}
              onBack={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 5 && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Préparation terminée !</h3>
              <p className="text-muted-foreground">
                L'année scolaire {nextYear?.name} est maintenant disponible dans votre dashboard.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retour au dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

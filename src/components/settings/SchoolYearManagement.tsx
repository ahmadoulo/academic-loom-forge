import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  AlertTriangle,
  Info,
  History
} from "lucide-react";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SchoolYearManagement() {
  const { currentYear, availableYears, setCurrentYear, loading } = useAcademicYear();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activating, setActivating] = useState(false);
  const { toast } = useToast();

  const nextYear = availableYears.find(y => y.is_next === true);

  const handleActivateNextYear = async () => {
    if (!nextYear) return;
    
    setActivating(true);
    try {
      await setCurrentYear(nextYear.id);
      toast({
        title: "Année scolaire activée",
        description: `${nextYear.name} est maintenant l'année active.`,
      });
      setShowConfirmDialog(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'activer l'année scolaire",
        variant: "destructive",
      });
    } finally {
      setActivating(false);
    }
  };

  const handleRollbackYear = async (yearId: string) => {
    setActivating(true);
    try {
      await setCurrentYear(yearId);
      toast({
        title: "Retour arrière effectué",
        description: "L'année scolaire précédente a été restaurée.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer l'année scolaire.",
        variant: "destructive",
      });
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestion des années scolaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestion des années scolaires
          </CardTitle>
          <CardDescription>
            Gérez le passage d'une année scolaire à l'autre manuellement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Le passage à la nouvelle année scolaire ne se fait pas automatiquement. Chaque établissement peut activer la nouvelle année quand il est prêt, indépendamment des dates calendaires.
            </AlertDescription>
          </Alert>

          {/* Current Year */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Année active actuelle</h3>
            {currentYear ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{currentYear.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(currentYear.start_date).toLocaleDateString('fr-FR')} - {new Date(currentYear.end_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            ) : (
              <div className="p-4 border rounded-lg text-center text-muted-foreground">
                Aucune année active
              </div>
            )}
          </div>

          {/* Next Year */}
          {nextYear && (
            <>
              <div className="flex items-center justify-center py-2">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Année suivante</h3>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{nextYear.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(nextYear.start_date).toLocaleDateString('fr-FR')} - {new Date(nextYear.end_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">En attente</Badge>
                </div>

                <Button 
                  onClick={() => setShowConfirmDialog(true)} 
                  className="w-full mt-4"
                  size="lg"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Activer cette année scolaire
                </Button>
              </div>
            </>
          )}

          {!nextYear && currentYear && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Aucune année suivante n'a été créée. Veuillez créer une nouvelle année scolaire avant de pouvoir effectuer le passage.
              </AlertDescription>
            </Alert>
          )}

          {/* All Years List */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground">Toutes les années</h3>
            <div className="space-y-2">
              {availableYears.map((year) => (
                <div 
                  key={year.id} 
                  className="flex items-center justify-between p-3 border rounded-lg text-sm"
                >
                  <div>
                    <p className="font-medium">{year.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(year.start_date).toLocaleDateString('fr-FR')} - {new Date(year.end_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {year.is_current && <Badge variant="default">Active</Badge>}
                    {year.is_next && <Badge variant="outline">Suivante</Badge>}
                    {!year.is_current && !year.is_next && (
                      <>
                        <Badge variant="secondary">Archivée</Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1 h-7 px-2">
                              <History className="h-3 w-3" />
                              <span className="text-xs">Restaurer</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                Restaurer cette année scolaire ?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="space-y-3 pt-2">
                                <p>
                                  Vous êtes sur le point d'activer <strong>{year.name}</strong> comme année scolaire active.
                                </p>
                                <p className="font-medium text-foreground">
                                  Cette action va :
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  <li>Désactiver l'année courante actuelle</li>
                                  <li>Réactiver l'année <strong>{year.name}</strong></li>
                                  <li>Toutes les nouvelles données seront associées à cette année</li>
                                </ul>
                                <Alert>
                                  <Info className="h-4 w-4" />
                                  <AlertDescription>
                                    Cette opération est <strong>réversible</strong>. Vous pourrez revenir à l'année actuelle si nécessaire.
                                  </AlertDescription>
                                </Alert>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={activating}>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRollbackYear(year.id)}
                                disabled={activating}
                              >
                                {activating ? "Restauration..." : "Confirmer la restauration"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirmer le passage d'année
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                Vous êtes sur le point d'activer <strong>{nextYear?.name}</strong> comme année scolaire active.
              </p>
              <p className="font-medium text-foreground">
                Cette action aura les conséquences suivantes :
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>L'année <strong>{currentYear?.name}</strong> sera archivée</li>
                <li>Toutes les nouvelles notes seront associées à <strong>{nextYear?.name}</strong></li>
                <li>Toutes les nouvelles présences seront prises sur <strong>{nextYear?.name}</strong></li>
                <li>Les professeurs et administrateurs travailleront sur la nouvelle année</li>
                <li>Les données de l'ancienne année resteront accessibles en consultation uniquement</li>
              </ul>
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Assurez-vous d'avoir effectué la préparation de l'année (duplication des classes, promotion des étudiants) avant d'activer la nouvelle année.
                </AlertDescription>
              </Alert>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={activating}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleActivateNextYear}
              disabled={activating}
              className="bg-primary"
            >
              {activating ? "Activation..." : "Confirmer l'activation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

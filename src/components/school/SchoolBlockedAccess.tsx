import { useState } from "react";
import { AlertCircle, Mail, CreditCard, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useSubscriptions, Subscription } from "@/hooks/useSubscriptions";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SchoolBlockedAccessProps {
  type: 'deactivated' | 'no-subscription' | 'expired';
  schoolName: string;
  schoolId?: string;
}

export function SchoolBlockedAccess({ type, schoolName, schoolId }: SchoolBlockedAccessProps) {
  const navigate = useNavigate();
  const { subscriptions } = useSubscriptions();
  const { plans } = useSubscriptionPlans();
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Find current subscription for this school
  const currentSubscription = subscriptions.find(s => s.school_id === schoolId);

  const messages = {
    deactivated: {
      title: 'École Désactivée',
      description: `Votre école ${schoolName} n'est actuellement pas active dans le système.`,
      actions: [
        'Vérifiez le statut de votre abonnement',
        'Contactez le support technique',
        'Effectuez le paiement si nécessaire'
      ]
    },
    'no-subscription': {
      title: 'Aucun Abonnement Actif',
      description: `Votre école ${schoolName} n'a pas d'abonnement actif.`,
      actions: [
        'Vérifiez le statut de votre abonnement',
        'Contactez le support technique',
        'Effectuez le paiement si nécessaire'
      ]
    },
    expired: {
      title: 'Abonnement Expiré',
      description: `L'abonnement de votre école ${schoolName} a expiré.`,
      actions: [
        'Vérifiez le statut de votre abonnement',
        'Contactez le support technique',
        'Effectuez le paiement si nécessaire'
      ]
    }
  };

  const message = messages[type];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_expires');
      toast.success('Déconnexion réussie');
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erreur lors de la déconnexion');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@eduvate.io?subject=Demande de support - ' + encodeURIComponent(schoolName);
  };

  const handleManageSubscription = () => {
    setShowSubscriptionDialog(true);
  };

  const handleRequestPlan = (planName: string) => {
    const subject = `Demande de renouvellement d'abonnement - ${schoolName}`;
    const body = `Bonjour,\n\nJe souhaite renouveler/souscrire à l'abonnement "${planName}" pour l'école ${schoolName}.\n\nMerci de me contacter pour finaliser cette demande.\n\nCordialement`;
    window.location.href = `mailto:support@eduvate.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowSubscriptionDialog(false);
    toast.success('Redirection vers votre client email...');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getPlanLabel = (planType: string) => {
    const labels: Record<string, string> = {
      basic: 'Basique',
      standard: 'Standard',
      premium: 'Premium'
    };
    return labels[planType] || planType;
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full border-border shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-warning" />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-foreground">
                {message.title}
              </h1>

              {/* Description */}
              <p className="text-muted-foreground">
                {message.description}
              </p>

              {/* Actions List */}
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 w-full">
                <h3 className="font-semibold text-warning mb-3 text-left">Que faire ?</h3>
                <ul className="space-y-2 text-left text-sm">
                  {message.actions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-warning mt-0.5">•</span>
                      <span className="text-muted-foreground">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3 w-full">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={handleManageSubscription}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Gérer l'abonnement
                </Button>
                
                <Button 
                  className="w-full bg-success hover:bg-success/90"
                  onClick={handleContactSupport}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contacter le support
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  Se déconnecter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Management Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gestion de l'abonnement</DialogTitle>
            <DialogDescription>
              Consultez votre abonnement actuel et choisissez un plan pour renouveler
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Current Subscription */}
            {currentSubscription && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="font-medium mb-2">Abonnement actuel</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <Badge variant="secondary">{getPlanLabel(currentSubscription.plan_type)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut:</span>
                    <Badge variant="destructive">Expiré</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date d'expiration:</span>
                    <span>{formatDate(currentSubscription.end_date)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Available Plans */}
            <div>
              <h4 className="font-medium mb-3">Choisir un plan pour renouveler</h4>
              <div className="space-y-2">
                {plans.length > 0 ? (
                  plans.filter(p => p.is_active).map(plan => (
                    <div 
                      key={plan.id} 
                      className="p-3 rounded-lg border hover:border-primary/50 cursor-pointer transition-colors"
                      onClick={() => handleRequestPlan(plan.name)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{plan.name}</span>
                          {plan.description && (
                            <p className="text-xs text-muted-foreground">{plan.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-primary">{plan.price} {plan.currency}</span>
                          <p className="text-xs text-muted-foreground">/mois</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div 
                      className="p-3 rounded-lg border hover:border-primary/50 cursor-pointer transition-colors"
                      onClick={() => handleRequestPlan('Basique')}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Plan Basique</span>
                        <Button size="sm" variant="outline">Demander</Button>
                      </div>
                    </div>
                    <div 
                      className="p-3 rounded-lg border hover:border-primary/50 cursor-pointer transition-colors"
                      onClick={() => handleRequestPlan('Standard')}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Plan Standard</span>
                        <Button size="sm" variant="outline">Demander</Button>
                      </div>
                    </div>
                    <div 
                      className="p-3 rounded-lg border hover:border-primary/50 cursor-pointer transition-colors"
                      onClick={() => handleRequestPlan('Premium')}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Plan Premium</span>
                        <Button size="sm" variant="outline">Demander</Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Cliquez sur un plan pour envoyer une demande de renouvellement par email à notre équipe.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

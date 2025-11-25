import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface SchoolBlockedAccessProps {
  type: 'deactivated' | 'no-subscription' | 'expired';
  schoolName: string;
}

export function SchoolBlockedAccess({ type, schoolName }: SchoolBlockedAccessProps) {
  const navigate = useNavigate();

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

  return (
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
                onClick={() => {
                  // In a real app, this would open a support modal or redirect to support page
                  window.location.href = 'mailto:support@example.com';
                }}
              >
                Gérer l'abonnement
              </Button>
              
              <Button 
                className="w-full bg-success hover:bg-success/90"
                onClick={() => {
                  // In a real app, this would open a support modal
                  window.location.href = 'mailto:support@example.com';
                }}
              >
                Contacter le support
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => {
                  localStorage.removeItem('auth_user');
                  navigate('/auth');
                }}
              >
                Se déconnecter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

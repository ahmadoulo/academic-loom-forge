import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSchools } from "@/hooks/useSchools";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Calendar, 
  CreditCard,
  ExternalLink,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SchoolDetailsDialogProps {
  schoolId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SchoolDetailsDialog({ schoolId, open, onOpenChange }: SchoolDetailsDialogProps) {
  const navigate = useNavigate();
  const { getSchoolById } = useSchools();
  const { subscriptions } = useSubscriptions();
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId && open) {
      loadSchoolDetails();
    }
  }, [schoolId, open]);

  const loadSchoolDetails = async () => {
    if (!schoolId) return;
    
    try {
      setLoading(true);
      const data = await getSchoolById(schoolId);
      setSchool(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const schoolSubscription = subscriptions.find(sub => sub.school_id === schoolId);

  const getSubscriptionStatus = () => {
    if (!schoolSubscription) return { label: "Aucun", variant: "secondary" as const };
    
    if (schoolSubscription.is_trial) {
      const isExpired = new Date(schoolSubscription.trial_end_date!) < new Date();
      return {
        label: isExpired ? "Essai expiré" : "Essai gratuit",
        variant: isExpired ? "destructive" as const : "default" as const
      };
    }

    if (schoolSubscription.status === 'active') {
      return { label: "Actif", variant: "default" as const };
    }
    if (schoolSubscription.status === 'expired') {
      return { label: "Expiré", variant: "destructive" as const };
    }
    if (schoolSubscription.status === 'cancelled') {
      return { label: "Annulé", variant: "secondary" as const };
    }
    
    return { label: "En attente", variant: "secondary" as const };
  };

  const handleAccessSchool = () => {
    if (school) {
      navigate(`/school/${school.identifier}`);
      onOpenChange(false);
    }
  };

  if (loading || !school) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const statusData = getSubscriptionStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            Détails de l'école
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* School Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold">{school.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{school.identifier}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {school.city && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{school.city}, {school.country}</span>
                </div>
              )}
              {school.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{school.phone}</span>
                </div>
              )}
              {school.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Visiter le site
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Créée le {format(new Date(school.created_at), "d MMMM yyyy", { locale: fr })}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Subscription Status */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Statut de l'abonnement
            </h4>

            {schoolSubscription ? (
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Statut</span>
                  <Badge variant={statusData.variant}>{statusData.label}</Badge>
                </div>

                {schoolSubscription.is_trial ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Période d'essai</span>
                      </div>
                    </div>
                    {schoolSubscription.trial_end_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Fin d'essai</span>
                        <span className="text-sm font-medium">
                          {format(new Date(schoolSubscription.trial_end_date), "d MMMM yyyy", { locale: fr })}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type de plan</span>
                      <Badge variant="outline">{schoolSubscription.plan_type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Période</span>
                      <span className="text-sm font-medium">
                        {format(new Date(schoolSubscription.start_date), "d MMM yyyy", { locale: fr })} - {format(new Date(schoolSubscription.end_date), "d MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                    {schoolSubscription.amount && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Montant</span>
                        <span className="text-sm font-medium">{schoolSubscription.amount} {schoolSubscription.currency || 'MAD'}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">Aucun abonnement actif</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleAccessSchool}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Accéder à l'interface de l'école
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

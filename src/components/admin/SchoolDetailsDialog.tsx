import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSchools } from "@/hooks/useSchools";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSchoolStats } from "@/hooks/useSchoolStats";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Calendar, 
  CreditCard,
  ExternalLink,
  Clock,
  Power,
  Lock,
  Users,
  GraduationCap,
  BookOpen
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SchoolDetailsDialogProps {
  schoolId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Owner {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

export function SchoolDetailsDialog({ schoolId, open, onOpenChange }: SchoolDetailsDialogProps) {
  const navigate = useNavigate();
  const { getSchoolById, updateSchool } = useSchools();
  const { subscriptions } = useSubscriptions();
  const [school, setSchool] = useState<any>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { stats, loading: statsLoading } = useSchoolStats(schoolId || "");

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

      // Load owner info from app_users if exists
      if (data.owner_id) {
        const { data: ownerData } = await supabase
          .from('app_users')
          .select('id, email, first_name, last_name, is_active')
          .eq('id', data.owner_id)
          .single();
        setOwner(ownerData as Owner | null);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!school || !owner) return;
    
    const newStatus = !owner.is_active;
    
    // Update owner status
    await supabase.from('app_users').update({ is_active: newStatus }).eq('id', owner.id);
    await updateSchool(school.id, { is_active: newStatus } as any);
    await loadSchoolDetails();
    
    toast.success(newStatus ? 'Compte activé' : 'Compte désactivé');
  };

  const handleChangePassword = async () => {
    if (!owner || !newPassword || newPassword.length < 8) {
      toast.error('Veuillez entrer un mot de passe valide (min 8 caractères)');
      return;
    }
    
    try {
      const sessionToken = localStorage.getItem("app_session_token") || localStorage.getItem("sessionToken");
      
      if (!sessionToken) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { sessionToken, userId: owner.id, newPassword }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success('Mot de passe modifié avec succès');
      setNewPassword("");
      setShowPasswordDialog(false);
    } catch {
      toast.error('Erreur lors du changement de mot de passe');
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

          {/* Owner Info */}
          {owner && (
            <>
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Propriétaire de l'école
                </h4>

                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Nom</span>
                    <span className="text-sm font-medium">{owner.first_name} {owner.last_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">{owner.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Statut</span>
                    <Badge variant={owner.is_active ? "default" : "destructive"}>
                      {owner.is_active ? "Actif" : "Désactivé"}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleStatus}
                      className="flex-1"
                    >
                      <Power className="h-4 w-4 mr-2" />
                      {owner.is_active ? "Désactiver" : "Activer"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordDialog(true)}
                      className="flex-1"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Changer mot de passe
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Statistics */}
          {!statsLoading && (
            <>
              <div className="space-y-4">
                <h4 className="font-semibold">Statistiques de l'école</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{stats.studentsCount}</p>
                      <p className="text-xs text-muted-foreground">Étudiants</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <GraduationCap className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{stats.teachersCount}</p>
                      <p className="text-xs text-muted-foreground">Professeurs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{stats.classesCount}</p>
                      <p className="text-xs text-muted-foreground">Classes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{stats.subjectsCount}</p>
                      <p className="text-xs text-muted-foreground">Matières</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

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

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                minLength={8}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleChangePassword} className="flex-1">
                Confirmer
              </Button>
              <Button variant="outline" onClick={() => {
                setShowPasswordDialog(false);
                setNewPassword("");
              }}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

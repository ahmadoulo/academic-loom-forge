import { useState } from "react";
import { useSchools } from "@/hooks/useSchools";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSchoolStats } from "@/hooks/useSchoolStats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Building2,
  CreditCard,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function SubscriptionsSection() {
  const { schools, loading: schoolsLoading } = useSchools();
  const { subscriptions, loading: subsLoading } = useSubscriptions();
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);

  const getSchoolSubscription = (schoolId: string) => {
    return subscriptions.find(sub => sub.school_id === schoolId);
  };

  const getStatusBadge = (subscription: any) => {
    if (!subscription) {
      return <Badge variant="destructive">Aucun abonnement</Badge>;
    }

    if (subscription.is_trial) {
      const trialEnd = new Date(subscription.trial_end_date);
      const daysLeft = Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 0) {
        return <Badge variant="destructive">Essai expiré</Badge>;
      }
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Essai ({daysLeft}j restant{daysLeft > 1 ? 's' : ''})
        </Badge>
      );
    }

    const endDate = new Date(subscription.end_date);
    const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (subscription.status === 'active' && daysLeft > 30) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Actif
        </Badge>
      );
    } else if (subscription.status === 'active' && daysLeft > 0) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Expire bientôt ({daysLeft}j)
        </Badge>
      );
    } else {
      return <Badge variant="destructive">Expiré</Badge>;
    }
  };

  const getExpirationInfo = (subscription: any) => {
    if (!subscription) return null;

    if (subscription.is_trial) {
      return (
        <div className="text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 inline mr-1" />
          Fin d'essai: {format(new Date(subscription.trial_end_date), 'dd MMMM yyyy', { locale: fr })}
        </div>
      );
    }

    return (
      <div className="text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 inline mr-1" />
        Expire le: {format(new Date(subscription.end_date), 'dd MMMM yyyy', { locale: fr })}
      </div>
    );
  };

  if (schoolsLoading || subsLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion des Abonnements</h2>
        <p className="text-muted-foreground">
          Vue d'ensemble des abonnements et statistiques de toutes les écoles
        </p>
      </div>

      <div className="grid gap-6">
        {schools.map((school) => {
          const subscription = getSchoolSubscription(school.id);
          
          return (
            <Card key={school.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {school.name}
                    </CardTitle>
                    <CardDescription>{school.identifier}</CardDescription>
                  </div>
                  {getStatusBadge(subscription)}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Subscription Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Informations d'abonnement
                    </h3>
                    
                    {subscription ? (
                      <div className="space-y-2 text-sm">
                        {!subscription.is_trial && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Plan:</span>
                              <span className="font-medium capitalize">{subscription.plan_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Durée:</span>
                              <span className="font-medium">
                                {subscription.duration === '1_month' && '1 mois'}
                                {subscription.duration === '3_months' && '3 mois'}
                                {subscription.duration === '6_months' && '6 mois'}
                                {subscription.duration === '1_year' && '1 an'}
                                {subscription.duration === '2_years' && '2 ans'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Montant:</span>
                              <span className="font-medium">
                                {subscription.amount} {subscription.currency}
                              </span>
                            </div>
                          </>
                        )}
                        {getExpirationInfo(subscription)}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Renouvellement auto:</span>
                          <span className="font-medium">
                            {subscription.auto_renew ? 'Oui' : 'Non'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucun abonnement actif
                      </p>
                    )}
                  </div>

                  {/* School Stats */}
                  <SchoolStatsDisplay schoolId={school.id} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SchoolStatsDisplay({ schoolId }: { schoolId: string }) {
  const { stats, loading } = useSchoolStats(schoolId);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Chargement des statistiques...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Statistiques</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{stats.studentsCount}</p>
            <p className="text-xs text-muted-foreground">Étudiants</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{stats.teachersCount}</p>
            <p className="text-xs text-muted-foreground">Professeurs</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{stats.classesCount}</p>
            <p className="text-xs text-muted-foreground">Classes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{stats.subjectsCount}</p>
            <p className="text-xs text-muted-foreground">Matières</p>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, CheckCircle2, Clock, DollarSign, Plus, CreditCard, Clock3 } from "lucide-react";
import { useSchools } from "@/hooks/useSchools";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale";

interface AdminSaaSDashboardProps {
  onAddSchool: () => void;
  onCreateSubscription: () => void;
  onManageTrials: () => void;
  onViewSchools: () => void;
  onViewSubscriptions: () => void;
}

export function AdminSaaSDashboard({
  onAddSchool,
  onCreateSubscription,
  onManageTrials,
  onViewSchools,
  onViewSubscriptions
}: AdminSaaSDashboardProps) {
  const { schools } = useSchools();
  const { subscriptions } = useSubscriptions();

  const stats = useMemo(() => {
    const activeSchools = schools.filter(school => 
      subscriptions.some(sub => 
        sub.school_id === school.id && 
        (sub.status === 'active' || sub.status === 'trial')
      )
    );

    const trialSchools = subscriptions.filter(sub => sub.is_trial && sub.status === 'trial');
    const paidSubscriptions = subscriptions.filter(sub => !sub.is_trial && sub.status === 'active');

    return {
      totalSchools: schools.length,
      activeSchools: activeSchools.length,
      trialSchools: trialSchools.length,
      paidSubscriptions: paidSubscriptions.length
    };
  }, [schools, subscriptions]);

  const expiringSubscriptions = useMemo(() => {
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);

    return subscriptions
      .filter(sub => {
        const endDate = new Date(sub.end_date);
        return isAfter(endDate, today) && isBefore(endDate, in30Days) && sub.status === 'active';
      })
      .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
      .slice(0, 5);
  }, [subscriptions]);

  const recentSubscriptions = useMemo(() => {
    return subscriptions
      .filter(sub => !sub.is_trial)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [subscriptions]);

  const getDaysRemaining = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Bienvenue sur Votre Tableau de Bord</h1>
        <p className="text-muted-foreground">Voici un aperçu de votre système de gestion scolaire.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Écoles */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Écoles</p>
                <p className="text-3xl font-bold">{stats.totalSchools}</p>
                <Button variant="link" className="p-0 h-auto text-primary" onClick={onViewSchools}>
                  Voir toutes →
                </Button>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <School className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Écoles Actives */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Écoles Actives</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeSchools}</p>
                <Button variant="link" className="p-0 h-auto text-green-600" onClick={onViewSchools}>
                  Voir actives →
                </Button>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* En Période d'Essai */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">En Période d'Essai</p>
                <p className="text-3xl font-bold text-blue-600">{stats.trialSchools}</p>
                <Button variant="link" className="p-0 h-auto text-blue-600" onClick={onManageTrials}>
                  Voir essais →
                </Button>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Abonnements Payants */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Abonnements Payants</p>
                <p className="text-3xl font-bold text-purple-600">{stats.paidSubscriptions}</p>
                <Button variant="link" className="p-0 h-auto text-purple-600" onClick={onViewSubscriptions}>
                  Voir payants →
                </Button>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abonnements Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Abonnements Expirant Bientôt */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Abonnements Expirant Bientôt</h3>
              <Button variant="link" className="text-sm" onClick={onViewSubscriptions}>
                Voir tous →
              </Button>
            </div>
            
            <div className="space-y-3">
              {expiringSubscriptions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun abonnement n'expire bientôt
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2 pb-2 border-b text-xs font-medium text-muted-foreground">
                    <div>ÉCOLE</div>
                    <div>EXPIRATION</div>
                    <div>JOURS RESTANTS</div>
                    <div>ACTIONS</div>
                  </div>
                  {expiringSubscriptions.map((sub) => {
                    const daysLeft = getDaysRemaining(sub.end_date);
                    return (
                      <div key={sub.id} className="grid grid-cols-4 gap-2 py-2 text-sm items-center">
                        <div className="font-medium">{sub.schools?.name}</div>
                        <div>{format(new Date(sub.end_date), 'dd/MM/yyyy', { locale: fr })}</div>
                        <div>
                          <span className={`inline-flex items-center gap-1 ${
                            daysLeft < 7 ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            <Clock3 className="h-3 w-3" />
                            {daysLeft} jours
                          </span>
                        </div>
                        <div>
                          <Button size="sm" variant="outline" onClick={onCreateSubscription}>
                            Renouveler
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Abonnements Récents */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Abonnements Récents</h3>
              <Button variant="link" className="text-sm" onClick={onViewSubscriptions}>
                Voir tous →
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentSubscriptions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun abonnement récent trouvé
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2 pb-2 border-b text-xs font-medium text-muted-foreground">
                    <div>ÉCOLE</div>
                    <div>PLAN</div>
                    <div>MONTANT</div>
                    <div>DATE</div>
                  </div>
                  {recentSubscriptions.map((sub) => (
                    <div key={sub.id} className="grid grid-cols-4 gap-2 py-2 text-sm items-center">
                      <div className="font-medium">{sub.schools?.name}</div>
                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          sub.plan_type === 'premium' ? 'bg-purple-100 text-purple-700' :
                          sub.plan_type === 'standard' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {sub.plan_type === 'premium' ? '⭐⭐⭐' : 
                           sub.plan_type === 'standard' ? '⭐⭐' : '⭐'}
                        </span>
                      </div>
                      <div className="font-medium">{sub.amount ? `${sub.amount.toLocaleString()} ${sub.currency}` : '-'}</div>
                      <div>{format(new Date(sub.created_at), 'dd/MM/yyyy', { locale: fr })}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Rapides */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Actions Rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="h-auto py-6 bg-blue-600 hover:bg-blue-700"
              onClick={onAddSchool}
            >
              <Plus className="h-5 w-5 mr-2" />
              Ajouter une École
            </Button>
            <Button 
              className="h-auto py-6 bg-green-600 hover:bg-green-700"
              onClick={onCreateSubscription}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Créer un Abonnement
            </Button>
            <Button 
              className="h-auto py-6 bg-purple-600 hover:bg-purple-700"
              onClick={onManageTrials}
            >
              <Clock3 className="h-5 w-5 mr-2" />
              Gérer les Essais
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
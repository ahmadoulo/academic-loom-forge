import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  CreditCard, 
  TrendingUp, 
  Users,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useSchools } from "@/hooks/useSchools";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Badge } from "@/components/ui/badge";

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

  const activeSchools = schools.filter(school => 
    subscriptions.some(sub => 
      sub.school_id === school.id && 
      (sub.status === 'active' || sub.status === 'trial')
    )
  );

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
  const trialSubscriptions = subscriptions.filter(sub => sub.is_trial).length;
  const totalRevenue = subscriptions
    .filter(sub => sub.amount && !sub.is_trial)
    .reduce((sum, sub) => sum + (sub.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Tableau de Bord
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre plateforme SaaS
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onCreateSubscription} variant="outline" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Nouvel Abonnement
          </Button>
          <Button onClick={onAddSchool} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une École
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Écoles</p>
                <p className="text-2xl font-bold text-foreground mt-1">{schools.length}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  {activeSchools.length} actives
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Abonnements Actifs</p>
                <p className="text-2xl font-bold text-foreground mt-1">{activeSubscriptions}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sur {subscriptions.length} total
                </p>
              </div>
              <div className="p-3 rounded-xl bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Périodes d'Essai</p>
                <p className="text-2xl font-bold text-foreground mt-1">{trialSubscriptions}</p>
                <button 
                  onClick={onManageTrials}
                  className="text-xs text-primary hover:text-primary/80 mt-1 flex items-center gap-1"
                >
                  Gérer les essais
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenus Totaux</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {totalRevenue.toLocaleString()} MAD
                </p>
                <p className="text-xs text-muted-foreground mt-1">Ce mois</p>
              </div>
              <div className="p-3 rounded-xl bg-accent/10">
                <CreditCard className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Actions Rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="h-auto py-6 gap-2"
              onClick={onViewSchools}
              variant="outline"
            >
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Voir les Écoles</div>
                <div className="text-xs text-muted-foreground">Gérer toutes les écoles</div>
              </div>
            </Button>
            <Button 
              className="h-auto py-6 gap-2"
              onClick={onViewSubscriptions}
              variant="outline"
            >
              <CreditCard className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Abonnements</div>
                <div className="text-xs text-muted-foreground">Gérer les abonnements</div>
              </div>
            </Button>
            <Button 
              className="h-auto py-6 gap-2"
              onClick={onManageTrials}
              variant="outline"
            >
              <Clock className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Essais Gratuits</div>
                <div className="text-xs text-muted-foreground">Gérer les périodes d'essai</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
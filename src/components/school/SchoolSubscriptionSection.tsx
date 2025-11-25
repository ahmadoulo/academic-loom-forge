import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  Calendar, 
  Users, 
  GraduationCap, 
  AlertCircle,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface SchoolSubscriptionSectionProps {
  schoolId: string;
}

export function SchoolSubscriptionSection({ schoolId }: SchoolSubscriptionSectionProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [stats, setStats] = useState({
    studentsCount: 0,
    teachersCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subscription
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('school_id', schoolId)
          .single();

        if (subData) {
          setSubscription(subData);

          // Fetch plan details
          const { data: planData } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('type', subData.plan_type)
            .single();

          if (planData) {
            setPlan(planData);
          }
        }

        // Fetch school stats
        const { data: currentYear } = await supabase
          .from('school_years')
          .select('id')
          .eq('is_current', true)
          .single();

        if (currentYear) {
          const { count: studentsCount } = await supabase
            .from('student_school')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .eq('school_year_id', currentYear.id)
            .eq('is_active', true);

          const { count: teachersCount } = await supabase
            .from('teachers')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .eq('archived', false);

          setStats({
            studentsCount: studentsCount || 0,
            teachersCount: teachersCount || 0
          });
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolId]);

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  if (!subscription) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Aucun abonnement actif</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Veuillez contacter l'administrateur pour activer un abonnement.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getExpirationDate = () => {
    return subscription.is_trial && subscription.trial_end_date
      ? new Date(subscription.trial_end_date)
      : new Date(subscription.end_date);
  };

  const expirationDate = getExpirationDate();
  const daysRemaining = differenceInDays(expirationDate, new Date());
  const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
  const isExpired = daysRemaining < 0;

  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge variant="destructive">Expiré</Badge>;
    }
    if (isExpiringSoon) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Expire bientôt
      </Badge>;
    }
    if (subscription.is_trial) {
      return <Badge variant="default">Essai gratuit</Badge>;
    }
    return <Badge variant="default" className="flex items-center gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Actif
    </Badge>;
  };

  const calculatePercentage = (used: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Abonnement</h2>
        <p className="text-muted-foreground">
          Détails de votre abonnement et consommation
        </p>
      </div>

      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              {subscription.is_trial ? "Période d'essai" : `Plan ${plan?.name || subscription.plan_type}`}
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Date d'expiration
              </div>
              <p className="font-medium">
                {format(expirationDate, 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Jours restants
              </div>
              <p className={`font-medium ${isExpired ? 'text-destructive' : isExpiringSoon ? 'text-yellow-600' : ''}`}>
                {isExpired ? 'Expiré' : `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {!subscription.is_trial && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Renouvellement automatique: {subscription.auto_renew ? 'Oui' : 'Non'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Consommation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Students Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">Étudiants</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {stats.studentsCount} / {plan?.student_limit || '∞'}
              </span>
            </div>
            {plan?.student_limit && (
              <>
                <Progress 
                  value={calculatePercentage(stats.studentsCount, plan.student_limit)}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {stats.studentsCount} utilisés
                  </span>
                  <span>
                    {plan.student_limit - stats.studentsCount} restants
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Teachers Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="font-medium">Professeurs</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {stats.teachersCount} / {plan?.teacher_limit || '∞'}
              </span>
            </div>
            {plan?.teacher_limit && (
              <>
                <Progress 
                  value={calculatePercentage(stats.teachersCount, plan.teacher_limit)}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {stats.teachersCount} utilisés
                  </span>
                  <span>
                    {plan.teacher_limit - stats.teachersCount} restants
                  </span>
                </div>
              </>
            )}
          </div>

          {(isExpiringSoon || isExpired) && (
            <div className={`p-4 rounded-lg border ${isExpired ? 'border-destructive bg-destructive/10' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'}`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`h-5 w-5 mt-0.5 ${isExpired ? 'text-destructive' : 'text-yellow-600'}`} />
                <div>
                  <p className={`font-medium ${isExpired ? 'text-destructive' : 'text-yellow-600'}`}>
                    {isExpired ? 'Abonnement expiré' : 'Abonnement expire bientôt'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Veuillez contacter l'administrateur pour renouveler votre abonnement.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

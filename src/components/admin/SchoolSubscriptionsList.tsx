import { useState } from "react";
import { useSchools } from "@/hooks/useSchools";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useSchoolStats } from "@/hooks/useSchoolStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EditSubscriptionDialog } from "./EditSubscriptionDialog";
import { 
  Calendar, 
  Users, 
  GraduationCap, 
  Building2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function SchoolSubscriptionsList() {
  const { schools, loading: schoolsLoading } = useSchools();
  const { subscriptions, loading: subsLoading, refetch } = useSubscriptions();
  const { plans } = useSubscriptionPlans();
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const getSchoolSubscription = (schoolId: string) => {
    return subscriptions.find(sub => sub.school_id === schoolId);
  };

  const getStatusBadge = (subscription: any) => {
    if (!subscription) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Aucun abonnement
        </Badge>
      );
    }

    if (subscription.is_trial) {
      const trialEnd = new Date(subscription.trial_end_date);
      const daysLeft = Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 0) {
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Essai expiré
          </Badge>
        );
      }
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Essai - {daysLeft}j restant{daysLeft > 1 ? 's' : ''}
        </Badge>
      );
    }

    const endDate = new Date(subscription.end_date);
    const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (subscription.status === 'active' && daysLeft > 30) {
      return (
        <Badge className="flex items-center gap-1 bg-success text-white">
          <CheckCircle2 className="h-3 w-3" />
          Actif
        </Badge>
      );
    } else if (subscription.status === 'active' && daysLeft > 0) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Expire dans {daysLeft}j
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Expiré
        </Badge>
      );
    }
  };

  if (schoolsLoading || subsLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {schools.map((school) => {
          const subscription = getSchoolSubscription(school.id);
          
          return (
            <Card key={school.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{school.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{school.identifier}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(subscription)}
                    {subscription && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSubscription(subscription);
                          setShowEditDialog(true);
                        }}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Modifier
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Subscription Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      Détails de l'abonnement
                    </h3>
                    
                    {subscription ? (
                      <div className="space-y-3">
                        {!subscription.is_trial && (
                          <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm text-muted-foreground">Plan</span>
                            <Badge variant="outline" className="capitalize font-medium">
                              {subscription.plan_type}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">Expire le</span>
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-3 w-3" />
                            {format(
                              new Date(subscription.is_trial ? subscription.trial_end_date : subscription.end_date), 
                              'dd MMM yyyy', 
                              { locale: fr }
                            )}
                          </div>
                        </div>
                        
                        {!subscription.is_trial && subscription.amount && (
                          <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm text-muted-foreground">Montant</span>
                            <span className="text-sm font-medium">
                              {subscription.amount} {subscription.currency}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucun abonnement actif</p>
                      </div>
                    )}
                  </div>

                  {/* Consumption Stats */}
                  <SchoolConsumptionDisplay 
                    schoolId={school.id} 
                    subscription={subscription}
                    plans={plans}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editingSubscription && (
        <EditSubscriptionDialog
          subscription={editingSubscription}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => {
            refetch();
            setEditingSubscription(null);
          }}
        />
      )}
    </div>
  );
}

function SchoolConsumptionDisplay({ 
  schoolId, 
  subscription,
  plans 
}: { 
  schoolId: string;
  subscription: any;
  plans: any[];
}) {
  const { stats, loading } = useSchoolStats(schoolId);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
        <div className="space-y-3">
          <div className="h-16 bg-muted rounded animate-pulse"></div>
          <div className="h-16 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Get limits from custom limits or plan limits
  const plan = plans.find(p => p.type === subscription?.plan_type);
  const studentLimit = subscription?.custom_student_limit || plan?.student_limit || 0;
  const teacherLimit = subscription?.custom_teacher_limit || plan?.teacher_limit || 0;

  const studentUsage = studentLimit > 0 ? Math.min((stats.studentsCount / studentLimit) * 100, 100) : 0;
  const teacherUsage = teacherLimit > 0 ? Math.min((stats.teachersCount / teacherLimit) * 100, 100) : 0;

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'text-destructive';
    if (usage >= 70) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        Consommation
      </h3>
      
      <div className="space-y-4">
        {/* Students */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Étudiants</span>
            </div>
            <span className={`text-sm font-bold ${getUsageColor(studentUsage)}`}>
              {stats.studentsCount} / {studentLimit || '∞'}
            </span>
          </div>
          {studentLimit > 0 ? (
            <>
              <Progress value={studentUsage} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground text-right">
                {studentUsage.toFixed(0)}% utilisé
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Illimité</p>
          )}
        </div>

        {/* Teachers */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Professeurs</span>
            </div>
            <span className={`text-sm font-bold ${getUsageColor(teacherUsage)}`}>
              {stats.teachersCount} / {teacherLimit || '∞'}
            </span>
          </div>
          {teacherLimit > 0 ? (
            <>
              <Progress value={teacherUsage} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground text-right">
                {teacherUsage.toFixed(0)}% utilisé
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Illimité</p>
          )}
        </div>

        {/* Classes count */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Classes</span>
            </div>
            <span className="text-lg font-bold">{stats.classesCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
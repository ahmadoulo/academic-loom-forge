import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  GraduationCap, 
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionUsageCardProps {
  schoolId: string;
}

export function SubscriptionUsageCard({ schoolId }: SubscriptionUsageCardProps) {
  const [data, setData] = useState<{
    subscription: any;
    plan: any;
    studentsCount: number;
    teachersCount: number;
    studentLimit: number | null;
    teacherLimit: number | null;
  } | null>(null);
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

        if (!subData) {
          setLoading(false);
          return;
        }

        // Fetch plan details
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('type', subData.plan_type)
          .single();

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

          // Use custom limits if available, otherwise use plan limits
          const studentLimit = subData.custom_student_limit || planData?.student_limit || null;
          const teacherLimit = subData.custom_teacher_limit || planData?.teacher_limit || null;

          setData({
            subscription: subData,
            plan: planData,
            studentsCount: studentsCount || 0,
            teachersCount: teachersCount || 0,
            studentLimit,
            teacherLimit
          });
        }
      } catch (error) {
        console.error('Error fetching subscription usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Consommation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const calculatePercentage = (used: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { color: 'text-destructive', icon: AlertTriangle, variant: 'destructive' as const };
    if (percentage >= 75) return { color: 'text-yellow-600', icon: AlertTriangle, variant: 'secondary' as const };
    return { color: 'text-success', icon: CheckCircle, variant: 'default' as const };
  };

  const studentPercentage = calculatePercentage(data.studentsCount, data.studentLimit);
  const teacherPercentage = calculatePercentage(data.teachersCount, data.teacherLimit);
  
  const studentStatus = getUsageStatus(studentPercentage);
  const teacherStatus = getUsageStatus(teacherPercentage);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Consommation d'Abonnement
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        {/* Students Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Étudiants</p>
                <p className="text-xs text-muted-foreground">
                  {data.studentLimit 
                    ? `${data.studentLimit - data.studentsCount} restants` 
                    : 'Illimité'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${studentStatus.color}`}>
                {data.studentsCount}
              </p>
              <p className="text-xs text-muted-foreground">
                / {data.studentLimit || '∞'}
              </p>
            </div>
          </div>
          {data.studentLimit && (
            <div className="space-y-1">
              <Progress 
                value={studentPercentage} 
                className="h-2"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {studentPercentage.toFixed(0)}% utilisé
                </span>
                {studentPercentage >= 75 && (
                  <Badge variant={studentStatus.variant} className="text-xs">
                    <studentStatus.icon className="h-3 w-3 mr-1" />
                    {studentPercentage >= 90 ? 'Limite atteinte' : 'Attention'}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Teachers Usage */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent/10 rounded-lg">
                <GraduationCap className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium">Professeurs</p>
                <p className="text-xs text-muted-foreground">
                  {data.teacherLimit 
                    ? `${data.teacherLimit - data.teachersCount} restants` 
                    : 'Illimité'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${teacherStatus.color}`}>
                {data.teachersCount}
              </p>
              <p className="text-xs text-muted-foreground">
                / {data.teacherLimit || '∞'}
              </p>
            </div>
          </div>
          {data.teacherLimit && (
            <div className="space-y-1">
              <Progress 
                value={teacherPercentage} 
                className="h-2"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {teacherPercentage.toFixed(0)}% utilisé
                </span>
                {teacherPercentage >= 75 && (
                  <Badge variant={teacherStatus.variant} className="text-xs">
                    <teacherStatus.icon className="h-3 w-3 mr-1" />
                    {teacherPercentage >= 90 ? 'Limite atteinte' : 'Attention'}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

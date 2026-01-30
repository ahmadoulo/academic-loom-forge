import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionLimitBadgeProps {
  schoolId: string;
  type: 'student' | 'teacher';
}

export function SubscriptionLimitBadge({ schoolId, type }: SubscriptionLimitBadgeProps) {
  const [data, setData] = useState<{
    current: number;
    limit: number | null;
    remaining: number | null;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subscription - get the most recent one
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('custom_student_limit, custom_teacher_limit, plan_type, status, is_trial, end_date, trial_end_date')
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!subData) return;

        // Check if expired
        const now = new Date();
        const endDate = subData.is_trial || subData.status === 'trial'
          ? new Date(subData.trial_end_date || subData.end_date)
          : new Date(subData.end_date);
        
        if (endDate < now) {
          setData({ current: 0, limit: 0, remaining: 0 });
          return;
        }

        // Fetch plan details
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('student_limit, teacher_limit')
          .eq('type', subData.plan_type)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get the limit (custom or plan) - null means unlimited
        const limit = type === 'student' 
          ? (subData.custom_student_limit ?? planData?.student_limit ?? null)
          : (subData.custom_teacher_limit ?? planData?.teacher_limit ?? null);

        // Fetch current count
        const { data: currentYear } = await supabase
          .from('school_years')
          .select('id')
          .eq('is_current', true)
          .single();

        if (!currentYear) return;

        let current = 0;
        if (type === 'student') {
          const { count } = await supabase
            .from('student_school')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .eq('school_year_id', currentYear.id)
            .eq('is_active', true);
          current = count || 0;
        } else {
          const { count } = await supabase
            .from('teachers')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .eq('archived', false);
          current = count || 0;
        }

        const remaining = limit !== null ? limit - current : null;

        setData({ current, limit, remaining });
      } catch (error) {
        // Silent fail - badge just won't show
      }
    };

    fetchData();
  }, [schoolId, type]);

  if (!data) return null;

  const percentage = data.limit ? (data.current / data.limit) * 100 : 0;
  const isWarning = percentage >= 90;

  return (
    <Badge 
      variant={isWarning ? "destructive" : "secondary"} 
      className="text-sm font-normal"
    >
      {isWarning && <AlertTriangle className="h-3 w-3 mr-1" />}
      {data.current} / {data.limit || '∞'}
      {data.remaining !== null && data.remaining >= 0 && (
        <span className="ml-1 opacity-75">
          ({data.remaining} restant{data.remaining > 1 ? 's' : ''})
        </span>
      )}
    </Badge>
  );
}

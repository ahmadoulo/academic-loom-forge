import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'basic' | 'standard' | 'premium';
  description: string | null;
  features: string[] | null;
  is_active: boolean;
  student_limit: number | null;
  teacher_limit: number | null;
  created_at: string;
  updated_at: string;
}

export const useSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Remove duplicates by keeping only the most recent plan for each type
      const uniquePlans = data?.reduce((acc, plan) => {
        const existing = acc.find(p => p.type === plan.type);
        if (!existing) {
          acc.push(plan);
        }
        return acc;
      }, [] as SubscriptionPlan[]) || [];
      
      setPlans(uniquePlans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des plans');
      toast.error('Erreur lors du chargement des plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans
  };
};
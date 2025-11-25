import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Subscription {
  id: string;
  school_id: string;
  plan_type: 'basic' | 'standard' | 'premium';
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  duration: '1_month' | '3_months' | '6_months' | '1_year' | '2_years';
  start_date: string;
  end_date: string;
  amount: number | null;
  currency: string;
  payment_method: 'cash' | 'bank_transfer' | 'check' | 'card' | 'other' | null;
  transaction_id: string | null;
  notes: string | null;
  is_trial: boolean;
  trial_end_date: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  schools?: {
    name: string;
    identifier: string;
  };
}

export interface CreateSubscriptionData {
  school_id: string;
  plan_type: 'basic' | 'standard' | 'premium';
  duration: '1_month' | '3_months' | '6_months' | '1_year' | '2_years';
  start_date: string;
  amount?: number;
  payment_method?: 'cash' | 'bank_transfer' | 'check' | 'card' | 'other';
  transaction_id?: string;
  notes?: string;
  is_trial?: boolean;
  trial_end_date?: string;
}

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          schools (
            name,
            identifier
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des abonnements');
      toast.error('Erreur lors du chargement des abonnements');
    } finally {
      setLoading(false);
    }
  };

  const calculateEndDate = (startDate: string, duration: string): string => {
    const start = new Date(startDate);
    let end = new Date(start);

    switch (duration) {
      case '1_month':
        end.setMonth(start.getMonth() + 1);
        break;
      case '3_months':
        end.setMonth(start.getMonth() + 3);
        break;
      case '6_months':
        end.setMonth(start.getMonth() + 6);
        break;
      case '1_year':
        end.setFullYear(start.getFullYear() + 1);
        break;
      case '2_years':
        end.setFullYear(start.getFullYear() + 2);
        break;
    }

    return end.toISOString().split('T')[0];
  };

  const createSubscription = async (subscriptionData: CreateSubscriptionData) => {
    try {
      const endDate = calculateEndDate(subscriptionData.start_date, subscriptionData.duration);
      const status = subscriptionData.is_trial ? 'trial' : 'active';

      const { data, error } = await supabase
        .from('subscriptions')
        .insert([{
          ...subscriptionData,
          end_date: endDate,
          status,
          trial_end_date: subscriptionData.is_trial ? endDate : null,
        }])
        .select()
        .single();

      if (error) throw error;

      setSubscriptions(prev => [data, ...prev]);
      toast.success('Abonnement créé avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de l\'abonnement';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const updateSubscription = async (id: string, updates: Partial<CreateSubscriptionData>) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSubscriptions(prev => prev.map(sub =>
        sub.id === id ? { ...sub, ...data } : sub
      ));

      toast.success('Abonnement mis à jour avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'abonnement';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      toast.success('Abonnement supprimé avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'abonnement';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  return {
    subscriptions,
    loading,
    error,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    refetch: fetchSubscriptions
  };
};
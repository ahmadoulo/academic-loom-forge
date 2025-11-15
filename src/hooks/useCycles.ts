import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Cycle {
  id: string;
  school_id: string;
  name: string;
  description?: string;
  level?: string;
  duration_years?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCycleData {
  name: string;
  description?: string;
  level?: string;
  duration_years?: number;
}

export const useCycles = (schoolId?: string) => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCycles = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('cycles')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCycles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des cycles');
      toast.error('Erreur lors du chargement des cycles');
    } finally {
      setLoading(false);
    }
  };

  const createCycle = async (cycleData: CreateCycleData, schoolId: string) => {
    try {
      const { data, error } = await supabase
        .from('cycles')
        .insert([{
          ...cycleData,
          school_id: schoolId,
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Cycle créé avec succès');
      await fetchCycles();
      return data;
    } catch (err) {
      toast.error('Erreur lors de la création du cycle');
      throw err;
    }
  };

  const updateCycle = async (id: string, cycleData: Partial<CreateCycleData>) => {
    try {
      const { error } = await supabase
        .from('cycles')
        .update(cycleData)
        .eq('id', id);

      if (error) throw error;
      toast.success('Cycle mis à jour avec succès');
      await fetchCycles();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du cycle');
      throw err;
    }
  };

  const deleteCycle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cycles')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Cycle supprimé avec succès');
      await fetchCycles();
    } catch (err) {
      toast.error('Erreur lors de la suppression du cycle');
      throw err;
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchCycles();
    }
  }, [schoolId]);

  return {
    cycles,
    loading,
    error,
    refetch: fetchCycles,
    createCycle,
    updateCycle,
    deleteCycle,
  };
};

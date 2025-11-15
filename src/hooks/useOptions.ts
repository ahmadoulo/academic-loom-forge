import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Option {
  id: string;
  cycle_id: string;
  school_id: string;
  name: string;
  description?: string;
  code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateOptionData {
  cycle_id: string;
  name: string;
  description?: string;
  code?: string;
}

export const useOptions = (schoolId?: string, cycleId?: string) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('options')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }
      if (cycleId) {
        query = query.eq('cycle_id', cycleId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOptions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des options');
      toast.error('Erreur lors du chargement des options');
    } finally {
      setLoading(false);
    }
  };

  const createOption = async (optionData: CreateOptionData, schoolId: string) => {
    try {
      const { data, error } = await supabase
        .from('options')
        .insert([{
          ...optionData,
          school_id: schoolId,
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Option créée avec succès');
      await fetchOptions();
      return data;
    } catch (err) {
      toast.error('Erreur lors de la création de l\'option');
      throw err;
    }
  };

  const updateOption = async (id: string, optionData: Partial<CreateOptionData>) => {
    try {
      const { error } = await supabase
        .from('options')
        .update(optionData)
        .eq('id', id);

      if (error) throw error;
      toast.success('Option mise à jour avec succès');
      await fetchOptions();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour de l\'option');
      throw err;
    }
  };

  const deleteOption = async (id: string) => {
    try {
      const { error } = await supabase
        .from('options')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Option supprimée avec succès');
      await fetchOptions();
    } catch (err) {
      toast.error('Erreur lors de la suppression de l\'option');
      throw err;
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchOptions();
    }
  }, [schoolId, cycleId]);

  return {
    options,
    loading,
    error,
    refetch: fetchOptions,
    createOption,
    updateOption,
    deleteOption,
  };
};

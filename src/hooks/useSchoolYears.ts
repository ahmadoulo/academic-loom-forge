import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SchoolYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_next?: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateSchoolYearData {
  name: string;
  start_date: string;
  end_date: string;
}

export const useSchoolYears = () => {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchoolYears = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('school_years' as any)
        .select('*')
        .order('start_date', { ascending: true });

      if (fetchError) throw fetchError;

      setSchoolYears((data as unknown as SchoolYear[]) || []);
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors du chargement des années scolaires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  const createSchoolYear = async (yearData: CreateSchoolYearData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('school_years' as any)
        .insert([yearData])
        .select()
        .single();

      if (insertError) throw insertError;

      setSchoolYears([...schoolYears, data as unknown as SchoolYear]);
      toast.success('Année scolaire créée avec succès');
      return data as unknown as SchoolYear;
    } catch (err: any) {
      toast.error('Erreur lors de la création de l\'année scolaire');
      throw err;
    }
  };

  const setCurrentYear = async (yearId: string) => {
    try {
      const { error: rpcError } = await supabase.rpc('set_current_school_year' as any, {
        year_id: yearId
      });

      if (rpcError) throw rpcError;

      // Refresh the list
      await fetchSchoolYears();
      toast.success('Année courante mise à jour avec succès');
    } catch (err: any) {
      toast.error('Erreur lors du changement d\'année courante');
      throw err;
    }
  };

  return {
    schoolYears,
    loading,
    error,
    createSchoolYear,
    setCurrentYear,
    refetch: fetchSchoolYears,
  };
};

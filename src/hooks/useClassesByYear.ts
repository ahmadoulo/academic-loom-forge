import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Class {
  id: string;
  name: string;
  school_id: string;
  school_year_id: string;
  created_at: string;
  updated_at: string;
}

export const useClassesByYear = (schoolId?: string, yearId?: string) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('classes' as any)
        .select('*');

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      if (yearId) {
        query = query.eq('school_year_id', yearId);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      setClasses((data as unknown as Class[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des classes');
      toast.error('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
    }
  }, [schoolId, yearId]);

  return {
    classes,
    loading,
    error,
    refetch: fetchClasses
  };
};

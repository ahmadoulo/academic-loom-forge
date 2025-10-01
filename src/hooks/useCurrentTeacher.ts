import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CurrentTeacherData {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  school_id: string;
  created_at: string;
  updated_at: string;
}

export const useCurrentTeacher = () => {
  const [teacher, setTeacher] = useState<CurrentTeacherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCurrentTeacher = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setTeacher(data);
    } catch (err) {
      console.error('Erreur lors du chargement des données professeur:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données professeur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentTeacher();
  }, [user?.email]);

  return {
    teacher,
    loading,
    error,
    refetch: fetchCurrentTeacher
  };
};

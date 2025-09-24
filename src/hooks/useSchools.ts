import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface School {
  id: string;
  name: string;
  identifier: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSchoolData {
  name: string;
  identifier: string;
}

export const useSchools = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchools(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des écoles');
      toast.error('Erreur lors du chargement des écoles');
    } finally {
      setLoading(false);
    }
  };

  const createSchool = async (schoolData: CreateSchoolData) => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert([schoolData])
        .select()
        .single();

      if (error) throw error;
      
      setSchools(prev => [data, ...prev]);
      toast.success('École créée avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de l\'école';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const getSchoolById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      toast.error('École non trouvée');
      throw err;
    }
  }, []);

  const getSchoolByIdentifier = useCallback(async (identifier: string) => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('identifier', identifier)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      toast.error('École non trouvée');
      throw err;
    }
  }, []);

  const updateSchool = async (id: string, updates: Partial<CreateSchoolData>) => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSchools(prev => prev.map(school => 
        school.id === id ? { ...school, ...data } : school
      ));
      
      toast.success('École mise à jour avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'école';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const deleteSchool = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSchools(prev => prev.filter(school => school.id !== id));
      toast.success('École supprimée avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'école';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  return {
    schools,
    loading,
    error,
    createSchool,
    updateSchool,
    deleteSchool,
    getSchoolById,
    getSchoolByIdentifier,
    refetch: fetchSchools
  };
};
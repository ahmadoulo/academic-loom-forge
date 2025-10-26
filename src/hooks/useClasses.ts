import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAcademicYear } from './useAcademicYear';

export interface Class {
  id: string;
  name: string;
  school_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClassData {
  name: string;
  school_id: string;
}

export const useClasses = (schoolId?: string) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getYearForCreation } = useAcademicYear();

  const fetchClasses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('classes')
        .select('*');

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des classes');
      toast.error('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  const createClass = async (classData: CreateClassData) => {
    try {
      const currentYearId = getYearForCreation();

      if (!currentYearId) {
        throw new Error('Aucune année scolaire active');
      }

      const { data, error } = await supabase
        .from('classes')
        .insert([{ ...classData, school_year_id: currentYearId }])
        .select()
        .single();

      if (error) throw error;
      
      setClasses(prev => [...prev, data]);
      toast.success('Classe créée avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de la classe';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const deleteClass = async (id: string) => {
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setClasses(prev => prev.filter(cls => cls.id !== id));
      toast.success('Classe supprimée avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression de la classe';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
    }
  }, [schoolId]);

  return {
    classes,
    loading,
    error,
    createClass,
    deleteClass,
    refetch: fetchClasses
  };
};
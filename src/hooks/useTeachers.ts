import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Teacher {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  school_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTeacherData {
  firstname: string;
  lastname: string;
  email?: string;
  school_id: string;
}

export const useTeachers = (schoolId?: string) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('teachers')
        .select('*');

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('lastname', { ascending: true });

      if (error) throw error;
      setTeachers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des professeurs');
      toast.error('Erreur lors du chargement des professeurs');
    } finally {
      setLoading(false);
    }
  };

  const createTeacher = async (teacherData: CreateTeacherData) => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .insert([teacherData])
        .select()
        .single();

      if (error) throw error;
      
      setTeachers(prev => [...prev, data]);
      toast.success('Professeur créé avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création du professeur';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTeachers(prev => prev.filter(teacher => teacher.id !== id));
      toast.success('Professeur supprimé avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression du professeur';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchTeachers();
    }
  }, [schoolId]);

  return {
    teachers,
    loading,
    error,
    createTeacher,
    deleteTeacher,
    refetch: fetchTeachers
  };
};
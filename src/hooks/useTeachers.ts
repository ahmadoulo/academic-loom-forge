import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Teacher {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  school_id: string;
  gender?: string;
  mobile?: string;
  birth_date?: string;
  qualification?: string;
  address?: string;
  salary?: number;
  join_date?: string;
  status?: string;
  assigned_classes_count?: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTeacherData {
  school_id: string;
  firstname: string;
  lastname: string;
  email?: string;
  gender?: string;
  mobile?: string;
  birth_date?: string;
  qualification?: string;
  address?: string;
  salary?: number;
  join_date?: string;
  status?: string;
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
        .select('*')
        .eq('archived', false);

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

  const updateTeacher = async (teacherId: string, updates: Partial<CreateTeacherData>) => {
    try {
      // Clean the updates object - remove undefined values and convert empty strings to null for date fields
      const cleanedUpdates: Record<string, unknown> = {};
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          // For date fields, convert empty strings to null
          if ((key === 'birth_date' || key === 'join_date') && value === '') {
            cleanedUpdates[key] = null;
          } else if (typeof value === 'string' && value.trim() === '') {
            // For other string fields, convert empty strings to null
            cleanedUpdates[key] = null;
          } else {
            cleanedUpdates[key] = value;
          }
        }
      });

      const { data, error } = await supabase
        .from('teachers')
        .update(cleanedUpdates)
        .eq('id', teacherId)
        .select()
        .single();

      if (error) throw error;

      setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, ...data } : t));
      
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('teacher-updated', { detail: data }));
      
      toast.success('Professeur mis à jour avec succès');
      return data;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du professeur:', err);
      toast.error('Erreur lors de la mise à jour du professeur');
      throw err;
    }
  };

  const archiveTeacher = async (id: string) => {
    try {
      const { error } = await supabase
        .from('teachers')
        .update({ 
          archived: true,
          archived_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // Dispatch event for instant update
      window.dispatchEvent(new CustomEvent('teacher-archived', { detail: { teacherId: id } }));
      
      setTeachers(prev => prev.filter(teacher => teacher.id !== id));
      toast.success('Professeur archivé avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'archivage du professeur';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const restoreTeacher = async (id: string) => {
    try {
      const { error } = await supabase
        .from('teachers')
        .update({ 
          archived: false,
          archived_at: null
        })
        .eq('id', id);

      if (error) throw error;
      
      // Dispatch event for instant update
      window.dispatchEvent(new CustomEvent('teacher-restored', { detail: { teacherId: id } }));
      
      toast.success('Professeur restauré avec succès');
      await fetchTeachers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la restauration du professeur';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [schoolId]);

  return {
    teachers,
    loading,
    error,
    createTeacher,
    updateTeacher,
    archiveTeacher,
    restoreTeacher,
    refetch: fetchTeachers
  };
};
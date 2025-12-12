import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Subject {
  id: string;
  name: string;
  class_id: string;
  school_id: string;
  teacher_id?: string;
  coefficient: number;
  coefficient_type: 'coefficient' | 'credit';
  created_at: string;
  updated_at: string;
  archived?: boolean;
  archived_at?: string;
}

export interface SubjectWithDetails extends Subject {
  classes: {
    name: string;
    school_id: string;
  };
  teachers?: {
    firstname: string;
    lastname: string;
  };
}

export interface CreateSubjectData {
  name: string;
  class_id: string;
  school_id: string;
  teacher_id?: string;
  coefficient: number;
  coefficient_type: 'coefficient' | 'credit';
}

export const useSubjects = (schoolId?: string, classId?: string, teacherId?: string) => {
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('subjects')
        .select(`
          *,
          classes (
            name,
            school_id
          ),
          teachers (
            firstname,
            lastname
          )
        `)
        .eq('archived', false);

      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }
      
      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      
      setSubjects((data || []) as SubjectWithDetails[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des matières');
      toast.error('Erreur lors du chargement des matières');
    } finally {
      setLoading(false);
    }
  };

  const createSubject = async (subjectData: CreateSubjectData) => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert([subjectData])
        .select(`
          *,
          classes (
            name,
            school_id
          ),
          teachers (
            firstname,
            lastname
          )
        `)
        .single();

      if (error) throw error;
      
      setSubjects(prev => [...prev, data as SubjectWithDetails]);
      toast.success('Matière créée avec succès');
      return data as SubjectWithDetails;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de la matière';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const updateSubject = async (subjectId: string, updates: Partial<{ name: string; class_id: string | null; teacher_id: string | null; coefficient: number; coefficient_type: 'coefficient' | 'credit' }>) => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('id', subjectId)
        .select(`
          *,
          classes (
            name,
            school_id
          ),
          teachers (
            firstname,
            lastname
          )
        `)
        .single();

      if (error) throw error;
      
      setSubjects(prev => prev.map(subject => 
        subject.id === subjectId ? (data as SubjectWithDetails) : subject
      ));
      toast.success('Matière mise à jour avec succès');
      return data as SubjectWithDetails;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la matière';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const assignTeacher = async (subjectId: string, teacherId: string) => {
    return updateSubject(subjectId, { teacher_id: teacherId });
  };

  const archiveSubject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ archived: true, archived_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      setSubjects(prev => prev.filter(subject => subject.id !== id));
      toast.success('Matière archivée avec succès');
      
      window.dispatchEvent(new CustomEvent('subject-archived', { detail: { id } }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'archivage de la matière';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const restoreSubject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ archived: false, archived_at: null })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Matière restaurée avec succès');
      
      window.dispatchEvent(new CustomEvent('subject-restored', { detail: { id } }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la restauration de la matière';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    if (schoolId || classId || teacherId) {
      fetchSubjects();
    }
  }, [schoolId, classId, teacherId]);

  return {
    subjects,
    loading,
    error,
    createSubject,
    updateSubject,
    assignTeacher,
    archiveSubject,
    restoreSubject,
    refetch: fetchSubjects
  };
};
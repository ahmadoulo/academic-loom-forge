import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Subject {
  id: string;
  name: string;
  class_id: string;
  teacher_id?: string;
  created_at: string;
  updated_at: string;
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
  teacher_id?: string;
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
        `);

      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      
      let filteredData = data || [];
      if (schoolId && !classId) {
        filteredData = filteredData.filter(subject => subject.classes?.school_id === schoolId);
      }
      
      setSubjects(filteredData);
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
      
      setSubjects(prev => [...prev, data]);
      toast.success('Matière créée avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de la matière';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const assignTeacher = async (subjectId: string, teacherId: string) => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .update({ teacher_id: teacherId })
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
        subject.id === subjectId ? data : subject
      ));
      toast.success('Professeur assigné avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'assignation du professeur';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSubjects(prev => prev.filter(subject => subject.id !== id));
      toast.success('Matière supprimée avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression de la matière';
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
    assignTeacher,
    deleteSubject,
    refetch: fetchSubjects
  };
};
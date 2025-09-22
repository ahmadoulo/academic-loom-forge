import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  teacher_id: string;
  grade: number;
  grade_type: string;
  comment?: string;
  exam_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GradeWithDetails extends Grade {
  students: {
    firstname: string;
    lastname: string;
  };
  subjects: {
    name: string;
  };
  teachers: {
    firstname: string;
    lastname: string;
  };
}

export interface CreateGradeData {
  student_id: string;
  subject_id: string;
  teacher_id: string;
  grade: number;
  grade_type: string;
  comment?: string;
  exam_date?: string;
}

export const useGrades = (subjectId?: string, studentId?: string, teacherId?: string) => {
  const [grades, setGrades] = useState<GradeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('grades')
        .select(`
          *,
          students (
            firstname,
            lastname
          ),
          subjects (
            name
          ),
          teachers (
            firstname,
            lastname
          )
        `);

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }
      
      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setGrades(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des notes');
      toast.error('Erreur lors du chargement des notes');
    } finally {
      setLoading(false);
    }
  };

  const createGrade = async (gradeData: CreateGradeData) => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .insert([gradeData])
        .select(`
          *,
          students (
            firstname,
            lastname
          ),
          subjects (
            name
          ),
          teachers (
            firstname,
            lastname
          )
        `)
        .single();

      if (error) throw error;
      
      setGrades(prev => [data, ...prev]);
      toast.success('Note ajoutée avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la note';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const updateGrade = async (id: string, gradeData: Partial<CreateGradeData>) => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .update(gradeData)
        .eq('id', id)
        .select(`
          *,
          students (
            firstname,
            lastname
          ),
          subjects (
            name
          ),
          teachers (
            firstname,
            lastname
          )
        `)
        .single();

      if (error) throw error;
      
      setGrades(prev => prev.map(grade => 
        grade.id === id ? data : grade
      ));
      toast.success('Note modifiée avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la modification de la note';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const deleteGrade = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setGrades(prev => prev.filter(grade => grade.id !== id));
      toast.success('Note supprimée avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression de la note';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    if (subjectId || studentId || teacherId) {
      fetchGrades();
    }
  }, [subjectId, studentId, teacherId]);

  return {
    grades,
    loading,
    error,
    createGrade,
    updateGrade,
    deleteGrade,
    refetch: fetchGrades
  };
};
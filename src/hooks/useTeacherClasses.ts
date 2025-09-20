import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TeacherClass {
  id: string;
  teacher_id: string;
  class_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherClassWithDetails extends TeacherClass {
  classes: {
    id: string;
    name: string;
    school_id: string;
  };
  teachers: {
    id: string;
    firstname: string;
    lastname: string;
  };
}

export interface CreateTeacherClassData {
  teacher_id: string;
  class_id: string;
}

export const useTeacherClasses = (teacherId?: string, classId?: string) => {
  const [teacherClasses, setTeacherClasses] = useState<TeacherClassWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('teacher_classes')
        .select(`
          *,
          classes!fk_teacher_classes_class_id (
            id,
            name,
            school_id
          ),
          teachers!fk_teacher_classes_teacher_id (
            id,
            firstname,
            lastname
          )
        `);

      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }
      
      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setTeacherClasses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des assignations');
      toast.error('Erreur lors du chargement des assignations');
    } finally {
      setLoading(false);
    }
  };

  const assignTeacherToClass = async (data: CreateTeacherClassData) => {
    try {
      const { data: newAssignment, error } = await supabase
        .from('teacher_classes')
        .insert([data])
        .select(`
          *,
          classes!fk_teacher_classes_class_id (
            id,
            name,
            school_id
          ),
          teachers!fk_teacher_classes_teacher_id (
            id,
            firstname,
            lastname
          )
        `)
        .single();

      if (error) throw error;
      
      setTeacherClasses(prev => [newAssignment, ...prev]);
      toast.success('Professeur assigné à la classe avec succès');
      return newAssignment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'assignation';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const removeTeacherFromClass = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('teacher_classes')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      
      setTeacherClasses(prev => prev.filter(tc => tc.id !== assignmentId));
      toast.success('Assignation supprimée avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchTeacherClasses();
  }, [teacherId, classId]);

  return {
    teacherClasses,
    loading,
    error,
    assignTeacherToClass,
    removeTeacherFromClass,
    refetch: fetchTeacherClasses
  };
};
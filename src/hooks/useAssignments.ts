import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Assignment {
  id: string;
  school_id: string;
  teacher_id: string;
  class_id: string;
  subject_id?: string;
  title: string;
  description?: string;
  type: 'exam' | 'test' | 'homework' | 'course' | 'assignment';
  due_date?: string;
  session_date?: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentWithDetails extends Assignment {
  teachers?: {
    firstname: string;
    lastname: string;
  };
  classes?: {
    name: string;
  };
  subjects?: {
    id: string;
    name: string;
  };
}

export interface CreateAssignmentData {
  school_id: string;
  teacher_id: string;
  class_id: string;
  subject_id?: string;
  title: string;
  description?: string;
  type: 'exam' | 'test' | 'homework' | 'course' | 'assignment';
  due_date?: string;
  session_date?: string;
  start_time?: string;
  end_time?: string;
}

interface UseAssignmentsOptions {
  classId?: string;
  studentId?: string;
  teacherId?: string;
  schoolId?: string;
}

export const useAssignments = (options?: UseAssignmentsOptions | string) => {
  // Support both old signature (classId as string) and new signature (options object)
  const opts = typeof options === 'string' ? { classId: options } : options || {};
  const { classId, studentId, teacherId, schoolId } = opts;

  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('assignments')
        .select(`
          *,
          teachers (
            firstname,
            lastname
          ),
          classes (
            name
          ),
          subjects (
            id,
            name
          )
        `);

      if (classId) {
        query = query.eq('class_id', classId);
      }

      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Type assertion to ensure proper typing
      const typedData = (data || []).map(assignment => ({
        ...assignment,
        type: assignment.type as 'exam' | 'test' | 'homework' | 'course' | 'assignment',
        // Normalize subjects to be a single object or null
        subjects: Array.isArray(assignment.subjects) && assignment.subjects.length > 0 
          ? assignment.subjects[0] 
          : (assignment.subjects || null)
      })) as AssignmentWithDetails[];

      setAssignments(typedData);
    } catch (err) {
      console.error('Erreur lors du chargement des devoirs:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des devoirs');
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (assignmentData: CreateAssignmentData) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert([assignmentData])
        .select()
        .single();

      if (error) throw error;

      await fetchAssignments();
      return { data, error: null };
    } catch (err) {
      console.error('Erreur lors de la création du devoir:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la création du devoir' 
      };
    }
  };

  const updateAssignment = async (id: string, assignmentData: Partial<CreateAssignmentData>) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update(assignmentData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchAssignments();
      return { data, error: null };
    } catch (err) {
      console.error('Erreur lors de la mise à jour du devoir:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du devoir' 
      };
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAssignments();
      return { error: null };
    } catch (err) {
      console.error('Erreur lors de la suppression du devoir:', err);
      return { 
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression du devoir' 
      };
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [classId, studentId, teacherId]);

  return {
    assignments,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    refetch: fetchAssignments,
  };
};
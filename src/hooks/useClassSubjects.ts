import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  created_at: string;
}

interface ClassSubjectWithDetails extends ClassSubject {
  subjects: {
    id: string;
    name: string;
    teacher_id: string | null;
    teachers?: {
      firstname: string;
      lastname: string;
    } | null;
  };
  classes: {
    name: string;
  };
}

interface CreateClassSubjectData {
  class_id: string;
  subject_id: string;
}

export const useClassSubjects = (classId?: string, subjectId?: string) => {
  const [classSubjects, setClassSubjects] = useState<ClassSubjectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClassSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('class_subjects')
        .select(`
          *,
          subjects (
            id,
            name,
            teacher_id,
            teachers (
              firstname,
              lastname
            )
          ),
          classes (
            name
          )
        `);

      if (classId) {
        query = query.eq('class_id', classId);
      }

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching class subjects:', error);
        setError(error.message);
        toast.error('Erreur lors du chargement des matières de classe');
        return;
      }

      setClassSubjects(data || []);
    } catch (err) {
      console.error('Error in fetchClassSubjects:', err);
      setError('Une erreur inattendue s\'est produite');
      toast.error('Erreur lors du chargement des matières de classe');
    } finally {
      setLoading(false);
    }
  };

  const createClassSubject = async (classSubjectData: CreateClassSubjectData) => {
    try {
      const { data, error } = await supabase
        .from('class_subjects')
        .insert(classSubjectData)
        .select(`
          *,
          subjects (
            id,
            name,
            teacher_id,
            teachers (
              firstname,
              lastname
            )
          ),
          classes (
            name  
          )
        `)
        .single();

      if (error) {
        console.error('Error creating class subject:', error);
        toast.error('Erreur lors de l\'assignation de la matière à la classe');
        throw error;
      }

      setClassSubjects(prev => [...prev, data]);
      toast.success('Matière assignée à la classe avec succès');
      return data;
    } catch (err) {
      console.error('Error in createClassSubject:', err);
      throw err;
    }
  };

  const deleteClassSubject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('class_subjects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting class subject:', error);
        toast.error('Erreur lors de la suppression de l\'assignation');
        throw error;
      }

      setClassSubjects(prev => prev.filter(cs => cs.id !== id));
      toast.success('Assignation supprimée avec succès');
    } catch (err) {
      console.error('Error in deleteClassSubject:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchClassSubjects();
  }, [classId, subjectId]);

  return {
    classSubjects,
    loading,
    error,
    createClassSubject,
    deleteClassSubject,
    refetch: fetchClassSubjects
  };
};
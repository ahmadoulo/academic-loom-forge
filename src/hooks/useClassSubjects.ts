import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  created_at: string;
  subjects: {
    id: string;
    name: string;
    school_id: string;
    teacher_id?: string;
  };
}

export const useClassSubjects = (classId?: string) => {
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClassSubjects = async () => {
    if (!classId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('DEBUG: Chargement des matières pour la classe:', classId);
      
      const { data, error } = await supabase
        .from('class_subjects')
        .select(`
          *,
          subjects (
            id,
            name,
            school_id,
            teacher_id
          )
        `)
        .eq('class_id', classId);

      console.log('DEBUG: Réponse class_subjects:', { data, error });

      if (error) throw error;
      setClassSubjects(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des matières';
      setError(message);
      console.error('Erreur chargement matières:', err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassSubjects();
  }, [classId]);

  return {
    classSubjects,
    loading,
    error,
    refetch: fetchClassSubjects
  };
};
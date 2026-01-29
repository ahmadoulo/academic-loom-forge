import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

      if (error) throw error;
      setClassSubjects(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des matières';
      setError(message);
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      });
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

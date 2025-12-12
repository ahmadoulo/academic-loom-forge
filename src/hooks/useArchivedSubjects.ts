import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SubjectWithDetails } from './useSubjects';

export const useArchivedSubjects = (schoolId?: string) => {
  const [archivedSubjects, setArchivedSubjects] = useState<SubjectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArchivedSubjects = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
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
        .eq('school_id', schoolId)
        .eq('archived', true)
        .order('archived_at', { ascending: false });

      if (error) throw error;
      setArchivedSubjects((data || []) as SubjectWithDetails[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des matières archivées';
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
    fetchArchivedSubjects();

    const handleArchived = () => fetchArchivedSubjects();
    const handleRestored = () => fetchArchivedSubjects();

    window.addEventListener('subject-archived', handleArchived);
    window.addEventListener('subject-restored', handleRestored);

    return () => {
      window.removeEventListener('subject-archived', handleArchived);
      window.removeEventListener('subject-restored', handleRestored);
    };
  }, [schoolId]);

  return {
    archivedSubjects,
    loading,
    error,
    refetch: fetchArchivedSubjects
  };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ArchivedClass {
  id: string;
  name: string;
  school_id: string;
  school_year_id: string;
  archived_at: string;
}

export const useArchivedClasses = (schoolId?: string) => {
  const [archivedClasses, setArchivedClasses] = useState<ArchivedClass[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchivedClasses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('classes')
        .select('*')
        .eq('archived', true);

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('archived_at', { ascending: false });

      if (error) throw error;
      setArchivedClasses(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des classes archivées:', err);
      toast.error('Erreur lors du chargement des classes archivées');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedClasses();

    // Listen for archive/restore events
    const handleArchived = () => fetchArchivedClasses();
    const handleRestored = () => fetchArchivedClasses();

    window.addEventListener('class-archived', handleArchived);
    window.addEventListener('class-restored', handleRestored);

    return () => {
      window.removeEventListener('class-archived', handleArchived);
      window.removeEventListener('class-restored', handleRestored);
    };
  }, [schoolId]);

  return {
    archivedClasses,
    loading,
    refetch: fetchArchivedClasses
  };
};

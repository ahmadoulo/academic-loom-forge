import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ArchivedTeacher {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  school_id: string;
  archived_at: string;
}

export const useArchivedTeachers = (schoolId?: string) => {
  const [archivedTeachers, setArchivedTeachers] = useState<ArchivedTeacher[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchivedTeachers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('teachers')
        .select('*')
        .eq('archived', true);

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('archived_at', { ascending: false });

      if (error) throw error;
      setArchivedTeachers(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des professeurs archivés:', err);
      toast.error('Erreur lors du chargement des professeurs archivés');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedTeachers();

    // Listen for archive/restore events
    const handleArchived = () => fetchArchivedTeachers();
    const handleRestored = () => fetchArchivedTeachers();

    window.addEventListener('teacher-archived', handleArchived);
    window.addEventListener('teacher-restored', handleRestored);

    return () => {
      window.removeEventListener('teacher-archived', handleArchived);
      window.removeEventListener('teacher-restored', handleRestored);
    };
  }, [schoolId]);

  return {
    archivedTeachers,
    loading,
    refetch: fetchArchivedTeachers
  };
};

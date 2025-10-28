import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ArchivedStudent {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  cin_number: string;
  birth_date?: string;
  student_phone?: string;
  parent_phone?: string;
  archived_at?: string;
  last_class_name?: string;
  last_school_year?: string;
}

export const useArchivedStudents = (schoolId?: string) => {
  const [students, setStudents] = useState<ArchivedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArchivedStudents = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Récupérer les étudiants archivés avec leur dernière inscription
      const { data, error: fetchError } = await supabase
        .from('student_school' as any)
        .select(`
          student_id,
          class_id,
          school_year_id,
          students:student_id (
            id,
            firstname,
            lastname,
            email,
            cin_number,
            birth_date,
            student_phone,
            parent_phone,
            archived,
            archived_at
          ),
          classes:class_id (
            name,
            school_years:school_year_id (
              name
            )
          )
        `)
        .eq('school_id', schoolId)
        .order('enrolled_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Filtrer et transformer les données pour ne garder que les étudiants archivés
      const archivedMap = new Map<string, ArchivedStudent>();
      
      (data || []).forEach((item: any) => {
        if (item.students?.archived && !archivedMap.has(item.students.id)) {
          archivedMap.set(item.students.id, {
            id: item.students.id,
            firstname: item.students.firstname,
            lastname: item.students.lastname,
            email: item.students.email,
            cin_number: item.students.cin_number,
            birth_date: item.students.birth_date,
            student_phone: item.students.student_phone,
            parent_phone: item.students.parent_phone,
            archived_at: item.students.archived_at,
            last_class_name: item.classes?.name,
            last_school_year: item.classes?.school_years?.name
          });
        }
      });

      setStudents(Array.from(archivedMap.values()));
    } catch (err) {
      console.error('Erreur lors du chargement des étudiants archivés:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      toast.error('Erreur lors du chargement des étudiants archivés');
    } finally {
      setLoading(false);
    }
  };

  const restoreStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ 
          archived: false, 
          archived_at: null 
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Étudiant restauré avec succès');
      await fetchArchivedStudents();
    } catch (error: any) {
      console.error('Erreur lors de la restauration:', error);
      toast.error('Erreur lors de la restauration de l\'étudiant');
    }
  };

  useEffect(() => {
    fetchArchivedStudents();
  }, [schoolId]);

  return {
    students,
    loading,
    error,
    restoreStudent,
    refetch: fetchArchivedStudents
  };
};

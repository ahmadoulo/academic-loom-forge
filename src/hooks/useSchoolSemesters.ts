import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SchoolSemester {
  id: string;
  school_id: string;
  school_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_actual: boolean;
  is_next: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateSemesterData {
  school_id: string;
  school_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export const useSchoolSemesters = (schoolId?: string, yearId?: string) => {
  const [semesters, setSemesters] = useState<SchoolSemester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSemesters = async (includeArchived = false) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('school_semester' as any)
        .select('*')
        .order('start_date', { ascending: true });

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      if (yearId) {
        query = query.eq('school_year_id', yearId);
      }

      // Exclure les semestres archivés par défaut
      if (!includeArchived) {
        query = query.eq('archived', false);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setSemesters((data as unknown as SchoolSemester[]) || []);
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors du chargement des semestres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, [schoolId, yearId]);

  const createSemester = async (semesterData: CreateSemesterData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('school_semester' as any)
        .insert([semesterData])
        .select()
        .single();

      if (insertError) throw insertError;

      setSemesters([...semesters, data as unknown as SchoolSemester]);
      toast.success('Semestre créé avec succès');
      return data as unknown as SchoolSemester;
    } catch (err: any) {
      toast.error('Erreur lors de la création du semestre');
      throw err;
    }
  };

  const updateSemester = async (semesterId: string, updates: Partial<SchoolSemester>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('school_semester' as any)
        .update(updates)
        .eq('id', semesterId)
        .select()
        .single();

      if (updateError) throw updateError;

      setSemesters(semesters.map(s => s.id === semesterId ? data as unknown as SchoolSemester : s));
      toast.success('Semestre mis à jour avec succès');
      return data as unknown as SchoolSemester;
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour du semestre');
      throw err;
    }
  };

  const setCurrentSemester = async (semesterId: string) => {
    try {
      const { error: rpcError } = await supabase.rpc('set_current_semester' as any, {
        semester_id: semesterId
      });

      if (rpcError) throw rpcError;

      await fetchSemesters();
      toast.success('Semestre actuel mis à jour avec succès');
    } catch (err: any) {
      toast.error('Erreur lors du changement de semestre actuel');
      throw err;
    }
  };

  const archiveSemester = async (semesterId: string) => {
    try {
      // Vérifier s'il y a des notes attachées à ce semestre
      const { count, error: countError } = await supabase
        .from('grades')
        .select('*', { count: 'exact', head: true })
        .eq('school_semester_id', semesterId);

      if (countError) throw countError;

      if (count && count > 0) {
        toast.info(`${count} note(s) attachée(s) à ce semestre seront conservées`);
      }

      const { error: updateError } = await supabase
        .from('school_semester' as any)
        .update({ archived: true })
        .eq('id', semesterId);

      if (updateError) throw updateError;

      setSemesters(semesters.filter(s => s.id !== semesterId));
      toast.success('Semestre archivé avec succès');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'archivage du semestre');
      throw err;
    }
  };

  return {
    semesters,
    loading,
    error,
    createSemester,
    updateSemester,
    setCurrentSemester,
    archiveSemester,
    refetch: fetchSemesters,
  };
};

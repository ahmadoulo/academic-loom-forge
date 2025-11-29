import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAcademicYear } from './useAcademicYear';
import { useOptionalSemester } from './useSemester';

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  teacher_id: string;
  grade: number;
  grade_type: string;
  comment?: string;
  exam_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GradeWithDetails extends Grade {
  students: {
    firstname: string;
    lastname: string;
  };
  subjects: {
    name: string;
  };
  teachers: {
    firstname: string;
    lastname: string;
  };
  bonus_given_by_credential?: {
    first_name: string;
    last_name: string;
  } | null;
}

export interface CreateGradeData {
  student_id: string;
  subject_id: string;
  teacher_id: string;
  grade: number;
  grade_type: string;
  comment?: string;
  exam_date?: string;
}

export const useGrades = (subjectId?: string, studentId?: string, teacherId?: string, yearId?: string, semesterId?: string) => {
  const [grades, setGrades] = useState<GradeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getYearForCreation, getYearForDisplay } = useAcademicYear();
  const semesterContext = useOptionalSemester();
  const currentSemester = semesterContext?.currentSemester || null;
  
  // Obtenir l'année d'affichage une fois pour la dépendance du useEffect
  const displayYearId = getYearForDisplay();

  const fetchGrades = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('grades')
        .select(`
          *,
          students (
            firstname,
            lastname
          ),
          subjects (
            name
          ),
          teachers (
            firstname,
            lastname
          ),
          bonus_given_by_credential:user_credentials!grades_bonus_given_by_fkey (
            first_name,
            last_name
          )
        `);

      // Filtrer par année scolaire (utiliser l'année passée en paramètre ou l'année sélectionnée)
      // IMPORTANT: Ne jamais afficher 'all' pour éviter les duplicatas
      const filterYearId = yearId || displayYearId;
      if (filterYearId && filterYearId !== 'all') {
        query = query.eq('school_year_id', filterYearId);
      }

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }
      
      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      // Filtrer par semestre SEULEMENT si un semestre spécifique est demandé
      // Ne PAS filtrer si semesterId est 'all', vide ou undefined
      if (semesterId && semesterId !== 'all' && semesterId !== '') {
        query = query.eq('school_semester_id', semesterId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setGrades(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des notes');
      toast.error('Erreur lors du chargement des notes');
    } finally {
      setLoading(false);
    }
  };

  const createGrade = async (gradeData: CreateGradeData) => {
    try {
      const currentYearId = getYearForCreation();
      console.log('[useGrades] Creating grade - currentYearId:', currentYearId, 'currentSemester:', currentSemester);

      if (!currentYearId) {
        throw new Error('Aucune année scolaire active');
      }

      if (!currentSemester) {
        console.error('[useGrades] No current semester available');
        throw new Error('Aucun semestre actif');
      }

      const { data, error } = await supabase
        .from('grades')
        .insert([{ 
          ...gradeData, 
          school_year_id: currentYearId,
          school_semester_id: currentSemester.id 
        }])
        .select(`
          *,
          students (
            firstname,
            lastname
          ),
          subjects (
            name
          ),
          teachers (
            firstname,
            lastname
          )
        `)
        .single();

      if (error) throw error;
      
      setGrades(prev => [data, ...prev]);
      toast.success('Note ajoutée avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la note';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const updateGrade = async (id: string, gradeData: Partial<CreateGradeData>) => {
    try {
      // Mark as modified when updating
      const updateData = {
        ...gradeData,
        is_modified: true
      };
      
      const { data, error } = await supabase
        .from('grades')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          students (
            firstname,
            lastname
          ),
          subjects (
            name
          ),
          teachers (
            firstname,
            lastname
          )
        `)
        .single();

      if (error) throw error;
      
      setGrades(prev => prev.map(grade => 
        grade.id === id ? data : grade
      ));
      toast.success('Note modifiée avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la modification de la note';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const deleteGrade = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setGrades(prev => prev.filter(grade => grade.id !== id));
      toast.success('Note supprimée avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression de la note';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const addBonus = async (gradeId: string, bonus: number, bonusReason: string) => {
    try {
      // Pour le moment, on ne force pas l'authentification :
      // on enregistre seulement les informations de bonus.
      const bonusUpdate = {
        bonus,
        bonus_reason: bonusReason,
        bonus_given_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('grades')
        .update(bonusUpdate)
        .eq('id', gradeId)
        .select(`
          *,
          students (
            firstname,
            lastname
          ),
          subjects (
            name
          ),
          teachers (
            firstname,
            lastname
          ),
          bonus_given_by_credential:user_credentials!grades_bonus_given_by_fkey (
            first_name,
            last_name
          )
        `)
        .single();

      if (error) throw error;
      
      setGrades(prev => prev.map(grade => 
        grade.id === gradeId ? data : grade
      ));
      toast.success('Bonus ajouté avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'ajout du bonus';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [subjectId, studentId, teacherId, yearId, displayYearId, semesterId]);

  return {
    grades,
    loading,
    error,
    createGrade,
    updateGrade,
    deleteGrade,
    addBonus,
    refetch: fetchGrades
  };
};
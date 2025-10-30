import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Class {
  id: string;
  name: string;
  school_id: string;
  school_year_id: string;
  created_at: string;
  updated_at: string;
}

export interface ClassWithYear extends Class {
  school_year?: {
    id: string;
    name: string;
    is_current: boolean;
  };
  student_count?: number;
}

export const useClassesByYear = (schoolId?: string, yearId?: string, includeAllYears = false) => {
  const [classes, setClasses] = useState<ClassWithYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('classes' as any)
        .select(`
          *,
          school_year:school_years(id, name, is_current)
        `);

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      // IMPORTANT: Toujours filtrer par année scolaire si fournie
      // Ne jamais afficher toutes les années à la fois (sauf si explicitement demandé)
      if (yearId && yearId !== 'all' && !includeAllYears) {
        query = query.eq('school_year_id', yearId);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      
      // Pour chaque classe, compter tous les étudiants inscrits dans cette année
      // (sans filtrer par is_active car après migration, les anciens étudiants ont is_active=false)
      const classesWithCount = await Promise.all((data || []).map(async (cls: any) => {
        const { count, error: countError } = await supabase
          .from('student_school')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id)
          .eq('school_year_id', cls.school_year_id);

        if (countError) {
          console.error('Error counting students for class:', cls.id, countError);
        }

        return {
          ...cls,
          school_year: cls.school_year,
          student_count: count || 0
        };
      }));
      
      setClasses(classesWithCount as ClassWithYear[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des classes');
      toast.error('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
    }
  }, [schoolId, yearId, includeAllYears]);

  return {
    classes,
    loading,
    error,
    refetch: fetchClasses
  };
};

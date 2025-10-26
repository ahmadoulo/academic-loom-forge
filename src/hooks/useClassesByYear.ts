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
          school_year:school_years(id, name, is_current),
          student_count:student_school(count)
        `);

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      if (yearId && !includeAllYears) {
        query = query.eq('school_year_id', yearId);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      
      // Transform data to include student count
      const classesWithCount = (data || []).map((cls: any) => ({
        ...cls,
        school_year: cls.school_year,
        student_count: cls.student_count?.[0]?.count || 0
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

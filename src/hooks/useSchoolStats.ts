import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SchoolStats {
  studentsCount: number;
  teachersCount: number;
  classesCount: number;
  subjectsCount: number;
}

export const useSchoolStats = (schoolId: string) => {
  const [stats, setStats] = useState<SchoolStats>({
    studentsCount: 0,
    teachersCount: 0,
    classesCount: 0,
    subjectsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get current school year
      const { data: currentYear } = await supabase
        .from('school_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (!currentYear) {
        setStats({
          studentsCount: 0,
          teachersCount: 0,
          classesCount: 0,
          subjectsCount: 0,
        });
        return;
      }

      // Count students
      const { count: studentsCount } = await supabase
        .from('student_school')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('school_year_id', currentYear.id)
        .eq('is_active', true);

      // Count teachers
      const { count: teachersCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('archived', false);

      // Count classes
      const { count: classesCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('school_year_id', currentYear.id)
        .eq('archived', false);

      // Count subjects
      const { count: subjectsCount } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('archived', false);

      setStats({
        studentsCount: studentsCount || 0,
        teachersCount: teachersCount || 0,
        classesCount: classesCount || 0,
        subjectsCount: subjectsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching school stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchStats();
    }
  }, [schoolId]);

  return {
    stats,
    loading,
    refetch: fetchStats,
  };
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AggregatedStats {
  totalSchools: number;
  activeSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  subscriptionsByPlan: {
    basic: number;
    standard: number;
    premium: number;
  };
  schoolsByStatus: {
    active: number;
    inactive: number;
    trial: number;
    expired: number;
  };
}

export const useAggregatedStats = () => {
  const [stats, setStats] = useState<AggregatedStats>({
    totalSchools: 0,
    activeSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    subscriptionsByPlan: { basic: 0, standard: 0, premium: 0 },
    schoolsByStatus: { active: 0, inactive: 0, trial: 0, expired: 0 }
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
        setLoading(false);
        return;
      }

      // Fetch all data in parallel
      const [schoolsRes, studentsRes, teachersRes, classesRes, subjectsRes, subscriptionsRes] = await Promise.all([
        supabase.from('schools').select('id, is_active'),
        supabase.from('student_school').select('student_id', { count: 'exact', head: false }).eq('school_year_id', currentYear.id).eq('is_active', true),
        supabase.from('teachers').select('id', { count: 'exact', head: false }).eq('archived', false),
        supabase.from('classes').select('id', { count: 'exact', head: false }).eq('school_year_id', currentYear.id).eq('archived', false),
        supabase.from('subjects').select('id', { count: 'exact', head: false }).eq('archived', false),
        supabase.from('subscriptions').select('plan_type, status, is_trial, end_date, trial_end_date')
      ]);

      const schools = schoolsRes.data || [];
      const activeSchools = schools.filter(s => s.is_active).length;
      
      // Count unique students
      const uniqueStudents = new Set(studentsRes.data?.map(s => s.student_id) || []);
      
      const subscriptions = subscriptionsRes.data || [];
      const now = new Date();

      // Calculate subscription stats
      const subsByPlan = { basic: 0, standard: 0, premium: 0 };
      const schoolsByStatus = { active: 0, inactive: 0, trial: 0, expired: 0 };

      subscriptions.forEach(sub => {
        const endDate = new Date(sub.is_trial ? sub.trial_end_date : sub.end_date);
        const isExpired = endDate < now;

        if (sub.status === 'active' || sub.status === 'trial') {
          if (!isExpired) {
            subsByPlan[sub.plan_type]++;
            if (sub.is_trial) {
              schoolsByStatus.trial++;
            } else {
              schoolsByStatus.active++;
            }
          } else {
            schoolsByStatus.expired++;
          }
        } else {
          schoolsByStatus.expired++;
        }
      });

      schoolsByStatus.inactive = schools.length - schoolsByStatus.active - schoolsByStatus.trial - schoolsByStatus.expired;

      setStats({
        totalSchools: schools.length,
        activeSchools,
        totalStudents: uniqueStudents.size,
        totalTeachers: teachersRes.data?.length || 0,
        totalClasses: classesRes.data?.length || 0,
        totalSubjects: subjectsRes.data?.length || 0,
        subscriptionsByPlan: subsByPlan,
        schoolsByStatus
      });
    } catch (error) {
      console.error('Error fetching aggregated stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, refetch: fetchStats };
};

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionLimits {
  studentLimit: number | null;
  teacherLimit: number | null;
  currentStudents: number;
  currentTeachers: number;
  canAddStudent: boolean;
  canAddTeacher: boolean;
}

export function useSubscriptionLimits(schoolId: string) {
  const [limits, setLimits] = useState<SubscriptionLimits>({
    studentLimit: null,
    teacherLimit: null,
    currentStudents: 0,
    currentTeachers: 0,
    canAddStudent: true,
    canAddTeacher: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        // Fetch subscription
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('school_id', schoolId)
          .eq('status', 'active')
          .single();

        if (!subData) {
          setLoading(false);
          return;
        }

        // Fetch plan details
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('type', subData.plan_type)
          .single();

        // Get the limit (custom or plan)
        const studentLimit = subData.custom_student_limit || planData?.student_limit;
        const teacherLimit = subData.custom_teacher_limit || planData?.teacher_limit;

        // Fetch current year
        const { data: currentYear } = await supabase
          .from('school_years')
          .select('id')
          .eq('is_current', true)
          .single();

        if (!currentYear) {
          setLoading(false);
          return;
        }

        // Get current student count
        const { count: studentCount } = await supabase
          .from('student_school')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('school_year_id', currentYear.id)
          .eq('is_active', true);

        // Get current teacher count
        const { count: teacherCount } = await supabase
          .from('teachers')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('archived', false);

        const currentStudents = studentCount || 0;
        const currentTeachers = teacherCount || 0;

        setLimits({
          studentLimit,
          teacherLimit,
          currentStudents,
          currentTeachers,
          canAddStudent: studentLimit ? currentStudents < studentLimit : true,
          canAddTeacher: teacherLimit ? currentTeachers < teacherLimit : true,
        });
      } catch (error) {
        console.error('Error fetching subscription limits:', error);
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchLimits();
    }
  }, [schoolId]);

  const checkCanAddStudents = (count: number = 1) => {
    if (!limits.studentLimit) return true;
    return limits.currentStudents + count <= limits.studentLimit;
  };

  const checkCanAddTeachers = (count: number = 1) => {
    if (!limits.teacherLimit) return true;
    return limits.currentTeachers + count <= limits.teacherLimit;
  };

  return {
    ...limits,
    loading,
    checkCanAddStudents,
    checkCanAddTeachers,
  };
}

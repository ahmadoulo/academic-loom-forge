import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionLimits {
  studentLimit: number | null;
  teacherLimit: number | null;
  currentStudents: number;
  currentTeachers: number;
  canAddStudent: boolean;
  canAddTeacher: boolean;
  loading: boolean;
}

export function useSubscriptionLimits(schoolId: string): SubscriptionLimits {
  const [limits, setLimits] = useState<SubscriptionLimits>({
    studentLimit: null,
    teacherLimit: null,
    currentStudents: 0,
    currentTeachers: 0,
    canAddStudent: true,
    canAddTeacher: true,
    loading: true,
  });

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        // Fetch subscription
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('custom_student_limit, custom_teacher_limit, plan_type')
          .eq('school_id', schoolId)
          .single();

        if (!subData) {
          setLimits(prev => ({ ...prev, loading: false }));
          return;
        }

        // Fetch plan details
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('student_limit, teacher_limit')
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
          setLimits(prev => ({ ...prev, loading: false }));
          return;
        }

        // Fetch current student count
        const { count: studentCount } = await supabase
          .from('student_school')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('school_year_id', currentYear.id)
          .eq('is_active', true);

        // Fetch current teacher count
        const { count: teacherCount } = await supabase
          .from('teachers')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('archived', false);

        const current = {
          studentLimit,
          teacherLimit,
          currentStudents: studentCount || 0,
          currentTeachers: teacherCount || 0,
          canAddStudent: studentLimit === null || (studentCount || 0) < studentLimit,
          canAddTeacher: teacherLimit === null || (teacherCount || 0) < teacherLimit,
          loading: false,
        };

        setLimits(current);
      } catch (error) {
        console.error('Error fetching subscription limits:', error);
        setLimits(prev => ({ ...prev, loading: false }));
      }
    };

    if (schoolId) {
      fetchLimits();
    }
  }, [schoolId]);

  return limits;
}

export function checkCanAddStudent(limits: SubscriptionLimits): boolean {
  if (limits.loading) return false;
  if (!limits.canAddStudent) {
    toast.error("Limite étudiant atteint. Contactez le support", {
      description: `Vous avez atteint la limite de ${limits.studentLimit} étudiants.`,
    });
    return false;
  }
  return true;
}

export function checkCanAddTeacher(limits: SubscriptionLimits): boolean {
  if (limits.loading) return false;
  if (!limits.canAddTeacher) {
    toast.error("Limite professeur atteint. Contactez le support", {
      description: `Vous avez atteint la limite de ${limits.teacherLimit} professeurs.`,
    });
    return false;
  }
  return true;
}

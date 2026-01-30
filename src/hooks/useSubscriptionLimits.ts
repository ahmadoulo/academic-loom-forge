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
        // Fetch subscription - get the most recent one
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('custom_student_limit, custom_teacher_limit, plan_type, status, is_trial, end_date, trial_end_date')
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!subData) {
          // No subscription means unlimited (allow creation)
          setLimits(prev => ({ 
            ...prev, 
            loading: false,
            canAddStudent: true,
            canAddTeacher: true 
          }));
          return;
        }

        // Check if subscription is valid (not expired)
        const now = new Date();
        const endDate = subData.is_trial || subData.status === 'trial' 
          ? new Date(subData.trial_end_date || subData.end_date)
          : new Date(subData.end_date);
        
        const isExpired = endDate < now;

        // If expired, block creation
        if (isExpired) {
          setLimits({
            studentLimit: 0,
            teacherLimit: 0,
            currentStudents: 0,
            currentTeachers: 0,
            canAddStudent: false,
            canAddTeacher: false,
            loading: false,
          });
          return;
        }

        // Fetch plan details
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('student_limit, teacher_limit')
          .eq('type', subData.plan_type)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get the limit (custom or plan) - null means unlimited
        const studentLimit = subData.custom_student_limit ?? planData?.student_limit ?? null;
        const teacherLimit = subData.custom_teacher_limit ?? planData?.teacher_limit ?? null;

        // Fetch current year
        const { data: currentYear } = await supabase
          .from('school_years')
          .select('id')
          .eq('is_current', true)
          .single();

        if (!currentYear) {
          // No current year but subscription is valid - allow creation
          setLimits({
            studentLimit,
            teacherLimit,
            currentStudents: 0,
            currentTeachers: 0,
            canAddStudent: true,
            canAddTeacher: true,
            loading: false,
          });
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

        // null limit means unlimited (canAdd = true)
        const canAddStudent = studentLimit === null || (studentCount || 0) < studentLimit;
        const canAddTeacher = teacherLimit === null || (teacherCount || 0) < teacherLimit;

        setLimits({
          studentLimit,
          teacherLimit,
          currentStudents: studentCount || 0,
          currentTeachers: teacherCount || 0,
          canAddStudent,
          canAddTeacher,
          loading: false,
        });
      } catch (error) {
        // On error, allow creation (fail open for better UX)
        setLimits(prev => ({ 
          ...prev, 
          loading: false,
          canAddStudent: true,
          canAddTeacher: true
        }));
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

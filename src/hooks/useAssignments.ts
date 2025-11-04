import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAcademicYear } from './useAcademicYear';
import { format, addWeeks, addMonths, isBefore, isAfter, setDay, startOfDay } from 'date-fns';

export interface Assignment {
  id: string;
  school_id: string;
  teacher_id: string;
  class_id: string;
  subject_id?: string;
  title: string;
  description?: string;
  type: 'exam' | 'test' | 'homework' | 'course' | 'assignment';
  due_date?: string;
  session_date?: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
  is_rescheduled?: boolean;
  reschedule_reason?: string;
  original_session_date?: string;
  proposed_new_date?: string;
  reschedule_status?: string;
  rescheduled_by?: string;
  rescheduled_at?: string;
}

export interface AssignmentWithDetails extends Assignment {
  teachers?: {
    firstname: string;
    lastname: string;
  };
  classes?: {
    name: string;
  };
  subjects?: {
    id: string;
    name: string;
  };
}

export interface CreateAssignmentData {
  school_id: string;
  teacher_id: string;
  class_id: string;
  subject_id?: string;
  title: string;
  description?: string;
  type: 'exam' | 'test' | 'homework' | 'course' | 'assignment';
  due_date?: string;
  session_date?: string;
  start_time?: string;
  end_time?: string;
  is_recurring?: boolean;
  recurrence_pattern?: 'weekly' | 'monthly' | 'none';
  recurrence_day?: number;
  recurrence_end_date?: string;
}

interface UseAssignmentsOptions {
  classId?: string;
  studentId?: string;
  teacherId?: string;
  schoolId?: string;
}

export const useAssignments = (options?: UseAssignmentsOptions | string) => {
  // Support both old signature (classId as string) and new signature (options object)
  const opts = typeof options === 'string' ? { classId: options } : options || {};
  const { classId, studentId, teacherId, schoolId } = opts;

  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getYearForCreation } = useAcademicYear();

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('assignments')
        .select(`
          *,
          teachers (
            firstname,
            lastname
          ),
          classes (
            name
          ),
          subjects (
            id,
            name
          )
        `);

      if (classId) {
        query = query.eq('class_id', classId);
      }

      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Type assertion to ensure proper typing
      const typedData = (data || []).map(assignment => ({
        ...assignment,
        type: assignment.type as 'exam' | 'test' | 'homework' | 'course' | 'assignment',
        // Normalize subjects to be a single object or null
        subjects: Array.isArray(assignment.subjects) && assignment.subjects.length > 0 
          ? assignment.subjects[0] 
          : (assignment.subjects || null)
      })) as AssignmentWithDetails[];

      setAssignments(typedData);
    } catch (err) {
      console.error('Erreur lors du chargement des devoirs:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des devoirs');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate recurring dates based on pattern
   */
  const generateRecurringDates = (
    startDate: Date,
    endDate: Date,
    pattern: 'weekly' | 'monthly',
    dayOfWeek: number
  ): Date[] => {
    const dates: Date[] = [];
    let currentDate = startOfDay(new Date(startDate));
    const finalDate = startOfDay(new Date(endDate));

    // Adjust first occurrence to match the desired day of week
    currentDate = setDay(currentDate, dayOfWeek, { weekStartsOn: 0 });
    
    // If the adjusted date is before the start date, move to next occurrence
    if (isBefore(currentDate, startDate)) {
      if (pattern === 'weekly') {
        currentDate = addWeeks(currentDate, 1);
      } else {
        currentDate = addMonths(currentDate, 1);
      }
    }

    // Generate all occurrences until end date
    while (isBefore(currentDate, finalDate) || currentDate.getTime() === finalDate.getTime()) {
      dates.push(new Date(currentDate));
      
      if (pattern === 'weekly') {
        currentDate = addWeeks(currentDate, 1);
      } else {
        currentDate = addMonths(currentDate, 1);
        currentDate = setDay(currentDate, dayOfWeek, { weekStartsOn: 0 });
      }
    }

    return dates;
  };

  const createAssignment = async (assignmentData: CreateAssignmentData) => {
    try {
      const currentYearId = getYearForCreation();

      if (!currentYearId) {
        throw new Error('Aucune année scolaire active');
      }

      // Check if this is a recurring assignment
      if (assignmentData.is_recurring && 
          assignmentData.recurrence_pattern && 
          assignmentData.recurrence_pattern !== 'none' &&
          assignmentData.recurrence_day !== undefined &&
          assignmentData.session_date &&
          assignmentData.recurrence_end_date) {
        
        // Generate all recurring dates
        const startDate = new Date(assignmentData.session_date);
        const endDate = new Date(assignmentData.recurrence_end_date);
        const recurringDates = generateRecurringDates(
          startDate,
          endDate,
          assignmentData.recurrence_pattern,
          assignmentData.recurrence_day
        );

        console.log(`Generating ${recurringDates.length} recurring sessions`);

        // Create the parent assignment first
        const parentData = {
          ...assignmentData,
          school_year_id: currentYearId,
          session_date: format(recurringDates[0], 'yyyy-MM-dd'),
        };

        // Remove recurrence-specific fields that shouldn't be in the insert
        const { is_recurring, recurrence_pattern, recurrence_day, recurrence_end_date, ...baseData } = parentData;

        const { data: parentAssignment, error: parentError } = await supabase
          .from('assignments')
          .insert([{
            ...baseData,
            is_recurring: true,
            recurrence_pattern: assignmentData.recurrence_pattern,
            recurrence_day: assignmentData.recurrence_day,
            recurrence_end_date: assignmentData.recurrence_end_date,
            parent_assignment_id: null,
          }])
          .select()
          .single();

        if (parentError) throw parentError;

        // Create all child occurrences (skip first one as it's the parent)
        if (recurringDates.length > 1) {
          const childAssignments = recurringDates.slice(1).map(date => ({
            ...baseData,
            session_date: format(date, 'yyyy-MM-dd'),
            is_recurring: true,
            recurrence_pattern: assignmentData.recurrence_pattern,
            recurrence_day: assignmentData.recurrence_day,
            recurrence_end_date: assignmentData.recurrence_end_date,
            parent_assignment_id: parentAssignment.id,
          }));

          const { error: childrenError } = await supabase
            .from('assignments')
            .insert(childAssignments);

          if (childrenError) throw childrenError;
        }

        await fetchAssignments();
        return { 
          data: parentAssignment, 
          error: null,
          message: `${recurringDates.length} séance(s) créée(s) avec succès`
        };
      } else {
        // Non-recurring assignment - standard creation
        const { data, error } = await supabase
          .from('assignments')
          .insert([{ ...assignmentData, school_year_id: currentYearId }])
          .select()
          .single();

        if (error) throw error;

        await fetchAssignments();
        return { data, error: null };
      }
    } catch (err) {
      console.error('Erreur lors de la création du devoir:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la création du devoir' 
      };
    }
  };

  const updateAssignment = async (id: string, assignmentData: Partial<CreateAssignmentData>) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update(assignmentData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchAssignments();
      return { data, error: null };
    } catch (err) {
      console.error('Erreur lors de la mise à jour du devoir:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du devoir' 
      };
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAssignments();
      return { error: null };
    } catch (err) {
      console.error('Erreur lors de la suppression du devoir:', err);
      return { 
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression du devoir' 
      };
    }
  };

  const rescheduleAssignment = async (
    assignmentId: string,
    reason: string,
    newDate?: Date,
    isTeacher: boolean = false
  ) => {
    try {
      // Get current assignment data
      const { data: currentAssignment, error: fetchError } = await supabase
        .from("assignments")
        .select("session_date, original_session_date")
        .eq("id", assignmentId)
        .single();

      if (fetchError) throw fetchError;

      const updateData: any = {
        reschedule_reason: reason,
        rescheduled_at: new Date().toISOString(),
      };

      if (isTeacher) {
        // Teacher proposes a new date - requires admin approval
        updateData.reschedule_status = "pending";
        if (newDate) {
          updateData.proposed_new_date = format(newDate, "yyyy-MM-dd");
        }
        if (!currentAssignment.original_session_date) {
          updateData.original_session_date = currentAssignment.session_date;
        }
      } else {
        // Admin can directly reschedule
        updateData.is_rescheduled = true;
        updateData.reschedule_status = "approved";
        if (!currentAssignment.original_session_date) {
          updateData.original_session_date = currentAssignment.session_date;
        }
        if (newDate) {
          updateData.session_date = format(newDate, "yyyy-MM-dd");
        }
      }

      const { error: updateError } = await supabase
        .from("assignments")
        .update(updateData)
        .eq("id", assignmentId);

      if (updateError) throw updateError;
      await fetchAssignments();
      return { error: null };
    } catch (err) {
      console.error("Error rescheduling assignment:", err);
      return {
        error: err instanceof Error ? err.message : "An error occurred"
      };
    }
  };

  const approveReschedule = async (assignmentId: string) => {
    try {
      const { data: assignment, error: fetchError } = await supabase
        .from("assignments")
        .select("proposed_new_date")
        .eq("id", assignmentId)
        .single();

      if (fetchError) throw fetchError;

      const updateData: any = {
        is_rescheduled: true,
        reschedule_status: "approved",
      };

      if (assignment.proposed_new_date) {
        updateData.session_date = assignment.proposed_new_date;
        updateData.proposed_new_date = null;
      }

      const { error: updateError } = await supabase
        .from("assignments")
        .update(updateData)
        .eq("id", assignmentId);

      if (updateError) throw updateError;
      await fetchAssignments();
      return { error: null };
    } catch (err) {
      console.error("Error approving reschedule:", err);
      return {
        error: err instanceof Error ? err.message : "An error occurred"
      };
    }
  };

  const rejectReschedule = async (assignmentId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("assignments")
        .update({
          reschedule_status: "rejected",
          proposed_new_date: null,
        })
        .eq("id", assignmentId);

      if (updateError) throw updateError;
      await fetchAssignments();
      return { error: null };
    } catch (err) {
      console.error("Error rejecting reschedule:", err);
      return {
        error: err instanceof Error ? err.message : "An error occurred"
      };
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [classId, studentId, teacherId]);

  return {
    assignments,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    rescheduleAssignment,
    approveReschedule,
    rejectReschedule,
    refetch: fetchAssignments,
  };
};
import { useState, useEffect } from "react";
import { ModernCalendarView } from "@/components/calendar/ModernCalendarView";
import { supabase } from "@/integrations/supabase/client";

interface SchoolCalendarViewProps {
  schoolId: string;
}

interface Assignment {
  id: string;
  title: string;
  session_date: string | null;
  due_date: string | null;
  start_time: string | null;
  end_time: string | null;
  type: string;
  classes?: {
    name: string;
  };
  subjects?: {
    name: string;
    teachers?: {
      firstname: string;
      lastname: string;
    };
  };
}

export function SchoolCalendarView({ schoolId }: SchoolCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    if (schoolId) {
      fetchAssignments();
    }
  }, [schoolId]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          session_date,
          due_date,
          start_time,
          end_time,
          type,
          classes (name),
          subjects (
            name,
            teachers (
              firstname,
              lastname
            )
          )
        `)
        .eq("school_id", schoolId)
        .order("session_date", { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des séances:", error);
    } finally {
      setLoading(false);
    }
  };

  const calendarEvents = assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    session_date: assignment.session_date || assignment.due_date || "",
    start_time: assignment.start_time || null,
    end_time: assignment.end_time || null,
    type: assignment.type,
    class_name: assignment.classes?.name,
    teacher_name: assignment.subjects?.teachers 
      ? `${assignment.subjects.teachers.firstname} ${assignment.subjects.teachers.lastname}`
      : undefined,
  }));

  if (loading) {
    return <div>Chargement du calendrier...</div>;
  }

  return (
    <ModernCalendarView
      events={calendarEvents}
      onDateSelect={setSelectedDate}
      selectedDate={selectedDate}
    />
  );
}

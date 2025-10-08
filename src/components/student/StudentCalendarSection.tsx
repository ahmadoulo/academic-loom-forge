import { useState, useEffect } from "react";
import { CalendarView } from "@/components/calendar/CalendarView";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StudentCalendarSectionProps {
  studentId: string;
  classId: string;
}

interface Assignment {
  id: string;
  title: string;
  session_date: string | null;
  due_date: string | null;
  start_time: string | null;
  end_time: string | null;
  type: string;
  classes: { name: string } | null;
  teachers: { firstname: string; lastname: string } | null;
}

export function StudentCalendarSection({ studentId, classId }: StudentCalendarSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, [classId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
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
          teachers (firstname, lastname)
        `)
        .eq("class_id", classId)
        .order("session_date", { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error("Erreur chargement du calendrier:", error);
      toast.error("Erreur lors du chargement du calendrier");
    } finally {
      setLoading(false);
    }
  };

  const calendarEvents = assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    session_date: assignment.session_date || assignment.due_date || "",
    start_time: assignment.start_time,
    end_time: assignment.end_time,
    type: assignment.type,
    class_name: assignment.classes?.name,
    teacher_name: assignment.teachers 
      ? `${assignment.teachers.firstname} ${assignment.teachers.lastname}`
      : undefined,
  }));

  if (loading) {
    return <div className="text-center py-8">Chargement du calendrier...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mon calendrier</h2>
        <p className="text-muted-foreground">
          Vos cours, examens et devoirs à venir
        </p>
      </div>

      <CalendarView
        events={calendarEvents}
        onDateSelect={setSelectedDate}
        selectedDate={selectedDate}
      />
    </div>
  );
}
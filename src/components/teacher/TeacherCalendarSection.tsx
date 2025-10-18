import { useState, useEffect } from "react";
import { ModernCalendarView } from "@/components/calendar/ModernCalendarView";
import { useAssignments } from "@/hooks/useAssignments";

interface TeacherCalendarSectionProps {
  teacherId: string;
}

export function TeacherCalendarSection({ teacherId }: TeacherCalendarSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { assignments } = useAssignments({ teacherId });

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const calendarEvents = assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    session_date: assignment.session_date || assignment.due_date || "",
    start_time: assignment.start_time || null,
    end_time: assignment.end_time || null,
    type: assignment.type,
    class_name: assignment.classes?.name,
  }));

  return (
    <ModernCalendarView
      events={calendarEvents}
      onDateSelect={setSelectedDate}
      selectedDate={selectedDate}
    />
  );
}
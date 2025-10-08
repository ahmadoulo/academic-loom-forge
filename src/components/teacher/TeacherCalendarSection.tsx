import { useState } from "react";
import { CalendarView } from "@/components/calendar/CalendarView";
import { useAssignments } from "@/hooks/useAssignments";

interface TeacherCalendarSectionProps {
  teacherId: string;
}

export function TeacherCalendarSection({ teacherId }: TeacherCalendarSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { assignments } = useAssignments({ teacherId });

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mon calendrier</h2>
        <p className="text-muted-foreground">
          Vos séances de cours, examens et devoirs
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
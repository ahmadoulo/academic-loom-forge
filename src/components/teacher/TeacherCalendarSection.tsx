import { useState, useEffect } from "react";
import { ModernCalendarView } from "@/components/calendar/ModernCalendarView";
import { RescheduleSessionDialog } from "@/components/calendar/RescheduleSessionDialog";
import { useAssignments } from "@/hooks/useAssignments";
import { toast } from "sonner";

interface TeacherCalendarSectionProps {
  teacherId: string;
}

export function TeacherCalendarSection({ teacherId }: TeacherCalendarSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const { assignments, rescheduleAssignment, loading } = useAssignments({ teacherId });

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
    is_rescheduled: assignment.is_rescheduled,
    reschedule_reason: assignment.reschedule_reason,
    reschedule_status: assignment.reschedule_status,
    proposed_new_date: assignment.proposed_new_date,
    original_session_date: assignment.original_session_date,
  }));

  const handleReschedule = (sessionId: string) => {
    const session = assignments.find((a) => a.id === sessionId);
    if (session) {
      setSelectedSession(session);
      setRescheduleDialogOpen(true);
    }
  };

  const handleRescheduleSubmit = async (data: { sessionId: string; reason: string; newDate?: Date }) => {
    try {
      await rescheduleAssignment(data.sessionId, data.reason, data.newDate, true);
      toast.success(data.newDate ? "Demande de report envoyée avec succès" : "Motif enregistré");
      setRescheduleDialogOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la demande");
      console.error(error);
    }
  };

  return (
    <>
      <ModernCalendarView
        events={calendarEvents}
        onDateSelect={setSelectedDate}
        selectedDate={selectedDate}
        canManage={true}
        isTeacher={true}
        onReschedule={handleReschedule}
      />

      {selectedSession && (
        <RescheduleSessionDialog
          open={rescheduleDialogOpen}
          onOpenChange={setRescheduleDialogOpen}
          sessionId={selectedSession.id}
          sessionTitle={selectedSession.title}
          currentDate={selectedSession.session_date}
          isTeacher={true}
          onReschedule={handleRescheduleSubmit}
        />
      )}
    </>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ModernCalendarView } from "@/components/calendar/ModernCalendarView";
import { RescheduleSessionDialog } from "@/components/calendar/RescheduleSessionDialog";
import { ApproveRescheduleDialog } from "@/components/calendar/ApproveRescheduleDialog";
import { SessionForm, SessionFormData } from "./SessionForm";
import { useAssignments } from "@/hooks/useAssignments";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useOptionalSemester } from "@/hooks/useSemester";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SchoolCalendarSectionProps {
  schoolId: string;
  classes: Array<{ id: string; name: string }>;
  teachers: Array<{ id: string; firstname: string; lastname: string }>;
}

export function SchoolCalendarSection({ schoolId, classes, teachers }: SchoolCalendarSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const { assignments, createAssignment, rescheduleAssignment, approveReschedule, rejectReschedule, loading } = useAssignments({ schoolId });
  const { assignClassroomAsync } = useClassrooms(schoolId);
  const semesterContext = useOptionalSemester();
  const currentSemester = semesterContext?.currentSemester;

  const calendarEvents = assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    session_date: assignment.session_date || assignment.due_date || "",
    start_time: assignment.start_time || null,
    end_time: assignment.end_time || null,
    type: assignment.type,
    class_name: assignment.classes?.name,
    teacher_name: assignment.teachers 
      ? `${assignment.teachers.firstname} ${assignment.teachers.lastname}`
      : undefined,
    is_rescheduled: assignment.is_rescheduled,
    reschedule_reason: assignment.reschedule_reason,
    reschedule_status: assignment.reschedule_status,
    proposed_new_date: assignment.proposed_new_date,
    original_session_date: assignment.original_session_date,
  }));

  const handleCreateSession = async (data: SessionFormData) => {
    try {
      const assignmentData: any = {
        school_id: schoolId,
        title: data.title,
        description: data.description,
        class_id: data.class_id,
        teacher_id: data.teacher_id,
        subject_id: data.subject_id,
        session_date: format(data.session_date, "yyyy-MM-dd"),
        start_time: data.start_time,
        end_time: data.end_time,
        type: data.type,
      };

      // Add recurrence data if enabled
      if (data.is_recurring) {
        assignmentData.is_recurring = true;
        assignmentData.recurrence_pattern = data.recurrence_pattern;
        assignmentData.recurrence_day = data.recurrence_day;
        assignmentData.recurrence_end_date = currentSemester?.end_date || format(data.session_date, "yyyy-MM-dd");
      }

      const result = await createAssignment(assignmentData);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        // If a classroom was selected, assign it
        if (data.classroom_id && result.data?.id) {
          try {
            await assignClassroomAsync({
              classroom_id: data.classroom_id,
              assignment_id: result.data.id,
            });
          } catch (classroomError) {
            console.error("Erreur lors de l'assignation de la salle:", classroomError);
            // Don't fail the whole operation if classroom assignment fails
          }
        }
        
        const message = (result as any).message || "Séance créée avec succès";
        toast.success(message);
        setIsDialogOpen(false);
      }
    } catch (error) {
      toast.error("Erreur lors de la création de la séance");
      console.error(error);
    }
  };

  const handleReschedule = (sessionId: string) => {
    const session = assignments.find((a) => a.id === sessionId);
    if (session) {
      setSelectedSession(session);
      setRescheduleDialogOpen(true);
    }
  };

  const handleApproveReschedule = (sessionId: string) => {
    const session = assignments.find((a) => a.id === sessionId);
    if (session) {
      setSelectedSession(session);
      setApproveDialogOpen(true);
    }
  };

  const handleRescheduleSubmit = async (data: { sessionId: string; reason: string; newDate?: Date; newStartTime?: string; newEndTime?: string }) => {
    try {
      await rescheduleAssignment(data.sessionId, data.reason, data.newDate, false, data.newStartTime, data.newEndTime);
      toast.success(data.newDate ? "Séance reportée avec succès" : "Report enregistré");
      setRescheduleDialogOpen(false);
    } catch (error) {
      toast.error("Erreur lors du report de la séance");
      console.error(error);
    }
  };

  const handleApproveRescheduleSubmit = async () => {
    if (!selectedSession) return;
    try {
      await approveReschedule(selectedSession.id);
      toast.success("Report validé avec succès");
      setApproveDialogOpen(false);
    } catch (error) {
      toast.error("Erreur lors de la validation");
      console.error(error);
    }
  };

  const handleRejectReschedule = async () => {
    if (!selectedSession) return;
    try {
      await rejectReschedule(selectedSession.id);
      toast.success("Demande de report refusée");
      setApproveDialogOpen(false);
    } catch (error) {
      toast.error("Erreur lors du refus");
      console.error(error);
    }
  };

  const handleMoveSession = async (sessionId: string, newDate: Date) => {
    try {
      await rescheduleAssignment(
        sessionId, 
        "Déplacement par glisser-déposer", 
        newDate, 
        false // isTeacher = false, so it applies directly
      );
      toast.success("Séance déplacée avec succès");
    } catch (error) {
      toast.error("Erreur lors du déplacement de la séance");
      console.error(error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <Button size="lg" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle séance
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une séance</DialogTitle>
            </DialogHeader>
            <SessionForm
              onSubmit={handleCreateSession}
              onCancel={() => setIsDialogOpen(false)}
              classes={classes}
              teachers={teachers}
              loading={loading}
              schoolId={schoolId}
            />
          </DialogContent>
        </Dialog>
      </div>

      <ModernCalendarView
        events={calendarEvents}
        onDateSelect={setSelectedDate}
        selectedDate={selectedDate}
        canManage={true}
        isTeacher={false}
        onReschedule={handleReschedule}
        onApproveReschedule={handleApproveReschedule}
        onMoveSession={handleMoveSession}
        showFilters={true}
      />

      {selectedSession && (
        <>
          <RescheduleSessionDialog
            open={rescheduleDialogOpen}
            onOpenChange={setRescheduleDialogOpen}
            sessionId={selectedSession.id}
            sessionTitle={selectedSession.title}
            currentDate={selectedSession.session_date}
            isTeacher={false}
            onReschedule={handleRescheduleSubmit}
          />

          <ApproveRescheduleDialog
            open={approveDialogOpen}
            onOpenChange={setApproveDialogOpen}
            sessionTitle={selectedSession.title}
            originalDate={selectedSession.original_session_date || selectedSession.session_date}
            proposedDate={selectedSession.proposed_new_date}
            reason={selectedSession.reschedule_reason || ""}
            teacherName={
              selectedSession.teachers
                ? `${selectedSession.teachers.firstname} ${selectedSession.teachers.lastname}`
                : undefined
            }
            onApprove={handleApproveRescheduleSubmit}
            onReject={handleRejectReschedule}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}
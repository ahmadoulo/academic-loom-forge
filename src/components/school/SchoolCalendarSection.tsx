import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarView } from "@/components/calendar/CalendarView";
import { SessionForm, SessionFormData } from "./SessionForm";
import { useAssignments } from "@/hooks/useAssignments";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SchoolCalendarSectionProps {
  schoolId: string;
  classes: Array<{ id: string; name: string }>;
  teachers: Array<{ id: string; firstname: string; lastname: string }>;
}

export function SchoolCalendarSection({ schoolId, classes, teachers }: SchoolCalendarSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { assignments, createAssignment, loading } = useAssignments({ schoolId });

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
  }));

  const handleCreateSession = async (data: SessionFormData) => {
    try {
      await createAssignment({
        school_id: schoolId,
        title: data.title,
        description: data.description,
        class_id: data.class_id,
        teacher_id: data.teacher_id,
        session_date: format(data.session_date, "yyyy-MM-dd"),
        start_time: data.start_time,
        end_time: data.end_time,
        type: data.type,
      });
      toast.success("Séance créée avec succès");
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Erreur lors de la création de la séance");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Calendrier de l'école</h2>
          <p className="text-muted-foreground">
            Gérez les séances de cours, examens et devoirs
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle séance
            </Button>
          </DialogTrigger>
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
            />
          </DialogContent>
        </Dialog>
      </div>

      <CalendarView
        events={calendarEvents}
        onDateSelect={setSelectedDate}
        selectedDate={selectedDate}
      />
    </div>
  );
}
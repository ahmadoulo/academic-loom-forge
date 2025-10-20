import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";

export interface TimetableEntry {
  id: string;
  day: string;
  date: string;
  subject: string;
  classroom: string;
  startTime: string;
  endTime: string;
  teacher: string;
  sessionDate: Date;
}

export function useTimetable(schoolId: string, classId: string | null, weekStart: Date | null) {
  return useQuery({
    queryKey: ["timetable", schoolId, classId, weekStart],
    queryFn: async () => {
      if (!classId || !weekStart) return [];

      const weekEnd = endOfWeek(weekStart, { locale: fr });
      const weekStartStr = format(weekStart, "yyyy-MM-dd");
      const weekEndStr = format(weekEnd, "yyyy-MM-dd");

      // Récupérer les séances (assignments) pour la classe et la semaine
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          session_date,
          start_time,
          end_time,
          type,
          subjects (
            name,
            teachers (
              firstname,
              lastname
            )
          )
        `)
        .eq("school_id", schoolId)
        .eq("class_id", classId)
        .gte("session_date", weekStartStr)
        .lte("session_date", weekEndStr)
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (assignmentsError) throw assignmentsError;

      // Récupérer les assignations de salles pour ces séances
      const assignmentIds = assignments?.map((a) => a.id) || [];
      const { data: classroomAssignments, error: classroomsError } = await supabase
        .from("classroom_assignments")
        .select(`
          assignment_id,
          classrooms (
            name
          )
        `)
        .in("assignment_id", assignmentIds);

      if (classroomsError) throw classroomsError;

      // Mapper les données pour l'affichage
      const timetableData: TimetableEntry[] = (assignments || []).map((assignment) => {
        const classroomAssignment = classroomAssignments?.find(
          (ca) => ca.assignment_id === assignment.id
        );

        const sessionDate = parseISO(assignment.session_date || "");
        const dayName = format(sessionDate, "EEEE", { locale: fr });
        const dateStr = format(sessionDate, "dd/MM/yyyy");

        return {
          id: assignment.id,
          day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          date: dateStr,
          subject: assignment.subjects?.name || "N/A",
          classroom: classroomAssignment?.classrooms?.name || "Non assignée",
          startTime: assignment.start_time || "N/A",
          endTime: assignment.end_time || "N/A",
          teacher: assignment.subjects?.teachers
            ? `${assignment.subjects.teachers.firstname} ${assignment.subjects.teachers.lastname}`
            : "N/A",
          sessionDate,
        };
      });

      return timetableData;
    },
    enabled: !!schoolId && !!classId && !!weekStart,
  });
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { useAssignments } from "@/hooks/useAssignments";
import { SessionsList } from "@/components/teacher/SessionsList";
import { SessionAttendanceManager } from "@/components/teacher/SessionAttendanceManager";

interface SchoolAttendanceViewProps {
  schoolId: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  type: string;
  teacher_id?: string;
  subject_id?: string;
  subjects?: {
    id: string;
    name: string;
  } | null;
}

export function SchoolAttendanceView({ schoolId }: SchoolAttendanceViewProps) {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<Assignment | null>(null);
  
  const { classes, loading: classesLoading } = useClasses(schoolId);
  const { students } = useStudents(schoolId);
  const { assignments, loading: assignmentsLoading } = useAssignments({ 
    classId: selectedClass || undefined,
    schoolId: schoolId 
  });

  const classData = classes.find(c => c.id === selectedClass);
  const classStudents = students.filter(s => s.class_id === selectedClass);

  // Filtrer uniquement les assignments qui ont des horaires (séances)
  const sessions = (assignments || []).filter(a => 
    a.session_date && a.start_time && a.end_time
  );

  if (selectedSession && classData) {
    return (
      <SessionAttendanceManager
        assignment={selectedSession}
        students={classStudents}
        teacherId={selectedSession.teacher_id || ''}
        classId={selectedClass}
        onBack={() => setSelectedSession(null)}
      />
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Gestion des Présences par Séance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Sélectionner une classe</label>
            <Select 
              value={selectedClass} 
              onValueChange={setSelectedClass}
              disabled={classesLoading || classes.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  classesLoading ? "Chargement..." : 
                  classes.length === 0 ? "Aucune classe disponible" : 
                  "Choisir une classe"
                } />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClass && (
            assignmentsLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Chargement des séances...</p>
              </div>
            ) : (
              <SessionsList
                assignments={sessions}
                onSelectSession={setSelectedSession}
              />
            )
          )}
        </div>

        {!selectedClass && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Sélectionnez une classe pour voir les séances</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

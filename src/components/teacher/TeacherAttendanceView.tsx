import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { useAssignments } from "@/hooks/useAssignments";
import { SessionsList } from "./SessionsList";
import { SessionAttendanceManager } from "./SessionAttendanceManager";

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  firstname: string;
  lastname: string;
  class_id: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  type: string;
  subjects?: {
    id: string;
    name: string;
  } | null;
}

interface TeacherAttendanceViewProps {
  teacherClasses: Array<{ class_id: string; classes: Class }>;
  students: Student[];
  teacherId: string;
}

export function TeacherAttendanceView({ 
  teacherClasses, 
  students,
  teacherId 
}: TeacherAttendanceViewProps) {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<Assignment | null>(null);
  
  const { assignments, loading } = useAssignments({ 
    classId: selectedClass,
    teacherId: teacherId 
  });

  const classData = teacherClasses.find(tc => tc.class_id === selectedClass)?.classes;
  const classStudents = students.filter(s => s.class_id === selectedClass);

  // Filtrer uniquement les assignments de type 'course' ou qui ont des horaires (ce sont des séances)
  const sessions = (assignments || []).filter(a => 
    a.session_date && a.start_time && a.end_time
  );

  if (selectedSession && classData) {
    return (
      <SessionAttendanceManager
        assignment={selectedSession}
        students={classStudents}
        teacherId={teacherId}
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
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une classe" />
              </SelectTrigger>
              <SelectContent>
                {teacherClasses.map((tc) => (
                  <SelectItem key={tc.class_id} value={tc.class_id}>
                    {tc.classes.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClass && (
            loading ? (
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
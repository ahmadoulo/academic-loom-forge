import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { AttendanceHistory } from "./AttendanceHistory";

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
  const [showHistory, setShowHistory] = useState(false);

  const handleViewHistory = () => {
    if (selectedClass) {
      setShowHistory(true);
    }
  };

  const classData = teacherClasses.find(tc => tc.class_id === selectedClass)?.classes;
  const classStudents = students.filter(s => s.class_id === selectedClass);

  if (showHistory && classData) {
    return (
      <AttendanceHistory
        classData={classData}
        students={classStudents}
        teacherId={teacherId}
        onBack={() => setShowHistory(false)}
      />
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Historique des Présences
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
            <Button onClick={handleViewHistory} className="w-full">
              Voir l'historique des présences
            </Button>
          )}
        </div>

        {!selectedClass && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Sélectionnez une classe pour commencer</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
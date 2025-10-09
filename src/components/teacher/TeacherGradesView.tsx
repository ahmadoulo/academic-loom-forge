import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BookOpen } from "lucide-react";
import { StudentsGrading } from "./StudentsGrading";

interface Class {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  class_id: string;
}

interface Student {
  id: string;
  firstname: string;
  lastname: string;
  class_id: string;
}

interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  teacher_id: string;
  grade: number;
  grade_type: string;
  comment?: string;
  created_at: string;
}

interface TeacherGradesViewProps {
  teacherClasses: Array<{ class_id: string; classes: Class }>;
  subjects: Subject[];
  students: Student[];
  grades: Grade[];
  onSaveGrade: (studentId: string, subjectId: string, grade: number, gradeType: string, comment?: string) => Promise<void>;
  onDeleteGrade: (gradeId: string) => Promise<void>;
}

export function TeacherGradesView({ 
  teacherClasses, 
  subjects, 
  students, 
  grades,
  onSaveGrade,
  onDeleteGrade 
}: TeacherGradesViewProps) {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [showGrading, setShowGrading] = useState(false);

  const handleViewGrades = () => {
    if (selectedClass && selectedSubject) {
      setShowGrading(true);
    }
  };

  const classSubjects = subjects.filter(s => s.class_id === selectedClass);
  const classData = teacherClasses.find(tc => tc.class_id === selectedClass)?.classes;
  const subjectData = subjects.find(s => s.id === selectedSubject);
  const classStudents = students.filter(s => s.class_id === selectedClass);

  if (showGrading && classData && subjectData) {
    return (
      <StudentsGrading
        classData={classData}
        subjectData={subjectData}
        students={classStudents}
        grades={grades}
        onBack={() => setShowGrading(false)}
        onSaveGrade={onSaveGrade}
        onDeleteGrade={onDeleteGrade}
      />
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Gestion des Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Sélectionner une classe</label>
            <Select value={selectedClass} onValueChange={(value) => {
              setSelectedClass(value);
              setSelectedSubject("");
            }}>
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
            <div>
              <label className="text-sm font-medium mb-2 block">Sélectionner une matière</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une matière" />
                </SelectTrigger>
                <SelectContent>
                  {classSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedClass && selectedSubject && (
            <Button onClick={handleViewGrades} className="w-full">
              Voir les notes de la classe
            </Button>
          )}
        </div>

        {!selectedClass && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Sélectionnez une classe pour commencer</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
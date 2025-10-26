import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAcademicYear } from "@/hooks/useAcademicYear";

interface Subject {
  id: string;
  name: string;
}

interface Student {
  id: string;
  firstname: string;
  lastname: string;
  classes?: {
    name: string;
  };
}

interface Grade {
  id: string;
  grade: number;
  subject_id: string;
  created_at: string;
  subjects: {
    name: string;
  };
}

interface GradeInputProps {
  student: Student;
  subjects: Subject[];
  grades: Grade[];
  onSaveGrade: (studentId: string, subjectId: string, grade: number) => Promise<void>;
}

export const GradeInput = ({ student, subjects, grades, onSaveGrade }: GradeInputProps) => {
  const [newGrade, setNewGrade] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { selectedYear } = useAcademicYear();
  
  // Vérifier si l'année sélectionnée est l'année courante
  const isCurrentYear = selectedYear?.is_current === true;

  const handleSaveGrade = async () => {
    const gradeValue = parseFloat(newGrade);
    
    if (!selectedSubject) {
      toast({
        title: "Matière manquante",
        description: "Veuillez sélectionner une matière",
        variant: "destructive"
      });
      return;
    }
    
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 20) {
      toast({
        title: "Note invalide",
        description: "La note doit être comprise entre 0 et 20",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await onSaveGrade(student.id, selectedSubject, gradeValue);
      setNewGrade("");
      setSelectedSubject("");
    } catch (error) {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  // Get grades for this student
  const studentGrades = grades.filter(g => 
    subjects.some(s => s.id === g.subject_id)
  ).slice(0, 3); // Show last 3 grades

  const calculateAverage = () => {
    const studentSubjectGrades = grades.filter(g => 
      subjects.some(s => s.id === g.subject_id)
    );
    
    if (!studentSubjectGrades.length) return "N/A";
    
    const total = studentSubjectGrades.reduce((sum, grade) => sum + Number(grade.grade), 0);
    return (total / studentSubjectGrades.length).toFixed(1);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          {student.firstname} {student.lastname}
        </CardTitle>
        {student.classes && (
          <Badge variant="outline" className="w-fit">
            {student.classes.name}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grades display */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Moyenne:</span>
            <Badge variant="secondary" className="font-mono">
              {calculateAverage()}/20
            </Badge>
          </div>
          
          {studentGrades.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {studentGrades.map((grade, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {Number(grade.grade).toFixed(1)}/20 ({grade.subjects.name})
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Aucune note</span>
          )}
        </div>

        {/* Grade input */}
        <div className="flex gap-2">
          <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!isCurrentYear}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={isCurrentYear ? "Matière" : "Année non active"} />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Input
            type="number"
            min="0"
            max="20"
            step="0.5"
            placeholder="Note/20"
            value={newGrade}
            onChange={(e) => setNewGrade(e.target.value)}
            className="w-24"
            disabled={!isCurrentYear}
          />
          
          <Button
            size="sm"
            onClick={handleSaveGrade}
            disabled={!isCurrentYear || !newGrade || !selectedSubject || saving}
            title={!isCurrentYear ? "La notation est désactivée pour les années non actives" : ""}
          >
            {!isCurrentYear ? <Lock className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
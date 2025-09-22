import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, BookOpen, User } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  firstname: string;
  lastname: string;
}

interface Grade {
  id: string;
  student_id: string;
  grade: number;
  grade_type: string;
  created_at: string;
  comment?: string;
}

interface StudentsGradingProps {
  classData: {
    id: string;
    name: string;
  };
  subjectData: {
    id: string;
    name: string;
  };
  students: Student[];
  grades: Grade[];
  onBack: () => void;
  onSaveGrade: (studentId: string, subjectId: string, grade: number, gradeType: string, comment?: string) => Promise<void>;
  onDeleteGrade: (gradeId: string) => Promise<void>;
}

export const StudentsGrading = ({ 
  classData, 
  subjectData, 
  students, 
  grades,
  onBack, 
  onSaveGrade,
  onDeleteGrade
}: StudentsGradingProps) => {
  const [newGrades, setNewGrades] = useState<{[key: string]: { grade: string; type: string; comment: string }}>({});
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSaveGrade = async (studentId: string) => {
    const gradeData = newGrades[studentId];
    if (!gradeData?.grade || !gradeData?.type) {
      toast({
        title: "Données manquantes",
        description: "Veuillez saisir une note et sélectionner le type",
        variant: "destructive"
      });
      return;
    }

    const gradeValue = parseFloat(gradeData.grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 20) {
      toast({
        title: "Note invalide",
        description: "La note doit être comprise entre 0 et 20",
        variant: "destructive"
      });
      return;
    }

    setSaving(studentId);
    try {
      await onSaveGrade(studentId, subjectData.id, gradeValue, gradeData.type, gradeData.comment);
      setNewGrades(prev => ({
        ...prev,
        [studentId]: { grade: "", type: "", comment: "" }
      }));
    } catch (error) {
      // Error handled by parent
    } finally {
      setSaving(null);
    }
  };

  const updateNewGrade = (studentId: string, field: string, value: string) => {
    setNewGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const getStudentGrades = (studentId: string) => {
    return grades.filter(g => g.student_id === studentId);
  };

  const calculateAverage = (studentId: string) => {
    const studentGrades = getStudentGrades(studentId);
    if (studentGrades.length === 0) return "N/A";
    
    const total = studentGrades.reduce((sum, grade) => sum + Number(grade.grade), 0);
    return (total / studentGrades.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {subjectData.name} - {classData.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {students.length} étudiants à noter
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Students List */}
      <div className="space-y-4">
        {students.map((student) => {
          const studentGrades = getStudentGrades(student.id);
          const currentGrade = newGrades[student.id] || { grade: "", type: "", comment: "" };
          
          return (
            <Card key={student.id} className="p-6">
              <div className="space-y-4">
                {/* Student Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">{student.firstname} {student.lastname}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">Moyenne:</span>
                        <Badge variant="secondary" className="font-mono">
                          {calculateAverage(student.id)}/20
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Existing Grades */}
                {studentGrades.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Notes existantes:</h4>
                    <div className="flex gap-2 flex-wrap">
                      {studentGrades.map((grade) => (
                        <div key={grade.id} className="flex items-center gap-1 bg-muted p-2 rounded-md">
                          <Badge variant="outline" className="text-xs">
                            {Number(grade.grade).toFixed(1)}/20 ({grade.grade_type})
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              if (window.confirm('Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.')) {
                                onDeleteGrade(grade.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Grade Input */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Note /20</label>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      placeholder="0.0"
                      value={currentGrade.grade}
                      onChange={(e) => updateNewGrade(student.id, 'grade', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Type</label>
                    <Select 
                      value={currentGrade.type} 
                      onValueChange={(value) => updateNewGrade(student.id, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="controle">Contrôle</SelectItem>
                        <SelectItem value="examen">Examen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-2">
                    <label className="text-xs text-muted-foreground">Commentaire (optionnel)</label>
                    <Input
                      placeholder="Commentaire..."
                      value={currentGrade.comment}
                      onChange={(e) => updateNewGrade(student.id, 'comment', e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={() => handleSaveGrade(student.id)}
                    disabled={!currentGrade.grade || !currentGrade.type || saving === student.id}
                    className="flex-shrink-0"
                  >
                    {saving === student.id ? (
                      "..."
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

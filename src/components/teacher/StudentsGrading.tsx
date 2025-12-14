import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Plus, Trash2, BookOpen, User, Download, Lock, Calendar } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { generateTeacherGradesReport } from "@/utils/teacherGradesPdfExport";
import { useSchools } from "@/hooks/useSchools";
import { imageUrlToBase64 } from "@/utils/imageToBase64";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useSemester } from "@/hooks/useSemester";

interface Student {
  id: string;
  firstname: string;
  lastname: string;
}

interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  grade: number;
  grade_type: string;
  created_at: string;
  comment?: string;
  school_semester_id?: string;
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
  schoolId?: string;
  students: Student[];
  grades: Grade[];
  onBack: () => void;
  onSaveGrade: (studentId: string, subjectId: string, grade: number, gradeType: string, comment?: string) => Promise<void>;
  onDeleteGrade: (gradeId: string) => Promise<void>;
}

export const StudentsGrading = ({ 
  classData, 
  subjectData,
  schoolId,
  students, 
  grades,
  onBack, 
  onSaveGrade,
  onDeleteGrade
}: StudentsGradingProps) => {
  const [newGrades, setNewGrades] = useState<{[key: string]: { grade: string; type: string; comment: string }}>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { getSchoolById } = useSchools();
  const [school, setSchool] = useState<any>(null);
  const [logoBase64, setLogoBase64] = useState<string>();
  const { selectedYear } = useAcademicYear();
  const { currentSemester } = useSemester();
  
  // Vérifier si l'année sélectionnée est l'année courante
  const isCurrentYear = selectedYear?.is_current === true;
  
  React.useEffect(() => {
    if (!schoolId) return;
    const loadSchool = async () => {
      const schoolData = await getSchoolById(schoolId);
      setSchool(schoolData);
      if (schoolData?.logo_url) {
        try {
          const base64 = await imageUrlToBase64(schoolData.logo_url);
          setLogoBase64(base64);
        } catch (error) {
          console.error("Erreur conversion logo:", error);
        }
      }
    };
    loadSchool();
  }, [schoolId]);

  // Filtrer les notes par semestre actuel
  const filteredGrades = useMemo(() => {
    if (!currentSemester) return grades;
    return grades.filter(g => g.school_semester_id === currentSemester.id);
  }, [grades, currentSemester]);

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
    return filteredGrades.filter(g => g.student_id === studentId && g.subject_id === subjectData.id);
  };

  const calculateAverage = (studentId: string) => {
    const studentGrades = getStudentGrades(studentId);
    if (studentGrades.length === 0) return "N/A";
    
    const total = studentGrades.reduce((sum, grade) => sum + Number(grade.grade), 0);
    return (total / studentGrades.length).toFixed(1);
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      await generateTeacherGradesReport(
        classData, 
        subjectData, 
        students, 
        filteredGrades,
        school?.name || 'École',
        logoBase64,
        school?.academic_year
      );
      toast({
        title: "PDF généré",
        description: "Le rapport des notes a été téléchargé avec succès",
      });
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert pour année non-courante */}
      {!isCurrentYear && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Vous consultez une année scolaire non active. La notation est désactivée.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  {subjectData.name} - {classData.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {students.length} étudiants
                  </span>
                  {currentSemester && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Calendar className="h-3 w-3" />
                      {currentSemester.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button 
              onClick={handleGeneratePDF}
              disabled={generating}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              {generating ? "..." : "PDF"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Students List */}
      <div className="space-y-3">
        {students.map((student) => {
          const studentGrades = getStudentGrades(student.id);
          const currentGrade = newGrades[student.id] || { grade: "", type: "", comment: "" };
          
          return (
            <Card key={student.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Student Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{student.firstname} {student.lastname}</h3>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Moyenne:</span>
                          <Badge variant="secondary" className="font-mono text-xs h-5">
                            {calculateAverage(student.id)}/20
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Existing Grades */}
                  {studentGrades.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-medium text-muted-foreground">Notes ({currentSemester?.name || 'Semestre'}):</h4>
                      <div className="flex gap-1.5 flex-wrap">
                        {studentGrades.map((grade) => (
                          <div key={grade.id} className="flex items-center gap-1 bg-muted/70 px-2 py-1 rounded-md">
                            <span className="text-xs font-medium">
                              {Number(grade.grade).toFixed(1)}/20
                            </span>
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              {grade.grade_type}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 w-5 p-0 hover:bg-destructive/10"
                              onClick={() => {
                                if (window.confirm('Supprimer cette note ?')) {
                                  onDeleteGrade(grade.id);
                                }
                              }}
                              disabled={!isCurrentYear}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Grade Input */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-2 flex-1">
                      <div className="w-20">
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          placeholder="Note"
                          value={currentGrade.grade}
                          onChange={(e) => updateNewGrade(student.id, 'grade', e.target.value)}
                          className="h-9 text-sm"
                          disabled={!isCurrentYear}
                        />
                      </div>
                      
                      <div className="w-28">
                        <Select 
                          value={currentGrade.type} 
                          onValueChange={(value) => updateNewGrade(student.id, 'type', value)}
                          disabled={!isCurrentYear}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="controle">Contrôle</SelectItem>
                            <SelectItem value="examen">Examen</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1 hidden sm:block">
                        <Input
                          placeholder="Commentaire..."
                          value={currentGrade.comment}
                          onChange={(e) => updateNewGrade(student.id, 'comment', e.target.value)}
                          disabled={!isCurrentYear}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSaveGrade(student.id)}
                      disabled={!isCurrentYear || !currentGrade.grade || !currentGrade.type || saving === student.id}
                      size="sm"
                      className="h-9 gap-1"
                    >
                      {saving === student.id ? "..." : <><Plus className="h-3.5 w-3.5" /> Ajouter</>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

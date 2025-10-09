import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, Loader2 } from "lucide-react";
import { generateSchoolGradesReport } from "@/utils/schoolGradesPdfExport";
import { useToast } from "@/hooks/use-toast";

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

interface Subject {
  id: string;
  name: string;
  class_id: string;
}

interface Class {
  id: string;
  name: string;
}

interface SchoolGradesViewProps {
  classes: Class[];
  students: Student[];
  grades: Grade[];
  subjects: Subject[];
  loading: boolean;
}

export function SchoolGradesView({ classes, students, grades, subjects, loading }: SchoolGradesViewProps) {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const filteredStudents = selectedClass === "all" 
    ? students 
    : students.filter(s => s.class_id === selectedClass);

  const getStudentGrades = (studentId: string) => {
    return grades.filter(g => g.student_id === studentId);
  };

  const calculateAverage = (studentId: string) => {
    const studentGrades = getStudentGrades(studentId);
    if (studentGrades.length === 0) return "N/A";
    
    const total = studentGrades.reduce((sum, grade) => sum + Number(grade.grade), 0);
    return (total / studentGrades.length).toFixed(1);
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || "Inconnu";
  };

  const handleExportPDF = async () => {
    setGenerating(true);
    try {
      const classData = selectedClass === "all" 
        ? { id: "all", name: "Toutes les classes" }
        : classes.find(c => c.id === selectedClass) || { id: "", name: "" };

      await generateSchoolGradesReport(
        classData,
        filteredStudents,
        grades,
        subjects
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
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Notes des Étudiants
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrer par classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleExportPDF}
              disabled={generating || filteredStudents.length === 0}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {generating ? "Génération..." : "Exporter PDF"}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">Chargement...</span>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-lg">Aucun étudiant trouvé</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Étudiant</TableHead>
                      <TableHead className="min-w-[120px]">Classe</TableHead>
                      <TableHead className="min-w-[100px] text-center">Nombre Notes</TableHead>
                      <TableHead className="min-w-[100px] text-center">Moyenne</TableHead>
                      <TableHead className="min-w-[300px]">Dernières notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const studentClass = classes.find(c => c.id === student.class_id);
                      const studentGrades = getStudentGrades(student.id);
                      const lastGrades = studentGrades.slice(-3).reverse();
                      const average = calculateAverage(student.id);
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {student.firstname} {student.lastname}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline">
                              {studentClass?.name || "Non assignée"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <Badge variant="secondary">{studentGrades.length}</Badge>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <Badge 
                              variant={average === "N/A" ? "outline" : Number(average) >= 10 ? "default" : "destructive"}
                            >
                              {average === "N/A" ? "N/A" : `${average}/20`}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex gap-2 flex-wrap">
                              {lastGrades.length > 0 ? (
                                lastGrades.map((grade) => (
                                  <Badge 
                                    key={grade.id} 
                                    variant="outline" 
                                    className="text-xs"
                                  >
                                    {getSubjectName(grade.subject_id)}: {Number(grade.grade).toFixed(1)}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">Aucune note</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
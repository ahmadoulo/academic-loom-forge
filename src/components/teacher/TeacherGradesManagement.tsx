import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, Loader2, ArrowLeft, FileDown, Search, Edit2, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSchools } from "@/hooks/useSchools";
import { useSchoolSemesters } from "@/hooks/useSchoolSemesters";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useGrades } from "@/hooks/useGrades";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

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
  exam_date?: string;
  school_semester_id?: string;
  is_modified?: boolean;
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

interface TeacherGradesManagementProps {
  teacherId: string;
  schoolId: string;
  teacherClasses: Array<{ class_id: string; classes: Class }>;
  students: Student[];
  subjects: Subject[];
}

export function TeacherGradesManagement({ 
  teacherId,
  schoolId,
  teacherClasses, 
  students, 
  subjects 
}: TeacherGradesManagementProps) {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editComment, setEditComment] = useState<string>("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();
  const { selectedYear } = useAcademicYear();
  
  const { semesters } = useSchoolSemesters(schoolId, undefined);
  const { grades, updateGrade, deleteGrade, refetch } = useGrades(
    undefined, 
    undefined, 
    teacherId, 
    selectedYear?.id, 
    selectedSemester && selectedSemester !== "all" ? selectedSemester : undefined
  );

  React.useEffect(() => {
    if (semesters.length > 0 && !selectedSemester) {
      const currentSemester = semesters.find(s => s.is_actual);
      if (currentSemester) {
        setSelectedSemester(currentSemester.id);
      }
    }
  }, [semesters]);

  const displayGrades = grades as Grade[];

  const filteredStudents = students.filter((s) => {
    const matchesClass = selectedClass === "all" || s.class_id === selectedClass;
    const matchesSearch =
      searchQuery === "" ||
      s.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastname.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const getStudentGrades = (studentId: string) => {
    let studentGrades = displayGrades.filter(g => g.student_id === studentId);
    
    if (selectedSubject !== "all") {
      studentGrades = studentGrades.filter(g => g.subject_id === selectedSubject);
    }
    
    return studentGrades;
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

  const handleEditGrade = (grade: Grade) => {
    if (grade.is_modified) {
      toast({
        title: "Modification impossible",
        description: "Cette note a déjà été modifiée une fois",
        variant: "destructive"
      });
      return;
    }
    
    setEditingGrade(grade.id);
    setEditValue(grade.grade.toString());
    setEditComment(grade.comment || "");
  };

  const handleSaveEdit = async (gradeId: string) => {
    try {
      const numericGrade = parseFloat(editValue);
      if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 20) {
        toast({
          title: "Erreur",
          description: "La note doit être entre 0 et 20",
          variant: "destructive"
        });
        return;
      }

      await updateGrade(gradeId, {
        grade: numericGrade,
        comment: editComment,
      });

      toast({
        title: "Note modifiée",
        description: "La note a été mise à jour avec succès. Vous ne pourrez plus la modifier.",
      });

      setEditingGrade(null);
      setEditValue("");
      setEditComment("");
      await refetch();
    } catch (error) {
      console.error('Erreur modification note:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la note",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingGrade(null);
    setEditValue("");
    setEditComment("");
  };

  const handleDeleteGrade = async (gradeId: string) => {
    try {
      await deleteGrade(gradeId);
      toast({
        title: "Note supprimée",
        description: "La note a été supprimée avec succès",
      });
      setDeleteConfirmId(null);
      await refetch();
    } catch (error) {
      console.error('Erreur suppression note:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la note",
        variant: "destructive"
      });
    }
  };

  const handleExportCSV = () => {
    try {
      const csvData = filteredStudents.map(student => {
        const studentClass = teacherClasses.find(tc => tc.class_id === student.class_id)?.classes;
        const studentGrades = getStudentGrades(student.id);
        const average = calculateAverage(student.id);
        
        return {
          'Prénom': student.firstname,
          'Nom': student.lastname,
          'Classe': studentClass?.name || 'N/A',
          'Nombre de notes': studentGrades.length,
          'Moyenne': average
        };
      });

      const headers = Object.keys(csvData[0] || {});
      const csv = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `notes_professeur_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      
      toast({
        title: "CSV exporté",
        description: "Les données ont été exportées avec succès",
      });
    } catch (error) {
      console.error('Erreur export CSV:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter en CSV",
        variant: "destructive"
      });
    }
  };

  if (selectedStudent) {
    const studentGrades = getStudentGrades(selectedStudent.id);
    const studentClass = teacherClasses.find(tc => tc.class_id === selectedStudent.class_id)?.classes;
    const average = calculateAverage(selectedStudent.id);
    
    const currentSemesterInfo = selectedSemester === "all" || !selectedSemester
      ? null
      : semesters.find(s => s.id === selectedSemester);
    
    const gradesBySubject = subjects
      .filter(subj => selectedSubject === "all" || subj.id === selectedSubject)
      .reduce((acc, subject) => {
        const subjectGrades = studentGrades.filter(g => g.subject_id === subject.id);
        if (subjectGrades.length > 0) {
          const subjectAverage = subjectGrades.reduce((sum, g) => sum + Number(g.grade), 0) / subjectGrades.length;
          acc.push({
            subject,
            grades: subjectGrades,
            average: subjectAverage
          });
        }
        return acc;
      }, [] as Array<{ subject: Subject; grades: Grade[]; average: number }>);

    return (
      <div className="space-y-4">
        <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-background to-accent/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedStudent(null)}
                className="gap-2 hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <div className="flex flex-col items-center">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {selectedStudent.firstname} {selectedStudent.lastname}
                </CardTitle>
                {currentSemesterInfo && (
                  <Badge variant="outline" className="mt-2 border-primary/40 text-primary font-medium">
                    {currentSemesterInfo.name}
                  </Badge>
                )}
              </div>
              <div className="w-24" />
            </div>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Badge variant="secondary" className="text-base px-4 py-1.5">
                {studentClass?.name}
              </Badge>
              <Badge variant="outline" className="text-base px-4 py-1.5">
                {studentGrades.length} note(s)
              </Badge>
              <Badge 
                variant={Number(average) >= 10 ? "default" : "destructive"}
                className="text-lg px-5 py-1.5 font-bold"
              >
                Moyenne: {average}/20
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-6">
              {gradesBySubject.map(({ subject, grades: subjectGrades, average: subjectAvg }) => (
                <Card key={subject.id} className="border-primary/10 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-xl flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        {subject.name}
                      </h3>
                      <Badge 
                        variant={subjectAvg >= 10 ? "default" : "destructive"}
                        className="text-base px-4 py-1.5 font-semibold"
                      >
                        Moyenne: {subjectAvg.toFixed(2)}/20
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subjectGrades.map(grade => (
                        <div 
                          key={grade.id} 
                          className="group relative border-2 rounded-xl p-4 bg-gradient-to-br from-background to-accent/5 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary" className="text-xs font-medium">
                              {grade.grade_type === 'examen' ? 'Examen' : 
                               grade.grade_type === 'controle' ? 'Contrôle' : 
                               'Devoir'}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {editingGrade === grade.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSaveEdit(grade.id)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Save className="h-3 w-3 text-emerald-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                    className="h-7 w-7 p-0"
                                  >
                                    <X className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditGrade(grade)}
                                    disabled={grade.is_modified}
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title={grade.is_modified ? "Note déjà modifiée" : "Modifier"}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeleteConfirmId(grade.id)}
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {editingGrade === grade.id ? (
                            <div className="space-y-2">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                min="0"
                                max="20"
                                step="0.5"
                                className="h-8"
                              />
                              <Input
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                                placeholder="Commentaire..."
                                className="h-8 text-xs"
                              />
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <span className={`font-bold text-2xl ${Number(grade.grade) >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                  {Number(grade.grade).toFixed(1)}
                                </span>
                                {grade.is_modified && (
                                  <Badge variant="outline" className="text-xs">
                                    Modifiée
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-medium mt-2">
                                {grade.exam_date 
                                  ? new Date(grade.exam_date).toLocaleDateString('fr-FR', { 
                                      day: 'numeric', 
                                      month: 'long', 
                                      year: 'numeric' 
                                    })
                                  : new Date(grade.created_at).toLocaleDateString('fr-FR', { 
                                      day: 'numeric', 
                                      month: 'long', 
                                      year: 'numeric' 
                                    })
                                }
                              </p>
                              {grade.comment && (
                                <p className="text-sm mt-3 pt-3 border-t text-muted-foreground italic">
                                  "{grade.comment}"
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
              {gradesBySubject.length === 0 && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">Aucune note disponible</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={() => deleteConfirmId && handleDeleteGrade(deleteConfirmId)}>
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-background to-accent/5">
        <CardHeader className="pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                Gestion des Notes
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Consultez et modifiez les notes de vos étudiants (1 modification par note)
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un étudiant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-primary/20 focus:border-primary/40 transition-colors"
                />
              </div>
              
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-full sm:w-[220px] border-primary/20 hover:border-primary/40 transition-colors">
                  <SelectValue placeholder="Filtrer par semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les semestres</SelectItem>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id}>
                      {sem.name}{sem.is_actual && " (Actuel)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-[220px] border-primary/20 hover:border-primary/40 transition-colors">
                  <SelectValue placeholder="Filtrer par classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {teacherClasses.map((tc) => (
                    <SelectItem key={tc.class_id} value={tc.class_id}>
                      {tc.classes.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full sm:w-[220px] border-primary/20 hover:border-primary/40 transition-colors">
                  <SelectValue placeholder="Filtrer par matière" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les matières</SelectItem>
                  {subjects.map((subj) => (
                    <SelectItem key={subj.id} value={subj.id}>
                      {subj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            
              <Button 
                onClick={handleExportCSV}
                disabled={filteredStudents.length === 0}
                variant="outline"
                className="gap-2 border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
              >
                <FileDown className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-bold">Étudiant</TableHead>
                  <TableHead className="font-bold">Classe</TableHead>
                  <TableHead className="font-bold text-center">Notes</TableHead>
                  <TableHead className="font-bold text-center">Moyenne</TableHead>
                  <TableHead className="font-bold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">Aucun étudiant trouvé</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const studentGrades = getStudentGrades(student.id);
                    const average = calculateAverage(student.id);
                    const studentClass = teacherClasses.find(tc => tc.class_id === student.class_id)?.classes;

                    return (
                      <TableRow key={student.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium">
                          {student.firstname} {student.lastname}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{studentClass?.name || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{studentGrades.length}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={average !== "N/A" && Number(average) >= 10 ? "default" : "destructive"}
                            className="font-bold"
                          >
                            {average}/20
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedStudent(student)}
                            className="hover:bg-primary/10"
                          >
                            Voir détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
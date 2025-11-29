import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, Loader2, ArrowLeft, FileDown, Search, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSchools } from "@/hooks/useSchools";
import { useSchoolSemesters } from "@/hooks/useSchoolSemesters";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useGrades } from "@/hooks/useGrades";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { GradeBonusDialog } from "./GradeBonusDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  bonus?: number;
  bonus_reason?: string;
  bonus_given_by?: string;
  bonus_given_at?: string;
  bonus_given_by_credential?: {
    first_name: string;
    last_name: string;
  } | null;
  teachers?: {
    firstname: string;
    lastname: string;
  };
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
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGradeForBonus] = useState<Grade | null>(null);
  
  const { toast } = useToast();
  const { selectedYear } = useAcademicYear();
  
  const { semesters } = useSchoolSemesters(schoolId, undefined);
  const { grades, updateGrade, deleteGrade, addBonus, refetch } = useGrades(
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

  const handleAddBonus = async (bonus: number, reason: string) => {
    if (!selectedGrade) return;
    await addBonus(selectedGrade.id, bonus, reason);
    setSelectedGradeForBonus(null);
    await refetch();
  };

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
    
    const total = studentGrades.reduce((sum, grade) => sum + Number(grade.grade) + (grade.bonus || 0), 0);
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
          const subjectAverage = subjectGrades.reduce((sum, g) => sum + Number(g.grade) + (g.bonus || 0), 0) / subjectGrades.length;
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
        <Button variant="ghost" size="sm" className="gap-1 mb-4" onClick={() => setSelectedStudent(null)}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-background to-accent/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              Notes de {selectedStudent.firstname} {selectedStudent.lastname}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold">Informations de l'étudiant</h3>
                <p>
                  <span className="font-medium">Classe:</span> {studentClass?.name || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Moyenne générale:</span> {average}
                </p>
                {currentSemesterInfo && (
                  <p>
                    <span className="font-medium">Semestre:</span> {currentSemesterInfo.name}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold">Détails par matière</h3>
                {gradesBySubject.length > 0 ? (
                  <ul className="list-none space-y-2">
                    {gradesBySubject.map(({ subject, grades, average }) => (
                      <li key={subject.id} className="border rounded-md p-3 shadow-sm">
                        <p className="font-semibold">{subject.name}</p>
                        <p className="text-sm">
                          Moyenne: {average.toFixed(1)} ({grades.length} notes)
                        </p>
                        {grades.map(grade => (
                          <div key={grade.id} className="text-xs text-muted-foreground mt-1">
                            {grade.grade_type}: {grade.grade} {grade.comment ? `(${grade.comment})` : ''}
                          </div>
                        ))}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Aucune note disponible pour ce semestre/matière.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
                Consultez et gérez les notes que vous avez assignées
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
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
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
          <div className="rounded-lg border border-border/50 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/40">
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Note</TableHead>
                  <TableHead className="text-center">Bonus</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Commentaire</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.flatMap(student => 
                  getStudentGrades(student.id).map(grade => {
                    const studentClass = teacherClasses.find(tc => tc.class_id === student.class_id)?.classes;
                    return (
                      <TableRow key={grade.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium">
                          {student.firstname} {student.lastname}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{studentClass?.name}</Badge>
                        </TableCell>
                        <TableCell>{getSubjectName(grade.subject_id)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {grade.grade_type === 'examen' ? 'Examen' : 
                             grade.grade_type === 'controle' ? 'Contrôle' : 
                             'Devoir'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-semibold">
                            {grade.grade.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {grade.bonus && grade.bonus > 0 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="gap-1 cursor-help bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-500/20">
                                    <Star className="h-3 w-3 fill-current" />
                                    +{grade.bonus}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="font-semibold mb-1">Raison du bonus:</p>
                                  <p className="text-sm">{grade.bonus_reason}</p>
                                  {(grade.bonus_given_by_credential || grade.teachers) && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Par: {grade.bonus_given_by_credential
                                        ? `${grade.bonus_given_by_credential.first_name} ${grade.bonus_given_by_credential.last_name}`
                                        : `${grade.teachers?.firstname} ${grade.teachers?.lastname}`}
                                    </p>
                                  )}
                                  {grade.bonus_given_at && (
                                    <p className="text-xs text-muted-foreground">
                                      Le: {format(new Date(grade.bonus_given_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {grade.exam_date ? format(new Date(grade.exam_date), 'dd MMM yyyy', { locale: fr }) : '-'}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {grade.comment || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedGradeForBonus(grade);
                              setBonusDialogOpen(true);
                            }}
                            className="gap-1.5"
                          >
                            <Star className="h-4 w-4" />
                            Bonus
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                {filteredStudents.flatMap(s => getStudentGrades(s.id)).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">Aucune note à afficher</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedGrade && (
        <GradeBonusDialog
          open={bonusDialogOpen}
          onOpenChange={setBonusDialogOpen}
          studentName={`${students.find(s => s.id === selectedGrade.student_id)?.firstname} ${students.find(s => s.id === selectedGrade.student_id)?.lastname}`}
          currentGrade={selectedGrade.grade}
          currentBonus={selectedGrade.bonus || 0}
          onAddBonus={handleAddBonus}
        />
      )}
      
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
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
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && handleDeleteGrade(deleteConfirmId)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

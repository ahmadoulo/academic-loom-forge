import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, TrendingUp, Loader2, GraduationCap, Plus, ArrowLeft } from "lucide-react";
import { useTeachers } from "@/hooks/useTeachers";
import { useStudents } from "@/hooks/useStudents";
import { useGrades } from "@/hooks/useGrades";
import { useSubjects } from "@/hooks/useSubjects";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { useSchools } from "@/hooks/useSchools";
import { useClasses } from "@/hooks/useClasses";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useSchoolSemesters } from "@/hooks/useSchoolSemesters";
import { useSemester } from "@/hooks/useSemester";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnalyticsDashboard } from "@/components/analytics/Dashboard";
import { ClassCard } from "@/components/teacher/ClassCard";
import { StudentsGrading } from "@/components/teacher/StudentsGrading";
import { ActiveSessionsPanel } from "@/components/teacher/ActiveSessionsPanel";
import { QRCodeGenerator } from "@/components/teacher/QRCodeGenerator";
import { AssignmentForm } from "@/components/teacher/AssignmentForm";
import { TeacherCalendarSection } from "@/components/teacher/TeacherCalendarSection";
import { SessionsList } from "@/components/teacher/SessionsList";
import { SessionAttendanceManager } from "@/components/teacher/SessionAttendanceManager";
import { TeacherGradesView } from "@/components/teacher/TeacherGradesView";
import { TeacherAttendanceView } from "@/components/teacher/TeacherAttendanceView";
import { ExamDocumentForm } from "@/components/teacher/ExamDocumentForm";
import { ExamDocumentsList } from "@/components/teacher/ExamDocumentsList";
import { useAssignments } from "@/hooks/useAssignments";
import { useExamDocuments, CreateExamDocumentData } from "@/hooks/useExamDocuments";
import { TeacherSidebar } from "@/components/layout/TeacherSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { EventsSection } from "@/components/school/EventsSection";
import { AnnouncementsSection } from "@/components/school/AnnouncementsSection";
import { SemesterProvider } from "@/hooks/useSemester";
import { downloadExamPdf } from "@/utils/examPdfExport";
import { toast } from "sonner";

const TeacherDashboardContent = ({ teacherId }: { teacherId: string | undefined }) => {
  const [teacher, setTeacher] = useState<any>(null);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'overview' | 'grading' | 'session-attendance' | 'qr-session'>('overview');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editingExamData, setEditingExamData] = useState<CreateExamDocumentData | null>(null);
  
  // Get current teacher first to get school_id
  const { teachers } = useTeachers();
  const currentTeacher = teachers.find(t => t.id === teacherId);

  // Update teacher state when currentTeacher is loaded
  useEffect(() => {
    if (currentTeacher) {
      setTeacher(currentTeacher);
      setTeacherLoading(false);
    } else if (teachers.length > 0) {
      // Teachers loaded but current teacher not found
      setTeacherLoading(false);
    }
  }, [currentTeacher, teachers]);
  
  // Get school information
  const { schools } = useSchools();
  const school = schools.find(s => s.id === currentTeacher?.school_id);
  
  // Get classes
  const { classes } = useClasses(currentTeacher?.school_id);
  
  // Get semesters for filter
  const { semesters } = useSchoolSemesters(currentTeacher?.school_id);
  
  // Get teacher's assigned classes
  const { teacherClasses } = useTeacherClasses(teacherId);
  const teacherClassIds = teacherClasses.map(tc => tc.class_id);
  
  // Get assignments for teacher
  const { assignments } = useAssignments({ teacherId });
  
  // Get academic year for filtering
  const { getYearForDisplay } = useAcademicYear();
  const displayYearId = getYearForDisplay();
  const { currentSemester } = useSemester();
  
  // Exam documents management
  const {
    teacherExams,
    isLoadingTeacherExams,
    fetchExamQuestions,
    createExam,
    submitExam,
    deleteExam,
    isCreating,
    updateExam,
    isUpdating,
  } = useExamDocuments(teacherId, currentTeacher?.school_id);
  
  // Get students from teacher's classes
  const { students } = useStudents(currentTeacher?.school_id);
  const teacherStudents = students.filter(student => 
    teacherClassIds.includes(student.class_id)
  );
  
  // Get subjects assigned to this teacher
  const { subjects } = useSubjects(currentTeacher?.school_id, undefined, teacherId);
  // useGrades avec filtrage par semestre
  const { grades: filteredGrades, createGrade, deleteGrade } = useGrades(
    undefined, 
    undefined, 
    teacherId, 
    displayYearId, 
    selectedSemester === "all" ? undefined : selectedSemester
  );

  const handleViewStudents = (classId: string, subjectId: string) => {
    const classData = teacherClasses.find(tc => tc.class_id === classId);
    const subjectData = subjects.find(s => s.id === subjectId);
    
    if (classData && subjectData) {
      setSelectedClass(classData.classes);
      setSelectedSubject(subjectData);
      setCurrentView('grading');
    }
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
    setSelectedClass(null);
    setSelectedSubject(null);
    setSelectedSession(null);
  };

  const handleViewSession = (session: any, classData: any) => {
    setSelectedSession(session);
    setSelectedClass(classData);
    setCurrentView('qr-session');
  };

  const handleSelectSession = (assignment: any) => {
    // Trouver la classe associée à cette séance
    const classData = teacherClasses.find(tc => tc.class_id === assignment.class_id);
    if (classData) {
      setSelectedSession(assignment);
      setSelectedClass(classData.classes);
      setCurrentView('session-attendance');
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    await deleteGrade(gradeId);
  };

  const handleExportGradesCSV = (classId: string, subjectId: string) => {
    try {
      const classData = teacherClasses.find(tc => tc.class_id === classId);
      const subjectData = subjects.find(s => s.id === subjectId);
      const classStudents = students.filter(s => s.class_id === classId);
      
      const csvData = classStudents.map(student => {
        const studentGrades = filteredGrades.filter(g => g.student_id === student.id && g.subject_id === subjectId);
        const average = studentGrades.length > 0
          ? (studentGrades.reduce((sum, g) => sum + Number(g.grade), 0) / studentGrades.length).toFixed(2)
          : 'N/A';
        
        return {
          'Prénom': student.firstname,
          'Nom': student.lastname,
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
      link.download = `notes_${classData?.classes.name}_${subjectData?.name}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      
      toast.success("CSV exporté avec succès");
    } catch (error) {
      console.error('Erreur export CSV:', error);
      toast.error("Erreur lors de l'export CSV");
    }
  };

  // Exam document handlers
  const handleCreateExam = async (data: any) => {
    if (!teacherId || !currentTeacher?.school_id || !displayYearId) return;
    
    try {
      await createExam({
        data,
        teacherId,
        schoolId: currentTeacher.school_id,
        schoolYearId: displayYearId,
        schoolSemesterId: currentSemester?.id || null,
      });
      setIsCreatingExam(false);
      setEditingExamId(null);
      setEditingExamData(null);
    } catch (error) {
      console.error('Error creating exam:', error);
    }
  };

  const handleSubmitExam = async (examId: string) => {
    try {
      await submitExam(examId);
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      await deleteExam(examId);
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
  };

  const handleExportExam = async (examId: string) => {
    try {
      const exam = teacherExams?.find((e: any) => e.id === examId);
      if (!exam) return;

      const questions = await fetchExamQuestions(examId);
      
      await downloadExamPdf({
        exam,
        questions: questions.map((q: any) => ({
          ...q,
          table_data: q.table_data as { rows: number; cols: number; cells: string[] } | null,
        })),
        schoolName: school?.name || '',
        schoolLogoUrl: school?.logo_url,
      }, `examen_${exam.exam_type}_${exam.subjects?.name}.pdf`);
    } catch (error) {
      console.error('Error exporting exam:', error);
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  const handleEditExam = async (examId: string) => {
    const exam = teacherExams?.find((e: any) => e.id === examId);
    if (!exam) return;

    try {
      const questionsData = await fetchExamQuestions(examId);

      const mappedQuestions = questionsData.map((q: any) => ({
        question_number: q.question_number,
        question_text: q.question_text,
        points: q.points,
        has_choices: q.has_choices,
        is_multiple_choice: q.is_multiple_choice,
        table_data: q.table_data as { rows: number; cols: number; cells: string[] } | null,
        answers: (q.exam_answers || []).map((a: any) => ({
          answer_text: a.answer_text,
          is_correct: a.is_correct,
        })),
      }));

      setEditingExamId(examId);
      setEditingExamData({
        subject_id: exam.subject_id,
        class_id: exam.class_id,
        exam_type: exam.exam_type,
        duration_minutes: exam.duration_minutes,
        documents_allowed: exam.documents_allowed,
        answer_on_document: exam.answer_on_document ?? true,
        questions: mappedQuestions,
      });
      setIsCreatingExam(true);
    } catch (error) {
      console.error('Error loading exam for edit:', error);
      toast.error("Erreur lors du chargement du document d'examen");
    }
  };

  const handleUpdateExam = async (data: any) => {
    if (!editingExamId) return;
    try {
      await updateExam({ examId: editingExamId, data });
      setEditingExamId(null);
      setEditingExamData(null);
      setIsCreatingExam(false);
    } catch (error) {
      console.error('Error updating exam:', error);
    }
  };

  const handleSaveGrade = async (studentId: string, subjectId: string, grade: number, gradeType: string = 'controle', comment?: string) => {
    if (!teacherId) return;
    
    await createGrade({
      student_id: studentId,
      teacher_id: teacherId,
      subject_id: subjectId,
      grade: grade,
      grade_type: gradeType,
      exam_date: new Date().toISOString().split('T')[0],
      comment: comment || `Note ${gradeType} ajoutée le ${new Date().toLocaleDateString()}`
    });
  };

  // Group students by class
  const studentsByClass = teacherStudents.reduce((acc, student) => {
    const className = student.classes?.name || 'Sans classe';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(student);
    return acc;
  }, {} as { [key: string]: any[] });

  if (teacherLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Professeur non trouvé</h1>
          <p className="text-muted-foreground">L'identifiant du professeur n'est pas valide.</p>
        </div>
      </div>
    );
  }

  // Check if account is inactive or archived
  if (teacher.status === 'inactive' || teacher.archived) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-destructive">Accès refusé</h1>
          <p className="text-muted-foreground">
            Ce compte professeur est {teacher.archived ? 'archivé' : 'inactif'} et n'a plus accès à l'interface.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Veuillez contacter l'administrateur pour plus d'informations.
          </p>
        </div>
      </div>
    );
  }

  const handleSettingsClick = () => {
    // Add settings functionality if needed
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <TeacherSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          <AuthenticatedHeader
            title={`Prof. ${teacher.firstname} ${teacher.lastname}`}
            onSettingsClick={handleSettingsClick}
            showMobileMenu={true}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            schoolName={school?.name}
            schoolLogoUrl={school?.logo_url || undefined}
            userRole="teacher"
            sidebarContent={
              <TeacherSidebar 
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            }
          />
          
          <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-background overflow-y-auto">
        {/* Teacher Info Card - Only on Dashboard */}
        {activeTab === "dashboard" && (
          <Card className="mb-4 lg:mb-6">
            <CardHeader className="pb-3 px-3 sm:px-6">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-base sm:text-lg lg:text-xl">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                  <span className="hidden sm:inline">Interface Professeur - </span>
                  <span className="sm:hidden">Prof. </span>
                </div>
                <span className="truncate">{teacher.firstname} {teacher.lastname}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-xs sm:text-sm lg:text-base">Matières:</span>
                  </div>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">{subjects.length}</Badge>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-xs sm:text-sm lg:text-base">Élèves:</span>
                  </div>
                  <span className="text-primary font-semibold text-xs sm:text-sm flex-shrink-0">{teacherStudents.length}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-xs sm:text-sm lg:text-base">Classes:</span>
                  </div>
                  <span className="text-primary font-semibold text-xs sm:text-sm flex-shrink-0">{teacherClasses.length}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-xs sm:text-sm lg:text-base">Notes:</span>
                  </div>
                  <span className="text-primary font-semibold text-xs sm:text-sm flex-shrink-0">{filteredGrades.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Semester Filter - Only show on grades page */}
        {activeTab === "grades" && semesters.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium whitespace-nowrap">Filtrer par semestre:</label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Sélectionner un semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les semestres</SelectItem>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id}>
                        {semester.name} {semester.is_actual && "(Actuel)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {currentView === 'grading' && selectedClass && selectedSubject ? (
          <StudentsGrading
            classData={selectedClass}
            subjectData={selectedSubject}
            schoolId={currentTeacher?.school_id}
            students={teacherStudents.filter(s => s.class_id === selectedClass.id)}
            grades={filteredGrades}
            onBack={handleBackToOverview}
            onSaveGrade={handleSaveGrade}
            onDeleteGrade={handleDeleteGrade}
          />
        ) : currentView === 'session-attendance' && selectedSession && selectedClass ? (
          <SessionAttendanceManager
            assignment={selectedSession}
            students={teacherStudents.filter(s => s.class_id === selectedClass.id)}
            teacherId={teacherId || ''}
            classId={selectedClass.id}
            onBack={handleBackToOverview}
          />
        ) : currentView === 'qr-session' && selectedSession && selectedClass ? (
          <QRCodeGenerator
            session={selectedSession}
            classData={selectedClass}
            onBack={handleBackToOverview}
          />
        ) : (
          <div className="space-y-4 lg:space-y-6">
            {/* Active Sessions Panel */}
            <ActiveSessionsPanel
              teacherId={teacherId || ''}
              classes={teacherClasses.map(tc => tc.classes).filter(Boolean)}
              onViewSession={handleViewSession}
            />

            {activeTab === "dashboard" && (
              <div className="space-y-4 lg:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  {teacherClasses.map((teacherClass) => {
                    const classStudents = teacherStudents.filter(s => s.class_id === teacherClass.class_id);
                    const classSubjects = subjects.filter(s => s.class_id === teacherClass.class_id);
                    
                    return (
                      <ClassCard
                        key={teacherClass.id}
                        classData={teacherClass.classes}
                        studentCount={classStudents.length}
                        subjects={classSubjects}
                        onViewStudents={handleViewStudents}
                      />
                    );
                  })}
                </div>
                
                <SessionsList 
                  assignments={assignments}
                  onSelectSession={handleSelectSession}
                />
              </div>
            )}

            {activeTab === "calendar" && (
              <TeacherCalendarSection teacherId={teacherId || ''} />
            )}

            {activeTab === "assignments" && (
              <AssignmentForm teacherId={teacherId || ''} />
            )}

            {activeTab === "grades" && (
              <TeacherGradesView
                teacherClasses={teacherClasses}
                subjects={subjects}
                students={teacherStudents}
                grades={filteredGrades}
                onSaveGrade={handleSaveGrade}
                onDeleteGrade={handleDeleteGrade}
                onExportCSV={handleExportGradesCSV}
              />
            )}

            {activeTab === "attendance-view" && (
              <TeacherAttendanceView
                teacherClasses={teacherClasses}
                students={teacherStudents}
                teacherId={teacherId || ''}
              />
            )}

            {activeTab === "classes" && (
              <div className="space-y-4 lg:space-y-6">
                {teacherClasses.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">Aucune classe assignée pour le moment.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    {teacherClasses.map((teacherClass) => {
                      const classStudents = teacherStudents.filter(s => s.class_id === teacherClass.class_id);
                      const classSubjects = subjects.filter(s => s.class_id === teacherClass.class_id);
                      
                      return (
                        <ClassCard
                          key={teacherClass.id}
                          classData={teacherClass.classes}
                          studentCount={classStudents.length}
                          subjects={classSubjects}
                          onViewStudents={handleViewStudents}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "exams" && (
              <div className="space-y-4">
                {isCreatingExam ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{editingExamId ? "Modifier un document d'examen" : "Créer un document d'examen"}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setIsCreatingExam(false);
                          setEditingExamId(null);
                          setEditingExamData(null);
                        }}>
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ExamDocumentForm
                        subjects={subjects.map(s => {
                          const classData = classes.find(c => c.id === s.class_id);
                          return { 
                            id: s.id, 
                            name: s.name, 
                            class_id: s.class_id,
                            class_name: classData?.name || 'Classe inconnue'
                          };
                        })}
                        onSubmit={editingExamId ? handleUpdateExam : handleCreateExam}
                        onCancel={() => {
                          setIsCreatingExam(false);
                          setEditingExamId(null);
                          setEditingExamData(null);
                        }}
                        isCreating={editingExamId ? isUpdating : isCreating}
                        initialData={editingExamData || undefined}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <Select onValueChange={(value) => {
                        if (value === "all") {
                          setActiveTab("exams");
                        } else {
                          setActiveTab("exams");
                        }
                      }}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue placeholder="Filtrer par classe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les classes</SelectItem>
                          {teacherClasses.map((tc) => (
                            <SelectItem key={tc.id} value={tc.class_id}>
                              {tc.classes?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select>
                        <SelectTrigger className="w-full sm:w-[200px]">
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
                      
                      <Button onClick={() => setIsCreatingExam(true)} className="ml-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau document
                      </Button>
                    </div>
                    {isLoadingTeacherExams ? (
                      <Card>
                        <CardContent className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </CardContent>
                      </Card>
                    ) : (
                      <ExamDocumentsList
                        exams={teacherExams || []}
                        onSubmit={handleSubmitExam}
                        onDelete={handleDeleteExam}
                        onExport={handleExportExam}
                        onEdit={handleEditExam}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "subjects" && (
              <div className="space-y-4 lg:space-y-6">
                {subjects.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">Aucune matière assignée pour le moment.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {subjects.map((subject) => {
                      const subjectGrades = filteredGrades.filter(g => g.subject_id === subject.id);
                      const uniqueStudents = [...new Set(subjectGrades.map(g => g.student_id))].length;
                      const averageGrade = subjectGrades.length > 0 
                        ? (subjectGrades.reduce((sum, g) => sum + Number(g.grade), 0) / subjectGrades.length).toFixed(1)
                        : "N/A";

                      return (
                        <Card key={subject.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <BookOpen className="h-5 w-5" />
                              <span className="truncate">{subject.name}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Étudiants évalués:</span>
                                <Badge variant="secondary">{uniqueStudents}</Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Notes saisies:</span>
                                <Badge variant="outline">{subjectGrades.length}</Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Moyenne générale:</span>
                                <Badge variant="default">{averageGrade}/20</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-4 lg:space-y-6">
                <AnalyticsDashboard teacherId={teacherId} />
              </div>
            )}
            
            {activeTab === "events" && currentTeacher && (
              <EventsSection schoolId={currentTeacher.school_id} isAdmin={false} />
            )}
            
            {activeTab === "announcements" && currentTeacher && (
              <AnnouncementsSection schoolId={currentTeacher.school_id} isAdmin={false} userRole="teacher" />
            )}
          </div>
        )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const TeacherDashboard = () => {
  const { teacherId } = useParams();
  const { teachers } = useTeachers();
  const currentTeacher = teachers.find(t => t.id === teacherId);

  console.log('[TeacherDashboard] Mounting with teacherId:', teacherId, 'currentTeacher:', currentTeacher);
  console.log('[TeacherDashboard] schoolId for SemesterProvider:', currentTeacher?.school_id);

  return (
    <SemesterProvider schoolId={currentTeacher?.school_id}>
      <TeacherDashboardContent teacherId={teacherId} />
    </SemesterProvider>
  );
};

export default TeacherDashboard;
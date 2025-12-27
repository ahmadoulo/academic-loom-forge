import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { StudentImport } from "@/components/school/StudentImport";
import { StudentForm } from "@/components/school/StudentForm";
import { ClassForm } from "@/components/school/ClassForm";
import { ClassEditDialog } from "@/components/school/ClassEditDialog";
import { SubjectForm } from "@/components/school/SubjectForm";
import { useClassSubjects } from "@/hooks/useClassSubjects";
import { TeacherClassAssignment } from "@/components/admin/TeacherClassAssignment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, BookOpen, School, GraduationCap, Plus, Loader2, UserPlus, TrendingUp, Archive, Pencil, RotateCcw } from "lucide-react";
import { useSchools } from "@/hooks/useSchools";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useClassesByYear } from "@/hooks/useClassesByYear";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useTeachers } from "@/hooks/useTeachers";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useGrades } from "@/hooks/useGrades";
import { useAssignments } from "@/hooks/useAssignments";
import { AnalyticsDashboard } from "@/components/analytics/Dashboard";
import { 
  SchoolOverviewHeader, 
  SchoolMetricsGrid, 
  SchoolInsightsGrid,
  SchoolQuickActions,
  SchoolActivityFeed
} from "@/components/school/dashboard";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { SchoolSettings } from "@/components/settings/SchoolSettings";
import { SchoolSettingsPage } from "@/components/settings/SchoolSettingsPage";
import { SchoolSidebar } from "@/components/layout/SchoolSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { StudentsListSection } from "@/components/school/StudentsListSection";
import { StudentsManagementSection } from "@/components/school/StudentsManagementSection";
import { ClassesListSection } from "@/components/school/ClassesListSection";
import { SchoolUserManagement } from "@/components/settings/SchoolUserManagement";
import { ClassDetailsView } from "@/components/school/ClassDetailsView";
import { DocumentRequestsManagement } from "@/components/school/DocumentRequestsManagement";
import { DocumentsManagementSection } from "@/components/school/DocumentsManagementSection";
import { StudentAccountsSection } from "@/components/school/StudentAccountsSection";
import { SchoolCalendarSection } from "@/components/school/SchoolCalendarSection";
import { CalendarSummary } from "@/components/calendar/CalendarSummary";
import { SchoolGradesView } from "@/components/school/SchoolGradesView";
import { SchoolAttendanceView } from "@/components/school/SchoolAttendanceView";
import { useAttendance } from "@/hooks/useAttendance";
import { EventsSection } from "@/components/school/EventsSection";
import { AnnouncementsSection } from "@/components/school/AnnouncementsSection";
import { useAutoAbsenceNotifications } from "@/hooks/useAutoAbsenceNotifications";
import { useSchoolAnalytics } from "@/hooks/useSchoolAnalytics";
import { useDocumentRequests } from "@/hooks/useDocumentRequests";
import { ClassroomManagement } from "@/components/school/ClassroomManagement";
import { ClassroomAvailabilityWidget } from "@/components/school/ClassroomAvailabilityWidget";
import { TimetableSection } from "@/components/school/TimetableSection";
import { BulletinSection } from "@/components/school/BulletinSection";
import { YearPreparationWizard } from "@/components/school/YearPreparationWizard";
import { ArchivedStudentsSection } from "@/components/school/ArchivedStudentsSection";
import { ArchivedSubjectsSection } from "@/components/school/ArchivedSubjectsSection";
import { TeachersManagementSection } from "@/components/school/TeachersManagementSection";
import { SubjectsManagementSection } from "@/components/school/SubjectsManagementSection";
import SchoolExamDocumentsPage from "./SchoolExamDocumentsPage";
import { NotificationsSection } from "@/components/school/NotificationsSection";
import { ArchivedTeachersSection } from "@/components/school/ArchivedTeachersSection";
import { ArchivedClassesSection } from "@/components/school/ArchivedClassesSection";
import { TeacherForm } from "@/components/school/TeacherForm";
import { useIsReadOnly } from "@/hooks/useIsReadOnly";
import { SemesterProvider } from "@/hooks/useSemester";
import { SemesterManagement } from "@/components/settings/SemesterManagement";
import { SchoolSubscriptionSection } from "@/components/school/SchoolSubscriptionSection";
import { useSubscriptionLimits, checkCanAddStudent, checkCanAddTeacher } from "@/hooks/useSubscriptionLimits";
import { AdmissionsManagement } from "@/components/school/AdmissionsManagement";
import { useAdmissions } from "@/hooks/useAdmissions";
import { ClipboardList } from "lucide-react";
import { AdvancedSearchDialog } from "@/components/school/AdvancedSearchDialog";
import { TextbooksSection } from "@/components/school/TextbooksSection";
import { AbsenceJustificationsManagement } from "@/components/school/AbsenceJustificationsManagement";

const SchoolDashboard = () => {
  const { schoolId } = useParams();
  const [activeTab, setActiveTab] = useState("analytics");
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [showClassDetails, setShowClassDetails] = useState(false);
  
  // Check if read-only mode (viewing past year)
  const { isReadOnly, selectedYear, currentYear } = useIsReadOnly();
  
  // Dialog states
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editingClass, setEditingClass] = useState<any>(null);
  
  // Archive dialog states (for students)
  const [archiveDialog, setArchiveDialog] = useState<{
    open: boolean;
    type?: 'student';
    id?: string;
    name?: string;
  }>({ open: false });
  
  // Delete dialog states (for other entities)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type?: 'teacher' | 'class' | 'subject';
    id?: string;
    name?: string;
  }>({ open: false });
  
  const { getSchoolByIdentifier } = useSchools();
  const [school, setSchool] = useState<any>(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  
  // Check subscription limits
  const limits = useSubscriptionLimits(school?.id || '');
  
  // Activer l'envoi automatique des notifications d'absence en arrière-plan
  useAutoAbsenceNotifications();
  
  // Initialize school data
  React.useEffect(() => {
    const fetchSchool = async () => {
      if (schoolId) {
        try {
          const schoolData = await getSchoolByIdentifier(schoolId);
          setSchool(schoolData);
        } catch (error) {
          console.error('Error fetching school:', error);
        } finally {
          setSchoolLoading(false);
        }
      }
    };
    fetchSchool();
  }, [schoolId, getSchoolByIdentifier]);

  // Get academic year for filtering - use getYearForDisplay to respect user selection
  const { getYearForDisplay, currentYear: contextCurrentYear, selectedYear: contextSelectedYear, loading: academicYearLoading } = useAcademicYear();
  // IMPORTANT: Ne jamais utiliser 'all' dans le dashboard école - toujours filtrer par une année spécifique
  // Et ne pas charger les classes tant que l'année n'est pas définie
  const displayYearId = contextSelectedYear?.id === 'all' 
    ? contextCurrentYear?.id 
    : (getYearForDisplay() || contextCurrentYear?.id);
  
  const { students, loading: studentsLoading, importStudents, createStudent, updateStudent, archiveStudent, restoreStudent } = useStudents(school?.id);
  
  // Use filtered classes by selected year (or current if none selected)
  // IMPORTANT: On passe displayYearId uniquement s'il est défini pour éviter de charger toutes les classes
  const { createClass: createClassOriginal, updateClass: updateClassOriginal, archiveClass: archiveClassOriginal, restoreClass } = useClasses(school?.id);
  const { classes, loading: classesLoading, refetch: refetchClasses } = useClassesByYear(school?.id, displayYearId);
  
  // Get current year classes for forms (only current year classes should be available in forms)
  const { classes: currentYearClasses, loading: currentYearClassesLoading } = useClassesByYear(school?.id, currentYear?.id);
  
  // Wrapper functions to refresh filtered data after mutations
  const createClass = async (data: any) => {
    const result = await createClassOriginal(data);
    await refetchClasses();
    return result;
  };
  
  const updateClass = async (id: string, data: any) => {
    const result = await updateClassOriginal(id, data);
    await refetchClasses();
    return result;
  };
  
  const archiveClass = async (id: string) => {
    await archiveClassOriginal(id);
    await refetchClasses();
  };
  
  const { teachers, loading: teachersLoading, createTeacher, updateTeacher, archiveTeacher, restoreTeacher } = useTeachers(school?.id);
  const { assignTeacherToClass } = useTeacherClasses();
  const { subjects, loading: subjectsLoading, createSubject, updateSubject, archiveSubject } = useSubjects(school?.id);
  const { grades } = useGrades(undefined, undefined, undefined, displayYearId);
  const { assignments } = useAssignments({ schoolId: school?.id });
  const { attendance, loading: attendanceLoading } = useAttendance();
  const { 
    absencesByClass, 
    topStudentsByClass, 
    performanceBySubject,
    gradeDistribution,
    attendanceByMonth,
    overallStats,
    loading: analyticsLoading 
  } = useSchoolAnalytics(school?.id);
  const { requests: documentRequests, loading: documentRequestsLoading } = useDocumentRequests(school?.id);
  const { admissions } = useAdmissions(school?.id);

  // Calculate enhanced stats
  const stats = useMemo(() => {
    const schoolStudents = students.filter(s => s.school_id === school?.id);
    const schoolTeachers = teachers.filter(t => t.school_id === school?.id);
    const schoolClasses = classes.filter(c => c.school_id === school?.id);
    const schoolSubjects = subjects.filter(s => s.school_id === school?.id);
    const schoolGrades = grades.filter(g => {
      const student = students.find(s => s.id === g.student_id);
      return student?.school_id === school?.id;
    });

    const avgGrade = schoolGrades.length > 0 
      ? schoolGrades.reduce((sum, g) => sum + Number(g.grade), 0) / schoolGrades.length 
      : 0;

    return {
      totalStudents: schoolStudents.length,
      totalTeachers: schoolTeachers.length,
      totalClasses: schoolClasses.length,
      totalSubjects: schoolSubjects.length,
      totalGrades: schoolGrades.length,
      avgGrade: avgGrade.toFixed(1),
      avgStudentsPerClass: schoolClasses.length > 0 ? Math.round(schoolStudents.length / schoolClasses.length) : 0
    };
  }, [students, teachers, classes, subjects, grades, school?.id]);

  // Generate recent activities
  const recentActivities = useMemo(() => {
    const activities: any[] = [];
    
    // Recent students
    students.slice(0, 2).forEach(student => {
      const studentClass = classes.find(c => c.id === student.class_id);
      activities.push({
        id: `student-${student.id}`,
        type: 'student' as const,
        title: `Étudiant inscrit: ${student.firstname} ${student.lastname}`,
        description: studentClass ? `Classe: ${studentClass.name}` : 'Classe non assignée',
        timestamp: student.created_at,
        status: 'success' as const
      });
    });

    // Recent grades
    grades.slice(0, 2).forEach(grade => {
      const student = students.find(s => s.id === grade.student_id);
      if (student && student.school_id === school?.id && student.firstname && student.lastname) {
        activities.push({
          id: `grade-${grade.id}`,
          type: 'grade' as const,
          title: `Note ajoutée: ${grade.grade}/20`,
          description: `Étudiant: ${student.firstname} ${student.lastname}`,
          timestamp: grade.created_at,
          status: Number(grade.grade) >= 10 ? 'success' as const : 'warning' as const
        });
      }
    });

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [students, grades, classes, school?.id]);

  // Helper functions to open dialogs with subscription limit checks
  const openStudentDialogWithLimit = () => {
    if (checkCanAddStudent(limits)) {
      setIsStudentDialogOpen(true);
    }
  };

  const openTeacherDialogWithLimit = () => {
    if (checkCanAddTeacher(limits)) {
      setEditingTeacher(null);
      setIsTeacherDialogOpen(true);
    }
  };

  const quickActions = [
    {
      title: "Nouvel Étudiant",
      description: "Inscrire un étudiant",
      icon: UserPlus,
      onClick: openStudentDialogWithLimit,
      variant: "default" as const
    },
    {
      title: "Nouvelle Classe",
      description: "Créer une classe",
      icon: School,
      onClick: () => setIsClassDialogOpen(true),
      variant: "outline" as const
    },
    {
      title: "Nouveau Professeur",
      description: "Ajouter un enseignant",
      icon: GraduationCap,
      onClick: openTeacherDialogWithLimit,
      variant: "outline" as const
    },
    {
      title: "Nouvelle Matière",
      description: "Créer une matière",
      icon: BookOpen,
      onClick: () => {
        setEditingSubject(null);
        setIsSubjectDialogOpen(true);
      },
      variant: "outline" as const
    }
  ];

  const handleCreateClass = async (classData: {
    name: string;
    cycle_id?: string;
    option_id?: string;
    year_level?: number;
    is_specialization?: boolean;
  }) => {
    if (!school?.id) return;
    
    try {
      await createClass({
        name: classData.name,
        school_id: school.id,
        cycle_id: classData.cycle_id,
        option_id: classData.option_id,
        year_level: classData.year_level,
        is_specialization: classData.is_specialization,
      });
      setIsClassDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateClass = async (classData: {
    name: string;
    cycle_id?: string;
    option_id?: string;
    year_level?: number;
    is_specialization?: boolean;
  }) => {
    if (!editingClass?.id) return;
    
    try {
      await updateClass(editingClass.id, classData);
      setEditingClass(null);
      toast.success('Classe mise à jour avec succès');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateOrUpdateSubject = async (subjectData: {
    name: string;
    class_id?: string | null;
    teacher_id?: string | null;
    coefficient: number;
    coefficient_type: 'coefficient' | 'credit';
  }) => {
    if (!school?.id) return;
    
    try {
      if (editingSubject) {
        // Update existing subject
        await updateSubject(editingSubject.id, {
          name: subjectData.name,
          class_id: subjectData.class_id === 'none' ? null : (subjectData.class_id || null),
          teacher_id: subjectData.teacher_id === 'none' ? null : (subjectData.teacher_id || null),
          coefficient: subjectData.coefficient || 1,
          coefficient_type: subjectData.coefficient_type || 'coefficient'
        });
      } else {
        // Create new subject
        await createSubject({
          name: subjectData.name,
          class_id: subjectData.class_id === 'none' ? undefined : (subjectData.class_id || undefined),
          school_id: school.id,
          teacher_id: subjectData.teacher_id === 'none' ? undefined : (subjectData.teacher_id || undefined),
          coefficient: subjectData.coefficient || 1,
          coefficient_type: subjectData.coefficient_type || 'coefficient'
        });
      }
      setIsSubjectDialogOpen(false);
      setEditingSubject(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleArchive = async () => {
    if (!archiveDialog.id) return;
    try {
      await archiveStudent(archiveDialog.id);
      setArchiveDialog({ open: false });
    } catch (error) {
      console.error("Erreur lors de l'archivage:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id || !deleteDialog.type) return;
    try {
      switch (deleteDialog.type) {
        case 'teacher':
          await archiveTeacher(deleteDialog.id);
          break;
        case 'class':
          await archiveClass(deleteDialog.id);
          break;
        case 'subject':
          await archiveSubject(deleteDialog.id);
          break;
      }
      setDeleteDialog({ open: false });
    } catch (error) {
      console.error("Erreur lors de l'archivage:", error);
    }
  };

  const handleImportStudents = async (importedStudents: any[]) => {
    if (!school?.id) return;
    
    const studentsData = importedStudents.map(student => ({
      firstname: student.firstname,
      lastname: student.lastname,
      email: student.email || "",
      class_id: student.class_id,
      school_id: school.id,
      cin_number: student.cin_number || `TEMP-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      birth_date: student.birth_date,
      student_phone: student.student_phone,
      parent_phone: student.parent_phone
    }));
    
    try {
      await importStudents(studentsData);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateStudent = async (studentData: {
    firstname: string;
    lastname: string;
    email?: string;
    class_id: string;
    birth_date?: string;
    cin_number: string;
    student_phone?: string;
    parent_phone?: string;
  }) => {
    // CRITICAL: Vérifier les limites AVANT toute création
    if (!checkCanAddStudent(limits)) {
      return;
    }
    
    if (!school?.id) {
      toast.error('Erreur: École non identifiée');
      return;
    }

    if (!createStudent || typeof createStudent !== 'function') {
      toast.error('Erreur: Function de création non disponible');
      return;
    }

    // Validation des données
    if (!studentData.firstname?.trim()) {
      toast.error('Le prénom est requis');
      return;
    }

    if (!studentData.lastname?.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    if (!studentData.class_id) {
      toast.error('La classe est requise');
      return;
    }

    if (!studentData.cin_number?.trim()) {
      toast.error('Le numéro CIN est requis');
      return;
    }

    try {
      const completeStudentData = {
        ...studentData,
        school_id: school.id,
      };
      
      await createStudent(completeStudentData);
      setIsStudentDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création de l\'étudiant:', error);
    }
  };

  const handleSettingsClick = () => {
    setActiveTab("settings");
  };

  const handleViewClassDetails = (classItem: any) => {
    setSelectedClass(classItem);
    setShowClassDetails(true);
  };

  const handleBackFromClassDetails = () => {
    setShowClassDetails(false);
    setSelectedClass(null);
  };

  if (schoolLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement de l'école...</span>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">École non trouvée</h1>
          <p className="text-muted-foreground">L'identifiant de l'école n'est pas valide.</p>
        </div>
      </div>
    );
  }

  return (
    <SemesterProvider schoolId={school?.id}>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <SchoolSidebar 
            schoolId={school.identifier}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        
          <div className="flex-1 flex flex-col min-w-0">
          <AuthenticatedHeader
            title={school.name}
            onSettingsClick={handleSettingsClick}
            showMobileMenu={true}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            schoolName={school.name}
            schoolLogoUrl={school.logo_url || undefined}
            userRole="admin"
            sidebarContent={
              <SchoolSidebar 
                schoolId={school.identifier}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            }
          />
          
            <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-background overflow-y-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 lg:mb-6">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold">Tableau de bord</h1>
                  <p className="text-sm text-muted-foreground">
                    Vue d'ensemble de l'école et accès rapide aux informations clés.
                  </p>
                </div>
                <AdvancedSearchDialog
                  schoolId={school.id}
                  students={students}
                  teachers={teachers}
                  classes={classes}
                  subjects={subjects}
                  grades={grades}
                  attendance={attendance}
                  assignments={assignments}
                />
              </div>
              {/* Analytics Dashboard - Reorganized SaaS Style */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  {/* Overview Header */}
                  <SchoolOverviewHeader
                    schoolName={school.name}
                    academicYear={selectedYear?.name || currentYear?.name}
                    totalStudents={stats.totalStudents}
                    totalClasses={stats.totalClasses}
                    avgGrade={Number(stats.avgGrade)}
                  />

                  {/* Metrics Grid */}
                  <SchoolMetricsGrid
                    totalStudents={stats.totalStudents}
                    totalTeachers={stats.totalTeachers}
                    totalClasses={stats.totalClasses}
                    totalSubjects={stats.totalSubjects}
                    avgGrade={Number(stats.avgGrade)}
                    successRate={overallStats?.successRate || 0}
                    attendanceRate={overallStats?.attendanceRate || 0}
                    studentsInDifficulty={overallStats?.studentsInDifficulty || 0}
                    avgStudentsPerClass={stats.avgStudentsPerClass}
                    totalGrades={stats.totalGrades}
                  />

                  {/* Quick Actions & Activity Feed */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SchoolQuickActions actions={quickActions} />
                    <div className="lg:col-span-2">
                      <SchoolActivityFeed activities={recentActivities} />
                    </div>
                  </div>

                  {/* Insights Grid */}
                  <SchoolInsightsGrid
                    absencesByClass={absencesByClass}
                    topStudentsByClass={topStudentsByClass}
                    documentRequests={documentRequests}
                    admissions={admissions}
                    loading={analyticsLoading || documentRequestsLoading}
                    onViewAdmissions={() => setActiveTab('admissions')}
                    classroomWidget={<ClassroomAvailabilityWidget schoolId={school.id} />}
                  />

                  {/* Analytics Charts */}
                  <AnalyticsDashboard 
                    schoolId={school.id}
                    performanceBySubject={performanceBySubject}
                    attendanceByMonth={attendanceByMonth}
                    gradeDistribution={gradeDistribution}
                    overallStats={overallStats}
                  />
                </div>
              )}

              {activeTab === "calendar" && (
                <SchoolCalendarSection 
                  schoolId={school.id}
                  classes={currentYearClasses}
                  teachers={teachers}
                />
              )}
              
              {activeTab === "grades" && (
                <div className="space-y-6">
                  <SchoolGradesView
                    schoolId={school.id}
                    classes={classes}
                    students={students}
                    grades={grades}
                    subjects={subjects}
                    loading={studentsLoading || subjectsLoading}
                  />
                </div>
              )}
              
              {activeTab === "attendance" && school?.id && (
                <div className="space-y-6">
                  <SchoolAttendanceView schoolId={school.id} />
                </div>
              )}

              {activeTab === "justifications" && school?.id && (
                <div className="space-y-6">
                  <AbsenceJustificationsManagement schoolId={school.id} />
                </div>
              )}
              
              {activeTab === "students" && (
                <div className="space-y-4 lg:space-y-6">
                  <div className="flex flex-col gap-4 items-start">
                    <div className="w-full">
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Gestion des Étudiants</h2>
                      <p className="text-gray-600 mt-1 text-sm lg:text-base">Gérez les inscriptions et informations des étudiants</p>
                    </div>
                    <Button onClick={openStudentDialogWithLimit} size="lg" className="gap-2 w-full sm:w-auto">
                      <UserPlus className="h-5 w-5" />
                      Ajouter un Étudiant
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    <StudentsManagementSection
                      schoolId={school.id}
                      students={students}
                      classes={currentYearClasses}
                      loading={studentsLoading}
                      onArchiveStudent={(id, name) => setArchiveDialog({
                        open: true,
                        type: 'student',
                        id,
                        name
                      })}
                      onUpdateStudent={async (id, data) => {
                        try {
                          await updateStudent(id, data);
                        } catch (error) {
                          console.error('Error updating student:', error);
                        }
                      }}
                      onCreateStudent={async (data) => {
                        try {
                          await createStudent(data);
                        } catch (error) {
                          console.error('Error creating student:', error);
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              
              {activeTab === "admissions" && school?.id && (
                <AdmissionsManagement 
                  schoolId={school.id}
                  schoolIdentifier={schoolId || ''}
                />
              )}
              
              {activeTab === "classes" && !showClassDetails && (
                <div className="space-y-6">
                  <ClassesListSection
                    classes={classes}
                    students={students}
                    loading={classesLoading}
                    onArchiveClass={(id, name) => setDeleteDialog({
                      open: true,
                      type: 'class',
                      id,
                      name
                    })}
                    onViewClassDetails={handleViewClassDetails}
                    onCreateClass={() => setIsClassDialogOpen(true)}
                    onEditClass={(classItem) => setEditingClass(classItem)}
                  />
                  
                  <ArchivedClassesSection schoolId={school.id} />
                </div>
              )}

              {activeTab === "classes" && showClassDetails && selectedClass && (
                <ClassDetailsView
                  classItem={selectedClass}
                  students={students}
                  onBack={handleBackFromClassDetails}
                  onAddStudent={() => setIsStudentDialogOpen(true)}
                />
              )}
              
              {activeTab === "subjects" && (
                <div className="space-y-6">
                  <SubjectsManagementSection
                    subjects={subjects}
                    classes={classes}
                    teachers={teachers}
                    loading={subjectsLoading}
                    onCreateSubject={() => {
                      setEditingSubject(null);
                      setIsSubjectDialogOpen(true);
                    }}
                    onEditSubject={(subject) => {
                      setEditingSubject(subject);
                      setIsSubjectDialogOpen(true);
                    }}
                    onArchiveSubject={(id, name) =>
                      setDeleteDialog({
                        open: true,
                        type: "subject",
                        id,
                        name,
                      })
                    }
                  />
                  
                  <ArchivedSubjectsSection schoolId={school.id} />
                </div>
              )}
              
              {/* Keep the old subject dialog below - it's used by the new component */}
              {activeTab === "subjects-old-hidden" && (
                <div className="space-y-4 lg:space-y-6" style={{ display: 'none' }}>
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <h2 className="text-xl font-semibold">Matières Enseignées</h2>
                    <Button onClick={() => {
                      setEditingSubject(null);
                      setIsSubjectDialogOpen(true);
                    }} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle Matière
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {subjects.map((subject) => {
                      const subjectClass = classes.find(c => c.id === subject.class_id);
                      const assignedTeacher = teachers.find(t => t.id === subject.teacher_id);
                      
                      return (
                        <Card key={subject.id} className="relative">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <BookOpen className="h-5 w-5" />
                              <span className="truncate">{subject.name}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium">Classe:</p>
                                <p className="text-sm text-muted-foreground">{subjectClass?.name || 'Non assignée'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Professeur:</p>
                                <p className="text-sm text-muted-foreground">
                                  {assignedTeacher ? `${assignedTeacher.firstname} ${assignedTeacher.lastname}` : 'Non assigné'}
                                </p>
                              </div>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                                onClick={() => {
                                  setEditingSubject(subject);
                                  setIsSubjectDialogOpen(true);
                                }}
                                title="Modifier cette matière"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => setDeleteDialog({
                                  open: true,
                                  type: 'subject',
                                  id: subject.id,
                                  name: subject.name
                                })}
                                title="Archiver cette matière"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  <ArchivedSubjectsSection schoolId={school.id} />
                </div>
              )}
              
              {activeTab === "teachers" && (
                <div className="space-y-6">
                  {isReadOnly && (
                    <div className="p-4 bg-muted rounded-lg border">
                      <p className="text-sm text-muted-foreground">
                        📚 Mode consultation - Vous visualisez l'année scolaire <strong>{selectedYear?.name}</strong>. 
                        Les modifications sont désactivées pour les années passées.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-4 items-start">
                    <div className="w-full">
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Gestion des Professeurs</h2>
                      <p className="text-gray-600 mt-1 text-sm lg:text-base">Gérez les professeurs, assignations et archives</p>
                    </div>
                    <Button 
                      onClick={openTeacherDialogWithLimit} 
                      size="lg" 
                      className="gap-2 w-full sm:w-auto"
                      disabled={isReadOnly}
                    >
                      <Plus className="h-5 w-5" />
                      Ajouter un Professeur
                    </Button>
                  </div>

                  <TeachersManagementSection
                    schoolId={school.id}
                    teachers={teachers}
                    loading={teachersLoading}
                    onArchiveTeacher={(id, name) => setDeleteDialog({
                      open: true,
                      type: 'teacher',
                      id,
                      name
                    })}
                    onUpdateTeacher={async (teacherId, data) => {
                      try {
                        await updateTeacher(teacherId, data);
                      } catch (error) {
                        console.error('Error updating teacher:', error);
                      }
                    }}
                    onCreateTeacher={async (data) => {
                      try {
                        await createTeacher(data);
                      } catch (error) {
                        console.error('Error creating teacher:', error);
                      }
                    }}
                  />
                </div>
              )}
              
              {activeTab === "settings" && (
                <SchoolSettingsPage schoolId={school.id} />
              )}
              
              {activeTab === "subscription" && school?.id && (
                <SchoolSubscriptionSection schoolId={school.id} />
              )}
              
              {activeTab === "document-requests" && school?.id && (
                <DocumentRequestsManagement schoolId={school.id} />
              )}
              
              {activeTab === "documents" && school?.id && (
                <DocumentsManagementSection schoolId={school.id} />
              )}
              
              {activeTab === "classrooms" && school?.id && (
                <ClassroomManagement schoolId={school.id} />
              )}
              
              {activeTab === "timetable" && school?.id && (
                <TimetableSection schoolId={school.id} schoolName={school.name} />
              )}
              
              {activeTab === "year-transition" && school?.id && (
                <YearPreparationWizard schoolId={school.id} />
              )}
              
              {activeTab === "semesters" && school?.id && (
                <SemesterManagement schoolId={school.id} />
              )}
              
              {activeTab === "events" && (
                <EventsSection schoolId={school.id} isAdmin={true} />
              )}

              {activeTab === "announcements" && (
                <AnnouncementsSection schoolId={school.id} isAdmin={true} userRole="admin" />
              )}
              
              {activeTab === "exams" && <SchoolExamDocumentsPage />}
              
              {activeTab === "notifications" && school?.id && (
                <NotificationsSection schoolId={school.id} />
              )}
              
              {activeTab === "bulletin" && (
                <BulletinSection
                  schoolId={school.id}
                  schoolName={school.name}
                  schoolLogoUrl={school.logo_url}
                  academicYear={school.academic_year}
                  students={students}
                  classes={classes}
                  grades={grades}
                  subjects={subjects}
                  loading={studentsLoading || subjectsLoading}
                />
              )}
              
              {activeTab === "textbooks" && school?.id && (
                <TextbooksSection schoolId={school.id} />
              )}
            </main>
          </div>
        </div>

      {/* Removed duplicate Student Dialog - only one is kept at the end of the file */}

      {/* Class Dialog */}
      <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une Classe</DialogTitle>
          </DialogHeader>
          <ClassForm 
            schoolId={school?.id || ''}
            onSubmit={handleCreateClass}
          />
        </DialogContent>
      </Dialog>

      {/* Teacher Form */}
      <TeacherForm
        open={isTeacherDialogOpen}
        onOpenChange={(open) => {
          setIsTeacherDialogOpen(open);
          if (!open) setEditingTeacher(null);
        }}
        schoolId={school?.id || ""}
        teacher={editingTeacher}
        onSuccess={() => {
          setEditingTeacher(null);
        }}
      />

      {/* Subject Dialog */}
      <Dialog open={isSubjectDialogOpen} onOpenChange={(open) => {
        setIsSubjectDialogOpen(open);
        if (!open) setEditingSubject(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Modifier la Matière' : 'Créer une Matière'}</DialogTitle>
          </DialogHeader>
          <SubjectForm
            onSubmit={handleCreateOrUpdateSubject}
            onCancel={() => {
              setIsSubjectDialogOpen(false);
              setEditingSubject(null);
            }}
            classes={currentYearClasses}
            teachers={teachers}
            initialData={editingSubject}
            isEditing={!!editingSubject}
          />
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <ConfirmationDialog
        open={archiveDialog.open}
        onOpenChange={(open) => setArchiveDialog({ ...archiveDialog, open })}
        title="Archiver l'étudiant"
        description={`Êtes-vous sûr de vouloir archiver "${archiveDialog.name}" ? L'étudiant conservera l'accès à ses données historiques mais ne sera plus visible dans la liste principale.`}
        onConfirm={handleArchive}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title={`Supprimer ${deleteDialog.type}`}
        description={`Êtes-vous sûr de vouloir supprimer "${deleteDialog.name}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
      />

      {/* Student Dialog */}
      <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un Étudiant</DialogTitle>
          </DialogHeader>
          <StudentForm
            onSubmit={handleCreateStudent}
            classes={currentYearClasses}
          />
        </DialogContent>
      </Dialog>

      {/* Class Edit Dialog */}
      <ClassEditDialog
        classToEdit={editingClass}
        schoolId={school?.id || ''}
        onClose={() => setEditingClass(null)}
        onUpdate={handleUpdateClass}
      />
    </SidebarProvider>
    </SemesterProvider>
  );
};

export default SchoolDashboard;
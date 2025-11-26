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
import { StatsCard } from "@/components/analytics/StatsCard";
import { QuickActions } from "@/components/analytics/QuickActions";
import { RecentActivity } from "@/components/analytics/RecentActivity";
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
import { TimetableSection } from "@/components/school/TimetableSection";
import { BulletinSection } from "@/components/school/BulletinSection";
import { YearPreparationWizard } from "@/components/school/YearPreparationWizard";
import { ArchivedStudentsSection } from "@/components/school/ArchivedStudentsSection";
import { ArchivedSubjectsSection } from "@/components/school/ArchivedSubjectsSection";
import { TeachersManagementSection } from "@/components/school/TeachersManagementSection";
import SchoolExamDocumentsPage from "./SchoolExamDocumentsPage";
import { NotificationsSection } from "@/components/school/NotificationsSection";
import { ArchivedTeachersSection } from "@/components/school/ArchivedTeachersSection";
import { ArchivedClassesSection } from "@/components/school/ArchivedClassesSection";
import { TeacherForm } from "@/components/school/TeacherForm";
import { useIsReadOnly } from "@/hooks/useIsReadOnly";
import { SemesterProvider } from "@/hooks/useSemester";
import { SemesterManagement } from "@/components/settings/SemesterManagement";
import { SchoolSubscriptionSection } from "@/components/school/SchoolSubscriptionSection";

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
  const { getYearForDisplay, currentYear: contextCurrentYear, selectedYear: contextSelectedYear } = useAcademicYear();
  // IMPORTANT: Ne jamais utiliser 'all' dans le dashboard école - toujours filtrer par une année spécifique
  const displayYearId = contextSelectedYear?.id === 'all' 
    ? contextCurrentYear?.id 
    : (getYearForDisplay() || contextCurrentYear?.id);
  
  const { students, loading: studentsLoading, importStudents, createStudent, updateStudent, archiveStudent, restoreStudent } = useStudents(school?.id);
  
  // Use filtered classes by selected year (or current if none selected)
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

  const quickActions = [
    {
      title: "Nouvel Étudiant",
      description: "Inscrire un étudiant",
      icon: UserPlus,
      onClick: () => setIsStudentDialogOpen(true),
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
      onClick: () => setIsTeacherDialogOpen(true),
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
  }) => {
    if (!school?.id) return;
    
    try {
      if (editingSubject) {
        // Update existing subject
        await updateSubject(editingSubject.id, {
          name: subjectData.name,
          class_id: subjectData.class_id === 'none' ? null : (subjectData.class_id || null),
          teacher_id: subjectData.teacher_id === 'none' ? null : (subjectData.teacher_id || null),
          coefficient: subjectData.coefficient || 1
        });
      } else {
        // Create new subject
        await createSubject({
          name: subjectData.name,
          class_id: subjectData.class_id === 'none' ? undefined : (subjectData.class_id || undefined),
          school_id: school.id,
          teacher_id: subjectData.teacher_id === 'none' ? undefined : (subjectData.teacher_id || undefined),
          coefficient: subjectData.coefficient || 1
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
    cin_number: string; // Requis maintenant
    student_phone?: string;
    parent_phone?: string;
  }) => {
    console.log('=== SchoolDashboard handleCreateStudent DÉBUT ===');
    console.log('Données reçues du formulaire:', studentData);
    console.log('schoolId disponible:', schoolId);
    console.log('school object:', school);
    console.log('school.id:', school?.id);
    console.log('createStudent function disponible:', typeof createStudent);
    console.log('classes disponibles:', classes);
    console.log('nombre de classes:', classes?.length);
    
    if (!school?.id) {
      console.error('❌ schoolId manquant');
      console.log('school object complet:', JSON.stringify(school, null, 2));
      toast.error('Erreur: École non identifiée');
      return;
    }

    if (!createStudent || typeof createStudent !== 'function') {
      console.error('❌ createStudent function non disponible');
      console.log('createStudent type:', typeof createStudent);
      toast.error('Erreur: Function de création non disponible');
      return;
    }

    // Validation supplémentaire des données
    if (!studentData.firstname?.trim()) {
      console.error('❌ Prénom manquant');
      toast.error('Le prénom est requis');
      return;
    }

    if (!studentData.lastname?.trim()) {
      console.error('❌ Nom manquant');
      toast.error('Le nom est requis');
      return;
    }

    if (!studentData.class_id) {
      console.error('❌ Classe non sélectionnée');
      toast.error('La classe est requise');
      return;
    }

    if (!studentData.cin_number?.trim()) {
      console.error('❌ CIN manquant');
      toast.error('Le numéro CIN est requis');
      return;
    }

    console.log('✅ Toutes les validations passées');

    try {
      const completeStudentData = {
        ...studentData,
        school_id: school.id,
      };
      
      console.log('Données complètes pour createStudent:', completeStudentData);
      console.log('🚀 Appel de createStudent...');
      
      const result = await createStudent(completeStudentData);
      console.log('✅ Résultat createStudent:', result);
      console.log('✅ Étudiant créé avec succès');
      
      console.log('🔒 Fermeture du dialog...');
      setIsStudentDialogOpen(false);
      console.log('✅ Dialog fermé');
      
      console.log('=== SchoolDashboard handleCreateStudent FIN SUCCESS ===');
    } catch (error) {
      console.error('❌ Erreur dans handleCreateStudent:', error);
      console.error('❌ Type d\'erreur:', typeof error);
      console.error('❌ Message d\'erreur:', error instanceof Error ? error.message : String(error));
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      
      // Log détaillé de l'erreur
      if (error && typeof error === 'object') {
        console.error('❌ Propriétés de l\'erreur:');
        Object.keys(error).forEach(key => {
          console.error(`   ${key}:`, (error as any)[key]);
        });
      }
      
      console.log('=== SchoolDashboard handleCreateStudent FIN ERREUR ===');
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
            {/* Enhanced Stats Cards - Only on Analytics Dashboard */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 lg:mb-6">
                <StatsCard
                  title="Étudiants"
                  value={stats.totalStudents}
                  icon={Users}
                  description="Inscrits dans l'école"
                  change={`Moyenne ${stats.avgStudentsPerClass} par classe`}
                  changeType="positive"
                />
                <StatsCard 
                  title="Classes"
                  value={stats.totalClasses}
                  icon={School}
                  description="Classes actives"
                  change={`${stats.totalSubjects} matières total`}
                  changeType="neutral"
                />
                <StatsCard 
                  title="Professeurs"
                  value={stats.totalTeachers}
                  icon={GraduationCap}
                  description="Enseignants actifs"
                  change={`${stats.totalSubjects} matières assignées`}
                  changeType="positive"
                />
                <StatsCard 
                  title="Moyenne Générale"
                  value={`${stats.avgGrade}/20`}
                  icon={TrendingUp}
                  description="Performance globale"
                  change={`${stats.totalGrades} notes saisies`}
                  changeType={Number(stats.avgGrade) >= 10 ? "positive" : "negative"}
                />
              </div>
            )}

            {/* Main Content */}
            <div className="space-y-6 lg:space-y-8">
              {activeTab === "analytics" && (
                <div className="space-y-6 lg:space-y-8">
                  {/* Dashboard Content Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 mb-6 lg:mb-8">
                    <div className="xl:col-span-1">
                      <QuickActions actions={quickActions} />
                    </div>
                    <div className="xl:col-span-2">
                      <RecentActivity activities={recentActivities} />
                    </div>
                  </div>
                  
                  {/* Nouvelles sections avec données réelles */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Absences par classe */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Absences par Classe</CardTitle>
                        <CardDescription>Résumé des absences par classe</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analyticsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : absencesByClass.length > 0 ? (
                          <div className="space-y-3">
                            {absencesByClass.slice(0, 5).map((item) => (
                              <div key={item.classId} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{item.className}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.totalAbsences} absences • {item.totalStudents} étudiants
                                  </p>
                                </div>
                                <Badge variant={item.absenceRate > 15 ? "destructive" : item.absenceRate > 10 ? "outline" : "default"}>
                                  {item.absenceRate.toFixed(1)}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">Aucune donnée d'absence disponible</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Demandes de documents */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Demandes de Documents</CardTitle>
                        <CardDescription>Résumé des demandes en cours</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {documentRequestsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : documentRequests.length > 0 ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="text-center p-3 border rounded-lg">
                                <div className="text-2xl font-bold">
                                  {documentRequests.filter(r => r.status === 'pending').length}
                                </div>
                                <div className="text-xs text-muted-foreground">En attente</div>
                              </div>
                              <div className="text-center p-3 border rounded-lg">
                                <div className="text-2xl font-bold">
                                  {documentRequests.filter(r => r.status === 'processing').length}
                                </div>
                                <div className="text-xs text-muted-foreground">En cours</div>
                              </div>
                              <div className="text-center p-3 border rounded-lg">
                                <div className="text-2xl font-bold">
                                  {documentRequests.filter(r => r.status === 'completed').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Complétées</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {documentRequests.slice(0, 3).map((request) => (
                                <div key={request.id} className="flex items-center justify-between p-2 border rounded text-sm">
                                  <span>{request.document_type}</span>
                                  <Badge variant={
                                    request.status === 'completed' ? 'default' : 
                                    request.status === 'processing' ? 'outline' : 
                                    'secondary'
                                  }>
                                    {request.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">Aucune demande de document</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Meilleurs étudiants */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Meilleurs Étudiants</CardTitle>
                      <CardDescription>Classement par moyenne générale</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analyticsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : topStudentsByClass.length > 0 ? (
                        <div className="space-y-2">
                          {topStudentsByClass.map((student, index) => (
                            <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                  index === 0 ? 'bg-yellow-500 text-white' :
                                  index === 1 ? 'bg-gray-400 text-white' :
                                  index === 2 ? 'bg-orange-600 text-white' :
                                  'bg-accent text-foreground'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{student.firstname} {student.lastname}</p>
                                  <p className="text-sm text-muted-foreground">{student.className}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">{student.average}/20</div>
                                <div className="text-xs text-muted-foreground">{student.totalGrades} notes</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">Aucune note disponible</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <AnalyticsDashboard 
                    schoolId={school.id}
                    performanceBySubject={performanceBySubject}
                    attendanceByMonth={attendanceByMonth}
                    gradeDistribution={gradeDistribution}
                    overallStats={overallStats}
                  />
                  
                  <CalendarSummary 
                    events={assignments.map(a => ({
                      id: a.id,
                      title: a.title,
                      session_date: a.session_date || a.due_date || "",
                      start_time: a.start_time || null,
                      end_time: a.end_time || null,
                      type: a.type,
                      class_name: a.classes?.name,
                    }))}
                    title="Séances à venir"
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
              
              {activeTab === "students" && (
                <div className="space-y-4 lg:space-y-6">
                  <div className="flex flex-col gap-4 items-start">
                    <div className="w-full">
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Gestion des Étudiants</h2>
                      <p className="text-gray-600 mt-1 text-sm lg:text-base">Gérez les inscriptions et informations des étudiants</p>
                    </div>
                    <Button onClick={() => setIsStudentDialogOpen(true)} size="lg" className="gap-2 w-full sm:w-auto">
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
                <div className="space-y-4 lg:space-y-6">
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
                      onClick={() => {
                        setEditingTeacher(null);
                        setIsTeacherDialogOpen(true);
                      }} 
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
            </div>
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
            schoolId={schoolId}
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
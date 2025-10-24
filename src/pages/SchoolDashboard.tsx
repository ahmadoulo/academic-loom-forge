import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { StudentImport } from "@/components/school/StudentImport";
import { StudentForm } from "@/components/school/StudentForm";
import { ClassForm } from "@/components/school/ClassForm";
import { useClassSubjects } from "@/hooks/useClassSubjects";
import { TeacherClassAssignment } from "@/components/admin/TeacherClassAssignment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, BookOpen, School, GraduationCap, Plus, Loader2, UserPlus, Trash2, TrendingUp } from "lucide-react";
import { useSchools } from "@/hooks/useSchools";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
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
import { SchoolSidebar } from "@/components/layout/SchoolSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { StudentsListSection } from "@/components/school/StudentsListSection";
import { ClassesListSection } from "@/components/school/ClassesListSection";
import { SchoolUserManagement } from "@/components/settings/SchoolUserManagement";
import { ClassDetailsView } from "@/components/school/ClassDetailsView";
import { DocumentRequestsManagement } from "@/components/school/DocumentRequestsManagement";
import { StudentAccountsSection } from "@/components/school/StudentAccountsSection";
import { SchoolCalendarSection } from "@/components/school/SchoolCalendarSection";
import { CalendarSummary } from "@/components/calendar/CalendarSummary";
import { SchoolGradesView } from "@/components/school/SchoolGradesView";
import { SchoolAttendanceView } from "@/components/school/SchoolAttendanceView";
import { useAttendance } from "@/hooks/useAttendance";
import { EventsSection } from "@/components/school/EventsSection";
import { AnnouncementsSection } from "@/components/school/AnnouncementsSection";
import { useSchoolAnalytics } from "@/hooks/useSchoolAnalytics";
import { useDocumentRequests } from "@/hooks/useDocumentRequests";
import { ClassroomManagement } from "@/components/school/ClassroomManagement";
import { TimetableSection } from "@/components/school/TimetableSection";
import { BulletinSection } from "@/components/school/BulletinSection";

const SchoolDashboard = () => {
  const { schoolId } = useParams();
  const [activeTab, setActiveTab] = useState("analytics");
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [showClassDetails, setShowClassDetails] = useState(false);
  
  // Dialog states
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newTeacher, setNewTeacher] = useState({ firstname: "", lastname: "", email: "", class_id: "" });
  const [newSubject, setNewSubject] = useState({ name: "", class_id: "", teacher_id: "" });
  
  // Delete dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type?: 'student' | 'teacher' | 'class' | 'subject';
    id?: string;
    name?: string;
  }>({ open: false });
  
  const { getSchoolByIdentifier } = useSchools();
  const [school, setSchool] = useState<any>(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  
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

  const { students, loading: studentsLoading, importStudents, createStudent, deleteStudent } = useStudents(school?.id);
  const { classes, loading: classesLoading, createClass, deleteClass } = useClasses(school?.id);
  const { teachers, loading: teachersLoading, createTeacher, deleteTeacher } = useTeachers(school?.id);
  const { assignTeacherToClass } = useTeacherClasses();
  const { subjects, loading: subjectsLoading, createSubject, deleteSubject } = useSubjects(school?.id);
  const { grades } = useGrades();
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
      onClick: () => setIsSubjectDialogOpen(true),
      variant: "outline" as const
    }
  ];

  const handleCreateClass = async (classData: {
    name: string;
    selectedSubjects: string[];
  }) => {
    if (!school?.id) return;
    
    try {
      const newClass = await createClass({
        name: classData.name,
        school_id: school.id
      });
      
      if (classData.selectedSubjects.length > 0 && newClass) {
        console.log('Assigning subjects to class:', classData.selectedSubjects);
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateTeacher = async () => {
    if (!newTeacher.firstname.trim() || !newTeacher.lastname.trim() || !school?.id) return;
    
    try {
      const createdTeacher = await createTeacher({
        firstname: newTeacher.firstname,
        lastname: newTeacher.lastname,
        email: newTeacher.email,
        school_id: school.id
      });
      
      // Si une classe est sélectionnée, assigner le professeur à cette classe
      if (newTeacher.class_id && createdTeacher) {
        await assignTeacherToClass({
          teacher_id: createdTeacher.id,
          class_id: newTeacher.class_id
        });
      }
      
      setNewTeacher({ firstname: "", lastname: "", email: "", class_id: "" });
      setIsTeacherDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubject.name.trim() || !newSubject.class_id || !school?.id) return;
    
    try {
      await createSubject({
        name: newSubject.name,
        class_id: newSubject.class_id,
        school_id: school.id,
        teacher_id: newSubject.teacher_id || undefined
      });
      setNewSubject({ name: "", class_id: "", teacher_id: "" });
      setIsSubjectDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id || !deleteDialog.type) return;
    
    try {
      switch (deleteDialog.type) {
        case 'student':
          await deleteStudent(deleteDialog.id);
          break;
        case 'teacher':
          await deleteTeacher(deleteDialog.id);
          break;
        case 'class':
          await deleteClass(deleteDialog.id);
          break;
        case 'subject':
          await deleteSubject(deleteDialog.id);
          break;
      }
      setDeleteDialog({ open: false });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const handleImportStudents = async (importedStudents: any[]) => {
    if (!school?.id) return;
    
    const studentsData = importedStudents.map(student => ({
      firstname: student.firstname,
      lastname: student.lastname,
      email: student.email || "",
      class_id: student.class_id,
      school_id: school.id
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
    cin_number?: string;
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SchoolSidebar 
          schoolId={school.identifier}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="flex-1 flex flex-col">
          <AuthenticatedHeader 
            title={school.name}
            onSettingsClick={handleSettingsClick}
            showMobileMenu={true}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            schoolName={school.name}
            schoolLogoUrl={school.logo_url || undefined}
            userRole="admin"
          />
          
          <main className="flex-1 p-4 lg:p-6">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
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
                  classes={classes}
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
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                    <StudentImport 
                      onImportComplete={handleImportStudents}
                      classes={classes}
                    />
                    
                    <StudentsListSection 
                      students={students}
                      classes={classes}
                      loading={studentsLoading}
                      onDeleteStudent={(id, name) => setDeleteDialog({
                        open: true,
                        type: 'student',
                        id,
                        name
                      })}
                    />
                  </div>
                </div>
              )}
              
              {activeTab === "classes" && !showClassDetails && (
                <ClassesListSection
                  classes={classes}
                  students={students}
                  loading={classesLoading}
                  onDeleteClass={(id, name) => setDeleteDialog({
                    open: true,
                    type: 'class',
                    id,
                    name
                  })}
                  onViewClassDetails={handleViewClassDetails}
                  onCreateClass={() => setIsClassDialogOpen(true)}
                />
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
                    <Button onClick={() => setIsSubjectDialogOpen(true)} className="w-full sm:w-auto">
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
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => setDeleteDialog({
                                open: true,
                                type: 'subject',
                                id: subject.id,
                                name: subject.name
                              })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {activeTab === "teachers" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Corps Enseignant</h2>
                    <Button onClick={() => setIsTeacherDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau Professeur
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teachers.map((teacher) => {
                      const teacherSubjects = subjects.filter(s => s.teacher_id === teacher.id);
                      return (
                         <Card key={teacher.id} className="relative">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <GraduationCap className="h-5 w-5" />
                              {teacher.firstname} {teacher.lastname}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">{teacher.email}</p>
                              <div className="flex flex-wrap gap-1">
                                {teacherSubjects.map((subject) => (
                                  <Badge key={subject.id} variant="secondary" className="text-xs">
                                    {subject.name}
                                  </Badge>
                                ))}
                              </div>
                              {teacherSubjects.length === 0 && (
                                <p className="text-xs text-muted-foreground">Aucune matière assignée</p>
                              )}
                              <Button 
                                size="sm" 
                                className="w-full mt-2"
                                onClick={() => window.location.href = `/teacher/${teacher.id}`}
                              >
                                Interface Professeur
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => setDeleteDialog({
                                open: true,
                                type: 'teacher',
                                id: teacher.id,
                                name: `${teacher.firstname} ${teacher.lastname}`
                              })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                   </div>
                  
                  {/* Assignation Professeurs - Classes */}
                  {school?.id && (
                    <div className="mt-8">
                      <TeacherClassAssignment schoolId={school.id} />
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === "users" && (
                <div className="space-y-6">
                  <StudentAccountsSection schoolId={school.id} />
                  <SchoolUserManagement schoolId={school?.id || ""} />
                </div>
              )}
              
              {activeTab === "documents" && school?.id && (
                <DocumentRequestsManagement schoolId={school.id} />
              )}
              
              {activeTab === "classrooms" && school?.id && (
                <ClassroomManagement schoolId={school.id} />
              )}
              
              {activeTab === "timetable" && school?.id && (
                <TimetableSection schoolId={school.id} schoolName={school.name} />
              )}
              
              {activeTab === "settings" && (
                <div className="space-y-6">
                  <SchoolSettings schoolId={school.id} />
                </div>
              )}
              
              {activeTab === "events" && (
                <EventsSection schoolId={school.id} isAdmin={true} />
              )}

              {activeTab === "announcements" && (
                <AnnouncementsSection schoolId={school.id} isAdmin={true} userRole="admin" />
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
            onSubmit={handleCreateClass}
            subjects={subjects}
          />
        </DialogContent>
      </Dialog>

      {/* Teacher Dialog */}
      <Dialog open={isTeacherDialogOpen} onOpenChange={setIsTeacherDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un Professeur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="teacher-firstname">Prénom</Label>
              <Input
                id="teacher-firstname"
                value={newTeacher.firstname}
                onChange={(e) => setNewTeacher({ ...newTeacher, firstname: e.target.value })}
                placeholder="Prénom du professeur"
              />
            </div>
            <div>
              <Label htmlFor="teacher-lastname">Nom</Label>
              <Input
                id="teacher-lastname"
                value={newTeacher.lastname}
                onChange={(e) => setNewTeacher({ ...newTeacher, lastname: e.target.value })}
                placeholder="Nom du professeur"
              />
            </div>
            <div>
              <Label htmlFor="teacher-email">Email (optionnel)</Label>
              <Input
                id="teacher-email"
                type="email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                placeholder="email@exemple.com"
              />
            </div>
            <div>
              <Label htmlFor="teacher-class">Classe à assigner (optionnel)</Label>
              <select
                id="teacher-class"
                className="w-full p-2 border rounded-md"
                value={newTeacher.class_id}
                onChange={(e) => setNewTeacher({ ...newTeacher, class_id: e.target.value })}
              >
                <option value="">Aucune classe assignée</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsTeacherDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateTeacher}>
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subject Dialog */}
      <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une Matière</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject-name">Nom de la matière</Label>
              <Input
                id="subject-name"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                placeholder="Mathématiques, Français..."
              />
            </div>
            <div>
              <Label htmlFor="subject-class">Classe</Label>
              <select
                id="subject-class"
                className="w-full p-2 border rounded-md"
                value={newSubject.class_id}
                onChange={(e) => setNewSubject({ ...newSubject, class_id: e.target.value })}
              >
                <option value="">Sélectionner une classe</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="subject-teacher">Professeur (optionnel)</Label>
              <select
                id="subject-teacher"
                className="w-full p-2 border rounded-md"
                value={newSubject.teacher_id}
                onChange={(e) => setNewSubject({ ...newSubject, teacher_id: e.target.value })}
              >
                <option value="">Aucun professeur assigné</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstname} {teacher.lastname}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsSubjectDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateSubject}>
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            classes={classes}
          />
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default SchoolDashboard;
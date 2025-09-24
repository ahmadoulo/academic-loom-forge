import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { StudentImport } from "@/components/school/StudentImport";
import { StudentForm } from "@/components/school/StudentForm";
import { ClassForm } from "@/components/school/ClassForm";
import { useClassSubjects } from "@/hooks/useClassSubjects";
import { TeacherClassAssignment } from "@/components/admin/TeacherClassAssignment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, BookOpen, School, GraduationCap, Plus, Loader2, UserPlus, Trash2, TrendingUp } from "lucide-react";
import { useSchools } from "@/hooks/useSchools";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useTeachers } from "@/hooks/useTeachers";
import { useSubjects } from "@/hooks/useSubjects";
import { useGrades } from "@/hooks/useGrades";
import { AnalyticsDashboard } from "@/components/analytics/Dashboard";
import { StatsCard } from "@/components/analytics/StatsCard";
import { QuickActions } from "@/components/analytics/QuickActions";
import { RecentActivity } from "@/components/analytics/RecentActivity";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { SchoolSettings } from "@/components/settings/SchoolSettings";
import { SchoolSidebar } from "@/components/layout/SchoolSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";

const SchoolDashboard = () => {
  const { schoolId } = useParams();
  const [activeTab, setActiveTab] = useState("analytics");
  
  // Dialog states
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newTeacher, setNewTeacher] = useState({ firstname: "", lastname: "", email: "" });
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
  const { subjects, loading: subjectsLoading, createSubject, deleteSubject } = useSubjects(school?.id);
  const { grades } = useGrades();

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
      if (student?.school_id === school?.id) {
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
      await createTeacher({
        ...newTeacher,
        school_id: school.id
      });
      setNewTeacher({ firstname: "", lastname: "", email: "" });
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
  }) => {
    if (!school?.id) return;
    
    try {
      await createStudent({
        ...studentData,
        school_id: school.id
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSettingsClick = () => {
    setActiveTab("settings");
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
          />
          
          <main className="flex-1 p-6">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

            {/* Dashboard Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-1">
                <QuickActions actions={quickActions} />
              </div>
              <div className="lg:col-span-2">
                <RecentActivity activities={recentActivities} />
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <AnalyticsDashboard schoolId={school.id} />
                </div>
              )}
              
              {activeTab === "students" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Gestion des Étudiants</h2>
                    <Button onClick={() => setIsStudentDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ajouter un Étudiant
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <StudentImport 
                      onImportComplete={handleImportStudents}
                      classes={classes}
                    />
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Liste des Étudiants ({students.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {studentsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Chargement...</span>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {students.map((student) => (
                              <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{student.firstname} {student.lastname}</p>
                                  <p className="text-sm text-muted-foreground">{student.classes?.name}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{student.classes?.name}</Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => setDeleteDialog({
                                      open: true,
                                      type: 'student',
                                      id: student.id,
                                      name: `${student.firstname} ${student.lastname}`
                                    })}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            {students.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-8 w-8 mx-auto mb-2" />
                                <p>Aucun étudiant inscrit</p>
                                <p className="text-sm">Utilisez l'import pour ajouter des étudiants</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              
              {activeTab === "classes" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Gestion des Classes</h2>
                    <Button onClick={() => setIsClassDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle Classe
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((classItem) => {
                      const classStudents = students.filter(s => s.class_id === classItem.id);
                      return (
                        <Card key={classItem.id} className="relative">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <School className="h-5 w-5" />
                              {classItem.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold text-primary">{classStudents.length}</p>
                            <p className="text-sm text-muted-foreground">étudiants</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => setDeleteDialog({
                                open: true,
                                type: 'class',
                                id: classItem.id,
                                name: classItem.name
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
              
              {activeTab === "subjects" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Matières Enseignées</h2>
                    <Button onClick={() => setIsSubjectDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle Matière
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map((subject) => {
                      const subjectClass = classes.find(c => c.id === subject.class_id);
                      const assignedTeacher = teachers.find(t => t.id === subject.teacher_id);
                      
                      return (
                        <Card key={subject.id} className="relative">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5" />
                              {subject.name}
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
                </div>
              )}
              
              {activeTab === "settings" && (
                <div className="space-y-6">
                  <SchoolSettings schoolId={school.id} />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Student Dialog */}
      <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un Étudiant</DialogTitle>
          </DialogHeader>
          <StudentForm 
            onSubmit={handleCreateStudent}
            classes={classes}
          />
        </DialogContent>
      </Dialog>

      {/* Class Dialog */}
      <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une Classe</DialogTitle>
          </DialogHeader>
          <ClassForm 
            onSubmit={handleCreateClass}
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
    </SidebarProvider>
  );
};

export default SchoolDashboard;
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { StudentImport } from "@/components/school/StudentImport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, BookOpen, School, GraduationCap, Plus, Loader2 } from "lucide-react";
import { useSchools } from "@/hooks/useSchools";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useTeachers } from "@/hooks/useTeachers";
import { useSubjects } from "@/hooks/useSubjects";

const SchoolDashboard = () => {
  const { schoolId } = useParams();
  const [activeTab, setActiveTab] = useState("students");
  
  // Dialog states
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newTeacher, setNewTeacher] = useState({ firstname: "", lastname: "", email: "" });
  const [newSubject, setNewSubject] = useState({ name: "", class_id: "", teacher_id: "" });
  
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

  const { students, loading: studentsLoading, importStudents } = useStudents(school?.id);
  const { classes, loading: classesLoading, createClass } = useClasses(school?.id);
  const { teachers, loading: teachersLoading, createTeacher } = useTeachers(school?.id);
  const { subjects, loading: subjectsLoading, createSubject } = useSubjects(school?.id);

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !school?.id) return;
    
    try {
      await createClass({
        name: newClassName,
        school_id: school.id
      });
      setNewClassName("");
      setIsClassDialogOpen(false);
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
        teacher_id: newSubject.teacher_id || undefined
      });
      setNewSubject({ name: "", class_id: "", teacher_id: "" });
      setIsSubjectDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleImportStudents = async (importedStudents: any[]) => {
    if (!school?.id) return;
    
    // Convert imported students to the format expected by Supabase
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
    <div className="min-h-screen bg-background">
      <Header title={school.name} userRole="school" schoolName={school.name} />
      
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Étudiants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {studentsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : students.length}
              </div>
              <p className="text-xs text-muted-foreground">Inscrits</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {classesLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : classes.length}
              </div>
              <p className="text-xs text-muted-foreground">Actives</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matières</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {subjectsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : subjects.length}
              </div>
              <p className="text-xs text-muted-foreground">Enseignées</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professeurs</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {teachersLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : teachers.length}
              </div>
              <p className="text-xs text-muted-foreground">Actifs</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="students">Étudiants</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="subjects">Matières</TabsTrigger>
            <TabsTrigger value="teachers">Professeurs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StudentImport 
                onImportComplete={handleImportStudents}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Liste des Étudiants</CardTitle>
                </CardHeader>
                <CardContent>
                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Chargement...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{student.firstname} {student.lastname}</p>
                            <p className="text-sm text-muted-foreground">{student.classes?.name}</p>
                          </div>
                          <Badge variant="outline">{student.classes?.name}</Badge>
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
          </TabsContent>
          
          <TabsContent value="classes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gestion des Classes</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Classe
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => (
                  <Card key={classItem.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <School className="h-5 w-5" />
                        {classItem.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">-</p>
                      <p className="text-sm text-muted-foreground">étudiants</p>
                    </CardContent>
                  </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="subjects" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Matières Enseignées</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Matière
              </Button>
            </div>
            
            <div className="space-y-4">
              {subjects.map((subject) => (
                <Card key={subject.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{subject.name}</p>
                        <p className="text-sm text-muted-foreground">{subject.classes?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{subject.teachers ? `${subject.teachers.firstname} ${subject.teachers.lastname}` : 'Non assigné'}</p>
                      <p className="text-sm text-muted-foreground">Professeur</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="teachers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Corps Enseignant</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Professeur
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachers.map((teacher) => (
                <Card key={teacher.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      {teacher.firstname} {teacher.lastname}
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary">Professeur</Badge>
                    </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SchoolDashboard;
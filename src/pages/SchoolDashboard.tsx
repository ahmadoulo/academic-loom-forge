import { useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { StudentImport } from "@/components/school/StudentImport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, School, GraduationCap, Plus } from "lucide-react";

const SchoolDashboard = () => {
  const { schoolId } = useParams();
  const [activeTab, setActiveTab] = useState("students");

  // Mock data - would come from database
  const school = {
    name: "Lycée Victor Hugo",
    identifier: schoolId || "LVH001"
  };

  const [students, setStudents] = useState([
    { id: "1", firstname: "Jean", lastname: "Dupont", class: "Terminale S" },
    { id: "2", firstname: "Marie", lastname: "Martin", class: "Première ES" },
    { id: "3", firstname: "Pierre", lastname: "Durand", class: "Seconde" }
  ]);

  const [classes] = useState([
    { id: "1", name: "Terminale S", studentsCount: 28 },
    { id: "2", name: "Première ES", studentsCount: 25 },
    { id: "3", name: "Seconde", studentsCount: 30 }
  ]);

  const [subjects] = useState([
    { id: "1", name: "Mathématiques", class: "Terminale S", teacher: "M. Dubois" },
    { id: "2", name: "Physique-Chimie", class: "Terminale S", teacher: "Mme Petit" },
    { id: "3", name: "Histoire-Géographie", class: "Première ES", teacher: "M. Moreau" }
  ]);

  const [teachers] = useState([
    { id: "1", firstname: "Jean", lastname: "Dubois", subject: "Mathématiques" },
    { id: "2", firstname: "Marie", lastname: "Petit", subject: "Physique-Chimie" },
    { id: "3", firstname: "Paul", lastname: "Moreau", subject: "Histoire-Géographie" }
  ]);

  const handleImportStudents = (importedStudents: any[]) => {
    const newStudents = importedStudents.map((student, index) => ({
      id: String(Date.now() + index),
      ...student
    }));
    setStudents([...students, ...newStudents]);
  };

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
              <div className="text-2xl font-bold text-primary">{students.length}</div>
              <p className="text-xs text-muted-foreground">Inscrits</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{classes.length}</div>
              <p className="text-xs text-muted-foreground">Actives</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matières</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">Enseignées</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professeurs</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{teachers.length}</div>
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
              <StudentImport onImportComplete={handleImportStudents} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Liste des Étudiants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{student.firstname} {student.lastname}</p>
                          <p className="text-sm text-muted-foreground">{student.class}</p>
                        </div>
                        <Badge variant="outline">{student.class}</Badge>
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
                    <p className="text-2xl font-bold text-primary">{classItem.studentsCount}</p>
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
                        <p className="text-sm text-muted-foreground">{subject.class}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{subject.teacher}</p>
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
                    <Badge variant="secondary">{teacher.subject}</Badge>
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
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, TrendingUp, Save, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTeachers } from "@/hooks/useTeachers";
import { useStudents } from "@/hooks/useStudents";
import { useGrades } from "@/hooks/useGrades";
import { useSubjects } from "@/hooks/useSubjects";
import { AnalyticsDashboard } from "@/components/analytics/Dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TeacherDashboard = () => {
  const { teacherId } = useParams();
  const { toast } = useToast();

  const [teacher, setTeacher] = useState<any>(null);
  const [teacherLoading, setTeacherLoading] = useState(true);
  
  const { teachers } = useTeachers();
  const { students, loading: studentsLoading } = useStudents();
  const { grades, loading: gradesLoading, createGrade } = useGrades();
  const { subjects } = useSubjects();

  useEffect(() => {
    if (teacherId && teachers.length > 0) {
      const foundTeacher = teachers.find(t => t.id === teacherId);
      setTeacher(foundTeacher);
      setTeacherLoading(false);
    }
  }, [teacherId, teachers]);

  // Get students with their grades for this teacher's subjects
  const teacherSubjects = subjects.filter(s => s.teacher_id === teacherId);
  const teacherStudents = students.filter(student => 
    teacherSubjects.some(subject => subject.class_id === student.class_id)
  );

  // Get grades for the students in this teacher's subjects  
  const studentGrades = grades.filter(grade => 
    teacherSubjects.some(subject => subject.id === grade.subject_id)
  );

  const [newGrades, setNewGrades] = useState<{ [key: string]: string }>({});
  const [newGradeCoeff, setNewGradeCoeff] = useState("1");

  const calculateAverage = (studentId: string) => {
    const studentGradesForThisTeacher = studentGrades.filter(g => g.student_id === studentId);
    if (!studentGradesForThisTeacher.length) return "N/A";
    
    const total = studentGradesForThisTeacher.reduce((sum, grade) => sum + Number(grade.grade), 0);
    return (total / studentGradesForThisTeacher.length).toFixed(1);
  };

  const getStudentRecentGrades = (studentId: string) => {
    return studentGrades
      .filter(g => g.student_id === studentId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  };

  const handleGradeChange = (studentId: string, value: string) => {
    setNewGrades(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleSaveGrade = async (studentId: string) => {
    const gradeValue = parseFloat(newGrades[studentId]);
    
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 20) {
      toast({
        title: "Note invalide",
        description: "La note doit être comprise entre 0 et 20",
        variant: "destructive"
      });
      return;
    }

    if (!teacherId || teacherSubjects.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucune matière assignée à ce professeur",
        variant: "destructive"
      });
      return;
    }

    try {
      await createGrade({
        student_id: studentId,
        teacher_id: teacherId,
        subject_id: teacherSubjects[0].id, // Use first subject for now
        grade: gradeValue,
        exam_date: new Date().toISOString().split('T')[0],
        comment: `Note ajoutée le ${new Date().toLocaleDateString()}`
      });

      setNewGrades(prev => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });

      toast({
        title: "Note enregistrée",
        description: `Note de ${gradeValue}/20 ajoutée avec succès`,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSaveAllGrades = async () => {
    let savedCount = 0;
    const gradePromises = Object.keys(newGrades).map(async (studentId) => {
      const gradeValue = parseFloat(newGrades[studentId]);
      if (!isNaN(gradeValue) && gradeValue >= 0 && gradeValue <= 20) {
        try {
          await handleSaveGrade(studentId);
          savedCount++;
        } catch (error) {
          console.error('Error saving grade:', error);
        }
      }
    });
    
    await Promise.all(gradePromises);
    
    if (savedCount > 0) {
      toast({
        title: "Notes enregistrées",
        description: `${savedCount} note(s) enregistrée(s) avec succès`,
      });
    }
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

  if (teacherLoading || studentsLoading || gradesLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title={`${teacher.firstname} ${teacher.lastname}`} 
        userRole="teacher" 
        schoolName="Tableau de bord enseignant" 
      />
      
      <main className="container mx-auto px-6 py-8">
        {/* Teacher Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Interface Professeur - {teacher.firstname} {teacher.lastname}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Matières:</span>
                <Badge variant="secondary">{teacherSubjects.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Étudiants:</span>
                <span className="text-primary font-semibold">{teacherStudents.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Classes:</span>
                <span className="text-primary font-semibold">{Object.keys(studentsByClass).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="grades" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grades">Saisie des Notes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="grades" className="space-y-6">
            {/* Grade Input Controls */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Paramètres de Notation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Coefficient:</label>
                    <Input
                      type="number"
                      min="0.5"
                      max="3"
                      step="0.5"
                      value={newGradeCoeff}
                      onChange={(e) => setNewGradeCoeff(e.target.value)}
                      className="w-20"
                    />
                  </div>
                  <Button onClick={handleSaveAllGrades} className="gap-2">
                    <Save className="h-4 w-4" />
                    Enregistrer toutes les notes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Classes and Students */}
            {Object.entries(studentsByClass).map(([className, classStudents]) => (
              <Card key={className} className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {className} ({classStudents.length} étudiants)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Étudiant</th>
                          <th className="text-center p-2">Moyenne</th>
                          <th className="text-center p-2">Dernières Notes</th>
                          <th className="text-center p-2">Nouvelle Note</th>
                          <th className="text-center p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((student) => {
                          const recentGrades = getStudentRecentGrades(student.id);
                          return (
                            <tr key={student.id} className="border-b hover:bg-muted/30">
                              <td className="p-2">
                                <div>
                                  <p className="font-medium">{student.firstname} {student.lastname}</p>
                                  <p className="text-xs text-muted-foreground">{student.classes?.name}</p>
                                </div>
                              </td>
                              <td className="text-center p-2">
                                <Badge variant="outline" className="font-mono">
                                  {calculateAverage(student.id)}/20
                                </Badge>
                              </td>
                              <td className="text-center p-2">
                                <div className="flex gap-1 justify-center flex-wrap">
                                  {recentGrades.map((grade, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {Number(grade.grade).toFixed(1)}/20
                                    </Badge>
                                  ))}
                                  {recentGrades.length === 0 && (
                                    <span className="text-xs text-muted-foreground">Aucune note</span>
                                  )}
                                </div>
                              </td>
                              <td className="text-center p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="20"
                                  step="0.5"
                                  placeholder="Note/20"
                                  value={newGrades[student.id] || ""}
                                  onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                  className="w-24 mx-auto text-center"
                                />
                              </td>
                              <td className="text-center p-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSaveGrade(student.id)}
                                  disabled={!newGrades[student.id]}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard teacherId={teacherId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeacherDashboard;
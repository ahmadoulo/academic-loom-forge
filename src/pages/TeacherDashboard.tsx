import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, TrendingUp, Loader2, GraduationCap } from "lucide-react";
import { useTeachers } from "@/hooks/useTeachers";
import { useStudents } from "@/hooks/useStudents";
import { useGrades } from "@/hooks/useGrades";
import { useSubjects } from "@/hooks/useSubjects";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { AnalyticsDashboard } from "@/components/analytics/Dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GradeInput } from "@/components/teacher/GradeInput";

const TeacherDashboard = () => {
  const { teacherId } = useParams();

  const [teacher, setTeacher] = useState<any>(null);
  const [teacherLoading, setTeacherLoading] = useState(true);
  
  // Get current teacher first to get school_id
  const { teachers } = useTeachers();
  const currentTeacher = teachers.find(t => t.id === teacherId);
  
  // Get teacher's assigned classes
  const { teacherClasses } = useTeacherClasses(teacherId);
  const teacherClassIds = teacherClasses.map(tc => tc.class_id);
  
  // Get students from teacher's classes
  const { students } = useStudents(currentTeacher?.school_id);
  const teacherStudents = students.filter(student => 
    teacherClassIds.includes(student.class_id)
  );
  
  // Get subjects assigned to this teacher
  const { subjects } = useSubjects(undefined, teacherId, currentTeacher?.school_id);
  const { grades, createGrade } = useGrades(undefined, undefined, teacherId);

  useEffect(() => {
    if (teacherId && teachers.length > 0) {
      const foundTeacher = teachers.find(t => t.id === teacherId);
      setTeacher(foundTeacher);
      setTeacherLoading(false);
    } else if (teachers.length > 0 && teacherId) {
      setTeacherLoading(false);
    }
  }, [teacherId, teachers]);

  const handleSaveGrade = async (studentId: string, subjectId: string, grade: number) => {
    if (!teacherId) return;
    
    await createGrade({
      student_id: studentId,
      teacher_id: teacherId,
      subject_id: subjectId,
      grade: grade,
      exam_date: new Date().toISOString().split('T')[0],
      comment: `Note ajoutée le ${new Date().toLocaleDateString()}`
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
              <GraduationCap className="h-6 w-6 text-primary" />
              Interface Professeur - {teacher.firstname} {teacher.lastname}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Matières:</span>
                <Badge variant="secondary">{subjects.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Étudiants:</span>
                <span className="text-primary font-semibold">{teacherStudents.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Classes:</span>
                <span className="text-primary font-semibold">{teacherClasses.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Notes saisies:</span>
                <span className="text-primary font-semibold">{grades.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="classes">Mes Classes</TabsTrigger>
            <TabsTrigger value="subjects">Mes Matières</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-6">
            {teacherClasses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Aucune classe assignée pour le moment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {teacherClasses.map((teacherClass) => {
                  const classStudents = teacherStudents.filter(s => s.class_id === teacherClass.class_id);
                  return (
                    <Card key={teacherClass.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {teacherClass.classes.name} ({classStudents.length} étudiants)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {classStudents.map((student) => (
                            <GradeInput
                              key={student.id}
                              student={student}
                              subjects={subjects}
                              grades={grades.filter(g => g.student_id === student.id)}
                              onSaveGrade={handleSaveGrade}
                            />
                          ))}
                          {classStudents.length === 0 && (
                            <p className="text-muted-foreground text-center py-4">
                              Aucun étudiant dans cette classe.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            {subjects.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Aucune matière assignée pour le moment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjects.map((subject) => {
                  const subjectGrades = grades.filter(g => g.subject_id === subject.id);
                  const uniqueStudents = [...new Set(subjectGrades.map(g => g.student_id))].length;
                  const averageGrade = subjectGrades.length > 0 
                    ? (subjectGrades.reduce((sum, g) => sum + Number(g.grade), 0) / subjectGrades.length).toFixed(1)
                    : "N/A";

                  return (
                    <Card key={subject.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          {subject.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Étudiants évalués:</span>
                            <Badge variant="secondary">{uniqueStudents}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Notes saisies:</span>
                            <Badge variant="outline">{subjectGrades.length}</Badge>
                          </div>
                          <div className="flex justify-between">
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
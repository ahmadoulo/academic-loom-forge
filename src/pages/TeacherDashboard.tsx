import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, TrendingUp, Loader2, GraduationCap } from "lucide-react";
import { useTeachers } from "@/hooks/useTeachers";
import { useStudents } from "@/hooks/useStudents";
import { useGrades } from "@/hooks/useGrades";
import { useSubjects } from "@/hooks/useSubjects";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { AnalyticsDashboard } from "@/components/analytics/Dashboard";
import { ClassCard } from "@/components/teacher/ClassCard";
import { StudentsGrading } from "@/components/teacher/StudentsGrading";
import { AttendanceManager } from "@/components/teacher/AttendanceManager";
import { AttendanceHistory } from "@/components/teacher/AttendanceHistory";
import { ActiveSessionsPanel } from "@/components/teacher/ActiveSessionsPanel";
import { QRCodeGenerator } from "@/components/teacher/QRCodeGenerator";
import { TeacherSidebar } from "@/components/layout/TeacherSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";

const TeacherDashboard = () => {
  const { teacherId } = useParams();

  const [teacher, setTeacher] = useState<any>(null);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'overview' | 'grading' | 'attendance' | 'attendance-history' | 'qr-session'>('overview');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("classes");
  
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
  const { subjects } = useSubjects(currentTeacher?.school_id, undefined, teacherId);
  const { grades, createGrade, deleteGrade } = useGrades(undefined, undefined, teacherId);

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

  const handleTakeAttendance = (classId: string) => {
    const classData = teacherClasses.find(tc => tc.class_id === classId);
    if (classData) {
      setSelectedClass(classData.classes);
      setCurrentView('attendance');
    }
  };

  const handleViewAttendanceHistory = (classId: string) => {
    const classData = teacherClasses.find(tc => tc.class_id === classId);
    if (classData) {
      setSelectedClass(classData.classes);
      setCurrentView('attendance-history');
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    await deleteGrade(gradeId);
  };

  useEffect(() => {
    if (teacherId && teachers.length > 0) {
      const foundTeacher = teachers.find(t => t.id === teacherId);
      setTeacher(foundTeacher);
      setTeacherLoading(false);
    } else if (teachers.length > 0 && teacherId) {
      setTeacherLoading(false);
    }
  }, [teacherId, teachers]);

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

  const handleSettingsClick = () => {
    // Add settings functionality if needed
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TeacherSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="flex-1 flex flex-col">
          <AuthenticatedHeader 
            title={`${teacher.firstname} ${teacher.lastname}`}
            onSettingsClick={handleSettingsClick}
          />
          
          <main className="flex-1 p-4 lg:p-6">
        {/* Teacher Info Card */}
        <Card className="mb-6 lg:mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <GraduationCap className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
              <span className="hidden sm:inline">Interface Professeur - </span>
              <span className="sm:hidden">Prof. </span>
              {teacher.firstname} {teacher.lastname}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base truncate">Matières:</span>
                <Badge variant="secondary" className="flex-shrink-0">{subjects.length}</Badge>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base truncate">Étudiants:</span>
                <span className="text-primary font-semibold flex-shrink-0">{teacherStudents.length}</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base truncate">Classes:</span>
                <span className="text-primary font-semibold flex-shrink-0">{teacherClasses.length}</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base truncate">Notes:</span>
                <span className="text-primary font-semibold flex-shrink-0">{grades.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {currentView === 'grading' && selectedClass && selectedSubject ? (
          <StudentsGrading
            classData={selectedClass}
            subjectData={selectedSubject}
            students={teacherStudents.filter(s => s.class_id === selectedClass.id)}
            grades={grades}
            onBack={handleBackToOverview}
            onSaveGrade={handleSaveGrade}
            onDeleteGrade={handleDeleteGrade}
          />
        ) : currentView === 'attendance' && selectedClass ? (
          <AttendanceManager
            classData={selectedClass}
            students={teacherStudents.filter(s => s.class_id === selectedClass.id)}
            teacherId={teacherId || ''}
            onBack={handleBackToOverview}
          />
        ) : currentView === 'attendance-history' && selectedClass ? (
          <AttendanceHistory
            classData={selectedClass}
            students={teacherStudents.filter(s => s.class_id === selectedClass.id)}
            teacherId={teacherId || ''}
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
                          onTakeAttendance={handleTakeAttendance}
                          onViewAttendanceHistory={handleViewAttendanceHistory}
                        />
                      );
                    })}
                  </div>
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
                      const subjectGrades = grades.filter(g => g.subject_id === subject.id);
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
          </div>
        )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TeacherDashboard;
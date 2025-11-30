import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, GraduationCap, CalendarDays, BookOpen } from "lucide-react";

interface AdvancedSearchDialogProps {
  schoolId: string;
  students: any[];
  teachers: any[];
  classes: any[];
  subjects: any[];
  grades: any[];
  attendance: any[];
  assignments: any[];
}

export function AdvancedSearchDialog({
  schoolId,
  students,
  teachers,
  classes,
  subjects,
  grades,
  attendance,
  assignments,
}: AdvancedSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "students" | "teachers">("all");

  const normalizedTerm = searchTerm.trim().toLowerCase();

  const filteredStudents = useMemo(() => {
    if (!normalizedTerm) return [];

    return students.filter((student) => {
      if (student.school_id && student.school_id !== schoolId) return false;
      const target = `${student.firstname || ""} ${student.lastname || ""} ${student.email || ""} ${
        student.cin_number || ""
      }`.toLowerCase();
      return target.includes(normalizedTerm);
    });
  }, [normalizedTerm, students, schoolId]);

  const filteredTeachers = useMemo(() => {
    if (!normalizedTerm) return [];

    return teachers.filter((teacher) => {
      if (teacher.school_id && teacher.school_id !== schoolId) return false;
      const target = `${teacher.firstname || ""} ${teacher.lastname || ""} ${teacher.email || ""}`.toLowerCase();
      return target.includes(normalizedTerm);
    });
  }, [normalizedTerm, teachers, schoolId]);

  const getStudentSummary = (student: any) => {
    const studentGrades = grades.filter((g) => g.student_id === student.id);
    const studentAttendance = attendance.filter((a) => a.student_id === student.id);

    const totalGrades = studentGrades.length;
    const averageGrade =
      totalGrades > 0
        ? studentGrades.reduce((sum: number, g: any) => sum + Number(g.grade || 0), 0) / totalGrades
        : null;

    const totalSessions = studentAttendance.length;
    const absences = studentAttendance.filter((a: any) => a.status === "absent").length;
    const presenceRate = totalSessions > 0 ? (((totalSessions - absences) / totalSessions) * 100).toFixed(1) : null;

    return {
      totalGrades,
      averageGrade,
      totalSessions,
      absences,
      presenceRate,
    };
  };

  const getTeacherSummary = (teacher: any) => {
    const teacherClassesIds = Array.from(
      new Set(assignments.filter((a) => a.teacher_id === teacher.id).map((a) => a.class_id))
    );
    const teacherClasses = classes.filter((c) => teacherClassesIds.includes(c.id));

    const today = new Date().toISOString().slice(0, 10);
    const upcomingSession = assignments
      .filter((a) => a.teacher_id === teacher.id && a.type === "course" && a.session_date && a.session_date >= today)
      .sort((a, b) => new Date(a.session_date!).getTime() - new Date(b.session_date!).getTime())[0];

    const upcomingClass = upcomingSession ? classes.find((c) => c.id === upcomingSession.class_id) : undefined;
    const upcomingSubject = upcomingSession
      ? subjects.find((s) => s.id === upcomingSession.subject_id)
      : undefined;

    return {
      classes: teacherClasses,
      upcomingSession,
      upcomingClass,
      upcomingSubject,
    };
  };

  const showStudents = activeTab === "all" || activeTab === "students";
  const showTeachers = activeTab === "all" || activeTab === "teachers";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Recherche avancée
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Recherche avancée</DialogTitle>
          <DialogDescription>
            Recherchez rapidement un étudiant ou un professeur et visualisez ses informations clés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Input
              placeholder="Tapez un nom, prénom, email ou CIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:max-w-md"
            />

            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "all" | "students" | "teachers")}
              className="w-full sm:w-auto"
            >
              <TabsList className="w-full sm:w-auto grid grid-cols-3">
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="students">Étudiants</TabsTrigger>
                <TabsTrigger value="teachers">Professeurs</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {!normalizedTerm && (
            <p className="text-sm text-muted-foreground">
              Commencez à taper un nom pour afficher les résultats de recherche.
            </p>
          )}

          {normalizedTerm && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
              {showStudents && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" /> Étudiants
                    </h3>
                    <Badge variant="secondary">{filteredStudents.length}</Badge>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <Card>
                      <CardContent className="py-6 text-center text-sm text-muted-foreground">
                        Aucun étudiant trouvé.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {filteredStudents.map((student) => {
                        const studentClass = classes.find((c) => c.id === student.class_id);
                        const summary = getStudentSummary(student);

                        return (
                          <Card key={student.id} className="border-muted/60">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center justify-between gap-2">
                                <span>
                                  {student.firstname} {student.lastname}
                                </span>
                                {studentClass && (
                                  <Badge variant="outline" className="text-xs">
                                    {studentClass.name}
                                  </Badge>
                                )}
                              </CardTitle>
                              {student.email && (
                                <CardDescription className="text-xs">{student.email}</CardDescription>
                              )}
                            </CardHeader>
                            <CardContent className="pt-0 text-xs space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-muted-foreground">CIN</p>
                                  <p className="font-medium break-all">{student.cin_number}</p>
                                </div>
                                {student.student_phone && (
                                  <div>
                                    <p className="text-muted-foreground">Téléphone</p>
                                    <p className="font-medium">{student.student_phone}</p>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-2 mt-1">
                                <div>
                                  <p className="text-muted-foreground">Notes</p>
                                  <p className="font-semibold">
                                    {summary.totalGrades > 0 ? `${summary.averageGrade?.toFixed(1)}/20` : "-"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Absences</p>
                                  <p className="font-semibold">{summary.absences}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Présence</p>
                                  <p className="font-semibold">
                                    {summary.presenceRate ? `${summary.presenceRate}%` : "-"}
                                  </p>
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

              {showTeachers && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" /> Professeurs
                    </h3>
                    <Badge variant="secondary">{filteredTeachers.length}</Badge>
                  </div>

                  {filteredTeachers.length === 0 ? (
                    <Card>
                      <CardContent className="py-6 text-center text-sm text-muted-foreground">
                        Aucun professeur trouvé.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {filteredTeachers.map((teacher) => {
                        const summary = getTeacherSummary(teacher);

                        return (
                          <Card key={teacher.id} className="border-muted/60">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center justify-between gap-2">
                                <span>
                                  {teacher.firstname} {teacher.lastname}
                                </span>
                                {teacher.status && (
                                  <Badge variant={teacher.status === "active" ? "default" : "outline"} className="text-xs">
                                    {teacher.status}
                                  </Badge>
                                )}
                              </CardTitle>
                              {teacher.email && (
                                <CardDescription className="text-xs">{teacher.email}</CardDescription>
                              )}
                            </CardHeader>
                            <CardContent className="pt-0 text-xs space-y-2">
                              <div>
                                <p className="text-muted-foreground mb-1">Classes assignées</p>
                                {summary.classes.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {summary.classes.map((cls) => (
                                      <Badge key={cls.id} variant="outline" className="text-[10px]">
                                        {cls.name}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground">Aucune classe assignée</p>
                                )}
                              </div>

                              {summary.upcomingSession && (
                                <div className="grid grid-cols-[auto,1fr] gap-2 pt-1 border-t mt-2 pt-2">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent">
                                    <CalendarDays className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Prochaine séance</p>
                                    <p className="font-medium">
                                      {summary.upcomingSession.session_date}
                                      {summary.upcomingSession.start_time && ` • ${summary.upcomingSession.start_time}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-1 items-center">
                                      {summary.upcomingClass && <span>{summary.upcomingClass.name}</span>}
                                      {summary.upcomingSubject && (
                                        <span className="inline-flex items-center gap-1">
                                          <BookOpen className="h-3 w-3" /> {summary.upcomingSubject.name}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

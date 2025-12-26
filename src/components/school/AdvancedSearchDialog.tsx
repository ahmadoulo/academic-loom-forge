import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  GraduationCap, 
  CalendarDays, 
  BookOpen, 
  Search, 
  Mail, 
  Phone, 
  CreditCard,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  User,
  Briefcase,
  DoorOpen,
  Building2,
  MapPin
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useClassrooms } from "@/hooks/useClassrooms";

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
  const [activeTab, setActiveTab] = useState<"students" | "teachers" | "classrooms">("students");
  
  // État pour la recherche de salles
  const [roomSearchDate, setRoomSearchDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [roomSearchStartTime, setRoomSearchStartTime] = useState("08:00");
  const [roomSearchEndTime, setRoomSearchEndTime] = useState("10:00");
  
  const { classrooms, assignments: classroomAssignments } = useClassrooms(schoolId);

  const normalizedTerm = searchTerm.trim().toLowerCase();

  const filteredStudents = useMemo(() => {
    if (!normalizedTerm) return [];

    return students.filter((student) => {
      if (student.school_id && student.school_id !== schoolId) return false;
      const target = `${student.firstname || ""} ${student.lastname || ""} ${student.email || ""} ${
        student.cin_number || ""
      }`.toLowerCase();
      return target.includes(normalizedTerm);
    }).slice(0, 10);
  }, [normalizedTerm, students, schoolId]);

  const filteredTeachers = useMemo(() => {
    if (!normalizedTerm) return [];

    return teachers.filter((teacher) => {
      if (teacher.school_id && teacher.school_id !== schoolId) return false;
      const target = `${teacher.firstname || ""} ${teacher.lastname || ""} ${teacher.email || ""}`.toLowerCase();
      return target.includes(normalizedTerm);
    }).slice(0, 10);
  }, [normalizedTerm, teachers, schoolId]);

  // Recherche de disponibilité des salles
  const classroomAvailability = useMemo(() => {
    if (!classrooms.length) return [];

    // Convertir les heures de recherche en minutes pour comparaison
    const searchStartMinutes = parseInt(roomSearchStartTime.split(':')[0]) * 60 + parseInt(roomSearchStartTime.split(':')[1] || '0');
    const searchEndMinutes = parseInt(roomSearchEndTime.split(':')[0]) * 60 + parseInt(roomSearchEndTime.split(':')[1] || '0');

    return classrooms
      .filter(room => room.is_active !== false)
      .map(room => {
        // Trouver les assignations pour cette salle à la date sélectionnée
        const roomAssignments = classroomAssignments
          .filter(ca => 
            ca.classroom_id === room.id && 
            ca.assignments?.session_date === roomSearchDate
          )
          .map(ca => ca.assignments)
          .filter(Boolean);

        // Vérifier les conflits
        const conflicts = roomAssignments.filter(assignment => {
          if (!assignment?.start_time || !assignment?.end_time) return false;
          
          const assignmentStart = parseInt(assignment.start_time.split(':')[0]) * 60 + parseInt(assignment.start_time.split(':')[1] || '0');
          const assignmentEnd = parseInt(assignment.end_time.split(':')[0]) * 60 + parseInt(assignment.end_time.split(':')[1] || '0');
          
          // Vérifier si les plages horaires se chevauchent
          return !(searchEndMinutes <= assignmentStart || searchStartMinutes >= assignmentEnd);
        });

        return {
          ...room,
          isAvailable: conflicts.length === 0,
          conflicts: conflicts.map(c => ({
            startTime: c?.start_time || '',
            endTime: c?.end_time || '',
            className: c?.classes?.name || '',
            subjectName: c?.subjects?.name || ''
          }))
        };
      })
      .sort((a, b) => {
        // Les salles disponibles en premier
        if (a.isAvailable && !b.isAvailable) return -1;
        if (!a.isAvailable && b.isAvailable) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [classrooms, classroomAssignments, roomSearchDate, roomSearchStartTime, roomSearchEndTime]);

  const getStudentStats = (student: any) => {
    const studentGrades = grades.filter((g) => g.student_id === student.id);
    const studentAttendance = attendance.filter((a) => a.student_id === student.id);

    const totalGrades = studentGrades.length;
    const averageGrade = totalGrades > 0
      ? studentGrades.reduce((sum: number, g: any) => sum + Number(g.grade || 0), 0) / totalGrades
      : null;

    const totalSessions = studentAttendance.length;
    const absences = studentAttendance.filter((a: any) => a.status === "absent").length;
    const justified = studentAttendance.filter((a: any) => a.status === "justified").length;
    const presenceRate = totalSessions > 0 ? ((totalSessions - absences) / totalSessions) * 100 : null;

    const studentClass = classes.find((c) => c.id === student.class_id);

    return {
      totalGrades,
      averageGrade,
      totalSessions,
      absences,
      justified,
      presenceRate,
      className: studentClass?.name || null,
    };
  };

  const getTeacherStats = (teacher: any) => {
    const teacherAssignments = assignments.filter((a) => a.teacher_id === teacher.id);
    const teacherClassIds = [...new Set(teacherAssignments.map((a) => a.class_id))];
    const teacherClasses = classes.filter((c) => teacherClassIds.includes(c.id));
    const teacherSubjectIds = [...new Set(teacherAssignments.map((a) => a.subject_id).filter(Boolean))];
    const teacherSubjects = subjects.filter((s) => teacherSubjectIds.includes(s.id));

    const today = new Date().toISOString().slice(0, 10);
    const upcomingSessions = teacherAssignments
      .filter((a) => a.type === "course" && a.session_date && a.session_date >= today)
      .sort((a, b) => new Date(a.session_date!).getTime() - new Date(b.session_date!).getTime())
      .slice(0, 3);

    const sessionsWithDetails = upcomingSessions.map((session) => ({
      ...session,
      className: classes.find((c) => c.id === session.class_id)?.name,
      subjectName: subjects.find((s) => s.id === session.subject_id)?.name,
    }));

    return {
      classes: teacherClasses,
      subjects: teacherSubjects,
      upcomingSessions: sessionsWithDetails,
      totalSessions: teacherAssignments.filter((a) => a.type === "course").length,
    };
  };

  const getInitials = (firstname: string, lastname: string) => {
    return `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.toUpperCase();
  };

  const totalResults = filteredStudents.length + filteredTeachers.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          Recherche avancée
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Recherche avancée
          </DialogTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, prénom, email ou CIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 text-base"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
            <div className="border-b px-6 py-3 bg-muted/30">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <TabsList className="h-9">
                  <TabsTrigger value="students" className="gap-2 px-3">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Étudiants</span>
                    {normalizedTerm && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {filteredStudents.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="teachers" className="gap-2 px-3">
                    <GraduationCap className="h-4 w-4" />
                    <span className="hidden sm:inline">Professeurs</span>
                    {normalizedTerm && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {filteredTeachers.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="classrooms" className="gap-2 px-3">
                    <DoorOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Salles</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {classroomAvailability.filter(r => r.isAvailable).length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
                {normalizedTerm && activeTab !== 'classrooms' && (
                  <span className="text-sm text-muted-foreground">
                    {totalResults} résultat{totalResults > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

              <ScrollArea className="flex-1 h-[450px]">
                <TabsContent value="students" className="m-0 p-4">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-12">
                      <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Aucun étudiant trouvé pour "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredStudents.map((student) => {
                        const stats = getStudentStats(student);
                        return (
                          <div 
                            key={student.id} 
                            className="p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex gap-4">
                              <Avatar className="h-14 w-14 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {getInitials(student.firstname, student.lastname)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <h4 className="font-semibold text-base">
                                      {student.firstname} {student.lastname}
                                    </h4>
                                    {stats.className && (
                                      <Badge variant="outline" className="mt-1">
                                        {stats.className}
                                      </Badge>
                                    )}
                                  </div>
                                  {stats.averageGrade !== null && (
                                    <div className="text-right">
                                      <span className={`text-lg font-bold ${
                                        stats.averageGrade >= 14 ? "text-green-600" :
                                        stats.averageGrade >= 10 ? "text-amber-600" : "text-red-600"
                                      }`}>
                                        {stats.averageGrade.toFixed(1)}/20
                                      </span>
                                      <p className="text-xs text-muted-foreground">Moyenne</p>
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                                  {student.email && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Mail className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">{student.email}</span>
                                    </div>
                                  )}
                                  {student.student_phone && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Phone className="h-3.5 w-3.5 shrink-0" />
                                      <span>{student.student_phone}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <CreditCard className="h-3.5 w-3.5 shrink-0" />
                                    <span>{student.cin_number}</span>
                                  </div>
                                  {student.birth_date && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                      <span>{format(new Date(student.birth_date), "dd/MM/yyyy")}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-4 pt-3 border-t">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                      <BookOpen className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Notes</p>
                                      <p className="font-semibold text-sm">{stats.totalGrades}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                      <AlertCircle className="h-4 w-4 text-red-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Absences</p>
                                      <p className="font-semibold text-sm">{stats.absences}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                      <CheckCircle2 className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Justifiées</p>
                                      <p className="font-semibold text-sm">{stats.justified}</p>
                                    </div>
                                  </div>
                                  {stats.presenceRate !== null && (
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Présence</p>
                                        <p className="font-semibold text-sm">{stats.presenceRate.toFixed(0)}%</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="teachers" className="m-0 p-4">
                  {filteredTeachers.length === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Aucun professeur trouvé pour "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTeachers.map((teacher) => {
                        const stats = getTeacherStats(teacher);
                        return (
                          <div 
                            key={teacher.id} 
                            className="p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex gap-4">
                              <Avatar className="h-14 w-14 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {getInitials(teacher.firstname, teacher.lastname)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <h4 className="font-semibold text-base flex items-center gap-2">
                                      {teacher.firstname} {teacher.lastname}
                                      <Badge 
                                        variant={teacher.status === "active" ? "default" : "secondary"}
                                        className="text-xs"
                                      >
                                        {teacher.status === "active" ? "Actif" : teacher.status}
                                      </Badge>
                                    </h4>
                                    {teacher.qualification && (
                                      <p className="text-sm text-muted-foreground">{teacher.qualification}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className="text-lg font-bold text-primary">
                                      {stats.classes.length}
                                    </span>
                                    <p className="text-xs text-muted-foreground">Classes</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                  {teacher.email && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Mail className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">{teacher.email}</span>
                                    </div>
                                  )}
                                  {teacher.mobile && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Phone className="h-3.5 w-3.5 shrink-0" />
                                      <span>{teacher.mobile}</span>
                                    </div>
                                  )}
                                </div>

                                {stats.classes.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-xs text-muted-foreground mb-1.5">Classes assignées</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {stats.classes.map((cls) => (
                                        <Badge key={cls.id} variant="outline" className="text-xs">
                                          {cls.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {stats.subjects.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-xs text-muted-foreground mb-1.5">Matières enseignées</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {stats.subjects.map((subj) => (
                                        <Badge key={subj.id} variant="secondary" className="text-xs">
                                          <BookOpen className="h-3 w-3 mr-1" />
                                          {subj.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {stats.upcomingSessions.length > 0 && (
                                  <div className="pt-3 border-t">
                                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Prochaines séances
                                    </p>
                                    <div className="space-y-2">
                                      {stats.upcomingSessions.map((session, idx) => (
                                        <div 
                                          key={idx} 
                                          className="flex items-center gap-3 text-sm bg-muted/50 rounded-lg px-3 py-2"
                                        >
                                          <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <span className="font-medium">
                                              {format(new Date(session.session_date), "EEEE d MMM", { locale: fr })}
                                            </span>
                                            {session.start_time && (
                                              <span className="text-muted-foreground"> à {session.start_time.slice(0, 5)}</span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            {session.className && (
                                              <Badge variant="outline" className="text-xs">
                                                {session.className}
                                              </Badge>
                                            )}
                                            {session.subjectName && (
                                              <Badge variant="secondary" className="text-xs">
                                                {session.subjectName}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Onglet Salles de cours */}
                <TabsContent value="classrooms" className="m-0 p-4">
                  <div className="space-y-4">
                    {/* Filtres de date/heure */}
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Vérifier la disponibilité
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={roomSearchDate}
                            onChange={(e) => setRoomSearchDate(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Heure début</Label>
                          <Input
                            type="time"
                            value={roomSearchStartTime}
                            onChange={(e) => setRoomSearchStartTime(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Heure fin</Label>
                          <Input
                            type="time"
                            value={roomSearchEndTime}
                            onChange={(e) => setRoomSearchEndTime(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(roomSearchDate), "EEEE d MMMM yyyy", { locale: fr })} de {roomSearchStartTime} à {roomSearchEndTime}
                      </p>
                    </div>

                    {/* Résultats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {classroomAvailability.length === 0 ? (
                        <div className="col-span-full text-center py-8">
                          <DoorOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">Aucune salle de cours configurée</p>
                        </div>
                      ) : (
                        classroomAvailability.map((room) => (
                          <div 
                            key={room.id} 
                            className={`p-4 rounded-lg border transition-all ${
                              room.isAvailable 
                                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                  room.isAvailable 
                                    ? 'bg-green-100 dark:bg-green-900/50' 
                                    : 'bg-red-100 dark:bg-red-900/50'
                                }`}>
                                  {room.isAvailable ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                  )}
                                </div>
                                <div>
                                  <h5 className="font-semibold">{room.name}</h5>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    <span>{room.capacity} places</span>
                                    {room.building && (
                                      <>
                                        <Building2 className="h-3 w-3 ml-1" />
                                        <span>{room.building}</span>
                                      </>
                                    )}
                                    {room.floor && (
                                      <>
                                        <MapPin className="h-3 w-3 ml-1" />
                                        <span>Étage {room.floor}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Badge variant={room.isAvailable ? "default" : "destructive"} className="shrink-0">
                                {room.isAvailable ? "Disponible" : "Occupée"}
                              </Badge>
                            </div>
                            
                            {!room.isAvailable && room.conflicts.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                                <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Occupée par :</p>
                                <div className="space-y-1">
                                  {room.conflicts.map((conflict, idx) => (
                                    <div key={idx} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {conflict.startTime?.slice(0,5)} - {conflict.endTime?.slice(0,5)}
                                      {conflict.className && <span>• {conflict.className}</span>}
                                      {conflict.subjectName && <span>({conflict.subjectName})</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Résumé */}
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">
                        {classroomAvailability.filter(r => r.isAvailable).length} salle{classroomAvailability.filter(r => r.isAvailable).length > 1 ? 's' : ''} disponible{classroomAvailability.filter(r => r.isAvailable).length > 1 ? 's' : ''} sur {classroomAvailability.length}
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
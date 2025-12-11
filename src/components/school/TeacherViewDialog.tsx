import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, Mail, Phone, Calendar, GraduationCap, MapPin, 
  DollarSign, Briefcase, BookOpen, Users, X, Clock, Timer
} from "lucide-react";
import { Teacher } from "@/hooks/useTeachers";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useTeacherSessionHours } from "@/hooks/useTeacherSessionHours";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TeacherViewDialogProps {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeacherViewDialog({ 
  teacher, 
  open, 
  onOpenChange 
}: TeacherViewDialogProps) {
  const { teacherClasses } = useTeacherClasses(teacher?.id);
  const { subjects } = useSubjects(teacher?.school_id, undefined, teacher?.id);
  const { data: sessionHoursData, loading: hoursLoading } = useTeacherSessionHours(teacher?.id);

  if (!teacher) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) {
      return `${wholeHours}h`;
    }
    return `${wholeHours}h${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Détails du Professeur
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Header Section */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{teacher.firstname} {teacher.lastname}</h3>
                    <p className="text-muted-foreground">{teacher.qualification || "Professeur"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={teacher.status === 'active' ? 'default' : 'secondary'}
                    className={`${teacher.status === 'active' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500'} text-white`}
                  >
                    {teacher.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                  {teacher.archived && (
                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                      Archivé
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Classes</p>
                    <p className="text-2xl font-bold">{teacherClasses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Matières</p>
                    <p className="text-2xl font-bold">{subjects.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Heures</p>
                    {hoursLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                        {sessionHoursData ? formatHours(sessionHoursData.totalHours) : '0h'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Timer className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Séances</p>
                    {hoursLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-2xl font-bold">{sessionHoursData?.totalSessions || 0}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hours by Class Section */}
          {sessionHoursData && sessionHoursData.hoursByClass.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Heures par classe (année en cours)
                </h3>
                <div className="space-y-3">
                  {sessionHoursData.hoursByClass.map((classData) => (
                    <div
                      key={classData.classId}
                      className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100 dark:border-amber-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="font-semibold">{classData.className}</p>
                          <p className="text-sm text-muted-foreground">
                            {classData.sessionCount} séance{classData.sessionCount > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
                          {formatHours(classData.totalHours)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ~{Math.round(classData.totalHours / classData.sessionCount * 60)} min/séance
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-primary" />
                Informations de contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{teacher.email || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mobile</p>
                    <p className="font-medium">{teacher.mobile || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="font-medium">{teacher.address || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Genre</p>
                    <p className="font-medium">
                      {teacher.gender === 'male' ? 'Masculin' : teacher.gender === 'female' ? 'Féminin' : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-primary" />
                Informations professionnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date de naissance</p>
                    <p className="font-medium">{formatDate(teacher.birth_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date d'adhésion</p>
                    <p className="font-medium">{formatDate(teacher.join_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Salaire</p>
                    <p className="font-medium">{teacher.salary ? `${teacher.salary} MAD` : "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Qualification</p>
                    <p className="font-medium">{teacher.qualification || "-"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classes and Subjects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Classes */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  Classes assignées ({teacherClasses.length})
                </h3>
                {teacherClasses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune classe assignée
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {teacherClasses.map((tc) => (
                      <div
                        key={tc.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">{tc.classes?.name || "Classe inconnue"}</span>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subjects */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Matières enseignées ({subjects.length})
                </h3>
                {subjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune matière assignée
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">{subject.name}</span>
                        <Badge variant="secondary">{subject.archived ? "Archivée" : "Active"}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

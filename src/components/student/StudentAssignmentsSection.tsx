import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calendar, Clock, FileText, User } from "lucide-react";
import { useCurrentStudent } from "@/hooks/useCurrentStudent";
import { useAssignments } from "@/hooks/useAssignments";
import { format, isPast, isFuture } from "date-fns";
import { fr } from "date-fns/locale";

interface StudentAssignmentsSectionProps {
  studentId?: string;
}

export const StudentAssignmentsSection = ({ studentId }: StudentAssignmentsSectionProps) => {
  const { student, loading: studentLoading } = useCurrentStudent(studentId);
  const { assignments, loading: assignmentsLoading } = useAssignments(student?.class_id);

  const getAssignmentTypeLabel = (type: string) => {
    const labels = {
      exam: 'Examen',
      test: 'Contrôle',
      homework: 'Devoir'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAssignmentTypeVariant = (type: string) => {
    const variants = {
      exam: 'destructive',
      test: 'default',
      homework: 'secondary'
    };
    return variants[type as keyof typeof variants] || 'outline';
  };

  // Filter assignments by upcoming and past
  const upcomingAssignments = assignments.filter(assignment => {
    if (!assignment.due_date) return true; // No due date = upcoming
    return isFuture(new Date(assignment.due_date)) || 
           format(new Date(assignment.due_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  }).sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const pastAssignments = assignments.filter(assignment => {
    if (!assignment.due_date) return false;
    return isPast(new Date(assignment.due_date)) && 
           format(new Date(assignment.due_date), 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');
  }).sort((a, b) => {
    if (!a.due_date || !b.due_date) return 0;
    return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
  });

  if (studentLoading || assignmentsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Mes Devoirs
          </h1>
          <p className="text-muted-foreground">
            Aucune information d'étudiant trouvée
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Mes Devoirs
        </h1>
        <p className="text-muted-foreground">
          Classe {student.classes.name} - {assignments.length} devoir{assignments.length > 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Assignments Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Devoirs</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">
                À Venir ({upcomingAssignments.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Passés ({pastAssignments.length})
              </TabsTrigger>
            </TabsList>

            {/* Upcoming Assignments */}
            <TabsContent value="upcoming" className="space-y-4 mt-4">
              {upcomingAssignments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    Aucun devoir à venir pour le moment
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Profitez-en pour réviser !
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment) => (
                    <Card key={assignment.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start gap-2">
                              <FileText className="h-5 w-5 text-primary mt-0.5" />
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{assignment.title}</h3>
                                {assignment.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {assignment.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              {assignment.teachers && (
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span>{assignment.teachers.firstname} {assignment.teachers.lastname}</span>
                                </div>
                              )}
                              {assignment.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{format(new Date(assignment.due_date), 'dd MMMM yyyy', { locale: fr })}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={getAssignmentTypeVariant(assignment.type) as any}>
                              {getAssignmentTypeLabel(assignment.type)}
                            </Badge>
                            {assignment.due_date && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {Math.ceil((new Date(assignment.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jour(s)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Past Assignments */}
            <TabsContent value="past" className="space-y-4 mt-4">
              {pastAssignments.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    Aucun devoir passé
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastAssignments.map((assignment) => (
                    <Card key={assignment.id} className="border-l-4 border-l-muted opacity-75">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start gap-2">
                              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{assignment.title}</h3>
                                {assignment.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {assignment.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              {assignment.teachers && (
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span>{assignment.teachers.firstname} {assignment.teachers.lastname}</span>
                                </div>
                              )}
                              {assignment.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{format(new Date(assignment.due_date), 'dd MMMM yyyy', { locale: fr })}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline">
                              {getAssignmentTypeLabel(assignment.type)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

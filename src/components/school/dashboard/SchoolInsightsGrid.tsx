import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  School, 
  FileText, 
  ClipboardList, 
  Building2,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trophy
} from "lucide-react";

interface AbsenceByClass {
  classId: string;
  className: string;
  totalAbsences: number;
  totalStudents: number;
  absenceRate: number;
}

interface TopStudentByClass {
  classId: string;
  className: string;
  students: Array<{
    id: string;
    firstname: string;
    lastname: string;
    average: number;
    totalGrades: number;
  }>;
}

interface DocumentRequest {
  id: string;
  status: string;
  document_type: string;
}

interface Admission {
  id: string;
  status: string;
}

interface SchoolInsightsGridProps {
  absencesByClass: AbsenceByClass[];
  topStudentsByClass: TopStudentByClass[];
  documentRequests: DocumentRequest[];
  admissions: Admission[];
  loading?: boolean;
  onViewAdmissions?: () => void;
  classroomWidget?: React.ReactNode;
}

export function SchoolInsightsGrid({
  absencesByClass,
  topStudentsByClass,
  documentRequests,
  admissions,
  loading = false,
  onViewAdmissions,
  classroomWidget
}: SchoolInsightsGridProps) {
  const pendingDocs = documentRequests.filter(r => r.status === 'pending').length;
  const processingDocs = documentRequests.filter(r => r.status === 'processing').length;
  const completedDocs = documentRequests.filter(r => r.status === 'completed').length;

  const newAdmissions = admissions.filter(a => a.status === 'nouveau').length;
  const inProgressAdmissions = admissions.filter(a => a.status === 'en_cours').length;
  const processedAdmissions = admissions.filter(a => a.status === 'traite').length;
  const rejectedAdmissions = admissions.filter(a => a.status === 'refuse').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Absences par classe */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-base">Absences par Classe</CardTitle>
                <CardDescription className="text-xs">Taux d'absentéisme</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {absencesByClass.length > 0 ? (
            <div className="space-y-2">
              {absencesByClass.slice(0, 4).map((item) => (
                <div 
                  key={item.classId} 
                  className="flex items-center justify-between p-3 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <School className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{item.className}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.totalAbsences} absences • {item.totalStudents} étudiants
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={item.absenceRate > 15 ? "destructive" : item.absenceRate > 10 ? "outline" : "secondary"}
                    className="font-mono"
                  >
                    {item.absenceRate.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">Aucune absence enregistrée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demandes de documents */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Demandes de Documents</CardTitle>
              <CardDescription className="text-xs">Suivi des demandes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50">
              <div className="text-xl font-bold text-amber-600">{pendingDocs}</div>
              <div className="text-xs text-muted-foreground">En attente</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50">
              <div className="text-xl font-bold text-blue-600">{processingDocs}</div>
              <div className="text-xs text-muted-foreground">En cours</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200/50">
              <div className="text-xl font-bold text-green-600">{completedDocs}</div>
              <div className="text-xs text-muted-foreground">Complétées</div>
            </div>
          </div>
          {documentRequests.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">Aucune demande</p>
          )}
        </CardContent>
      </Card>

      {/* Demandes d'admission */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <ClipboardList className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">Demandes d'Admission</CardTitle>
                <CardDescription className="text-xs">Nouvelles inscriptions</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50">
              <div className="text-xl font-bold text-blue-600">{newAdmissions}</div>
              <div className="text-xs text-muted-foreground">Nouvelles</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50">
              <div className="text-xl font-bold text-amber-600">{inProgressAdmissions}</div>
              <div className="text-xs text-muted-foreground">En cours</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200/50">
              <div className="text-xl font-bold text-green-600">{processedAdmissions}</div>
              <div className="text-xs text-muted-foreground">Traitées</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/50">
              <div className="text-xl font-bold text-red-600">{rejectedAdmissions}</div>
              <div className="text-xs text-muted-foreground">Refusées</div>
            </div>
          </div>
          {admissions.length > 0 && onViewAdmissions && (
            <Button variant="outline" size="sm" className="w-full" onClick={onViewAdmissions}>
              Voir toutes les admissions
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Disponibilité des salles */}
      {classroomWidget}

      {/* Meilleurs étudiants par classe */}
      <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
              <Trophy className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-base">Meilleurs Étudiants par Classe</CardTitle>
              <CardDescription className="text-xs">Top 3 de chaque classe par moyenne</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {topStudentsByClass.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {topStudentsByClass.slice(0, 6).map((classData) => (
                <div key={classData.classId} className="p-4 bg-accent/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <School className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">{classData.className}</h4>
                  </div>
                  <div className="space-y-2">
                    {classData.students.slice(0, 3).map((student, index) => (
                      <div 
                        key={student.id} 
                        className="flex items-center gap-2 p-2 bg-background rounded-lg"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          'bg-orange-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {student.firstname} {student.lastname}
                          </p>
                        </div>
                        <span className={`text-sm font-bold ${
                          student.average >= 14 ? 'text-green-600' :
                          student.average >= 10 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {student.average}/20
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Aucune note disponible</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

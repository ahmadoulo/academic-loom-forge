import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";
import { useExamDocuments } from "@/hooks/useExamDocuments";
import { useSchools } from "@/hooks/useSchools";
import { useSubjects } from "@/hooks/useSubjects";
import { useTeachers } from "@/hooks/useTeachers";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useSemester } from "@/hooks/useSemester";

export const ExamDocumentsManagement = () => {
  const { schools } = useSchools();
  const school = schools?.[0];
  const { getYearForDisplay } = useAcademicYear();
  const schoolYear = getYearForDisplay();
  const { currentSemester } = useSemester();

  const { subjects } = useSubjects(school?.id, schoolYear);
  const { teachers } = useTeachers(school?.id);

  const { examDocuments, isLoading } = useExamDocuments(school?.id);

  // Only show submitted exams
  const submittedExams = examDocuments.filter((e) => e.status === "submitted");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: "secondary", label: "Brouillon" },
      submitted: { variant: "default", label: "Soumis" },
      approved: { variant: "default", label: "Approuvé" },
      rejected: { variant: "destructive", label: "Rejeté" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getExamTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      devoir_surveille: "Devoir Surveillé",
      controle: "Contrôle",
      examen: "Examen",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Documents d'Examen Soumis</h2>
        <p className="text-muted-foreground">
          Consultez tous les documents d'examens soumis par les enseignants
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : submittedExams.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucun document d'examen soumis pour le moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submittedExams.map((exam) => {
            const subject = subjects?.find((s) => s.id === exam.subject_id);
            const teacher = teachers?.find((t) => t.id === exam.teacher_id);
            
            return (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2">
                        {getExamTypeLabel(exam.exam_type)}
                        {getStatusBadge(exam.status)}
                      </CardTitle>
                      <CardDescription>
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">Matière:</span> {subject?.name}
                          </div>
                          <div>
                            <span className="font-medium">Enseignant:</span>{" "}
                            {teacher?.firstname} {teacher?.lastname}
                          </div>
                          <div>
                            <span className="font-medium">Durée:</span> {exam.duration_minutes} minutes
                          </div>
                          <div>
                            <span className="font-medium">Documents:</span>{" "}
                            {exam.documents_allowed ? "Autorisés" : "Non autorisés"}
                          </div>
                          <div>
                            <span className="font-medium">Soumis le:</span>{" "}
                            {exam.submitted_at
                              ? new Date(exam.submitted_at).toLocaleDateString("fr-FR")
                              : "-"}
                          </div>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Download, Eye, Trash2 } from "lucide-react";
import { useExamDocuments } from "@/hooks/useExamDocuments";
import { useCurrentTeacher } from "@/hooks/useCurrentTeacher";
import { useAuth } from "@/hooks/useAuth";
import { useSubjects } from "@/hooks/useSubjects";
import { useSchools } from "@/hooks/useSchools";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useSemester } from "@/hooks/useSemester";
import { ExamDocumentForm } from "./ExamDocumentForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadExamPDF, previewExamPDF } from "@/utils/examPdfExport";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const ExamDocumentsSection = () => {
  const { user } = useAuth();
  const { teacher } = useCurrentTeacher();
  const { selectedYear, currentYear } = useAcademicYear();
  const schoolYear = selectedYear || currentYear;
  const { currentSemester } = useSemester();
  const [showForm, setShowForm] = useState(false);

  const { schools } = useSchools();
  const school = schools?.[0];

  // Récupérer toutes les matières assignées au professeur (comme dans StudentsGrading)
  const { subjects: teacherSubjects } = useSubjects(undefined, undefined, teacher?.id);

  const { examDocuments, isLoading, createExamDocument, submitExamDocument, deleteExamDocument } =
    useExamDocuments(school?.id, teacher?.id);

  const handleCreateExam = async (data: any) => {
    if (!teacher || !school || !schoolYear) return;

    await createExamDocument.mutateAsync({
      school_id: school.id,
      teacher_id: teacher.id,
      school_year_id: schoolYear.id,
      school_semester_id: currentSemester?.id,
      ...data,
    });

    setShowForm(false);
  };

  const handleExportPDF = async (examId: string) => {
    const exam = examDocuments.find((e) => e.id === examId);
    if (!exam || !school || !teacher || !schoolYear) return;

    try {
      // Récupérer les questions depuis la base de données
      const { data: questions, error: questionsError } = await supabase
        .from("exam_questions")
        .select(`
          *,
          exam_answers (*)
        `)
        .eq("exam_document_id", examId)
        .order("question_number", { ascending: true });

      if (questionsError) throw questionsError;
      if (!questions) return;

      // Récupérer les détails de la classe
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("name")
        .eq("id", exam.class_id)
        .single();

      if (classError) throw classError;

      const subject = teacherSubjects?.find((s) => s.id === exam.subject_id);
      if (!subject) {
        toast.error("Matière introuvable");
        return;
      }

      await downloadExamPDF(
        {
          exam,
          questions: questions as any,
          school: {
            name: school.name,
            logo_url: school.logo_url,
          },
          subject: {
            name: subject.name,
          },
          class: {
            name: classData?.name || "",
          },
          teacher: {
            firstname: teacher.firstname,
            lastname: teacher.lastname,
          },
          semester: {
            name: currentSemester?.name || "",
          },
          schoolYear: {
            name: schoolYear.name,
          },
        },
        `examen_${exam.exam_type}_${subject.name}.pdf`
      );
    } catch (error) {
      toast.error("Erreur lors de l'export PDF");
      console.error(error);
    }
  };

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

  if (!teacher) {
    return <div>Chargement...</div>;
  }

  // Vérifier si le professeur a des matières assignées
  const hasSubjects = teacherSubjects && teacherSubjects.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documents d'Examen</h2>
          <p className="text-muted-foreground">
            Créez et gérez vos documents d'examens et devoirs surveillés
          </p>
        </div>
        {!showForm && (
          <Button 
            onClick={() => setShowForm(true)}
            disabled={!hasSubjects}
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer un document
          </Button>
        )}
      </div>

      {!hasSubjects && !showForm && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Aucune matière assignée. Contactez l'administration pour vous assigner des matières.
            </p>
          </CardContent>
        </Card>
      )}

      {showForm && hasSubjects ? (
        <ExamDocumentForm
          teacherId={teacher.id}
          schoolId={school?.id || ""}
          schoolYearId={schoolYear?.id || ""}
          semesterId={currentSemester?.id}
          subjects={teacherSubjects.map(s => ({
            id: s.id,
            name: s.name,
            class_id: s.class_id,
          }))}
          onSubmit={handleCreateExam}
          onCancel={() => setShowForm(false)}
        />
      ) : !showForm && hasSubjects && (
        <>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : examDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Aucun document d'examen créé. Commencez par créer votre premier document.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {examDocuments.map((exam) => {
                const subject = teacherSubjects?.find((s) => s.id === exam.subject_id);
                return (
                  <Card key={exam.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {getExamTypeLabel(exam.exam_type)}
                            {getStatusBadge(exam.status)}
                          </CardTitle>
                          <CardDescription>
                            {subject?.name} • {exam.duration_minutes} minutes
                            {exam.documents_allowed && " • Documents autorisés"}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportPDF(exam.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {exam.status === "draft" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => submitExamDocument.mutate(exam.id)}
                              >
                                Soumettre
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteExamDocument.mutate(exam.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

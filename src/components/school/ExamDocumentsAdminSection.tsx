import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";
import { useExamDocuments } from "@/hooks/useExamDocuments";
import { useSchools } from "@/hooks/useSchools";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useSemester } from "@/hooks/useSemester";
import { exportExamToPDF } from "@/utils/examPdfExport";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface ExamDocumentsAdminSectionProps {
  schoolId: string;
}

export function ExamDocumentsAdminSection({ schoolId }: ExamDocumentsAdminSectionProps) {
  const { examDocuments, loading, getExamWithQuestions } = useExamDocuments(undefined, schoolId);
  const { schools } = useSchools();
  const school = schools.find(s => s.id === schoolId);
  const { currentYear } = useAcademicYear();
  const { currentSemester } = useSemester();

  const submittedExams = examDocuments.filter(exam => exam.status === 'submitted');

  const getExamTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'devoir_surveille': 'Devoir Surveillé',
      'controle': 'Contrôle',
      'examen': 'Examen'
    };
    return labels[type] || type;
  };

  const handleExportPDF = async (exam: any) => {
    try {
      const questions = await getExamWithQuestions(exam.id);
      
      await exportExamToPDF({
        examType: exam.exam_type,
        subject: exam.subjects?.name || '',
        className: exam.classes?.name || '',
        teacherName: `${exam.teachers?.firstname} ${exam.teachers?.lastname}`,
        semester: currentSemester?.name || 'Semestre actuel',
        schoolYear: currentYear?.name || '',
        documentsAllowed: exam.documents_allowed,
        duration: exam.duration_minutes,
        questions: questions,
        schoolLogoUrl: school?.logo_url,
        schoolName: school?.name || ''
      });
      
      toast.success('PDF exporté avec succès');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Documents d'Examen Soumis</h2>
        <p className="text-muted-foreground">Examens et contrôles soumis par les enseignants</p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Chargement...</p>
      ) : submittedExams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun document d'examen soumis</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submittedExams.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {getExamTypeLabel(exam.exam_type)} - {exam.subjects?.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Enseignant: {exam.teachers?.firstname} {exam.teachers?.lastname}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Classe: {exam.classes?.name}
                    </p>
                  </div>
                  <Badge>Soumis</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Durée: {exam.duration_minutes} min</span>
                    <span>{exam.documents_allowed ? "Documents autorisés" : "Sans documents"}</span>
                    <span>
                      Soumis le {exam.submitted_at && format(new Date(exam.submitted_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF(exam)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

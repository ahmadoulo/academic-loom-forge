import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Trash2, Download } from "lucide-react";
import { ExamDocumentForm } from "./ExamDocumentForm";
import { ExamDocumentBuilder } from "./ExamDocumentBuilder";
import { useExamDocuments } from "@/hooks/useExamDocuments";
import { useCurrentTeacher } from "@/hooks/useCurrentTeacher";
import { useSchools } from "@/hooks/useSchools";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useSemester } from "@/hooks/useSemester";
import { exportExamToPDF } from "@/utils/examPdfExport";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export function ExamDocumentsSection() {
  const { teacher } = useCurrentTeacher();
  const { examDocuments, loading, createExamDocument, deleteExamDocument, getExamWithQuestions } = useExamDocuments(
    teacher?.id,
    teacher?.school_id
  );
  const { schools } = useSchools();
  const school = schools.find(s => s.id === teacher?.school_id);
  const { currentYear } = useAcademicYear();
  const { currentSemester } = useSemester();

  const [showForm, setShowForm] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);

  const handleCreateDocument = async (data: any) => {
    try {
      const doc = await createExamDocument(data, teacher!.id, teacher!.school_id);
      setShowForm(false);
      setSelectedExam(doc);
    } catch (error) {
      console.error('Erreur création document:', error);
    }
  };

  const handleDelete = async (examId: string) => {
    if (confirm("Supprimer ce document ?")) {
      await deleteExamDocument(examId);
    }
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'draft': { variant: 'secondary', label: 'Brouillon' },
      'submitted': { variant: 'default', label: 'Soumis' },
      'approved': { variant: 'success', label: 'Approuvé' }
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getExamTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'devoir_surveille': 'Devoir Surveillé',
      'controle': 'Contrôle',
      'examen': 'Examen'
    };
    return labels[type] || type;
  };

  if (selectedExam && selectedExam.status === 'draft') {
    return (
      <ExamDocumentBuilder
        examDocument={selectedExam}
        onBack={() => setSelectedExam(null)}
        onComplete={() => {
          setSelectedExam(null);
          window.location.reload();
        }}
      />
    );
  }

  if (showForm) {
    return (
      <ExamDocumentForm
        teacherId={teacher!.id}
        schoolId={teacher!.school_id}
        onSubmit={handleCreateDocument}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Documents d'Examen</h2>
          <p className="text-muted-foreground">Créez et gérez vos examens et contrôles</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Document
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Chargement...</p>
      ) : examDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun document d'examen créé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {examDocuments.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {getExamTypeLabel(exam.exam_type)} - {exam.subjects?.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Classe: {exam.classes?.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(exam.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Durée: {exam.duration_minutes} min</span>
                    <span>{exam.documents_allowed ? "Documents autorisés" : "Sans documents"}</span>
                    <span>
                      Créé le {format(new Date(exam.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {exam.status === 'draft' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExam(exam)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Continuer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(exam.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {exam.status === 'submitted' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPDF(exam)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter PDF
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

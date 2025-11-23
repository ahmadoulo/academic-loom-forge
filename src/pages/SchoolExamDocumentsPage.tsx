import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { useSchools } from "@/hooks/useSchools";
import { useExamDocuments } from "@/hooks/useExamDocuments";
import { ExamDocumentsReviewByClass } from "@/components/school/ExamDocumentsReviewByClass";
import { downloadExamPdf } from "@/utils/examPdfExport";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SchoolExamDocumentsPage() {
  const { schoolId } = useParams();
  const { user } = useAuth();
  const { schools } = useSchools();
  const school = schools.find(s => s.identifier === schoolId);
  
  const {
    schoolExams,
    isLoadingSchoolExams,
    fetchExamQuestions,
    reviewExam,
  } = useExamDocuments(undefined, school?.id);

  const handleApprove = async (examId: string) => {
    if (!user?.id) {
      toast.error("Utilisateur non authentifié");
      return;
    }
    try {
      await reviewExam({ examId, reviewerId: user.id, approved: true });
      toast.success("Document approuvé avec succès");
    } catch (error) {
      console.error('Error approving exam:', error);
      toast.error("Erreur lors de l'approbation du document");
    }
  };

  const handleReject = async (examId: string) => {
    if (!user?.id) {
      toast.error("Utilisateur non authentifié");
      return;
    }
    try {
      await reviewExam({ examId, reviewerId: user.id, approved: false });
      toast.success("Document rejeté avec succès");
    } catch (error) {
      console.error('Error rejecting exam:', error);
      toast.error("Erreur lors du rejet du document");
    }
  };

  const handleExport = async (examId: string) => {
    try {
      const exam = schoolExams?.find((e: any) => e.id === examId);
      if (!exam) return;

      const questions = await fetchExamQuestions(examId);
      
      await downloadExamPdf({
        exam,
        questions,
        schoolName: school?.name || '',
        schoolLogoUrl: school?.logo_url,
      }, `examen_${exam.exam_type}_${exam.subjects?.name}.pdf`);
    } catch (error) {
      console.error('Error exporting exam:', error);
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  if (isLoadingSchoolExams) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Documents d'examens par classe</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4 flex flex-wrap gap-2">
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="submitted">En attente</TabsTrigger>
              <TabsTrigger value="approved">Approuvés</TabsTrigger>
              <TabsTrigger value="rejected">Rejetés</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ExamDocumentsReviewByClass
                exams={schoolExams || []}
                onApprove={handleApprove}
                onReject={handleReject}
                onExport={handleExport}
              />
            </TabsContent>

            <TabsContent value="submitted">
              <ExamDocumentsReviewByClass
                exams={(schoolExams || []).filter((e: any) => e.status === "submitted")}
                onApprove={handleApprove}
                onReject={handleReject}
                onExport={handleExport}
              />
            </TabsContent>

            <TabsContent value="approved">
              <ExamDocumentsReviewByClass
                exams={(schoolExams || []).filter((e: any) => e.status === "approved")}
                onApprove={handleApprove}
                onReject={handleReject}
                onExport={handleExport}
              />
            </TabsContent>

            <TabsContent value="rejected">
              <ExamDocumentsReviewByClass
                exams={(schoolExams || []).filter((e: any) => e.status === "rejected")}
                onApprove={handleApprove}
                onReject={handleReject}
                onExport={handleExport}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { useSchools } from "@/hooks/useSchools";
import { useExamDocuments } from "@/hooks/useExamDocuments";
import { ExamDocumentsReviewByClass } from "@/components/school/ExamDocumentsReviewByClass";
import { downloadExamPdf } from "@/utils/examPdfExport";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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
    if (!user?.id) return;
    try {
      await reviewExam({ examId, reviewerId: user.id, approved: true });
    } catch (error) {
      console.error('Error approving exam:', error);
    }
  };

  const handleReject = async (examId: string) => {
    if (!user?.id) return;
    try {
      await reviewExam({ examId, reviewerId: user.id, approved: false });
    } catch (error) {
      console.error('Error rejecting exam:', error);
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
          <ExamDocumentsReviewByClass
            exams={schoolExams || []}
            onApprove={handleApprove}
            onReject={handleReject}
            onExport={handleExport}
          />
        </CardContent>
      </Card>
    </div>
  );
}

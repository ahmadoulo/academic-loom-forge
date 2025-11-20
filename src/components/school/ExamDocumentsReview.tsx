import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Download, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ExamDocument {
  id: string;
  exam_type: string;
  duration_minutes: number;
  documents_allowed: boolean;
  status: string;
  submitted_at: string | null;
  subjects: { name: string } | null;
  classes: { name: string } | null;
  teachers: { firstname: string; lastname: string } | null;
  school_semester: { name: string } | null;
}

interface ExamDocumentsReviewProps {
  exams: ExamDocument[];
  onApprove: (examId: string) => Promise<void>;
  onReject: (examId: string) => Promise<void>;
  onExport: (examId: string) => Promise<void>;
}

export const ExamDocumentsReview = ({ exams, onApprove, onReject, onExport }: ExamDocumentsReviewProps) => {
  return (
    <div className="grid gap-4">
      {exams.map((exam) => (
        <Card key={exam.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  {exam.exam_type} - {exam.subjects?.name}
                </CardTitle>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Classe: {exam.classes?.name}</div>
                  <div>
                    Enseignant: {exam.teachers?.firstname} {exam.teachers?.lastname}
                  </div>
                  <div>Durée: {exam.duration_minutes} minutes</div>
                  <div>
                    Documents: {exam.documents_allowed ? "Autorisés" : "Non autorisés"}
                  </div>
                  {exam.school_semester && (
                    <div>Semestre: {exam.school_semester.name}</div>
                  )}
                </div>
              </div>
              <Badge className="bg-blue-500">En attente</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Soumis {exam.submitted_at && formatDistanceToNow(new Date(exam.submitted_at), { addSuffix: true, locale: fr })}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport(exam.id)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Aperçu PDF
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onReject(exam.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Rejeter
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onApprove(exam.id)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approuver
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {exams.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun document en attente de validation</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

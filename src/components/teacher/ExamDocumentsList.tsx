import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Send, Download, Trash2, Edit, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExamDocument {
  id: string;
  exam_type: string;
  duration_minutes: number;
  documents_allowed: boolean;
  status: string;
  created_at: string;
  submitted_at: string | null;
  subjects: { name: string } | null;
  classes: { name: string } | null;
  school_semester: { name: string } | null;
}

interface ExamDocumentsListProps {
  exams: ExamDocument[];
  onSubmit: (examId: string) => Promise<void>;
  onDelete: (examId: string) => Promise<void>;
  onExport: (examId: string) => Promise<void>;
  onEdit?: (examId: string) => void;
}

const statusColors = {
  draft: "bg-gray-500",
  submitted: "bg-blue-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
};

const statusLabels = {
  draft: "Brouillon",
  submitted: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
};

export const ExamDocumentsList = ({ exams, onSubmit, onDelete, onExport, onEdit }: ExamDocumentsListProps) => {
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
                  <div>Durée: {exam.duration_minutes} minutes</div>
                  <div>
                    Documents: {exam.documents_allowed ? "Autorisés" : "Non autorisés"}
                  </div>
                  {exam.school_semester && (
                    <div>Semestre: {exam.school_semester.name}</div>
                  )}
                </div>
              </div>
              <Badge className={statusColors[exam.status as keyof typeof statusColors]}>
                {statusLabels[exam.status as keyof typeof statusLabels]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {exam.status === "rejected" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Ce document a été rejeté. Vous pouvez le modifier et le soumettre à nouveau.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Créé {formatDistanceToNow(new Date(exam.created_at), { addSuffix: true, locale: fr })}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport(exam.id)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                
                {(exam.status === "draft" || exam.status === "rejected") && (
                  <>
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(exam.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onSubmit(exam.id)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Soumettre
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(exam.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {exams.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun document d'examen</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

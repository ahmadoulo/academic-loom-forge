import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Download, FileText, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ExamDocument {
  id: string;
  exam_type: string;
  duration_minutes: number;
  documents_allowed: boolean;
  status: string;
  submitted_at: string | null;
  subjects: { name: string } | null;
  classes: { name: string; id: string } | null;
  teachers: { firstname: string; lastname: string } | null;
  school_semester: { name: string } | null;
}

interface ExamDocumentsReviewByClassProps {
  exams: ExamDocument[];
  onApprove: (examId: string) => Promise<void>;
  onReject: (examId: string) => Promise<void>;
  onExport: (examId: string) => Promise<void>;
}

export const ExamDocumentsReviewByClass = ({ 
  exams, 
  onApprove, 
  onReject, 
  onExport 
}: ExamDocumentsReviewByClassProps) => {
  // Grouper les examens par classe
  const examsByClass = exams.reduce((acc, exam) => {
    const className = exam.classes?.name || "Sans classe";
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(exam);
    return acc;
  }, {} as Record<string, ExamDocument[]>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-blue-500">En attente</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approuvé</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejeté</Badge>;
      default:
        return <Badge className="bg-gray-500">Brouillon</Badge>;
    }
  };

  const classNames = Object.keys(examsByClass).sort();

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun document d'examen</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="w-full">
        {classNames.map((className) => {
          const classExams = examsByClass[className];
          const pendingCount = classExams.filter(e => e.status === "submitted").length;
          
          return (
            <AccordionItem key={className} value={className}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{className}</span>
                    <Badge variant="outline">{classExams.length} document(s)</Badge>
                  </div>
                  {pendingCount > 0 && (
                    <Badge className="bg-orange-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {pendingCount} en attente
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 pt-2">
                  {classExams.map((exam) => (
                    <Card key={exam.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base">
                              {exam.exam_type} - {exam.subjects?.name}
                            </CardTitle>
                            <div className="text-sm text-muted-foreground space-y-1">
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
                          {getStatusBadge(exam.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {exam.status === "submitted" && exam.submitted_at && (
                              <>Soumis {formatDistanceToNow(new Date(exam.submitted_at), { addSuffix: true, locale: fr })}</>
                            )}
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
                            
                            {exam.status === "submitted" && (
                              <>
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
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

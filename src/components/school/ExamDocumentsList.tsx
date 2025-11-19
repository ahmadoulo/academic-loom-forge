import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, Trash2, Clock, BookOpen, School as SchoolIcon } from "lucide-react";
import { useExamDocuments } from "@/hooks/useExamDocuments";
import { useExamQuestions } from "@/hooks/useExamQuestions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { exportExamPDF } from "@/utils/examPdfExport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExamDocumentsListProps {
  schoolId: string;
  teacherId?: string;
  isAdmin?: boolean;
}

export function ExamDocumentsList({ schoolId, teacherId, isAdmin }: ExamDocumentsListProps) {
  const { documents, loading, deleteDocument, submitDocument } = useExamDocuments(schoolId, teacherId);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  
  const { questions } = useExamQuestions(selectedDoc || undefined);

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'devoir_surveille': 'Devoir surveillé',
      'controle': 'Contrôle',
      'examen': 'Examen'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      'draft': { variant: 'secondary', label: 'Brouillon' },
      'submitted': { variant: 'default', label: 'Soumis' },
      'approved': { variant: 'outline', label: 'Approuvé' }
    };
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleExport = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    try {
      toast.loading("Préparation du PDF...");
      
      // Fetch questions for this document
      const { data: questionsData } = await supabase
        .from('exam_questions')
        .select(`
          *,
          exam_answers (*)
        `)
        .eq('exam_document_id', docId)
        .order('question_number', { ascending: true });

      const questionsWithAnswers = questionsData?.map(q => ({
        ...q,
        answers: q.exam_answers || []
      })) || [];

      await exportExamPDF(doc, questionsWithAnswers, schoolId);
      toast.dismiss();
      toast.success("PDF exporté avec succès");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.dismiss();
      toast.error("Erreur lors de l'export du PDF");
    }
  };

  const handleView = (docId: string) => {
    setSelectedDoc(docId);
    setViewDialog(true);
  };

  const handleDelete = async (docId: string) => {
    await deleteDocument(docId);
    setDeleteDialog(null);
  };

  const handleSubmit = async (docId: string) => {
    await submitDocument(docId);
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <>
      <div className="grid gap-4">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {getTypeLabel(doc.exam_type)}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {doc.subjects?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <SchoolIcon className="h-4 w-4" />
                      {doc.classes?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {doc.duration_minutes} min
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.status)}
                  {doc.documents_allowed && (
                    <Badge variant="outline">Documents autorisés</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {isAdmin && doc.teachers && (
                    <p>Enseignant: {doc.teachers.firstname} {doc.teachers.lastname}</p>
                  )}
                  <p>Créé le: {new Date(doc.created_at).toLocaleDateString('fr-FR')}</p>
                  {doc.submitted_at && (
                    <p>Soumis le: {new Date(doc.submitted_at).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(doc.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport(doc.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter PDF
                  </Button>
                  {!isAdmin && doc.status === 'draft' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSubmit(doc.id)}
                      >
                        Soumettre
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog(doc.id)}
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

        {documents.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucun document d'examen
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du document</DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <ExamDocumentDetails docId={selectedDoc} documents={documents} questions={questions} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
        onConfirm={() => deleteDialog && handleDelete(deleteDialog)}
        title="Supprimer le document"
        description="Êtes-vous sûr de vouloir supprimer ce document d'examen ? Cette action est irréversible."
      />
    </>
  );
}

function ExamDocumentDetails({ 
  docId, 
  documents, 
  questions 
}: { 
  docId: string; 
  documents: any[];
  questions: any[];
}) {
  const doc = documents.find(d => d.id === docId);
  if (!doc) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium">Type</p>
          <p className="text-sm text-muted-foreground">
            {doc.exam_type === 'devoir_surveille' ? 'Devoir surveillé' : 
             doc.exam_type === 'controle' ? 'Contrôle' : 'Examen'}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Durée</p>
          <p className="text-sm text-muted-foreground">{doc.duration_minutes} minutes</p>
        </div>
        <div>
          <p className="text-sm font-medium">Matière</p>
          <p className="text-sm text-muted-foreground">{doc.subjects?.name}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Classe</p>
          <p className="text-sm text-muted-foreground">{doc.classes?.name}</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Questions ({questions.length})</p>
        <div className="space-y-3">
          {questions.map((q, index) => (
            <Card key={q.id} className="p-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="font-medium">Question {index + 1}</p>
                  <Badge variant="outline">{q.points} pts</Badge>
                </div>
                <p className="text-sm">{q.question_text}</p>
                {q.has_choices && q.answers && q.answers.length > 0 && (
                  <div className="pl-4 space-y-1">
                    {q.answers.map((a: any, aIndex: number) => (
                      <div key={a.id} className="flex items-center gap-2 text-sm">
                        <span className={a.is_correct ? "text-green-600 font-medium" : "text-muted-foreground"}>
                          {String.fromCharCode(65 + aIndex)}) {a.answer_text}
                          {a.is_correct && " ✓"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExamQuestionForm } from "./ExamQuestionForm";
import { FileText, Plus, Send, ArrowLeft } from "lucide-react";
import { useExamDocuments } from "@/hooks/useExamDocuments";

interface ExamDocumentBuilderProps {
  examDocument: any;
  onBack: () => void;
  onComplete: () => void;
}

export function ExamDocumentBuilder({ examDocument, onBack, onComplete }: ExamDocumentBuilderProps) {
  const { addQuestion, getExamWithQuestions, submitExamDocument } = useExamDocuments();
  const [questions, setQuestions] = useState<any[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadQuestions = async () => {
    try {
      const loadedQuestions = await getExamWithQuestions(examDocument.id);
      setQuestions(loadedQuestions);
    } catch (error) {
      console.error('Erreur chargement questions:', error);
    }
  };

  const handleAddQuestion = async (questionData: any) => {
    try {
      setLoading(true);
      await addQuestion(examDocument.id, questionData, questions.length + 1);
      await loadQuestions();
      setShowQuestionForm(false);
    } catch (error) {
      console.error('Erreur ajout question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (questions.length === 0) {
      alert("Ajoutez au moins une question avant de soumettre");
      return;
    }

    try {
      setLoading(true);
      await submitExamDocument(examDocument.id);
      onComplete();
    } catch (error) {
      console.error('Erreur soumission:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  const getExamTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'devoir_surveille': 'Devoir Surveillé',
      'controle': 'Contrôle',
      'examen': 'Examen'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex gap-2">
          <Badge variant="outline">{getExamTypeLabel(examDocument.exam_type)}</Badge>
          <Badge variant="outline">{examDocument.duration_minutes} min</Badge>
          <Badge variant={examDocument.documents_allowed ? "default" : "secondary"}>
            {examDocument.documents_allowed ? "Documents autorisés" : "Sans documents"}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Questions ({questions.length})</span>
            <span className="text-sm font-normal text-muted-foreground">
              Total: {totalPoints} points
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">Question {index + 1}</span>
                  <Badge variant="outline">{question.points} pts</Badge>
                </div>
                <p className="text-sm mb-2">{question.question_text}</p>
                {question.has_choices && question.answers && (
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {question.answers.map((answer: any, aIndex: number) => (
                      <div key={answer.id} className="flex items-center gap-2">
                        <span className={answer.is_correct ? "text-primary font-medium" : ""}>
                          {String.fromCharCode(97 + aIndex)}) {answer.answer_text}
                          {answer.is_correct && " ✓"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {!showQuestionForm && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowQuestionForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une Question
            </Button>
          )}
        </CardContent>
      </Card>

      {showQuestionForm && (
        <ExamQuestionForm
          questionNumber={questions.length + 1}
          onSubmit={handleAddQuestion}
          onCancel={() => setShowQuestionForm(false)}
        />
      )}

      {questions.length > 0 && !showQuestionForm && (
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={loading}
        >
          <Send className="h-4 w-4 mr-2" />
          Soumettre à l'Administration
        </Button>
      )}
    </div>
  );
}

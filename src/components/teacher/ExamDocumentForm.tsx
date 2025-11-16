import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Send } from "lucide-react";
import { ExamQuestion, ExamAnswer } from "@/hooks/useExamDocuments";
import { toast } from "sonner";

interface ExamDocumentFormProps {
  teacherId: string;
  schoolId: string;
  schoolYearId: string;
  semesterId?: string;
  subjects: Array<{
    id: string;
    name: string;
    class_id: string;
  }>;
  onSubmit: (data: {
    subject_id: string;
    class_id: string;
    exam_type: string;
    duration_minutes: number;
    documents_allowed: boolean;
    questions: ExamQuestion[];
  }) => void;
  onCancel: () => void;
}

export const ExamDocumentForm = ({
  teacherId,
  schoolId,
  schoolYearId,
  semesterId,
  subjects,
  onSubmit,
  onCancel,
}: ExamDocumentFormProps) => {
  const [subjectId, setSubjectId] = useState("");
  const [examType, setExamType] = useState<"devoir_surveille" | "controle" | "examen">("devoir_surveille");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [documentsAllowed, setDocumentsAllowed] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_number: questions.length + 1,
        question_text: "",
        points: 1,
        has_choices: false,
        is_multiple_choice: false,
        answers: [],
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    // Renumber remaining questions
    setQuestions((prev) =>
      prev.map((q, i) => ({ ...q, question_number: i + 1 }))
    );
  };

  const handleQuestionChange = (index: number, field: keyof ExamQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleAddAnswer = (questionIndex: number) => {
    const updated = [...questions];
    if (!updated[questionIndex].answers) {
      updated[questionIndex].answers = [];
    }
    updated[questionIndex].answers!.push({
      answer_text: "",
      is_correct: false,
    });
    setQuestions(updated);
  };

  const handleRemoveAnswer = (questionIndex: number, answerIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].answers = updated[questionIndex].answers!.filter((_, i) => i !== answerIndex);
    setQuestions(updated);
  };

  const handleAnswerChange = (
    questionIndex: number,
    answerIndex: number,
    field: keyof ExamAnswer,
    value: any
  ) => {
    const updated = [...questions];
    updated[questionIndex].answers![answerIndex] = {
      ...updated[questionIndex].answers![answerIndex],
      [field]: value,
    };
    setQuestions(updated);
  };

  const handleSubmit = () => {
    if (!subjectId) {
      toast.error("Veuillez sélectionner une matière");
      return;
    }

    if (questions.length === 0) {
      toast.error("Veuillez ajouter au moins une question");
      return;
    }

    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    onSubmit({
      subject_id: subjectId,
      class_id: subject.class_id,
      exam_type: examType,
      duration_minutes: durationMinutes,
      documents_allowed: documentsAllowed,
      questions,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'examen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Matière *</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Sélectionner une matière" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examType">Type d'examen *</Label>
            <Select value={examType} onValueChange={(value: any) => setExamType(value)}>
              <SelectTrigger id="examType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="devoir_surveille">Devoir Surveillé</SelectItem>
                <SelectItem value="controle">Contrôle</SelectItem>
                <SelectItem value="examen">Examen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Durée (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
              min={1}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="documents"
              checked={documentsAllowed}
              onCheckedChange={(checked) => setDocumentsAllowed(checked as boolean)}
            />
            <Label htmlFor="documents" className="cursor-pointer">
              Documents autorisés
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Questions</h3>
          <Button onClick={handleAddQuestion} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une question
          </Button>
        </div>

        {questions.map((question, qIndex) => (
          <Card key={qIndex}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Question {question.question_number}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveQuestion(qIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Texte de la question *</Label>
                <Textarea
                  value={question.question_text}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "question_text", e.target.value)
                  }
                  placeholder="Entrez votre question..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Points *</Label>
                <Input
                  type="number"
                  value={question.points}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "points", parseFloat(e.target.value) || 0)
                  }
                  min={0}
                  step={0.5}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={question.has_choices}
                  onCheckedChange={(checked) => {
                    handleQuestionChange(qIndex, "has_choices", checked);
                    if (!checked) {
                      handleQuestionChange(qIndex, "answers", []);
                    }
                  }}
                />
                <Label className="cursor-pointer">Ajouter des réponses à choix</Label>
              </div>

              {question.has_choices && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={question.is_multiple_choice}
                      onCheckedChange={(checked) =>
                        handleQuestionChange(qIndex, "is_multiple_choice", checked)
                      }
                    />
                    <Label className="cursor-pointer">Choix multiple</Label>
                  </div>

                  <div className="space-y-2 pl-4 border-l-2 border-border">
                    <div className="flex items-center justify-between">
                      <Label>Réponses</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddAnswer(qIndex)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter
                      </Button>
                    </div>

                    {question.answers?.map((answer, aIndex) => (
                      <div key={aIndex} className="flex items-center gap-2">
                        <Checkbox
                          checked={answer.is_correct}
                          onCheckedChange={(checked) =>
                            handleAnswerChange(qIndex, aIndex, "is_correct", checked)
                          }
                        />
                        <Input
                          value={answer.answer_text}
                          onChange={(e) =>
                            handleAnswerChange(qIndex, aIndex, "answer_text", e.target.value)
                          }
                          placeholder="Texte de la réponse"
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveAnswer(qIndex, aIndex)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleSubmit}>
          <Send className="h-4 w-4 mr-2" />
          Soumettre à l'administration
        </Button>
      </div>
    </div>
  );
};

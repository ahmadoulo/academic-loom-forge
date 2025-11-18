import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save } from "lucide-react";
import { useExamDocuments } from "@/hooks/useExamDocuments";
import { useExamQuestions } from "@/hooks/useExamQuestions";
import { useSubjects } from "@/hooks/useSubjects";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useSchoolSemesters } from "@/hooks/useSchoolSemesters";
import { toast } from "sonner";

interface ExamDocumentFormProps {
  teacherId: string;
  schoolId: string;
  onSuccess?: () => void;
}

interface QuestionForm {
  question_text: string;
  points: number;
  has_choices: boolean;
  is_multiple_choice: boolean;
  answers: { text: string; is_correct: boolean }[];
}

export function ExamDocumentForm({ teacherId, schoolId, onSuccess }: ExamDocumentFormProps) {
  const [examType, setExamType] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [duration, setDuration] = useState(60);
  const [documentsAllowed, setDocumentsAllowed] = useState(false);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [currentDocument, setCurrentDocument] = useState<string | null>(null);

  const { subjects } = useSubjects(schoolId, undefined, teacherId);
  const { createDocument } = useExamDocuments(schoolId, teacherId);
  const { createQuestion, createAnswer } = useExamQuestions(currentDocument || undefined);
  const { getYearForDisplay } = useAcademicYear();
  const { semesters } = useSchoolSemesters(schoolId);
  
  const currentSemester = semesters.find(s => s.is_actual);

  const selectedSubject = subjects.find(s => s.id === subjectId);

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: "",
      points: 1,
      has_choices: false,
      is_multiple_choice: false,
      answers: []
    }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    
    // Reset answers if switching from choices to no choices
    if (field === 'has_choices' && !value) {
      updated[index].answers = [];
      updated[index].is_multiple_choice = false;
    }
    
    setQuestions(updated);
  };

  const addAnswer = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].answers.push({ text: "", is_correct: false });
    setQuestions(updated);
  };

  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].answers = updated[questionIndex].answers.filter((_, i) => i !== answerIndex);
    setQuestions(updated);
  };

  const updateAnswer = (questionIndex: number, answerIndex: number, field: 'text' | 'is_correct', value: any) => {
    const updated = [...questions];
    updated[questionIndex].answers[answerIndex] = {
      ...updated[questionIndex].answers[answerIndex],
      [field]: value
    };
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    if (!examType || !subjectId || !classId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (questions.length === 0) {
      toast.error("Veuillez ajouter au moins une question");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast.error(`La question ${i + 1} ne peut pas être vide`);
        return;
      }
      if (q.has_choices && q.answers.length < 2) {
        toast.error(`La question ${i + 1} doit avoir au moins 2 choix`);
        return;
      }
      if (q.has_choices && !q.answers.some(a => a.is_correct)) {
        toast.error(`La question ${i + 1} doit avoir au moins une bonne réponse`);
        return;
      }
    }

    try {
      // Create document
      const { data: doc, error: docError } = await createDocument({
        school_id: schoolId,
        teacher_id: teacherId,
        subject_id: subjectId,
        class_id: classId,
        school_year_id: getYearForDisplay() || '',
        school_semester_id: currentSemester?.id,
        exam_type: examType,
        duration_minutes: duration,
        documents_allowed: documentsAllowed
      });

      if (docError || !doc) {
        toast.error("Erreur lors de la création du document");
        return;
      }

      // Create questions and answers
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: questionData } = await createQuestion({
          exam_document_id: doc.id,
          question_number: i + 1,
          question_text: q.question_text,
          points: q.points,
          has_choices: q.has_choices,
          is_multiple_choice: q.is_multiple_choice
        });

        if (questionData && q.has_choices) {
          for (const answer of q.answers) {
            await createAnswer({
              question_id: questionData.id,
              answer_text: answer.text,
              is_correct: answer.is_correct
            });
          }
        }
      }

      toast.success("Document d'examen créé avec succès");
      
      // Reset form
      setExamType("");
      setSubjectId("");
      setClassId("");
      setDuration(60);
      setDocumentsAllowed(false);
      setQuestions([]);
      
      onSuccess?.();
    } catch (error) {
      console.error("Error creating exam:", error);
      toast.error("Erreur lors de la création du document");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type d'évaluation *</Label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="devoir_surveille">Devoir surveillé</SelectItem>
                  <SelectItem value="controle">Contrôle</SelectItem>
                  <SelectItem value="examen">Examen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Matière *</Label>
              <Select value={subjectId} onValueChange={(value) => {
                setSubjectId(value);
                const subject = subjects.find(s => s.id === value);
                if (subject) setClassId(subject.class_id);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la matière" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} - {subject.classes?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Durée (minutes) *</Label>
              <Input
                type="number"
                min={15}
                max={300}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
              />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="documents"
                checked={documentsAllowed}
                onCheckedChange={(checked) => setDocumentsAllowed(checked as boolean)}
              />
              <Label htmlFor="documents" className="cursor-pointer">
                Documents autorisés
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Questions</CardTitle>
          <Button onClick={addQuestion} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une question
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question, qIndex) => (
            <Card key={qIndex} className="p-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Question {qIndex + 1} *</Label>
                    <Textarea
                      value={question.question_text}
                      onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                      placeholder="Énoncé de la question"
                      rows={3}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Points *</Label>
                    <Input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox
                      id={`choices-${qIndex}`}
                      checked={question.has_choices}
                      onCheckedChange={(checked) => updateQuestion(qIndex, 'has_choices', checked)}
                    />
                    <Label htmlFor={`choices-${qIndex}`} className="cursor-pointer">
                      QCM
                    </Label>
                  </div>

                  {question.has_choices && (
                    <div className="flex items-center space-x-2 pt-8">
                      <Checkbox
                        id={`multiple-${qIndex}`}
                        checked={question.is_multiple_choice}
                        onCheckedChange={(checked) => updateQuestion(qIndex, 'is_multiple_choice', checked)}
                      />
                      <Label htmlFor={`multiple-${qIndex}`} className="cursor-pointer">
                        Choix multiple
                      </Label>
                    </div>
                  )}
                </div>

                {question.has_choices && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Choix de réponses</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addAnswer(qIndex)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter un choix
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {question.answers.map((answer, aIndex) => (
                        <div key={aIndex} className="flex items-center gap-2">
                          <Checkbox
                            checked={answer.is_correct}
                            onCheckedChange={(checked) => updateAnswer(qIndex, aIndex, 'is_correct', checked)}
                          />
                          <Input
                            value={answer.text}
                            onChange={(e) => updateAnswer(qIndex, aIndex, 'text', e.target.value)}
                            placeholder={`Choix ${aIndex + 1}`}
                            className="flex-1"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeAnswer(qIndex, aIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune question ajoutée. Cliquez sur "Ajouter une question" pour commencer.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSubmit} size="lg">
          <Save className="h-4 w-4 mr-2" />
          Enregistrer le document
        </Button>
      </div>
    </div>
  );
}

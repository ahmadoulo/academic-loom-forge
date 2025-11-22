import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Check } from "lucide-react";
import { CreateExamDocumentData, ExamQuestion } from "@/hooks/useExamDocuments";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ExamDocumentFormProps {
  subjects: Array<{ id: string; name: string; class_id: string }>;
  onSubmit: (data: CreateExamDocumentData) => Promise<void>;
  onCancel: () => void;
  isCreating?: boolean;
  initialData?: CreateExamDocumentData;
}

export const ExamDocumentForm = ({ subjects, onSubmit, onCancel, isCreating, initialData }: ExamDocumentFormProps) => {
  const { register, handleSubmit, watch, setValue } = useForm<CreateExamDocumentData>();
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<ExamQuestion>>({
    question_number: 1,
    question_text: "",
    points: 1,
    has_choices: false,
    is_multiple_choice: false,
    answers: [],
  });

  useEffect(() => {
    if (initialData) {
      setValue("subject_id", initialData.subject_id);
      setValue("class_id", initialData.class_id);
      setValue("exam_type", initialData.exam_type);
      setValue("duration_minutes", initialData.duration_minutes);
      setValue("documents_allowed", initialData.documents_allowed);
      setValue("answer_on_document", initialData.answer_on_document ?? true);
      setQuestions(initialData.questions || []);
      setCurrentQuestion({
        question_number: (initialData.questions?.length || 0) + 1,
        question_text: "",
        points: 1,
        has_choices: false,
        is_multiple_choice: false,
        answers: [],
      });
    } else {
      setQuestions([]);
      setCurrentQuestion({
        question_number: 1,
        question_text: "",
        points: 1,
        has_choices: false,
        is_multiple_choice: false,
        answers: [],
      });
    }
  }, [initialData, setValue]);

  const selectedSubjectId = watch("subject_id");
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  const addAnswer = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      answers: [...(prev.answers || []), { answer_text: "", is_correct: false }],
    }));
  };

  const updateAnswer = (index: number, field: "answer_text" | "is_correct", value: string | boolean) => {
    setCurrentQuestion(prev => {
      const newAnswers = [...(prev.answers || [])];
      newAnswers[index] = { ...newAnswers[index], [field]: value };
      
      // If single choice, uncheck others when one is checked
      if (field === "is_correct" && value && !prev.is_multiple_choice) {
        newAnswers.forEach((ans, idx) => {
          if (idx !== index) ans.is_correct = false;
        });
      }
      
      return { ...prev, answers: newAnswers };
    });
  };

  const removeAnswer = (index: number) => {
    setCurrentQuestion(prev => ({
      ...prev,
      answers: prev.answers?.filter((_, i) => i !== index) || [],
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question_text || !currentQuestion.points) {
      return;
    }

    const newQuestion: ExamQuestion = {
      question_number: questions.length + 1,
      question_text: currentQuestion.question_text,
      points: Number(currentQuestion.points),
      has_choices: currentQuestion.has_choices || false,
      is_multiple_choice: currentQuestion.is_multiple_choice || false,
      answers: currentQuestion.has_choices ? currentQuestion.answers : [],
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      question_number: questions.length + 2,
      question_text: "",
      points: 1,
      has_choices: false,
      is_multiple_choice: false,
      answers: [],
    });
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions.map((q, i) => ({ ...q, question_number: i + 1 })));
  };

  const handleFormSubmit = async (data: CreateExamDocumentData) => {
    if (questions.length === 0) {
      return;
    }

    // Normaliser la valeur du type d'épreuve pour respecter la contrainte SQL
    let normalizedType = data.exam_type;
    switch (data.exam_type) {
      case "Devoir Surveillé":
      case "Devoir Surveille":
      case "devoir_surveille":
        normalizedType = "devoir_surveille";
        break;
      case "Contrôle":
      case "Controle":
      case "controle":
        normalizedType = "controle";
        break;
      case "Examen":
      case "examen":
        normalizedType = "examen";
        break;
    }

    await onSubmit({
      ...data,
      exam_type: normalizedType,
      questions,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'examen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject_id">Matière *</Label>
            <Select onValueChange={(value) => {
              setValue("subject_id", value);
              const subject = subjects.find(s => s.id === value);
              if (subject) setValue("class_id", subject.class_id);
            }}>
              <SelectTrigger>
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

          {selectedSubject && (
            <div className="text-sm text-muted-foreground">
              Classe: {selectedSubject.class_id}
            </div>
          )}

          <div>
            <Label htmlFor="exam_type">Type d'épreuve *</Label>
            <Select onValueChange={(value) => setValue("exam_type", value)}>
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

          <div>
            <Label htmlFor="duration_minutes">Durée (en minutes) *</Label>
            <Input
              id="duration_minutes"
              type="number"
              {...register("duration_minutes", { required: true, valueAsNumber: true })}
              placeholder="Ex: 120"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="documents_allowed"
              onCheckedChange={(checked) => setValue("documents_allowed", checked as boolean)}
            />
            <Label htmlFor="documents_allowed" className="cursor-pointer">
              Documents autorisés
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="answer_on_document"
              defaultChecked={true}
              onCheckedChange={(checked) => setValue("answer_on_document", checked as boolean)}
            />
            <Label htmlFor="answer_on_document" className="cursor-pointer">
              Répondre sur la feuille d'examen
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions ajoutées ({questions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.map((q, index) => (
            <div key={index} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/50">
              <div className="flex-1">
                <div className="font-medium">Q{q.question_number}: {q.question_text}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {q.points} point(s) 
                  {q.has_choices && ` • ${q.is_multiple_choice ? "Choix multiple" : "Choix unique"} • ${q.answers?.length || 0} réponse(s)`}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeQuestion(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter une question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Numéro de la question</Label>
            <Input value={currentQuestion.question_number} disabled />
          </div>

          <div>
            <Label>Texte de la question *</Label>
            <Textarea
              value={currentQuestion.question_text}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
              placeholder="Entrez le texte de la question..."
              rows={3}
            />
          </div>

          <div>
            <Label>Points *</Label>
            <Input
              type="number"
              value={currentQuestion.points}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: Number(e.target.value) })}
              min={0.5}
              step={0.5}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_choices"
              checked={currentQuestion.has_choices}
              onCheckedChange={(checked) => setCurrentQuestion({
                ...currentQuestion,
                has_choices: checked as boolean,
                answers: checked ? [] : undefined,
              })}
            />
            <Label htmlFor="has_choices" className="cursor-pointer">
              Ajouter des réponses à choix
            </Label>
          </div>

          {currentQuestion.has_choices && (
            <div className="space-y-3 pl-6 border-l-2">
              <RadioGroup
                value={currentQuestion.is_multiple_choice ? "multiple" : "single"}
                onValueChange={(value) => setCurrentQuestion({
                  ...currentQuestion,
                  is_multiple_choice: value === "multiple",
                })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single">Choix unique</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiple" id="multiple" />
                  <Label htmlFor="multiple">Choix multiple</Label>
                </div>
              </RadioGroup>

              {currentQuestion.answers?.map((answer, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    checked={answer.is_correct}
                    onCheckedChange={(checked) => updateAnswer(index, "is_correct", checked as boolean)}
                  />
                  <Input
                    value={answer.answer_text}
                    onChange={(e) => updateAnswer(index, "answer_text", e.target.value)}
                    placeholder="Texte de la réponse"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAnswer(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={addAnswer}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une réponse
              </Button>
            </div>
          )}

          <Button
            type="button"
            onClick={addQuestion}
            disabled={!currentQuestion.question_text || !currentQuestion.points}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter cette question
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={questions.length === 0 || isCreating}>
          <Check className="h-4 w-4 mr-2" />
          {isCreating ? "Création..." : "Créer le document"}
        </Button>
      </div>
    </form>
  );
};

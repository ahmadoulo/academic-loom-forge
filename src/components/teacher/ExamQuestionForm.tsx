import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";

interface ExamQuestionFormProps {
  questionNumber: number;
  onSubmit: (data: {
    question_text: string;
    points: number;
    has_choices: boolean;
    is_multiple_choice: boolean;
    answers?: { answer_text: string; is_correct: boolean }[];
  }) => void;
  onCancel: () => void;
}

export function ExamQuestionForm({ questionNumber, onSubmit, onCancel }: ExamQuestionFormProps) {
  const [formData, setFormData] = useState({
    question_text: "",
    points: 1,
    has_choices: false,
    is_multiple_choice: false
  });

  const [answers, setAnswers] = useState<{ answer_text: string; is_correct: boolean }[]>([
    { answer_text: "", is_correct: false }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      answers: formData.has_choices ? answers.filter(a => a.answer_text.trim()) : undefined
    };

    onSubmit(dataToSubmit);
  };

  const addAnswer = () => {
    setAnswers([...answers, { answer_text: "", is_correct: false }]);
  };

  const removeAnswer = (index: number) => {
    setAnswers(answers.filter((_, i) => i !== index));
  };

  const updateAnswer = (index: number, field: 'answer_text' | 'is_correct', value: string | boolean) => {
    const newAnswers = [...answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    setAnswers(newAnswers);
  };

  const toggleCorrectAnswer = (index: number) => {
    if (formData.is_multiple_choice) {
      updateAnswer(index, 'is_correct', !answers[index].is_correct);
    } else {
      const newAnswers = answers.map((a, i) => ({
        ...a,
        is_correct: i === index
      }));
      setAnswers(newAnswers);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question {questionNumber}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question_text">Question *</Label>
            <Textarea
              id="question_text"
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="Énoncé de la question..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">Points *</Label>
            <Input
              id="points"
              type="number"
              min="0.5"
              step="0.5"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_choices"
              checked={formData.has_choices}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, has_choices: checked as boolean });
                if (!checked) {
                  setAnswers([{ answer_text: "", is_correct: false }]);
                }
              }}
            />
            <Label htmlFor="has_choices" className="cursor-pointer">
              Ajouter des choix de réponse
            </Label>
          </div>

          {formData.has_choices && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_multiple_choice"
                  checked={formData.is_multiple_choice}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_multiple_choice: checked as boolean })}
                />
                <Label htmlFor="is_multiple_choice" className="cursor-pointer">
                  Choix multiples
                </Label>
              </div>

              <div className="space-y-3 pt-2">
                <Label>Réponses</Label>
                {answers.map((answer, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="pt-2">
                      {formData.is_multiple_choice ? (
                        <Checkbox
                          checked={answer.is_correct}
                          onCheckedChange={() => toggleCorrectAnswer(index)}
                        />
                      ) : (
                        <RadioGroup value={answers.findIndex(a => a.is_correct).toString()}>
                          <RadioGroupItem
                            value={index.toString()}
                            onClick={() => toggleCorrectAnswer(index)}
                          />
                        </RadioGroup>
                      )}
                    </div>
                    <Input
                      value={answer.answer_text}
                      onChange={(e) => updateAnswer(index, 'answer_text', e.target.value)}
                      placeholder={`Réponse ${index + 1}`}
                      className="flex-1"
                    />
                    {answers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAnswer(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addAnswer}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une réponse
                </Button>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Ajouter la Question
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

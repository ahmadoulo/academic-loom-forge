import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Check } from 'lucide-react';
import { useOnlineExams } from '@/hooks/useOnlineExams';
import { useTeacherClasses } from '@/hooks/useTeacherClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { toast } from 'sonner';

interface CreateOnlineExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  schoolId: string;
  schoolYearId: string;
}

interface Question {
  question_text: string;
  points: number;
  answers: Array<{ answer_text: string; is_correct: boolean }>;
}

export function CreateOnlineExamDialog({
  open,
  onOpenChange,
  teacherId,
  schoolId,
  schoolYearId,
}: CreateOnlineExamDialogProps) {
  const { createExam, isCreating } = useOnlineExams(teacherId);
  const { teacherClasses } = useTeacherClasses(teacherId);
  const { subjects } = useSubjects(schoolId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allowWindowSwitch, setAllowWindowSwitch] = useState(false);
  const [maxWarnings, setMaxWarnings] = useState('3');
  const [questions, setQuestions] = useState<Question[]>([
    {
      question_text: '',
      points: 1,
      answers: [
        { answer_text: '', is_correct: false },
        { answer_text: '', is_correct: false },
      ],
    },
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        points: 1,
        answers: [
          { answer_text: '', is_correct: false },
          { answer_text: '', is_correct: false },
        ],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addAnswer = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].answers.push({ answer_text: '', is_correct: false });
    setQuestions(updated);
  };

  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].answers = updated[questionIndex].answers.filter((_, i) => i !== answerIndex);
    setQuestions(updated);
  };

  const updateAnswer = (questionIndex: number, answerIndex: number, field: 'answer_text' | 'is_correct', value: string | boolean) => {
    const updated = [...questions];
    if (field === 'is_correct' && value) {
      // Only one correct answer per question
      updated[questionIndex].answers = updated[questionIndex].answers.map((a, i) => ({
        ...a,
        is_correct: i === answerIndex,
      }));
    } else {
      if (field === 'answer_text') {
        updated[questionIndex].answers[answerIndex].answer_text = value as string;
      } else {
        updated[questionIndex].answers[answerIndex].is_correct = value as boolean;
      }
    }
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    if (!title || !classId || !subjectId || !startTime || !endTime) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (questions.length === 0) {
      toast.error('Ajoutez au moins une question');
      return;
    }

    for (const q of questions) {
      if (!q.question_text || q.answers.length < 2) {
        toast.error('Chaque question doit avoir un texte et au moins 2 réponses');
        return;
      }
      if (!q.answers.some(a => a.is_correct)) {
        toast.error('Chaque question doit avoir une réponse correcte');
        return;
      }
      if (q.answers.some(a => !a.answer_text)) {
        toast.error('Toutes les réponses doivent avoir un texte');
        return;
      }
    }

    await createExam({
      exam: {
        school_id: schoolId,
        teacher_id: teacherId,
        class_id: classId,
        subject_id: subjectId,
        school_year_id: schoolYearId,
        title,
        description,
        duration_minutes: parseInt(durationMinutes),
        start_time: startTime,
        end_time: endTime,
        allow_window_switch: allowWindowSwitch,
        max_warnings: parseInt(maxWarnings),
        is_published: false,
      },
      questions,
    });

    onOpenChange(false);
    // Reset form
    setTitle('');
    setDescription('');
    setClassId('');
    setSubjectId('');
    setQuestions([
      {
        question_text: '',
        points: 1,
        answers: [
          { answer_text: '', is_correct: false },
          { answer_text: '', is_correct: false },
        ],
      },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un Examen en Ligne</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Exam details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Examen de Mathématiques"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Classe *</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {teacherClasses.map((tc) => (
                    <SelectItem key={tc.classes.id} value={tc.classes.id}>
                      {tc.classes.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Matière *</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Durée (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start">Date/Heure de début *</Label>
              <Input
                id="start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end">Date/Heure de fin *</Label>
              <Input
                id="end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions pour l'examen..."
              rows={3}
            />
          </div>

          {/* Security settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paramètres de sécurité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autoriser le changement de fenêtre</Label>
                  <p className="text-sm text-muted-foreground">
                    Si désactivé, l'étudiant recevra des avertissements
                  </p>
                </div>
                <Switch
                  checked={allowWindowSwitch}
                  onCheckedChange={setAllowWindowSwitch}
                />
              </div>

              {!allowWindowSwitch && (
                <div className="space-y-2">
                  <Label htmlFor="warnings">Nombre maximum d'avertissements</Label>
                  <Input
                    id="warnings"
                    type="number"
                    value={maxWarnings}
                    onChange={(e) => setMaxWarnings(e.target.value)}
                    min="1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Questions</h3>
              <Button onClick={addQuestion} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une question
              </Button>
            </div>

            {questions.map((question, qIndex) => (
              <Card key={qIndex}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                      disabled={questions.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Question *</Label>
                    <Textarea
                      value={question.question_text}
                      onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                      placeholder="Entrez votre question..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Points *</Label>
                    <Input
                      type="number"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', parseFloat(e.target.value))}
                      min="0.5"
                      step="0.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Réponses *</Label>
                      <Button
                        onClick={() => addAnswer(qIndex)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter réponse
                      </Button>
                    </div>

                    {question.answers.map((answer, aIndex) => (
                      <div key={aIndex} className="flex items-center gap-2">
                        <Button
                          variant={answer.is_correct ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateAnswer(qIndex, aIndex, 'is_correct', !answer.is_correct)}
                          className="shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Input
                          value={answer.answer_text}
                          onChange={(e) => updateAnswer(qIndex, aIndex, 'answer_text', e.target.value)}
                          placeholder={`Réponse ${aIndex + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAnswer(qIndex, aIndex)}
                          disabled={question.answers.length === 2}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Cliquez sur ✓ pour marquer la bonne réponse
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating}>
              {isCreating ? 'Création...' : 'Créer l\'Examen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

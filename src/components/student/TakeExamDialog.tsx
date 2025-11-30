import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TakeExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: any;
  studentId: string;
}

export function TakeExamDialog({ open, onOpenChange, exam, studentId }: TakeExamDialogProps) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [warningCount, setWarningCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  useEffect(() => {
    if (open && exam) {
      initializeExam();
    }

    return () => {
      if (attemptId && !isSubmitted) {
        // Auto-submit if dialog closed without submission
        handleSubmit(true);
      }
    };
  }, [open, exam]);

  // Window blur detection
  useEffect(() => {
    if (!open || exam?.allow_window_switch) return;

    const handleBlur = async () => {
      if (attemptId && !isSubmitted) {
        const newWarningCount = warningCount + 1;
        setWarningCount(newWarningCount);

        await supabase
          .from('student_exam_attempts')
          .update({ warning_count: newWarningCount })
          .eq('id', attemptId);

        if (newWarningCount >= exam.max_warnings) {
          toast.error(`Limite d'avertissements atteinte. L'examen sera soumis automatiquement.`);
          handleSubmit(true);
        } else {
          toast.warning(`Avertissement ${newWarningCount}/${exam.max_warnings}: Ne quittez pas la fenêtre!`);
        }
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [open, exam, attemptId, warningCount, isSubmitted]);

  // Timer
  useEffect(() => {
    if (!open || timeRemaining <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, timeRemaining, isSubmitted]);

  const initializeExam = async () => {
    setLoading(true);
    try {
      // Fetch questions with answers
      const { data: questionsData } = await supabase
        .from('online_exam_questions')
        .select(`
          *,
          online_exam_answers(*)
        `)
        .eq('exam_id', exam.id)
        .order('question_order');

      setQuestions(questionsData || []);

      // Create attempt
      const { data: attempt } = await supabase
        .from('student_exam_attempts')
        .insert({
          exam_id: exam.id,
          student_id: studentId,
          status: 'in_progress',
        })
        .select()
        .single();

      setAttemptId(attempt?.id || null);
      setTimeRemaining(exam.duration_minutes * 60);
    } catch (error) {
      console.error('Error initializing exam:', error);
      toast.error('Erreur lors du chargement de l\'examen');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setAnswers({ ...answers, [questionId]: answerId });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!attemptId) return;

    try {
      let totalScore = 0;
      const responses = [];

      for (const question of questions) {
        const selectedAnswerId = answers[question.id];
        const selectedAnswer = question.online_exam_answers?.find((a: any) => a.id === selectedAnswerId);
        const isCorrect = selectedAnswer?.is_correct || false;
        
        if (isCorrect) {
          totalScore += question.points;
        }

        responses.push({
          attempt_id: attemptId,
          question_id: question.id,
          selected_answer_id: selectedAnswerId || null,
          is_correct: isCorrect,
        });
      }

      // Save responses
      await supabase.from('student_exam_responses').insert(responses);

      // Update attempt
      await supabase
        .from('student_exam_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          score: totalScore,
          status: 'completed',
        })
        .eq('id', attemptId);

      setFinalScore(totalScore);
      setIsSubmitted(true);

      if (!autoSubmit) {
        toast.success('Examen soumis avec succès!');
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Erreur lors de la soumission');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="text-center py-8">Chargement de l'examen...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Examen Terminé</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <div>
              <p className="text-2xl font-bold">Score: {finalScore?.toFixed(1)} points</p>
              <p className="text-muted-foreground mt-2">
                Votre examen a été soumis avec succès
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle>{exam.title}</DialogTitle>
            <Badge variant={timeRemaining < 300 ? 'destructive' : 'default'}>
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(timeRemaining)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Question {currentQuestionIndex + 1} sur {questions.length}</span>
              <span>{answeredCount}/{questions.length} répondu(es)</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Warnings */}
          {!exam.allow_window_switch && warningCount > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Avertissement: {warningCount}/{exam.max_warnings} - Ne quittez pas la fenêtre!
              </AlertDescription>
            </Alert>
          )}

          {/* Question */}
          {currentQuestion && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">
                    {currentQuestion.question_text}
                  </h3>
                  <Badge variant="secondary">{currentQuestion.points} pts</Badge>
                </div>

                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                >
                  {currentQuestion.online_exam_answers?.map((answer: any) => (
                    <div key={answer.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                      <RadioGroupItem value={answer.id} id={answer.id} />
                      <Label htmlFor={answer.id} className="flex-1 cursor-pointer">
                        {answer.answer_text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Précédent
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={() => handleSubmit(false)}
                disabled={answeredCount < questions.length}
              >
                Soumettre l'examen
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Suivant
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

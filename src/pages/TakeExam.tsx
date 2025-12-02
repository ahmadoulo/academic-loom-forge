import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useOnlineExams } from '@/hooks/useOnlineExams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function TakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const studentId = location.state?.studentId;
  
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [warningCount, setWarningCount] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const { fetchExamWithDetails } = useOnlineExams();

  useEffect(() => {
    if (!studentId || !examId) {
      toast.error('Informations manquantes');
      navigate(-1);
      return;
    }

    loadExam();
  }, [examId, studentId]);

  const loadExam = async () => {
    try {
      const data = await fetchExamWithDetails(examId!);
      setExam(data.exam);
      setQuestions(data.questions);
      setAnswers(data.answers);
      setTimeRemaining(data.exam.duration_minutes * 60);

      // Create attempt
      const { data: attempt, error } = await supabase
        .from('student_exam_attempts')
        .insert({
          exam_id: examId!,
          student_id: studentId,
          status: 'in_progress',
        })
        .select()
        .single();

      if (error) throw error;
      setAttemptId(attempt.id);
      setLoading(false);
    } catch (error) {
      console.error('Error loading exam:', error);
      toast.error('Erreur lors du chargement de l\'examen');
      navigate(-1);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  // Window blur detection
  useEffect(() => {
    if (!exam || exam.allow_window_switch || isSubmitted) return;

    const handleBlur = async () => {
      const newCount = warningCount + 1;
      setWarningCount(newCount);

      if (newCount >= exam.max_warnings) {
        setWarningMessage('Trop d\'avertissements. L\'examen sera soumis automatiquement.');
        setShowWarningDialog(true);
        await handleSubmit();
      } else {
        setWarningMessage(`Avertissement ${newCount}/${exam.max_warnings}: Ne quittez pas la fenêtre d'examen!`);
        setShowWarningDialog(true);
        toast.warning(`Avertissement ${newCount}/${exam.max_warnings}`);
      }

      // Update warning count in database
      if (attemptId) {
        await supabase
          .from('student_exam_attempts')
          .update({ warning_count: newCount })
          .eq('id', attemptId);
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [exam, warningCount, attemptId, isSubmitted]);

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    try {
      setLoading(true);

      // Calculate score
      let totalScore = 0;
      const responses = [];

      for (const question of questions) {
        const selectedAnswerId = selectedAnswers[question.id];
        if (!selectedAnswerId) continue;

        const selectedAnswer = answers.find((a) => a.id === selectedAnswerId);
        const isCorrect = selectedAnswer?.is_correct || false;

        if (isCorrect) {
          totalScore += question.points;
        }

        responses.push({
          attempt_id: attemptId,
          question_id: question.id,
          selected_answer_id: selectedAnswerId,
          is_correct: isCorrect,
        });
      }

      // Save responses
      if (responses.length > 0) {
        const { error: responsesError } = await supabase
          .from('student_exam_responses')
          .insert(responses);

        if (responsesError) throw responsesError;
      }

      // Update attempt
      const { error: attemptError } = await supabase
        .from('student_exam_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          score: totalScore,
          status: 'completed',
        })
        .eq('id', attemptId);

      if (attemptError) throw attemptError;

      setScore(totalScore);
      setIsSubmitted(true);
      toast.success('Examen soumis avec succès!');
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const questionAnswers = answers.filter((a) => a.question_id === currentQuestion?.id);
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const hasActiveWarning = !exam?.allow_window_switch && warningCount > 0 && !isSubmitted;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="animate-fade-in">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Chargement de l'examen...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted && score !== null) {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = (score / totalPoints) * 100;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="max-w-md w-full animate-scale-in shadow-elegant">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 animate-fade-in">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Examen Terminé!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <p className="text-4xl font-bold text-primary">{score}/{totalPoints}</p>
              <p className="text-muted-foreground">
                Résultat: {percentage.toFixed(1)}%
              </p>
            </div>
            <Button 
              onClick={() => navigate(-1)} 
              className="w-full animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              Retour aux examens
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 ${
        hasActiveWarning ? 'warning-border' : ''
      }`}
    >
      <div className="max-w-4xl mx-auto py-8 space-y-6 animate-fade-in">
        {/* Header with timer */}
        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{exam.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} sur {questions.length}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {!exam.allow_window_switch && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Avertissements: {warningCount}/{exam.max_warnings}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-lg font-bold">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className={timeRemaining < 60 ? 'text-red-500 animate-pulse' : ''}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="shadow-elegant animate-scale-in">
          <CardHeader>
            <CardTitle className="text-lg">
              <div className="flex items-start justify-between">
                <span>Question {currentQuestionIndex + 1}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg">{currentQuestion.question_text}</p>

            <RadioGroup
              value={selectedAnswers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
            >
              <div className="space-y-3">
                {questionAnswers.map((answer, index) => (
                  <div
                    key={answer.id}
                    className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                  >
                    <RadioGroupItem value={answer.id} id={answer.id} />
                    <Label htmlFor={answer.id} className="flex-1 cursor-pointer">
                      <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                      {answer.answer_text}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="hover-scale"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="hover-scale"
              size="lg"
            >
              Soumettre l'examen
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="hover-scale"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Answer indicator */}
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all hover-scale ${
                    index === currentQuestionIndex
                      ? 'bg-primary text-primary-foreground'
                      : selectedAnswers[q.id]
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Attention</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{warningMessage || "Ne quittez pas la fenêtre pendant l'examen."}</p>
              <p className="text-sm text-destructive">
                Des avertissements répétés entraîneront la soumission automatique de l'examen.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Compris</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

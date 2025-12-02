import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, User, RotateCcw } from 'lucide-react';
import { useOnlineExams } from '@/hooks/useOnlineExams';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface ExamResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
}

export function ExamResultsDialog({ open, onOpenChange, examId }: ExamResultsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [exam, setExam] = useState<any>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [attemptToReset, setAttemptToReset] = useState<string | null>(null);

  const { resetStudentAttempt } = useOnlineExams();

  useEffect(() => {
    if (open && examId) {
      fetchResults();
    }
  }, [open, examId]);

  const handleResetClick = (attemptId: string) => {
    setAttemptToReset(attemptId);
    setResetDialogOpen(true);
  };

  const handleConfirmReset = async () => {
    if (attemptToReset) {
      await resetStudentAttempt({ attemptId: attemptToReset });
      setResetDialogOpen(false);
      setAttemptToReset(null);
      fetchResults();
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      // Fetch exam
      const { data: examData } = await supabase
        .from('online_exams')
        .select('*, subjects(name), classes(name)')
        .eq('id', examId)
        .single();

      setExam(examData);

      // Fetch attempts with student info
      const { data: attemptsData } = await supabase
        .from('student_exam_attempts')
        .select(`
          *,
          students(firstname, lastname, cin_number)
        `)
        .eq('exam_id', examId)
        .order('score', { ascending: false });

      if (attemptsData) {
        // For each attempt, fetch responses with details
        const attemptsWithResponses = await Promise.all(
          attemptsData.map(async (attempt) => {
            const { data: responses } = await supabase
              .from('student_exam_responses')
              .select(`
                *,
                online_exam_questions(question_text, points),
                online_exam_answers(answer_text, is_correct)
              `)
              .eq('attempt_id', attempt.id);

            return { ...attempt, responses };
          })
        );

        setAttempts(attemptsWithResponses);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8">Chargement des résultats...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Résultats: {exam?.title}
            <p className="text-sm text-muted-foreground font-normal mt-1">
              {exam?.classes?.name} - {exam?.subjects?.name}
            </p>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {attempts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune tentative pour cet examen
              </CardContent>
            </Card>
          ) : (
            attempts.map((attempt) => (
              <Card key={attempt.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      <div>
                        <CardTitle className="text-base">
                          {attempt.students?.firstname} {attempt.students?.lastname}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          CIN: {attempt.students?.cin_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant={attempt.status === 'completed' ? 'default' : 'secondary'}>
                        {attempt.status === 'completed' ? 'Terminé' : 'En cours'}
                      </Badge>
                      <p className="text-2xl font-bold">
                        {attempt.score?.toFixed(1) || '0'} pts
                      </p>
                      {attempt.warning_count > 0 && (
                        <p className="text-xs text-destructive">
                          {attempt.warning_count} avertissement(s)
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetClick(attempt.id)}
                        className="w-full"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Deuxième chance
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {attempt.responses?.map((response: any, index: number) => (
                    <div
                      key={response.id}
                      className={`p-3 rounded-lg border ${
                        response.is_correct
                          ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20'
                          : 'border-red-500/50 bg-red-50 dark:bg-red-950/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {response.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">
                            Question {index + 1}: {response.online_exam_questions?.question_text}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Réponse: {response.online_exam_answers?.answer_text || 'Non répondu'}
                          </p>
                          <p className="text-xs mt-1">
                            {response.is_correct
                              ? `+${response.online_exam_questions?.points} pts`
                              : '0 pts'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <ConfirmationDialog
          open={resetDialogOpen}
          onOpenChange={setResetDialogOpen}
          title="Donner une deuxième chance"
          description="Êtes-vous sûr de vouloir réinitialiser la tentative de cet étudiant ? Il pourra repasser l'examen."
          onConfirm={handleConfirmReset}
        />
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, User } from 'lucide-react';

interface ExamResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
}

export function ExamResultsDialog({ open, onOpenChange, examId }: ExamResultsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [exam, setExam] = useState<any>(null);

  useEffect(() => {
    if (open && examId) {
      fetchResults();
    }
  }, [open, examId]);

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
                    <div className="text-right">
                      <Badge variant={attempt.status === 'completed' ? 'default' : 'secondary'}>
                        {attempt.status === 'completed' ? 'Terminé' : 'En cours'}
                      </Badge>
                      <p className="text-2xl font-bold mt-2">
                        {attempt.score?.toFixed(1) || '0'} pts
                      </p>
                      {attempt.warning_count > 0 && (
                        <p className="text-xs text-destructive mt-1">
                          {attempt.warning_count} avertissement(s)
                        </p>
                      )}
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
      </DialogContent>
    </Dialog>
  );
}

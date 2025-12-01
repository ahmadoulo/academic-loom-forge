import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnlineExams } from '@/hooks/useOnlineExams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface StudentOnlineExamsSectionProps {
  studentId: string;
  classId: string;
}

export function StudentOnlineExamsSection({ studentId, classId }: StudentOnlineExamsSectionProps) {
  const navigate = useNavigate();
  const { studentExams, isLoadingStudentExams, checkExamAttempt } = useOnlineExams(undefined, classId);
  const [examAttempts, setExamAttempts] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadAttempts = async () => {
      const attempts: Record<string, any> = {};
      for (const exam of studentExams) {
        const attempt = await checkExamAttempt(exam.id, studentId);
        if (attempt) {
          attempts[exam.id] = attempt;
        }
      }
      setExamAttempts(attempts);
    };

    if (studentExams.length > 0) {
      loadAttempts();
    }
  }, [studentExams, studentId]);

  const handleTakeExam = async (exam: any) => {
    // Check if already attempted
    const attempt = examAttempts[exam.id];
    if (attempt) {
      toast.error('Vous avez déjà passé cet examen');
      return;
    }

    // Navigate to exam page
    navigate(`/exam/${exam.id}`, { state: { studentId } });
  };

  const getExamStatus = (exam: any) => {
    const attempt = examAttempts[exam.id];
    
    if (attempt) {
      return { 
        label: `Complété (${attempt.score || 0} pts)`, 
        variant: 'default' as const, 
        disabled: true,
        icon: <CheckCircle className="w-4 h-4" />
      };
    }

    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);

    if (isFuture(start)) return { label: 'À venir', variant: 'secondary' as const, disabled: true };
    if (isPast(end)) return { label: 'Terminé', variant: 'secondary' as const, disabled: true };
    return { label: 'Disponible', variant: 'default' as const, disabled: false };
  };

  if (isLoadingStudentExams) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Examens en Ligne</h2>
        <p className="text-muted-foreground">Consultez et passez vos examens disponibles</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {studentExams.map((exam) => {
          const status = getExamStatus(exam);
          
          return (
            <Card key={exam.id} className="hover-scale transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{exam.title}</CardTitle>
                  <Badge variant={status.variant} className="flex items-center gap-1">
                    {status.icon}
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <BookOpen className="w-4 h-4 mr-2" />
                    {exam.subjects?.name}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    Durée: {exam.duration_minutes} minutes
                  </div>
                  <div className="text-muted-foreground">
                    Disponible du {format(new Date(exam.start_time), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </div>
                  <div className="text-muted-foreground">
                    Jusqu'au {format(new Date(exam.end_time), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </div>
                  {exam.description && (
                    <p className="text-muted-foreground text-xs mt-2">
                      {exam.description}
                    </p>
                  )}
                  {!exam.allow_window_switch && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-yellow-600">
                        Ne quittez pas la fenêtre pendant l'examen. Limite: {exam.max_warnings} avertissements
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleTakeExam(exam)}
                  disabled={status.disabled}
                  className="w-full hover-scale"
                >
                  {examAttempts[exam.id] ? 'Examen complété' : status.disabled ? status.label : 'Commencer l\'examen'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {studentExams.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun examen disponible pour le moment.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

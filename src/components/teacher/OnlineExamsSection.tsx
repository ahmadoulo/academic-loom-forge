import { useState } from 'react';
import { useOnlineExams } from '@/hooks/useOnlineExams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Users, Trash2, Eye, CheckCircle } from 'lucide-react';
import { CreateOnlineExamDialog } from './CreateOnlineExamDialog';
import { ExamResultsDialog } from './ExamResultsDialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface OnlineExamsSectionProps {
  teacherId: string;
  schoolId: string;
  schoolYearId: string;
}

export function OnlineExamsSection({ teacherId, schoolId, schoolYearId }: OnlineExamsSectionProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  
  const { exams, isLoadingExams, publishExam, deleteExam, attempts } = useOnlineExams(teacherId);

  const handleViewResults = (examId: string) => {
    setSelectedExamId(examId);
    setResultsDialogOpen(true);
  };

  const handleDeleteClick = (examId: string) => {
    setExamToDelete(examId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (examToDelete) {
      await deleteExam(examToDelete);
      setDeleteDialogOpen(false);
      setExamToDelete(null);
    }
  };

  const getExamAttemptCount = (examId: string) => {
    return attempts.filter(a => a.exam_id === examId).length;
  };

  if (isLoadingExams) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Examens en Ligne</h2>
          <p className="text-muted-foreground">Créez et gérez vos examens QCM en ligne</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Créer un Examen
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <Card key={exam.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{exam.title}</CardTitle>
                <Badge variant={exam.is_published ? 'default' : 'secondary'}>
                  {exam.is_published ? 'Publié' : 'Brouillon'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  {exam.classes?.name || 'N/A'}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="w-4 h-4 mr-2" />
                  {exam.duration_minutes} minutes
                </div>
                <div className="text-muted-foreground">
                  Du {format(new Date(exam.start_time), 'dd MMM yyyy HH:mm', { locale: fr })}
                </div>
                <div className="text-muted-foreground">
                  Au {format(new Date(exam.end_time), 'dd MMM yyyy HH:mm', { locale: fr })}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Eye className="w-4 h-4 mr-2" />
                  {getExamAttemptCount(exam.id)} tentative(s)
                </div>
              </div>

              <div className="flex gap-2">
                {!exam.is_published && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => publishExam(exam.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Publier
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewResults(exam.id)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Résultats
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(exam.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {exams.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun examen créé. Commencez par créer votre premier examen en ligne.
          </CardContent>
        </Card>
      )}

      <CreateOnlineExamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        teacherId={teacherId}
        schoolId={schoolId}
        schoolYearId={schoolYearId}
      />

      {selectedExamId && (
        <ExamResultsDialog
          open={resultsDialogOpen}
          onOpenChange={setResultsDialogOpen}
          examId={selectedExamId}
        />
      )}

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer l'examen"
        description="Êtes-vous sûr de vouloir supprimer cet examen ? Toutes les tentatives des étudiants seront également supprimées."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, RotateCcw, BookOpen } from "lucide-react";
import { useArchivedSubjects } from "@/hooks/useArchivedSubjects";
import { useSubjects } from "@/hooks/useSubjects";
import { toast } from "sonner";

interface ArchivedSubjectsSectionProps {
  schoolId: string;
}

export function ArchivedSubjectsSection({ schoolId }: ArchivedSubjectsSectionProps) {
  const { archivedSubjects, loading } = useArchivedSubjects(schoolId);
  const { restoreSubject } = useSubjects(schoolId);

  const handleRestore = async (subjectId: string) => {
    try {
      await restoreSubject(subjectId);
      toast.success("Matière restaurée avec succès");
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Matières Archivées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (archivedSubjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Matières Archivées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Aucune matière archivée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Matières Archivées ({archivedSubjects.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {archivedSubjects.map((subject) => (
            <div
              key={subject.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{subject.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">
                    Classe: {subject.classes?.name}
                  </Badge>
                  {subject.teachers && (
                    <Badge variant="outline">
                      Prof: {subject.teachers.firstname} {subject.teachers.lastname}
                    </Badge>
                  )}
                  {subject.archived_at && (
                    <span className="text-xs">
                      Archivé le {new Date(subject.archived_at).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRestore(subject.id)}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Restaurer
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

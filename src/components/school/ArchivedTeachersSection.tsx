import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, UserX } from "lucide-react";
import { useArchivedTeachers } from "@/hooks/useArchivedTeachers";
import { useTeachers } from "@/hooks/useTeachers";

interface ArchivedTeachersSectionProps {
  schoolId?: string;
}

export const ArchivedTeachersSection = ({ schoolId }: ArchivedTeachersSectionProps) => {
  const { archivedTeachers, loading } = useArchivedTeachers(schoolId);
  const { restoreTeacher } = useTeachers(schoolId);

  const handleRestore = async (teacherId: string) => {
    try {
      await restoreTeacher(teacherId);
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Professeurs Archivés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserX className="h-5 w-5" />
          Professeurs Archivés ({archivedTeachers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {archivedTeachers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun professeur archivé.
          </p>
        ) : (
          <div className="space-y-3">
            {archivedTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {teacher.firstname} {teacher.lastname}
                    </p>
                    <Badge variant="secondary">Archivé</Badge>
                  </div>
                  {teacher.email && (
                    <p className="text-sm text-muted-foreground">{teacher.email}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Archivé le {new Date(teacher.archived_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRestore(teacher.id)}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurer
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, School } from "lucide-react";
import { useArchivedClasses } from "@/hooks/useArchivedClasses";
import { useClasses } from "@/hooks/useClasses";

interface ArchivedClassesSectionProps {
  schoolId?: string;
}

export const ArchivedClassesSection = ({ schoolId }: ArchivedClassesSectionProps) => {
  const { archivedClasses, loading } = useArchivedClasses(schoolId);
  const { restoreClass } = useClasses(schoolId);

  const handleRestore = async (classId: string) => {
    try {
      await restoreClass(classId);
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Classes Archivées
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
          <School className="h-5 w-5" />
          Classes Archivées ({archivedClasses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {archivedClasses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucune classe archivée.
          </p>
        ) : (
          <div className="space-y-3">
            {archivedClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{classItem.name}</p>
                    <Badge variant="secondary">Archivée</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Archivée le {new Date(classItem.archived_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRestore(classItem.id)}
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

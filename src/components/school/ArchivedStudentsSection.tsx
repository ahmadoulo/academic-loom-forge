import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Archive, Loader2 } from "lucide-react";
import { useArchivedStudents } from "@/hooks/useArchivedStudents";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useState } from "react";
import { formatDate } from "date-fns";
import { fr } from "date-fns/locale";

interface ArchivedStudentsSectionProps {
  schoolId: string;
}

export const ArchivedStudentsSection = ({ schoolId }: ArchivedStudentsSectionProps) => {
  const { students, loading, restoreStudent } = useArchivedStudents(schoolId);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    if (!selectedStudent) return;
    
    setIsRestoring(true);
    try {
      await restoreStudent(selectedStudent);
    } finally {
      setIsRestoring(false);
      setSelectedStudent(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Étudiants archivés</CardTitle>
              <CardDescription>
                Liste des étudiants archivés. Vous pouvez les restaurer si nécessaire.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun étudiant archivé</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>CIN</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Dernière classe</TableHead>
                    <TableHead>Archivé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.firstname} {student.lastname}
                      </TableCell>
                      <TableCell>{student.cin_number}</TableCell>
                      <TableCell>{student.email || '-'}</TableCell>
                      <TableCell>
                        {student.last_class_name ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{student.last_class_name}</span>
                            {student.last_school_year && (
                              <Badge variant="outline" className="w-fit text-xs">
                                {student.last_school_year}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {student.archived_at
                          ? formatDate(new Date(student.archived_at), 'Pp', { locale: fr })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudent(student.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restaurer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={!!selectedStudent}
        onOpenChange={(open) => !open && setSelectedStudent(null)}
        title="Restaurer cet étudiant ?"
        description="L'étudiant sera restauré et redeviendra visible dans la liste principale. Vous pourrez ensuite l'assigner à une classe."
        onConfirm={handleRestore}
        loading={isRestoring}
      />
    </>
  );
};

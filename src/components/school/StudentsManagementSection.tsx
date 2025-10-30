import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Upload, Archive } from "lucide-react";
import { StudentsListSection } from "./StudentsListSection";
import { StudentImport } from "./StudentImport";
import { ArchivedStudentsSection } from "./ArchivedStudentsSection";
import { StudentViewDialog } from "./StudentViewDialog";
import { StudentEditDialog } from "./StudentEditDialog";
import { toast } from "sonner";

interface StudentWithClass {
  id: string;
  firstname: string;
  lastname: string;
  email?: string | null;
  cin_number?: string | null;
  birth_date?: string | null;
  student_phone?: string | null;
  parent_phone?: string | null;
  archived?: boolean;
  class_id: string;
  classes?: { name: string };
}

interface StudentsManagementSectionProps {
  schoolId: string;
  students: StudentWithClass[];
  classes: { id: string; name: string }[];
  loading: boolean;
  onArchiveStudent: (id: string, name: string) => void;
  onUpdateStudent: (studentId: string, data: any) => Promise<void>;
  onCreateStudent: (data: any) => Promise<void>;
}

export function StudentsManagementSection({
  schoolId,
  students,
  classes,
  loading,
  onArchiveStudent,
  onUpdateStudent,
  onCreateStudent
}: StudentsManagementSectionProps) {
  const [selectedStudent, setSelectedStudent] = useState<StudentWithClass | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleViewStudent = (student: StudentWithClass) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleEditStudent = (student: StudentWithClass) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleImportComplete = async (importedStudents: any[]) => {
    let successCount = 0;
    let errorCount = 0;

    for (const student of importedStudents) {
      try {
        await onCreateStudent(student);
        successCount++;
      } catch (error) {
        console.error('Error importing student:', error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} étudiant(s) importé(s) avec succès`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} étudiant(s) n'ont pas pu être importés`);
    }
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Étudiants
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Archivés
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <StudentsListSection
                students={students}
                classes={classes}
                loading={loading}
                onArchiveStudent={onArchiveStudent}
                onEditStudent={handleEditStudent}
                onViewStudent={handleViewStudent}
              />
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <StudentImport 
                onImportComplete={handleImportComplete}
                classes={classes}
              />
            </TabsContent>

            <TabsContent value="archived" className="space-y-4">
              <ArchivedStudentsSection schoolId={schoolId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <StudentViewDialog
        student={selectedStudent}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      <StudentEditDialog
        student={selectedStudent}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={onUpdateStudent}
        classes={classes}
      />
    </>
  );
}

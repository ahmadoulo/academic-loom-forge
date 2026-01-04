import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, Users, Archive, Upload } from "lucide-react";
import { TeachersListSection } from "./TeachersListSection";
import { TeacherDetailsDialog } from "./TeacherDetailsDialog";
import { TeacherViewDialog } from "./TeacherViewDialog";
import { TeacherClassAssignment } from "@/components/admin/TeacherClassAssignment";
import { ArchivedTeachersSection } from "./ArchivedTeachersSection";
import { TeacherImport } from "./TeacherImport";
import { Teacher, CreateTeacherData } from "@/hooks/useTeachers";
import { toast } from "sonner";
import { SubscriptionLimitBadge } from "./SubscriptionLimitBadge";
import { useSubscriptionLimits, checkCanAddTeacher } from "@/hooks/useSubscriptionLimits";

interface TeachersManagementSectionProps {
  schoolId: string;
  teachers: Teacher[];
  loading: boolean;
  onArchiveTeacher?: (id: string, name: string) => void;
  onUpdateTeacher?: (teacherId: string, data: Partial<Teacher>) => Promise<void>;
  onCreateTeacher?: (data: CreateTeacherData) => Promise<void>;
  canCreate?: boolean;
  canEdit?: boolean;
  canArchive?: boolean;
}

export function TeachersManagementSection({
  schoolId,
  teachers,
  loading,
  onArchiveTeacher,
  onUpdateTeacher,
  onCreateTeacher,
  canCreate = true,
  canEdit = true,
  canArchive = true
}: TeachersManagementSectionProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Check subscription limits
  const limits = useSubscriptionLimits(schoolId);

  const handleImportComplete = async (importedTeachers: any[]) => {
    // Check if we can add teachers before importing
    if (!checkCanAddTeacher(limits)) {
      return;
    }
    
    // Check if importing would exceed limit
    if (limits.teacherLimit !== null) {
      const wouldExceed = limits.currentTeachers + importedTeachers.length > limits.teacherLimit;
      if (wouldExceed) {
        const remaining = limits.teacherLimit - limits.currentTeachers;
        toast.error("Limite professeur atteint. Contactez le support", {
          description: `Vous pouvez seulement ajouter ${remaining} professeur(s) de plus. Vous essayez d'importer ${importedTeachers.length} professeurs.`,
        });
        return;
      }
    }
    
    let successCount = 0;
    let errorCount = 0;

    for (const teacher of importedTeachers) {
      try {
        await onCreateTeacher({
          school_id: schoolId,
          ...teacher
        });
        successCount++;
      } catch (error) {
        console.error('Error importing teacher:', error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} professeur(s) importé(s) avec succès`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} professeur(s) n'ont pas pu être importés`);
    }
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDetailsDialogOpen(true);
  };

  const handleViewTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsViewDialogOpen(true);
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                Professeurs
              </TabsTrigger>
              {canCreate && (
                <TabsTrigger value="import" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import
                </TabsTrigger>
              )}
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assignations
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Archivés
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <TeachersListSection
                schoolId={schoolId}
                teachers={teachers}
                loading={loading}
                onArchiveTeacher={canArchive ? onArchiveTeacher : undefined}
                onEditTeacher={canEdit ? handleEditTeacher : undefined}
                onViewTeacher={handleViewTeacher}
              />
            </TabsContent>

            {canCreate && (
              <TabsContent value="import" className="space-y-4">
                <TeacherImport onImportComplete={handleImportComplete} />
              </TabsContent>
            )}

            <TabsContent value="assignments" className="space-y-4">
              <TeacherClassAssignment schoolId={schoolId} />
            </TabsContent>

            <TabsContent value="archived" className="space-y-4">
              <ArchivedTeachersSection schoolId={schoolId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TeacherDetailsDialog
        teacher={selectedTeacher}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onSave={onUpdateTeacher}
      />

      <TeacherViewDialog
        teacher={selectedTeacher}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
    </>
  );
}

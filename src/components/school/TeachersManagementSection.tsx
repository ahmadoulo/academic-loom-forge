import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, Users, Archive } from "lucide-react";
import { TeachersListSection } from "./TeachersListSection";
import { TeacherDetailsDialog } from "./TeacherDetailsDialog";
import { TeacherClassAssignment } from "@/components/admin/TeacherClassAssignment";
import { ArchivedTeachersSection } from "./ArchivedTeachersSection";
import { Teacher } from "@/hooks/useTeachers";

interface TeachersManagementSectionProps {
  schoolId: string;
  teachers: Teacher[];
  loading: boolean;
  onArchiveTeacher: (id: string, name: string) => void;
  onUpdateTeacher: (teacherId: string, data: Partial<Teacher>) => Promise<void>;
}

export function TeachersManagementSection({
  schoolId,
  teachers,
  loading,
  onArchiveTeacher,
  onUpdateTeacher
}: TeachersManagementSectionProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDetailsDialogOpen(true);
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                Professeurs
              </TabsTrigger>
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
                teachers={teachers}
                loading={loading}
                onArchiveTeacher={onArchiveTeacher}
                onEditTeacher={handleEditTeacher}
              />
            </TabsContent>

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
    </>
  );
}

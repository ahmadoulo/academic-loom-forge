import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, X } from "lucide-react";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { useClasses } from "@/hooks/useClasses";
import { useTeachers } from "@/hooks/useTeachers";
import { toast } from "sonner";

interface TeacherClassAssignmentProps {
  schoolId: string;
}

export const TeacherClassAssignment = ({ schoolId }: TeacherClassAssignmentProps) => {
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { teacherClasses, assignTeacherToClass, removeTeacherFromClass } = useTeacherClasses();
  const { classes } = useClasses(schoolId);
  const { teachers } = useTeachers(schoolId);

  const handleAssignment = async () => {
    if (!selectedTeacher || !selectedClass) {
      toast.error("Veuillez sélectionner un professeur et une classe");
      return;
    }

    // Check if assignment already exists
    const existingAssignment = teacherClasses.find(
      tc => tc.teacher_id === selectedTeacher && tc.class_id === selectedClass
    );

    if (existingAssignment) {
      toast.error("Ce professeur est déjà assigné à cette classe");
      return;
    }

    try {
      await assignTeacherToClass({
        teacher_id: selectedTeacher,
        class_id: selectedClass
      });
      setSelectedTeacher("");
      setSelectedClass("");
      setDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      await removeTeacherFromClass(assignmentId);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Get assignments for this school
  const schoolAssignments = teacherClasses.filter(tc => 
    tc.classes.school_id === schoolId
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assignation Professeurs - Classes</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Assigner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assigner un professeur à une classe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Professeur</label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un professeur" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.firstname} {teacher.lastname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Classe</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleAssignment} className="w-full">
                  Assigner
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {schoolAssignments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Aucune assignation pour le moment.
          </p>
        ) : (
          <div className="space-y-3">
            {schoolAssignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {assignment.teachers.firstname} {assignment.teachers.lastname}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="secondary">
                      {assignment.classes.name}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveAssignment(assignment.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
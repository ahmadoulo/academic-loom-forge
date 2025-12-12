import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, X, User, GraduationCap } from "lucide-react";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { useClassesByYear } from "@/hooks/useClassesByYear";
import { useTeachers } from "@/hooks/useTeachers";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { toast } from "sonner";

interface TeacherClassAssignmentProps {
  schoolId: string;
}

interface GroupedAssignment {
  teacherId: string;
  teacherName: string;
  classes: Array<{
    assignmentId: string;
    classId: string;
    className: string;
  }>;
}

export const TeacherClassAssignment = ({ schoolId }: TeacherClassAssignmentProps) => {
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { getYearForDisplay } = useAcademicYear();
  const displayYearId = getYearForDisplay();
  
  const { teacherClasses, assignTeacherToClass, removeTeacherFromClass } = useTeacherClasses();
  const { classes } = useClassesByYear(schoolId, displayYearId);
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

  // Get assignments for this school and group by teacher
  const groupedAssignments = useMemo(() => {
    const schoolAssignments = teacherClasses.filter(tc => 
      tc.classes?.school_id === schoolId
    );

    const grouped: Record<string, GroupedAssignment> = {};

    schoolAssignments.forEach(assignment => {
      if (!assignment.teachers || !assignment.classes) return;
      
      const teacherId = assignment.teacher_id;
      const teacherName = `${assignment.teachers.firstname} ${assignment.teachers.lastname}`;

      if (!grouped[teacherId]) {
        grouped[teacherId] = {
          teacherId,
          teacherName,
          classes: []
        };
      }

      // Avoid duplicate classes for same teacher
      const classExists = grouped[teacherId].classes.some(
        c => c.classId === assignment.class_id
      );

      if (!classExists) {
        grouped[teacherId].classes.push({
          assignmentId: assignment.id,
          classId: assignment.class_id,
          className: assignment.classes.name
        });
      }
    });

    return Object.values(grouped).sort((a, b) => 
      a.teacherName.localeCompare(b.teacherName)
    );
  }, [teacherClasses, schoolId]);

  const totalAssignments = groupedAssignments.reduce(
    (acc, teacher) => acc + teacher.classes.length, 
    0
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Assignation Professeurs - Classes
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {groupedAssignments.length} professeur{groupedAssignments.length > 1 ? 's' : ''} • {totalAssignments} assignation{totalAssignments > 1 ? 's' : ''}
            </p>
          </div>
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
        {groupedAssignments.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Aucune assignation pour le moment.
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Cliquez sur "Assigner" pour commencer
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedAssignments.map((teacher) => (
              <div 
                key={teacher.teacherId} 
                className="border rounded-lg overflow-hidden bg-card"
              >
                {/* Teacher Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{teacher.teacherName}</p>
                    <p className="text-xs text-muted-foreground">
                      {teacher.classes.length} classe{teacher.classes.length > 1 ? 's' : ''} assignée{teacher.classes.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                {/* Classes List */}
                <div className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {teacher.classes.map((cls) => (
                      <Badge 
                        key={cls.assignmentId}
                        variant="secondary"
                        className="pl-3 pr-1 py-1.5 flex items-center gap-2 text-sm"
                      >
                        <span>{cls.className}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 rounded-full hover:bg-destructive/20 hover:text-destructive"
                          onClick={() => handleRemoveAssignment(cls.assignmentId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

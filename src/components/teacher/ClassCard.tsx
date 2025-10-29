import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, ChevronRight } from "lucide-react";

interface ClassCardProps {
  classData: {
    id: string;
    name: string;
  };
  studentCount: number;
  subjects: {
    id: string;
    name: string;
  }[];
  onViewStudents: (classId: string, subjectId: string) => void;
}

export const ClassCard = ({ classData, studentCount, subjects, onViewStudents }: ClassCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {classData.name}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {studentCount} étudiants
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {subjects.length} matières
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Mes matières dans cette classe:</h4>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune matière assignée</p>
          ) : (
            <div className="space-y-1">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-2 border rounded-md">
                  <span className="text-sm font-medium">{subject.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewStudents(classData.id, subject.id)}
                    className="h-8 px-2"
                  >
                    Noter les étudiants
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
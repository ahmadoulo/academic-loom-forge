import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Send, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationDialog } from "./NotificationDialog";

interface Student {
  id: string;
  firstname: string;
  lastname: string;
  email: string | null;
  class_name?: string;
}

interface StudentNotificationsProps {
  schoolId: string;
}

export function StudentNotifications({ schoolId }: StudentNotificationsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [schoolId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(
          (s) =>
            s.firstname.toLowerCase().includes(query) ||
            s.lastname.toLowerCase().includes(query) ||
            s.email?.toLowerCase().includes(query) ||
            s.class_name?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredStudents(students);
    }
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select(
          `
          id,
          firstname,
          lastname,
          email,
          student_school!inner(
            class_id,
            classes!inner(name)
          )
        `
        )
        .eq("student_school.school_id", schoolId)
        .eq("archived", false)
        .order("lastname", { ascending: true });

      if (error) throw error;

      const studentsWithClass = data.map((student: any) => ({
        id: student.id,
        firstname: student.firstname,
        lastname: student.lastname,
        email: student.email,
        class_name: student.student_school?.[0]?.classes?.name,
      }));

      setStudents(studentsWithClass);
      setFilteredStudents(studentsWithClass);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Erreur lors du chargement des étudiants");
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const toggleAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const handleSendNotification = () => {
    if (selectedStudents.size === 0) {
      toast.error("Veuillez sélectionner au moins un étudiant");
      return;
    }
    setDialogOpen(true);
  };

  const selectedStudentsList = students.filter((s) => selectedStudents.has(s.id));

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un étudiant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={handleSendNotification}
          disabled={selectedStudents.size === 0}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          Envoyer notification ({selectedStudents.size})
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4 flex items-center gap-3 bg-muted/50">
            <Checkbox
              checked={
                filteredStudents.length > 0 &&
                selectedStudents.size === filteredStudents.length
              }
              onCheckedChange={toggleAll}
            />
            <span className="font-medium">
              Tout sélectionner ({filteredStudents.length})
            </span>
          </div>

          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedStudents.has(student.id)}
                  onCheckedChange={() => toggleStudent(student.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">
                    {student.firstname} {student.lastname}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {student.email ? (
                      <span>{student.email}</span>
                    ) : (
                      <span className="text-destructive">Pas d'email</span>
                    )}
                    {student.class_name && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {student.class_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredStudents.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Aucun étudiant trouvé
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <NotificationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        recipients={selectedStudentsList}
        type="student"
        schoolId={schoolId}
      />
    </div>
  );
}

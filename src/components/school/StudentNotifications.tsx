import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Send, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationDialog } from "./NotificationDialog";
import { useAcademicYear } from "@/hooks/useAcademicYear";

interface Student {
  id: string;
  firstname: string;
  lastname: string;
  email: string | null;
  class_name?: string;
  class_id?: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface StudentNotificationsProps {
  schoolId: string;
}

export function StudentNotifications({ schoolId }: StudentNotificationsProps) {
  const { currentYear } = useAcademicYear();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [showAllYears, setShowAllYears] = useState(false);

  useEffect(() => {
    if (currentYear) {
      fetchClasses();
      fetchStudents();
    }
  }, [schoolId, currentYear, showAllYears]);

  useEffect(() => {
    let filtered = students;

    // Filter by class
    if (selectedClass !== "all") {
      filtered = filtered.filter((s) => s.class_id === selectedClass);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.firstname.toLowerCase().includes(query) ||
          s.lastname.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
          s.class_name?.toLowerCase().includes(query)
      );
    }

    setFilteredStudents(filtered);
  }, [searchQuery, students, selectedClass]);

  const fetchClasses = async () => {
    try {
      let query = supabase
        .from("classes")
        .select("id, name")
        .eq("school_id", schoolId)
        .eq("archived", false);

      // Filter by current year if toggle is off
      if (!showAllYears && currentYear) {
        query = query.eq("school_year_id", currentYear.id);
      }

      const { data, error } = await query.order("name", { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("students")
        .select(
          `
          id,
          firstname,
          lastname,
          email,
          student_school!inner(
            class_id,
            school_year_id,
            classes!inner(name)
          )
        `
        )
        .eq("student_school.school_id", schoolId)
        .eq("archived", false);

      // Filter by current year if toggle is off
      if (!showAllYears && currentYear) {
        query = query.eq("student_school.school_year_id", currentYear.id);
      }

      const { data, error } = await query.order("lastname", { ascending: true });

      if (error) throw error;

      const studentsWithClass = data.map((student: any) => ({
        id: student.id,
        firstname: student.firstname,
        lastname: student.lastname,
        email: student.email,
        class_name: student.student_school?.[0]?.classes?.name,
        class_id: student.student_school?.[0]?.class_id,
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

  const selectedStudentsList = students.filter((s) => selectedStudents.has(s.id)).map(s => ({
    ...s,
    name: `${s.firstname} ${s.lastname}`
  }));

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un étudiant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              id="all-years-students"
              checked={showAllYears}
              onCheckedChange={setShowAllYears}
            />
            <Label htmlFor="all-years-students" className="text-sm whitespace-nowrap cursor-pointer">
              Toutes les années
            </Label>
          </div>
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

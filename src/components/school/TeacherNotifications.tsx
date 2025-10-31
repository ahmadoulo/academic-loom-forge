import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Send, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationDialog } from "./NotificationDialog";

interface Teacher {
  id: string;
  firstname: string;
  lastname: string;
  email: string | null;
  classes_count?: number;
}

interface TeacherNotificationsProps {
  schoolId: string;
}

export function TeacherNotifications({ schoolId }: TeacherNotificationsProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, [schoolId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredTeachers(
        teachers.filter(
          (t) =>
            t.firstname.toLowerCase().includes(query) ||
            t.lastname.toLowerCase().includes(query) ||
            t.email?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredTeachers(teachers);
    }
  }, [searchQuery, teachers]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select(
          `
          id,
          firstname,
          lastname,
          email,
          teacher_classes(count)
        `
        )
        .eq("school_id", schoolId)
        .eq("archived", false)
        .order("lastname", { ascending: true });

      if (error) throw error;

      const teachersWithCount = data.map((teacher: any) => ({
        id: teacher.id,
        firstname: teacher.firstname,
        lastname: teacher.lastname,
        email: teacher.email,
        classes_count: teacher.teacher_classes?.[0]?.count || 0,
      }));

      setTeachers(teachersWithCount);
      setFilteredTeachers(teachersWithCount);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("Erreur lors du chargement des professeurs");
    } finally {
      setLoading(false);
    }
  };

  const toggleTeacher = (teacherId: string) => {
    const newSelected = new Set(selectedTeachers);
    if (newSelected.has(teacherId)) {
      newSelected.delete(teacherId);
    } else {
      newSelected.add(teacherId);
    }
    setSelectedTeachers(newSelected);
  };

  const toggleAll = () => {
    if (selectedTeachers.size === filteredTeachers.length) {
      setSelectedTeachers(new Set());
    } else {
      setSelectedTeachers(new Set(filteredTeachers.map((t) => t.id)));
    }
  };

  const handleSendNotification = () => {
    if (selectedTeachers.size === 0) {
      toast.error("Veuillez sélectionner au moins un professeur");
      return;
    }
    setDialogOpen(true);
  };

  const selectedTeachersList = teachers.filter((t) => selectedTeachers.has(t.id)).map(t => ({
    ...t,
    name: `${t.firstname} ${t.lastname}`
  }));

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un professeur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={handleSendNotification}
          disabled={selectedTeachers.size === 0}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          Envoyer notification ({selectedTeachers.size})
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4 flex items-center gap-3 bg-muted/50">
            <Checkbox
              checked={
                filteredTeachers.length > 0 &&
                selectedTeachers.size === filteredTeachers.length
              }
              onCheckedChange={toggleAll}
            />
            <span className="font-medium">
              Tout sélectionner ({filteredTeachers.length})
            </span>
          </div>

          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedTeachers.has(teacher.id)}
                  onCheckedChange={() => toggleTeacher(teacher.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">
                    {teacher.firstname} {teacher.lastname}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {teacher.email ? (
                      <span>{teacher.email}</span>
                    ) : (
                      <span className="text-destructive">Pas d'email</span>
                    )}
                    {teacher.classes_count !== undefined && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {teacher.classes_count} classe(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredTeachers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Aucun professeur trouvé
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <NotificationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        recipients={selectedTeachersList}
        type="teacher"
        schoolId={schoolId}
      />
    </div>
  );
}

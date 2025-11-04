import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Send, Search, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationDialog } from "./NotificationDialog";
import { useAcademicYear } from "@/hooks/useAcademicYear";

interface Parent {
  id: string;
  tutor_name: string;
  tutor_email: string;
  student_firstname: string;
  student_lastname: string;
  class_name?: string;
  class_id?: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface ParentNotificationsProps {
  schoolId: string;
}

export function ParentNotifications({ schoolId }: ParentNotificationsProps) {
  const { currentYear } = useAcademicYear();
  const [parents, setParents] = useState<Parent[]>([]);
  const [filteredParents, setFilteredParents] = useState<Parent[]>([]);
  const [selectedParents, setSelectedParents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [showAllYears, setShowAllYears] = useState(false);

  useEffect(() => {
    if (currentYear) {
      fetchClasses();
      fetchParents();
    }
  }, [schoolId, currentYear, showAllYears]);

  useEffect(() => {
    let filtered = parents;

    // Filter by class
    if (selectedClass !== "all") {
      filtered = filtered.filter((p) => p.class_id === selectedClass);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.tutor_name?.toLowerCase().includes(query) ||
          p.tutor_email?.toLowerCase().includes(query) ||
          p.student_firstname.toLowerCase().includes(query) ||
          p.student_lastname.toLowerCase().includes(query) ||
          p.class_name?.toLowerCase().includes(query)
      );
    }

    setFilteredParents(filtered);
  }, [searchQuery, parents, selectedClass]);

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

  const fetchParents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("students")
        .select(
          `
          id,
          firstname,
          lastname,
          tutor_name,
          tutor_email,
          student_school!inner(
            class_id,
            school_year_id,
            classes!inner(name)
          )
        `
        )
        .eq("student_school.school_id", schoolId)
        .eq("archived", false)
        .not("tutor_email", "is", null);

      // Filter by current year if toggle is off
      if (!showAllYears && currentYear) {
        query = query.eq("student_school.school_year_id", currentYear.id);
      }

      const { data, error } = await query.order("tutor_name", { ascending: true });

      if (error) throw error;

      const parentsWithClass = data
        .filter((student: any) => student.tutor_email && student.tutor_name)
        .map((student: any) => ({
          id: student.id,
          tutor_name: student.tutor_name,
          tutor_email: student.tutor_email,
          student_firstname: student.firstname,
          student_lastname: student.lastname,
          class_name: student.student_school?.[0]?.classes?.name,
          class_id: student.student_school?.[0]?.class_id,
        }));

      setParents(parentsWithClass);
      setFilteredParents(parentsWithClass);
    } catch (error) {
      console.error("Error fetching parents:", error);
      toast.error("Erreur lors du chargement des parents");
    } finally {
      setLoading(false);
    }
  };

  const toggleParent = (parentId: string) => {
    const newSelected = new Set(selectedParents);
    if (newSelected.has(parentId)) {
      newSelected.delete(parentId);
    } else {
      newSelected.add(parentId);
    }
    setSelectedParents(newSelected);
  };

  const toggleAll = () => {
    if (selectedParents.size === filteredParents.length) {
      setSelectedParents(new Set());
    } else {
      setSelectedParents(new Set(filteredParents.map((p) => p.id)));
    }
  };

  const handleSendNotification = () => {
    if (selectedParents.size === 0) {
      toast.error("Veuillez sélectionner au moins un parent");
      return;
    }
    setDialogOpen(true);
  };

  const selectedParentsList = parents
    .filter((p) => selectedParents.has(p.id))
    .map((p) => ({
      id: p.id,
      firstname: p.tutor_name,
      lastname: "",
      email: p.tutor_email,
      name: p.tutor_name
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
              placeholder="Rechercher un parent..."
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
              id="all-years-parents"
              checked={showAllYears}
              onCheckedChange={setShowAllYears}
            />
            <Label htmlFor="all-years-parents" className="text-sm whitespace-nowrap cursor-pointer">
              Toutes les années
            </Label>
          </div>
        </div>
        <Button
          onClick={handleSendNotification}
          disabled={selectedParents.size === 0}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          Envoyer notification ({selectedParents.size})
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4 flex items-center gap-3 bg-muted/50">
            <Checkbox
              checked={
                filteredParents.length > 0 &&
                selectedParents.size === filteredParents.length
              }
              onCheckedChange={toggleAll}
            />
            <span className="font-medium">
              Tout sélectionner ({filteredParents.length})
            </span>
          </div>

          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredParents.map((parent) => (
              <div
                key={parent.id}
                className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedParents.has(parent.id)}
                  onCheckedChange={() => toggleParent(parent.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{parent.tutor_name}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    {parent.tutor_email ? (
                      <span>{parent.tutor_email}</span>
                    ) : (
                      <span className="text-destructive">Pas d'email</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">
                      Parent de: {parent.student_firstname} {parent.student_lastname}
                    </span>
                    {parent.class_name && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {parent.class_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredParents.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Aucun parent trouvé
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <NotificationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        recipients={selectedParentsList}
        type="parent"
        schoolId={schoolId}
      />
    </div>
  );
}

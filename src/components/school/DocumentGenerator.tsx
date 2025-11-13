import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentTemplate } from "@/hooks/useDocumentTemplates";
import { useStudents } from "@/hooks/useStudents";
import { useSchoolYears } from "@/hooks/useSchoolYears";
import { useSchools } from "@/hooks/useSchools";
import { useClasses } from "@/hooks/useClasses";
import { downloadDocumentPDF, previewDocumentPDF } from "@/utils/documentPdfExport";
import { Download, Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DocumentGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DocumentTemplate;
  schoolId: string;
}

export const DocumentGenerator = ({
  open,
  onOpenChange,
  template,
  schoolId,
}: DocumentGeneratorProps) => {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  
  const { students, loading } = useStudents(schoolId);
  const { schoolYears } = useSchoolYears();
  const { schools } = useSchools();
  const { classes } = useClasses(schoolId);
  
  const currentYear = schoolYears.find(y => y.is_current);
  const school = schools.find(s => s.id === schoolId);

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstname} ${student.lastname}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || student.cin_number.toLowerCase().includes(query);
    const matchesClass = selectedClassId === "all" || student.class_id === selectedClassId;
    return matchesSearch && matchesClass;
  });

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

  const getSelectedStudentsData = () => {
    return students
      .filter((s) => selectedStudents.has(s.id))
      .map((student) => ({
        id: student.id,
        firstname: student.firstname,
        lastname: student.lastname,
        cin_number: student.cin_number,
        birth_date: student.birth_date || null,
        class_name: student.classes?.name,
        school_name: school?.name,
        school_address: school?.address,
        school_phone: school?.phone,
        school_website: school?.website,
        school_city: school?.city,
        school_country: school?.country,
      }));
  };

  const handlePreview = async () => {
    if (selectedStudents.size === 0) {
      toast.error("Veuillez sélectionner au moins un étudiant");
      return;
    }

    const studentsData = getSelectedStudentsData();
    await previewDocumentPDF(
      { 
        content: template.content, 
        name: template.name, 
        footer_color: template.footer_color,
        footer_content: template.footer_content 
      },
      studentsData,
      currentYear?.name || "",
      school?.logo_url || undefined
    );
  };

  const handleDownload = async () => {
    if (selectedStudents.size === 0) {
      toast.error("Veuillez sélectionner au moins un étudiant");
      return;
    }

    const studentsData = getSelectedStudentsData();
    await downloadDocumentPDF(
      { 
        content: template.content, 
        name: template.name, 
        footer_color: template.footer_color,
        footer_content: template.footer_content 
      },
      studentsData,
      currentYear?.name || "",
      school?.logo_url || undefined
    );
    toast.success("Document téléchargé avec succès");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Générer : {template.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden flex flex-col">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Filtrer par classe</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
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
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un étudiant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm font-medium">
                  Tout sélectionner ({selectedStudents.size} sélectionné{selectedStudents.size > 1 ? "s" : ""})
                </span>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 border rounded-md">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Chargement...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Aucun étudiant trouvé
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => toggleStudent(student.id)}
                  >
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {student.firstname} {student.lastname}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        CIN: {student.cin_number || "N/A"} • Classe: {student.classes?.name || "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={selectedStudents.size === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              Prévisualiser
            </Button>
            <Button onClick={handleDownload} disabled={selectedStudents.size === 0}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

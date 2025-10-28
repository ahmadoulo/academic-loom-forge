import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Archive, Loader2, Filter, Pencil, ExternalLink } from "lucide-react";
import { StudentEditDialog } from "./StudentEditDialog";

interface StudentWithClass {
  id: string;
  firstname: string;
  lastname: string;
  email?: string | null;
  cin_number?: string | null;
  student_phone?: string | null;
  parent_phone?: string | null;
  birth_date?: string | null;
  class_id: string;
  classes?: { name: string };
}

interface Class {
  id: string;
  name: string;
}

interface StudentsListSectionProps {
  students: StudentWithClass[];
  classes: Class[];
  loading: boolean;
  onArchiveStudent: (id: string, name: string) => void;
  onUpdateStudent: (id: string, data: Partial<StudentWithClass>) => Promise<void>;
}

export function StudentsListSection({ students, classes, loading, onArchiveStudent, onUpdateStudent }: StudentsListSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [editingStudent, setEditingStudent] = useState<StudentWithClass | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = (student: StudentWithClass) => {
    setEditingStudent(student);
    setIsEditDialogOpen(true);
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstname} ${student.lastname}`.toLowerCase();
    const className = student.classes?.name?.toLowerCase() || "";
    const email = student.email?.toLowerCase() || "";
    const cin = student.cin_number?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    
    const matchesSearch = fullName.includes(term) || className.includes(term) || email.includes(term) || cin.includes(term);
    const matchesClass = selectedClass === "all" || student.classes?.name === selectedClass;
    
    return matchesSearch && matchesClass;
  });

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Base de données des Étudiants ({students.length})
          </CardTitle>
        
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email, CIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par classe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.name}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">Chargement...</span>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                {searchTerm || selectedClass !== "all" ? (
                  <>
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-lg">Aucun étudiant trouvé</p>
                    <p className="text-sm text-muted-foreground">Essayez avec d'autres critères de recherche</p>
                  </>
                ) : (
                  <>
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-lg">Aucun étudiant inscrit</p>
                    <p className="text-sm text-muted-foreground">Utilisez l'import pour ajouter des étudiants</p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Nom Complet</TableHead>
                      <TableHead className="min-w-[140px]">Classe</TableHead>
                      <TableHead className="min-w-[120px]">CIN</TableHead>
                      <TableHead className="min-w-[200px]">Email</TableHead>
                      <TableHead className="min-w-[140px]">Téléphone</TableHead>
                      <TableHead className="min-w-[140px]">Tél. Parent</TableHead>
                      <TableHead className="text-right min-w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium whitespace-nowrap">
                          {student.firstname} {student.lastname}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="font-medium">
                            {student.classes?.name || "Non assignée"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {student.cin_number || "-"}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {student.email || "-"}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {student.student_phone || "-"}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {student.parent_phone || "-"}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(student)}
                              className="hover:bg-primary hover:text-primary-foreground"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/student-dashboard?studentId=${student.id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/20"
                              onClick={() => onArchiveStudent(student.id, `${student.firstname} ${student.lastname}`)}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    <StudentEditDialog
      student={editingStudent}
      classes={classes}
      open={isEditDialogOpen}
      onOpenChange={setIsEditDialogOpen}
      onSave={onUpdateStudent}
    />
    </>
  );
}
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Trash2, Loader2, Filter } from "lucide-react";

interface StudentWithClass {
  id: string;
  firstname: string;
  lastname: string;
  email?: string | null;
  cin_number?: string | null;
  student_phone?: string | null;
  parent_phone?: string | null;
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
  onDeleteStudent: (id: string, name: string) => void;
}

export function StudentsListSection({ students, classes, loading, onDeleteStudent }: StudentsListSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");

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
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
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
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom Complet</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>CIN</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Tél. Parent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.firstname} {student.lastname}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {student.classes?.name || "Non assignée"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {student.cin_number || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {student.email || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {student.student_phone || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {student.parent_phone || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/student-dashboard?studentId=${student.id}`, '_blank')}
                            >
                              Interface
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => onDeleteStudent(student.id, `${student.firstname} ${student.lastname}`)}
                            >
                              <Trash2 className="h-4 w-4" />
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
  );
}
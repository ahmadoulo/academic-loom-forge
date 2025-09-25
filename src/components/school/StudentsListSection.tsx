import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Search, Trash2, Mail, Phone, Loader2 } from "lucide-react";

interface StudentWithClass {
  id: string;
  firstname: string;
  lastname: string;
  email?: string | null;
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

  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstname} ${student.lastname}`.toLowerCase();
    const className = student.classes?.name?.toLowerCase() || "";
    const email = student.email?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    
    return fullName.includes(term) || className.includes(term) || email.includes(term);
  });

  const getInitials = (firstname: string, lastname: string) => {
    return `${firstname[0]}${lastname[0]}`.toUpperCase();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Liste des Étudiants ({students.length})
        </CardTitle>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un étudiant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">Chargement...</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                {searchTerm ? (
                  <>
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-lg">Aucun étudiant trouvé</p>
                    <p className="text-sm text-muted-foreground">Essayez avec d'autres termes de recherche</p>
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
              filteredStudents.map((student) => (
                <div key={student.id} className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                      {getInitials(student.firstname, student.lastname)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {student.firstname} {student.lastname}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {student.classes?.name || "Aucune classe"}
                      </Badge>
                    </div>
                    
                    {student.email && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                        <Mail className="h-3 w-3" />
                        {student.email}
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      Classe: {student.classes?.name || "Non assignée"}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3 hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => window.open(`/student-dashboard?studentId=${student.id}`, '_blank')}
                    >
                      Interface Étudiant
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => onDeleteStudent(student.id, `${student.firstname} ${student.lastname}`)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
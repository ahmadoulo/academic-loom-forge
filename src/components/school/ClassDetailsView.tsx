import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Users, Search, Mail, Phone, Download, UserPlus } from "lucide-react";

interface Class {
  id: string;
  name: string;
}

interface StudentWithClass {
  id: string;
  firstname: string;
  lastname: string;
  email?: string | null;
  class_id: string;
  classes?: { name: string };
}

interface ClassDetailsViewProps {
  classItem: Class;
  students: StudentWithClass[];
  onBack: () => void;
  onAddStudent: () => void;
}

export function ClassDetailsView({ classItem, students, onBack, onAddStudent }: ClassDetailsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const classStudents = students.filter(student => student.class_id === classItem.id);
  
  const filteredStudents = classStudents.filter(student => {
    const fullName = `${student.firstname} ${student.lastname}`.toLowerCase();
    const email = student.email?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    
    return fullName.includes(term) || email.includes(term);
  });

  const getInitials = (firstname: string, lastname: string) => {
    return `${firstname[0]}${lastname[0]}`.toUpperCase();
  };

  const exportStudentsList = () => {
    const csvContent = [
      "Prénom,Nom,Email",
      ...classStudents.map(student => 
        `${student.firstname},${student.lastname},${student.email || ""}`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `etudiants_${classItem.name.replace(/\s+/g, "_")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            Classe {classItem.name}
          </h2>
          <p className="text-gray-600 mt-1">{classStudents.length} étudiant{classStudents.length !== 1 ? 's' : ''} inscrit{classStudents.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportStudentsList} className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={onAddStudent} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Ajouter un étudiant
          </Button>
        </div>
      </div>

      {/* Students List */}
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              Liste des étudiants
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {filteredStudents.length} / {classStudents.length}
            </Badge>
          </div>
          
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
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm ? (
                <>
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-lg">Aucun étudiant trouvé</p>
                  <p className="text-sm text-muted-foreground">Essayez avec d'autres termes de recherche</p>
                </>
              ) : classStudents.length === 0 ? (
                <>
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-lg">Aucun étudiant dans cette classe</p>
                  <p className="text-sm text-muted-foreground">Ajoutez des étudiants pour commencer</p>
                </>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredStudents.map((student, index) => (
                <div key={student.id} className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50">
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-8">
                        #{(index + 1).toString().padStart(2, '0')}
                      </span>
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                          {getInitials(student.firstname, student.lastname)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {student.firstname} {student.lastname}
                    </h3>
                    
                    {student.email && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        <a 
                          href={`mailto:${student.email}`}
                          className="hover:text-primary transition-colors"
                        >
                          {student.email}
                        </a>
                      </div>
                    )}
                    
                    {!student.email && (
                      <p className="text-sm text-muted-foreground">
                        Aucun email renseigné
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      ID: {student.id.substring(0, 8)}...
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
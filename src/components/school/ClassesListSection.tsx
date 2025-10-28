import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { School, Search, Archive, Users, ArrowRight, Plus } from "lucide-react";

interface Class {
  id: string;
  name: string;
  school_year_id: string;
  student_count?: number;
}

interface StudentWithClass {
  id: string;
  firstname: string;
  lastname: string;
  email?: string | null;
  class_id: string;
  classes?: { name: string };
}

interface ClassesListSectionProps {
  classes: Class[];
  students: StudentWithClass[];
  loading: boolean;
  onArchiveClass: (id: string, name: string) => void;
  onViewClassDetails: (classItem: Class) => void;
  onCreateClass: () => void;
}

export function ClassesListSection({ 
  classes, 
  students, 
  loading, 
  onArchiveClass, 
  onViewClassDetails,
  onCreateClass 
}: ClassesListSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClasses = classes.filter(classItem => {
    const className = classItem.name.toLowerCase();
    const term = searchTerm.toLowerCase();
    return className.includes(term);
  });

  const getClassStudentCount = (classItem: Class) => {
    // Utiliser le student_count déjà calculé par useClassesByYear qui tient compte de l'année
    return classItem.student_count ?? 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Classes</h2>
          <p className="text-gray-600 mt-1">Organisez vos classes et consultez les listes d'étudiants</p>
        </div>
        <Button onClick={onCreateClass} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Nouvelle Classe
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <School className="h-5 w-5 text-primary" />
            Liste des Classes ({classes.length})
          </CardTitle>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-lg">Chargement...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  {searchTerm ? (
                    <>
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-lg">Aucune classe trouvée</p>
                      <p className="text-sm text-muted-foreground">Essayez avec d'autres termes de recherche</p>
                    </>
                  ) : (
                    <>
                      <School className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-lg">Aucune classe créée</p>
                      <p className="text-sm text-muted-foreground">Créez votre première classe pour commencer</p>
                    </>
                  )}
                </div>
              ) : (
                filteredClasses.map((classItem) => {
                  const studentCount = getClassStudentCount(classItem);
                  
                  return (
                    <Card key={classItem.id} className="relative hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/30 cursor-pointer group">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <School className="h-5 w-5 text-primary" />
                            </div>
                            {classItem.name}
                          </CardTitle>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onArchiveClass(classItem.id, classItem.name);
                            }}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-2xl font-bold text-primary">{studentCount}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {studentCount === 0 ? "Aucun étudiant" : 
                               studentCount === 1 ? "1 étudiant" : 
                               `${studentCount} étudiants`}
                            </Badge>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                            onClick={() => onViewClassDetails(classItem)}
                          >
                            Voir les étudiants
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Plus, Pencil, Archive, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Subject {
  id: string;
  name: string;
  class_id: string;
  teacher_id?: string;
  coefficient: number;
  coefficient_type?: 'coefficient' | 'credit';
}

interface Teacher {
  id: string;
  firstname: string;
  lastname: string;
}

interface Class {
  id: string;
  name: string;
}

interface SubjectsManagementSectionProps {
  subjects: Subject[];
  classes: Class[];
  teachers: Teacher[];
  loading: boolean;
  onCreateSubject?: () => void;
  onEditSubject?: (subject: Subject) => void;
  onArchiveSubject?: (id: string, name: string) => void;
}

export function SubjectsManagementSection({
  subjects,
  classes,
  teachers,
  loading,
  onCreateSubject,
  onEditSubject,
  onArchiveSubject,
}: SubjectsManagementSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || "all");

  // Filter subjects by search and class
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClassId === "all" || subject.class_id === selectedClassId;
    return matchesSearch && matchesClass;
  });

  // Group subjects by class
  const subjectsByClass = classes.reduce((acc, cls) => {
    acc[cls.id] = subjects.filter((s) => s.class_id === cls.id);
    return acc;
  }, {} as Record<string, Subject[]>);

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return "Non assigné";
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : "Non assigné";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matières Enseignées</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-background to-accent/5">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                Matières Enseignées
              </CardTitle>
              <CardDescription className="mt-2">
                Gérez les matières par classe avec leurs coefficients
              </CardDescription>
            </div>
            {onCreateSubject && (
              <Button onClick={onCreateSubject} size="lg" className="gap-2 w-full sm:w-auto">
                <Plus className="h-5 w-5" />
                Nouvelle Matière
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une matière..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-primary/20 focus:border-primary/40 transition-colors"
            />
          </div>

          <Tabs value={selectedClassId} onValueChange={setSelectedClassId} className="w-full">
            <TabsList className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${classes.length + 1}, minmax(0, 1fr))` }}>
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Toutes ({subjects.length})
              </TabsTrigger>
              {classes.map((cls) => (
                <TabsTrigger
                  key={cls.id}
                  value={cls.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {cls.name} ({subjectsByClass[cls.id]?.length || 0})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {filteredSubjects.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">Aucune matière trouvée</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    {searchQuery ? "Essayez de modifier votre recherche" : "Commencez par créer votre première matière"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredSubjects.map((subject) => {
                    const subjectClass = classes.find((c) => c.id === subject.class_id);
                    
                    return (
                      <Card key={subject.id} className="border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg group">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between gap-2 text-lg">
                            <div className="flex items-center gap-2 min-w-0">
                              <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
                              <span className="truncate">{subject.name}</span>
                            </div>
                            <Badge variant="secondary" className="ml-auto flex-shrink-0">
                              {subject.coefficient_type === 'credit' ? 'Crédit' : 'Coef.'} {subject.coefficient}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Classe</p>
                            <p className="text-sm font-semibold">{subjectClass?.name || "Non assignée"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Professeur</p>
                            <p className="text-sm">{getTeacherName(subject.teacher_id)}</p>
                          </div>
                          <div className="flex gap-2 pt-2">
                            {onEditSubject && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() => onEditSubject(subject)}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Modifier
                              </Button>
                            )}
                            {onArchiveSubject && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => onArchiveSubject(subject.id, subject.name)}
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {classes.map((cls) => {
              const classSubjects = subjectsByClass[cls.id] || [];
              const filteredClassSubjects = classSubjects.filter((s) =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase())
              );

              return (
                <TabsContent key={cls.id} value={cls.id} className="mt-6">
                  {filteredClassSubjects.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                        <BookOpen className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-muted-foreground">Aucune matière trouvée</p>
                      <p className="text-sm text-muted-foreground/60 mt-1">
                        {searchQuery
                          ? "Essayez de modifier votre recherche"
                          : `Aucune matière créée pour la classe ${cls.name}`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredClassSubjects.map((subject) => (
                        <Card key={subject.id} className="border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg group">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between gap-2 text-lg">
                              <div className="flex items-center gap-2 min-w-0">
                                <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
                                <span className="truncate">{subject.name}</span>
                              </div>
                              <Badge variant="secondary" className="ml-auto flex-shrink-0">
                                {subject.coefficient_type === 'credit' ? 'Crédit' : 'Coef.'} {subject.coefficient}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Professeur</p>
                              <p className="text-sm">{getTeacherName(subject.teacher_id)}</p>
                            </div>
                            <div className="flex gap-2 pt-2">
                              {onEditSubject && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                                  onClick={() => onEditSubject(subject)}
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Modifier
                                </Button>
                              )}
                              {onArchiveSubject && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => onArchiveSubject(subject.id, subject.name)}
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

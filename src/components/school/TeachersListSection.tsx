import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCog, Search, Archive, Loader2, Pencil, ExternalLink, Mail, Phone, Eye } from "lucide-react";
import { Teacher } from "@/hooks/useTeachers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SubscriptionLimitBadge } from "./SubscriptionLimitBadge";

interface TeachersListSectionProps {
  schoolId: string;
  teachers: Teacher[];
  loading: boolean;
  onArchiveTeacher: (id: string, name: string) => void;
  onEditTeacher: (teacher: Teacher) => void;
  onViewTeacher: (teacher: Teacher) => void;
}

export function TeachersListSection({ 
  schoolId,
  teachers, 
  loading, 
  onArchiveTeacher,
  onEditTeacher,
  onViewTeacher
}: TeachersListSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [teacherClassCounts, setTeacherClassCounts] = useState<Record<string, number>>({});

  // Fetch real class counts for all teachers
  useEffect(() => {
    const fetchClassCounts = async () => {
      if (teachers.length === 0) return;
      
      const teacherIds = teachers.map(t => t.id);
      const { data, error } = await supabase
        .from('teacher_classes')
        .select('teacher_id')
        .in('teacher_id', teacherIds);

      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach(tc => {
          counts[tc.teacher_id] = (counts[tc.teacher_id] || 0) + 1;
        });
        setTeacherClassCounts(counts);
      }
    };

    fetchClassCounts();
  }, [teachers]);

  const filteredTeachers = teachers.filter(teacher => {
    const fullName = `${teacher.firstname} ${teacher.lastname}`.toLowerCase();
    const email = teacher.email?.toLowerCase() || "";
    const mobile = teacher.mobile?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    
    return fullName.includes(term) || email.includes(term) || mobile.includes(term);
  });

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" />
            Base de données des Professeurs ({teachers.length})
          </CardTitle>
          <SubscriptionLimitBadge schoolId={schoolId} type="teacher" />
        </div>
      
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
            {filteredTeachers.length === 0 ? (
              <div className="text-center py-12">
                {searchTerm ? (
                  <>
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-lg">Aucun professeur trouvé</p>
                    <p className="text-sm text-muted-foreground">Essayez avec d'autres critères de recherche</p>
                  </>
                ) : (
                  <>
                    <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-lg">Aucun professeur enregistré</p>
                    <p className="text-sm text-muted-foreground">Ajoutez votre premier professeur</p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Nom Complet</TableHead>
                      <TableHead className="min-w-[200px]">Email</TableHead>
                      <TableHead className="min-w-[140px]">Téléphone</TableHead>
                      <TableHead className="min-w-[120px]">Genre</TableHead>
                      <TableHead className="min-w-[140px]">Qualification</TableHead>
                      <TableHead className="min-w-[100px]">Statut</TableHead>
                      <TableHead className="min-w-[120px]">Classes</TableHead>
                      <TableHead className="text-right min-w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium whitespace-nowrap">
                          {teacher.firstname} {teacher.lastname}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {teacher.email ? (
                              <>
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {teacher.email}
                              </>
                            ) : (
                              "-"
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {teacher.mobile ? (
                              <>
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {teacher.mobile}
                              </>
                            ) : (
                              "-"
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {teacher.gender ? (
                            <Badge variant="outline" className="font-medium">
                              {teacher.gender === 'male' ? 'M' : 'F'}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {teacher.qualification || "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge 
                            variant={teacher.status === 'active' ? 'default' : 'secondary'}
                            className={teacher.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
                          >
                            {teacher.status === 'active' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <Badge variant="outline" className="font-semibold">
                            {teacherClassCounts[teacher.id] || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewTeacher(teacher)}
                              className="hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/20"
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditTeacher(teacher)}
                              className="hover:bg-primary hover:text-primary-foreground"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (teacher.status === 'inactive' || teacher.archived) {
                                  toast.error('Accès refusé', {
                                    description: 'Ce compte professeur est inactif ou archivé'
                                  });
                                  return;
                                }
                                window.open(`/teacher/${teacher.id}`, '_blank');
                              }}
                              disabled={teacher.status === 'inactive' || teacher.archived}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/20"
                              onClick={() => onArchiveTeacher(teacher.id, `${teacher.firstname} ${teacher.lastname}`)}
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
  );
}

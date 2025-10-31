import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, Mail, Phone, Calendar, CreditCard, MapPin, 
  GraduationCap, BookOpen, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface StudentData {
  id: string;
  firstname: string;
  lastname: string;
  email?: string | null;
  cin_number?: string | null;
  birth_date?: string | null;
  student_phone?: string | null;
  parent_phone?: string | null;
  tutor_name?: string | null;
  tutor_email?: string | null;
  archived?: boolean;
}

interface StudentViewDialogProps {
  student: StudentData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentViewDialog({ 
  student, 
  open, 
  onOpenChange 
}: StudentViewDialogProps) {
  const [classInfo, setClassInfo] = useState<any>(null);
  const [gradesCount, setGradesCount] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);

  useEffect(() => {
    if (!student?.id || !open) return;

    const fetchStudentData = async () => {
      // Fetch class info
      const { data: studentSchool } = await supabase
        .from('student_school')
        .select(`
          *,
          classes (
            id,
            name
          )
        `)
        .eq('student_id', student.id)
        .eq('is_active', true)
        .single();

      if (studentSchool) {
        setClassInfo(studentSchool.classes);
      }

      // Fetch grades count
      const { data: grades } = await supabase
        .from('grades')
        .select('id')
        .eq('student_id', student.id);

      setGradesCount(grades?.length || 0);

      // Fetch attendance stats
      const { data: attendance } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', student.id);

      if (attendance && attendance.length > 0) {
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const rate = (presentCount / attendance.length) * 100;
        setAttendanceRate(Math.round(rate));
      }
    };

    fetchStudentData();
  }, [student?.id, open]);

  if (!student) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Détails de l'Étudiant
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Header Section */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{student.firstname} {student.lastname}</h3>
                    <p className="text-muted-foreground">{classInfo?.name || "Non assigné"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={student.archived ? 'secondary' : 'default'}
                    className={`${student.archived ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                  >
                    {student.archived ? 'Archivé' : 'Actif'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Classe</p>
                    <p className="text-xl font-bold">{classInfo?.name || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-2xl font-bold">{gradesCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assiduité</p>
                    <p className="text-2xl font-bold">{attendanceRate !== null ? `${attendanceRate}%` : "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-primary" />
                Informations de contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{student.email || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone étudiant</p>
                    <p className="font-medium">{student.student_phone || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone parent</p>
                    <p className="font-medium">{student.parent_phone || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">CIN</p>
                    <p className="font-medium">{student.cin_number || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Tutor Information */}
              {(student.tutor_name || student.tutor_email) && (
                <>
                  <Separator className="my-4" />
                  <h4 className="text-sm font-semibold mb-3">Informations du tuteur</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {student.tutor_name && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Nom du tuteur</p>
                          <p className="font-medium">{student.tutor_name}</p>
                        </div>
                      </div>
                    )}
                    {student.tutor_email && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email du tuteur</p>
                          <p className="font-medium">{student.tutor_email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                Informations personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date de naissance</p>
                    <p className="font-medium">{formatDate(student.birth_date)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

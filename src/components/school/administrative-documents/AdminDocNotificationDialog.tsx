import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail,
  Users,
  UserCheck,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  UserCircle,
} from "lucide-react";

interface StudentWithMissingDocs {
  id: string;
  fullName: string;
  email?: string;
  tutorEmail?: string;
  className: string;
  missingDocuments: string[];
}

interface AdminDocNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentWithMissingDocs[];
  schoolId: string;
  schoolName: string;
  className: string;
}

export const AdminDocNotificationDialog: React.FC<AdminDocNotificationDialogProps> = ({
  open,
  onOpenChange,
  students,
  schoolId,
  schoolName,
  className,
}) => {
  const [sendToStudents, setSendToStudents] = useState(true);
  const [sendToParents, setSendToParents] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set(students.map(s => s.id)));
  const [isSending, setIsSending] = useState(false);

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedStudents(new Set(students.map(s => s.id)));
      setSendToStudents(true);
      setSendToParents(true);
    }
  }, [open, students]);

  const stats = useMemo(() => {
    const selected = students.filter(s => selectedStudents.has(s.id));
    return {
      totalSelected: selected.length,
      withStudentEmail: selected.filter(s => s.email).length,
      withParentEmail: selected.filter(s => s.tutorEmail).length,
      totalEmails: (sendToStudents ? selected.filter(s => s.email).length : 0) +
                   (sendToParents ? selected.filter(s => s.tutorEmail).length : 0),
    };
  }, [students, selectedStudents, sendToStudents, sendToParents]);

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
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const handleSend = async () => {
    if (stats.totalEmails === 0) {
      toast.error("Aucun destinataire avec email valide");
      return;
    }

    setIsSending(true);

    try {
      const recipients: Array<{
        email: string;
        name: string;
        type: 'student' | 'parent';
        missingDocuments: string[];
      }> = [];

      const selectedStudentsList = students.filter(s => selectedStudents.has(s.id));

      for (const student of selectedStudentsList) {
        if (sendToStudents && student.email) {
          recipients.push({
            email: student.email,
            name: student.fullName,
            type: 'student',
            missingDocuments: student.missingDocuments,
          });
        }
        if (sendToParents && student.tutorEmail) {
          recipients.push({
            email: student.tutorEmail,
            name: student.fullName,
            type: 'parent',
            missingDocuments: student.missingDocuments,
          });
        }
      }

      const sessionToken = localStorage.getItem("app_session_token") || localStorage.getItem("sessionToken");
      
      if (!sessionToken) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('send-smtp-notification', {
        body: {
          sessionToken,
          recipients,
          schoolId,
          schoolName,
          className,
        },
      });

      if (error) throw error;

      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const failedCount = data.results?.filter((r: any) => !r.success).length || 0;

      if (failedCount === 0) {
        toast.success(`${successCount} notification(s) envoyée(s) avec succès`);
      } else if (successCount > 0) {
        toast.warning(`${successCount} envoyée(s), ${failedCount} échec(s)`);
      } else {
        toast.error("Échec de l'envoi des notifications");
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending notifications:", error);
      toast.error(`Erreur: ${error.message || "Impossible d'envoyer les notifications"}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="h-5 w-5 text-primary" />
            Envoyer un rappel par email
          </DialogTitle>
          <DialogDescription>
            Envoyez un rappel aux étudiants et/ou parents concernant les documents administratifs manquants.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Recipients Type Selection */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Destinataires
            </h4>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <Checkbox
                  checked={sendToStudents}
                  onCheckedChange={(checked) => setSendToStudents(checked === true)}
                  className="h-5 w-5"
                />
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Étudiants</span>
                  <Badge variant="secondary" className="text-xs">
                    {stats.withStudentEmail} emails
                  </Badge>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <Checkbox
                  checked={sendToParents}
                  onCheckedChange={(checked) => setSendToParents(checked === true)}
                  className="h-5 w-5"
                />
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium">Parents/Tuteurs</span>
                  <Badge variant="secondary" className="text-xs">
                    {stats.withParentEmail} emails
                  </Badge>
                </div>
              </label>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
              <Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">{stats.totalSelected}</p>
              <p className="text-xs text-muted-foreground">Étudiants sélectionnés</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-center">
              <Mail className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-600">{stats.totalEmails}</p>
              <p className="text-xs text-muted-foreground">Emails à envoyer</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-600">
                {students.reduce((sum, s) => sum + s.missingDocuments.length, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Documents manquants</p>
            </div>
          </div>

          <Separator />

          {/* Student List */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Sélectionner les étudiants</h4>
              <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs">
                {selectedStudents.size === students.length ? "Désélectionner tout" : "Tout sélectionner"}
              </Button>
            </div>
            <ScrollArea className="h-[200px] rounded-md border">
              <div className="p-2 space-y-1">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                      selectedStudents.has(student.id) 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{student.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.className}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {student.email && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <GraduationCap className="h-3 w-3" />
                          Email
                        </Badge>
                      )}
                      {student.tutorEmail && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <UserCircle className="h-3 w-3" />
                          Tuteur
                        </Badge>
                      )}
                      <Badge variant="destructive" className="text-xs">
                        {student.missingDocuments.length} manquant(s)
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Warning if no valid emails */}
          {stats.totalEmails === 0 && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>Aucun destinataire avec une adresse email valide. Veuillez sélectionner des étudiants avec email.</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || stats.totalEmails === 0}
            className="gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Envoyer ({stats.totalEmails} email{stats.totalEmails > 1 ? 's' : ''})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

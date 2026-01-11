import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileCheck,
  FileX,
  Clock,
  Save,
  Loader2,
  User,
  GraduationCap,
  Mail,
  CreditCard,
} from "lucide-react";
import {
  useAdministrativeDocuments,
  AdministrativeDocumentType,
  StudentWithDocuments,
} from "@/hooks/useAdministrativeDocuments";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface StudentDocumentDialogProps {
  student: StudentWithDocuments;
  documentTypes: AdministrativeDocumentType[];
  schoolId: string;
  canEdit?: boolean;
  onClose: () => void;
}

export function StudentDocumentDialog({
  student,
  documentTypes,
  schoolId,
  canEdit = true,
  onClose,
}: StudentDocumentDialogProps) {
  const { updateStudentDocument, bulkUpdateStudentDocuments } = useAdministrativeDocuments(schoolId);
  
  // Local state for document changes
  const [changes, setChanges] = useState<Record<string, 'missing' | 'acquired' | 'pending'>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Get applicable document types for this student
  const applicableDocTypes = documentTypes.filter((dt) => {
    if (dt.cycle_id !== student.cycle_id) return false;
    if (dt.year_level && student.year_level && student.year_level < dt.year_level) {
      return false;
    }
    return true;
  });

  // Get current status (from changes or original)
  const getStatus = (docTypeId: string): 'missing' | 'acquired' | 'pending' => {
    if (changes[docTypeId]) return changes[docTypeId];
    const doc = student.documents.find((d) => d.documentTypeId === docTypeId);
    return doc?.status || 'missing';
  };

  const toggleDocument = (docTypeId: string) => {
    const currentStatus = getStatus(docTypeId);
    const newStatus = currentStatus === 'acquired' ? 'missing' : 'acquired';
    setChanges((prev) => ({ ...prev, [docTypeId]: newStatus }));
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const updates = Object.entries(changes).map(([docTypeId, status]) => ({
        student_id: student.id,
        document_type_id: docTypeId,
        status,
      }));

      await bulkUpdateStudentDocuments.mutateAsync(updates);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Object.keys(changes).length > 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Documents de {student.firstname} {student.lastname}
          </DialogTitle>
          <DialogDescription>
            Gérez les documents administratifs de cet étudiant
          </DialogDescription>
        </DialogHeader>

        {/* Student Info */}
        <div className="flex flex-wrap gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span>{student.class_name}</span>
          </div>
          {student.cin_number && (
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>{student.cin_number}</span>
            </div>
          )}
          {student.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{student.email}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Documents List */}
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-2">
            {applicableDocTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun document requis pour ce cycle</p>
              </div>
            ) : (
              applicableDocTypes.map((docType) => {
                const status = getStatus(docType.id);
                const originalDoc = student.documents.find(
                  (d) => d.documentTypeId === docType.id
                );
                const hasChanged = changes[docType.id] !== undefined;

                return (
                  <div
                    key={docType.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      status === 'acquired'
                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                        : 'bg-background hover:bg-muted/50'
                    } ${hasChanged ? 'ring-2 ring-primary/50' : ''}`}
                  >
                    {canEdit ? (
                      <Checkbox
                        id={docType.id}
                        checked={status === 'acquired'}
                        onCheckedChange={() => toggleDocument(docType.id)}
                      />
                    ) : (
                      <div className="w-5 h-5 flex items-center justify-center">
                        {status === 'acquired' ? (
                          <FileCheck className="h-4 w-4 text-emerald-600" />
                        ) : status === 'pending' ? (
                          <Clock className="h-4 w-4 text-amber-600" />
                        ) : (
                          <FileX className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={docType.id}
                        className={`font-medium cursor-pointer ${
                          status === 'acquired' ? 'text-emerald-700 dark:text-emerald-400' : ''
                        }`}
                      >
                        {docType.name}
                      </Label>
                      {docType.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {docType.description}
                        </p>
                      )}
                      {originalDoc?.acquiredAt && status === 'acquired' && !hasChanged && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          Acquis le{" "}
                          {format(new Date(originalDoc.acquiredAt), "d MMMM yyyy", {
                            locale: fr,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {docType.year_level && (
                        <Badge variant="outline" className="text-xs">
                          Année {docType.year_level}+
                        </Badge>
                      )}
                      {docType.is_required && (
                        <Badge variant="secondary" className="text-xs">
                          Requis
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {student.totalAcquired}/{student.totalRequired} documents acquis
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {hasChanges ? "Annuler" : "Fermer"}
            </Button>
            {canEdit && hasChanges && (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

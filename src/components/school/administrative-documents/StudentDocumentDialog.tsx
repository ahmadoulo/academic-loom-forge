import { useState, useMemo } from "react";
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
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
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
  const { bulkUpdateStudentDocuments } = useAdministrativeDocuments(schoolId);
  
  // Local state for document changes
  const [changes, setChanges] = useState<Record<string, 'missing' | 'acquired' | 'pending'>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Get applicable document types for this student based on their cycle and year level
  const applicableDocTypes = useMemo(() => {
    if (!student.cycle_id) return [];
    
    return documentTypes.filter((dt) => {
      // Must match cycle
      if (dt.cycle_id !== student.cycle_id) return false;
      // If document specifies a year_level, student must be at or above that level
      if (dt.year_level && student.year_level && student.year_level < dt.year_level) {
        return false;
      }
      return true;
    });
  }, [documentTypes, student.cycle_id, student.year_level]);

  // Get current status (from changes or from student's documents)
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
    } catch (error) {
      console.error("Error saving documents:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Mark all as acquired
  const markAllAcquired = () => {
    const newChanges: Record<string, 'acquired'> = {};
    applicableDocTypes.forEach((dt) => {
      if (getStatus(dt.id) !== 'acquired') {
        newChanges[dt.id] = 'acquired';
      }
    });
    setChanges((prev) => ({ ...prev, ...newChanges }));
  };

  // Mark all as missing  
  const markAllMissing = () => {
    const newChanges: Record<string, 'missing'> = {};
    applicableDocTypes.forEach((dt) => {
      if (getStatus(dt.id) !== 'missing') {
        newChanges[dt.id] = 'missing';
      }
    });
    setChanges((prev) => ({ ...prev, ...newChanges }));
  };

  const hasChanges = Object.keys(changes).length > 0;

  // Calculate counts with changes applied
  const currentCounts = useMemo(() => {
    let acquired = 0;
    let missing = 0;
    let pending = 0;

    applicableDocTypes.forEach((dt) => {
      const status = getStatus(dt.id);
      if (status === 'acquired') acquired++;
      else if (status === 'missing') missing++;
      else pending++;
    });

    return { acquired, missing, pending, total: applicableDocTypes.length };
  }, [applicableDocTypes, changes, student.documents]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
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
            <span className="font-medium">{student.class_name}</span>
            {student.year_level && (
              <Badge variant="outline" className="ml-1">
                Année {student.year_level}
              </Badge>
            )}
          </div>
          {student.cycle_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>•</span>
              <span>{student.cycle_name}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {student.cin_number && (
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              <span>{student.cin_number}</span>
            </div>
          )}
          {student.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              <span>{student.email}</span>
            </div>
          )}
          {student.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              <span>{student.phone}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Quick Actions */}
        {canEdit && applicableDocTypes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Actions rapides:</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAcquired}
              className="gap-1 text-xs h-7"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Tout acquis
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllMissing}
              className="gap-1 text-xs h-7"
            >
              <XCircle className="h-3 w-3 text-destructive" />
              Tout manquant
            </Button>
          </div>
        )}

        {/* Documents List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 py-2">
            {applicableDocTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Aucun document requis</p>
                <p className="text-sm mt-1">
                  {!student.cycle_id 
                    ? "La classe de cet étudiant n'a pas de cycle configuré"
                    : "Aucun type de document n'est défini pour ce cycle"
                  }
                </p>
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
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      status === 'acquired'
                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                        : status === 'pending'
                        ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                        : 'bg-background hover:bg-muted/50'
                    } ${hasChanged ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                  >
                    {canEdit ? (
                      <Checkbox
                        id={docType.id}
                        checked={status === 'acquired'}
                        onCheckedChange={() => toggleDocument(docType.id)}
                        className="mt-0.5"
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
                        className={`font-medium cursor-pointer block ${
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
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {docType.year_level && (
                        <Badge variant="outline" className="text-xs">
                          A{docType.year_level}+
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
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">{currentCounts.acquired}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileX className="h-4 w-4 text-muted-foreground" />
              <span>{currentCounts.missing}</span>
            </div>
            <span className="text-muted-foreground">/ {currentCounts.total} documents</span>
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

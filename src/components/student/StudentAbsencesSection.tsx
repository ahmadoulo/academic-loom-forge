import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Calendar, Clock, FileText, Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Absence {
  id: string;
  date: string;
  status: string;
  is_justified: boolean;
  justification_status: string | null;
  justification_comment: string | null;
  justification_file_path: string | null;
  justification_submitted_at: string | null;
  justification_rejection_reason: string | null;
  subjects?: { id: string; name: string } | null;
  assignments?: { id: string; title: string; start_time: string; end_time: string } | null;
}

interface StudentAbsencesSectionProps {
  studentId: string;
  classId?: string;
}

export function StudentAbsencesSection({ studentId, classId }: StudentAbsencesSectionProps) {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [justifyDialogOpen, setJustifyDialogOpen] = useState(false);
  const [justificationComment, setJustificationComment] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAbsences();
  }, [studentId]);

  const fetchAbsences = async () => {
    try {
      setLoading(true);
      // Fetch absences (status = 'absent') and justified absences (status = 'justified')
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          date,
          status,
          is_justified,
          justification_status,
          justification_comment,
          justification_file_path,
          justification_submitted_at,
          justification_rejection_reason,
          subjects(id, name),
          assignments(id, title, start_time, end_time)
        `)
        .eq("student_id", studentId)
        .in("status", ["absent", "justified"])
        .order("date", { ascending: false });

      if (error) throw error;
      setAbsences((data || []) as unknown as Absence[]);
    } catch (error) {
      console.error("Error fetching absences:", error);
      toast.error("Erreur lors du chargement des absences");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Le fichier ne doit pas dépasser 2 Mo");
        e.target.value = "";
        return;
      }
      // Check file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Format de fichier non autorisé. Utilisez JPG, PNG, GIF ou PDF");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitJustification = async () => {
    if (!selectedAbsence || !justificationComment.trim()) {
      toast.error("Veuillez saisir un commentaire");
      return;
    }

    setSubmitting(true);
    try {
      let filePath: string | null = null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `justifications/${studentId}/${selectedAbsence.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("school-document")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;
        filePath = fileName;
      }

      // Update attendance record
      const { error } = await supabase
        .from("attendance")
        .update({
          justification_comment: justificationComment.trim(),
          justification_file_path: filePath,
          justification_submitted_at: new Date().toISOString(),
          justification_status: "pending",
        })
        .eq("id", selectedAbsence.id);

      if (error) throw error;

      toast.success("Justificatif soumis avec succès");
      setJustifyDialogOpen(false);
      setJustificationComment("");
      setSelectedFile(null);
      setSelectedAbsence(null);
      fetchAbsences();
    } catch (error) {
      console.error("Error submitting justification:", error);
      toast.error("Erreur lors de la soumission du justificatif");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (absence: Absence) => {
    // Check if status is justified or is_justified is true
    if (absence.status === "justified" || absence.is_justified) {
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle className="h-3 w-3 mr-1" />
          Justifiée
        </Badge>
      );
    }

    // Only show pending/rejected if a justification was actually submitted
    if (absence.justification_submitted_at) {
      switch (absence.justification_status) {
        case "pending":
          return (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              <Clock className="h-3 w-3 mr-1" />
              En attente de validation
            </Badge>
          );
        case "rejected":
          return (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Refusée
            </Badge>
          );
      }
    }

    // Default: absence not justified and no justification submitted
    return (
      <Badge variant="outline" className="text-destructive border-destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Non justifiée
      </Badge>
    );
  };

  const canJustify = (absence: Absence) => {
    // Can only justify if not already justified and no pending justification submitted
    return absence.status !== "justified" && 
           !absence.is_justified && 
           (!absence.justification_submitted_at || absence.justification_status === "rejected");
  };

  // Count only non-justified absences
  const unjustifiedCount = absences.filter(a => 
    a.status === "absent" && !a.is_justified
  ).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Mes Absences
            <div className="ml-auto flex gap-2">
              {unjustifiedCount > 0 && (
                <Badge variant="destructive">
                  {unjustifiedCount} non justifiée{unjustifiedCount > 1 ? "s" : ""}
                </Badge>
              )}
              <Badge variant="outline">
                {absences.length} total
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {absences.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-success opacity-50" />
              <p className="font-medium">Aucune absence enregistrée</p>
              <p className="text-sm">Vous n'avez aucune absence à ce jour</p>
            </div>
          ) : (
            <div className="space-y-3">
              {absences.map((absence) => (
                <div
                  key={absence.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(absence.date), "EEEE d MMMM yyyy", { locale: fr })}
                      </span>
                      {getStatusBadge(absence)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {absence.subjects && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {absence.subjects.name}
                        </span>
                      )}
                      {absence.assignments && absence.assignments.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {absence.assignments.start_time?.slice(0, 5)} - {absence.assignments.end_time?.slice(0, 5)}
                        </span>
                      )}
                    </div>
                    {absence.justification_status === "rejected" && absence.justification_rejection_reason && (
                      <p className="text-sm text-destructive mt-2 p-2 bg-destructive/10 rounded">
                        <strong>Motif de refus:</strong> {absence.justification_rejection_reason}
                      </p>
                    )}
                  </div>
                  <div>
                    {canJustify(absence) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAbsence(absence);
                          setJustifyDialogOpen(true);
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Justifier
                      </Button>
                    )}
                    {absence.justification_submitted_at && absence.justification_status === "pending" && (
                      <span className="text-sm text-muted-foreground italic">
                        Justificatif en cours de traitement
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={justifyDialogOpen} onOpenChange={setJustifyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Justifier mon absence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAbsence && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">
                  {format(new Date(selectedAbsence.date), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
                {selectedAbsence.subjects && (
                  <p className="text-muted-foreground">{selectedAbsence.subjects.name}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="comment">Commentaire *</Label>
              <Textarea
                id="comment"
                placeholder="Expliquez la raison de votre absence..."
                value={justificationComment}
                onChange={(e) => setJustificationComment(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Document justificatif (optionnel)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedFile ? selectedFile.name : "Cliquez pour ajouter un fichier"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, JPG, PNG ou GIF (max 2 Mo)
                  </span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setJustifyDialogOpen(false);
                setJustificationComment("");
                setSelectedFile(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitJustification}
              disabled={submitting || !justificationComment.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Soumettre"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
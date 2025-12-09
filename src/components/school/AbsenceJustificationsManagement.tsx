import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Calendar, CheckCircle, XCircle, Clock, FileText, Eye, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useClassesByYear } from "@/hooks/useClassesByYear";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useHybridAuth } from "@/hooks/useHybridAuth";

interface JustificationRequest {
  id: string;
  date: string;
  is_justified: boolean;
  justification_status: string | null;
  justification_comment: string | null;
  justification_file_path: string | null;
  justification_submitted_at: string | null;
  students: {
    id: string;
    firstname: string;
    lastname: string;
  };
  subjects?: { id: string; name: string } | null;
  classes?: { id: string; name: string } | null;
}

interface AbsenceJustificationsManagementProps {
  schoolId: string;
}

export function AbsenceJustificationsManagement({ schoolId }: AbsenceJustificationsManagementProps) {
  const [justifications, setJustifications] = useState<JustificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<JustificationRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  
  const { selectedYear } = useAcademicYear();
  const { classes } = useClassesByYear(schoolId, selectedYear?.id);
  const { user } = useHybridAuth();

  useEffect(() => {
    fetchJustifications();
  }, [schoolId, selectedClass, activeTab]);

  const fetchJustifications = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("attendance")
        .select(`
          id,
          date,
          is_justified,
          justification_status,
          justification_comment,
          justification_file_path,
          justification_submitted_at,
          students!inner(id, firstname, lastname),
          subjects(id, name),
          class_id
        `)
        .eq("status", "absent")
        .not("justification_submitted_at", "is", null)
        .order("justification_submitted_at", { ascending: false });

      // Filter by status based on active tab
      if (activeTab === "pending") {
        query = query.eq("justification_status", "pending");
      } else if (activeTab === "approved") {
        query = query.eq("is_justified", true);
      } else if (activeTab === "rejected") {
        query = query.eq("justification_status", "rejected");
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get class info for each record
      let filteredData = data || [];
      
      if (selectedClass !== "all") {
        filteredData = filteredData.filter((item: any) => item.class_id === selectedClass);
      }

      // Get class names
      const enrichedData = await Promise.all(
        filteredData.map(async (item: any) => {
          const classData = classes.find(c => c.id === item.class_id);
          return {
            ...item,
            classes: classData ? { id: classData.id, name: classData.name } : null,
          };
        })
      );

      setJustifications(enrichedData as unknown as JustificationRequest[]);
    } catch (error) {
      console.error("Error fetching justifications:", error);
      toast.error("Erreur lors du chargement des justificatifs");
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("school-document")
        .createSignedUrl(filePath, 3600); // 1 hour validity

      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Error getting file URL:", error);
      toast.error("Erreur lors de l'ouverture du fichier");
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      // Update attendance: set status to 'justified', is_justified to true
      const { error } = await supabase
        .from("attendance")
        .update({
          status: "justified", // Change status from 'absent' to 'justified'
          is_justified: true,
          justification_status: "approved",
          justification_reviewed_at: new Date().toISOString(),
          justification_reviewed_by: user?.id,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast.success("Justificatif approuvé - Absence marquée comme justifiée");
      setReviewDialogOpen(false);
      setSelectedRequest(null);
      fetchJustifications();
    } catch (error) {
      console.error("Error approving justification:", error);
      toast.error("Erreur lors de l'approbation");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    if (!rejectionReason.trim()) {
      toast.error("Veuillez saisir un motif de refus");
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("attendance")
        .update({
          is_justified: false,
          justification_status: "rejected",
          justification_rejection_reason: rejectionReason.trim(),
          justification_reviewed_at: new Date().toISOString(),
          justification_reviewed_by: user?.id,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast.success("Justificatif refusé");
      setReviewDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchJustifications();
    } catch (error) {
      console.error("Error rejecting justification:", error);
      toast.error("Erreur lors du refus");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (request: JustificationRequest) => {
    if (request.is_justified) {
      return <Badge className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>;
    }
    if (request.justification_status === "rejected") {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Refusé</Badge>;
    }
    return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
  };

  const pendingCount = justifications.filter(j => j.justification_status === "pending").length;

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Gestion des Justificatifs d'Absence
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-auto">{pendingCount} en attente</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-64">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                En attente
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approuvés
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Refusés
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : justifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun justificatif {activeTab === "pending" ? "en attente" : activeTab === "approved" ? "approuvé" : "refusé"}</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Étudiant</TableHead>
                        <TableHead>Classe</TableHead>
                        <TableHead>Date d'absence</TableHead>
                        <TableHead>Matière</TableHead>
                        <TableHead>Soumis le</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {justifications.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.students.lastname} {request.students.firstname}
                          </TableCell>
                          <TableCell>{request.classes?.name || "-"}</TableCell>
                          <TableCell>
                            {format(new Date(request.date), "dd/MM/yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell>{request.subjects?.name || "-"}</TableCell>
                          <TableCell>
                            {request.justification_submitted_at 
                              ? format(new Date(request.justification_submitted_at), "dd/MM/yyyy HH:mm", { locale: fr })
                              : "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(request)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setReviewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Voir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du justificatif</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Étudiant</Label>
                  <p className="font-medium">{selectedRequest.students.lastname} {selectedRequest.students.firstname}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Classe</Label>
                  <p className="font-medium">{selectedRequest.classes?.name || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date d'absence</Label>
                  <p className="font-medium">{format(new Date(selectedRequest.date), "EEEE d MMMM yyyy", { locale: fr })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Matière</Label>
                  <p className="font-medium">{selectedRequest.subjects?.name || "-"}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Commentaire de l'étudiant</Label>
                <p className="mt-1 p-3 bg-muted rounded-lg text-sm">{selectedRequest.justification_comment}</p>
              </div>

              {selectedRequest.justification_file_path && (
                <div>
                  <Label className="text-muted-foreground">Document justificatif</Label>
                  <Button
                    variant="outline"
                    className="mt-1 w-full"
                    onClick={() => handleViewFile(selectedRequest.justification_file_path!)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir le document
                  </Button>
                </div>
              )}

              {activeTab === "pending" && (
                <div>
                  <Label htmlFor="rejection-reason">Motif de refus (si refus)</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Saisissez le motif de refus..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Fermer
            </Button>
            {activeTab === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Refuser
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="bg-success hover:bg-success/90"
                >
                  {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approuver
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
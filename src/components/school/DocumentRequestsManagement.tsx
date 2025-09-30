import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Edit, History } from "lucide-react";
import { useDocumentRequests } from "@/hooks/useDocumentRequests";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentRequestsManagementProps {
  schoolId: string;
}

const DOCUMENT_TYPES = {
  certificat_scolarite: 'Certificat de scolarité',
  releve_notes: 'Relevé de notes',
  attestation_reussite: 'Attestation de réussite',
  attestation_inscription: 'Attestation d\'inscription',
  autre: 'Autre document',
};

const STATUS_CONFIG = {
  pending: { label: 'En attente', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  in_progress: { label: 'En cours', icon: AlertCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { label: 'Complété', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  rejected: { label: 'Rejeté', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

export const DocumentRequestsManagement = ({ schoolId }: DocumentRequestsManagementProps) => {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { requests, tracking, loading, updateRequestStatus, fetchTracking } = useDocumentRequests(schoolId);

  const handleUpdateStatus = async () => {
    if (!selectedRequest || !newStatus) return;

    await updateRequestStatus(selectedRequest, newStatus, comment.trim() || undefined);
    setShowUpdateDialog(false);
    setSelectedRequest(null);
    setNewStatus('');
    setComment('');
  };

  const handleViewTracking = async (requestId: string) => {
    setSelectedRequest(requestId);
    await fetchTracking(requestId);
    setShowTrackingDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRequests = requests.filter(request => {
    const studentName = `${request.students?.firstname} ${request.students?.lastname}`.toLowerCase();
    const docType = DOCUMENT_TYPES[request.document_type as keyof typeof DOCUMENT_TYPES]?.toLowerCase() || '';
    return studentName.includes(searchTerm.toLowerCase()) || docType.includes(searchTerm.toLowerCase());
  });

  const requestsByStatus = {
    pending: filteredRequests.filter(r => r.status === 'pending'),
    in_progress: filteredRequests.filter(r => r.status === 'in_progress'),
    completed: filteredRequests.filter(r => r.status === 'completed'),
    rejected: filteredRequests.filter(r => r.status === 'rejected'),
  };

  const renderRequestCard = (request: any) => {
    const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    const StatusIcon = statusConfig.icon;
    const docType = DOCUMENT_TYPES[request.document_type as keyof typeof DOCUMENT_TYPES] || request.document_type;

    return (
      <div key={request.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">{docType}</h3>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Étudiant: {request.students?.firstname} {request.students?.lastname}
            </p>
            {request.students?.email && (
              <p className="text-xs text-muted-foreground mb-1">{request.students.email}</p>
            )}
            {request.reason && (
              <p className="text-sm text-muted-foreground mb-2 italic">"{request.reason}"</p>
            )}
            <p className="text-xs text-muted-foreground">
              Demandé le {formatDate(request.created_at)}
            </p>
          </div>
          <Badge className={`${statusConfig.bgColor} ${statusConfig.color} flex items-center gap-1`}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Dialog open={showUpdateDialog && selectedRequest === request.id} onOpenChange={(open) => {
            if (!open) {
              setShowUpdateDialog(false);
              setSelectedRequest(null);
              setNewStatus('');
              setComment('');
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  setSelectedRequest(request.id);
                  setNewStatus(request.status);
                  setShowUpdateDialog(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Mettre à jour
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mettre à jour la demande</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nouveau statut</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Complété</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Commentaire (optionnel)</Label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ajoutez un commentaire sur cette mise à jour..."
                    rows={3}
                  />
                </div>

                <Button onClick={handleUpdateStatus} className="w-full">
                  Enregistrer
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showTrackingDialog && selectedRequest === request.id} onOpenChange={(open) => {
            if (!open) {
              setShowTrackingDialog(false);
              setSelectedRequest(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                onClick={() => handleViewTracking(request.id)}
              >
                <History className="h-4 w-4 mr-2" />
                Historique
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Historique de la demande</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {tracking.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Aucun historique disponible</p>
                ) : (
                  <div className="space-y-3">
                    {tracking.map((track, index) => {
                      const trackStatusConfig = STATUS_CONFIG[track.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                      const TrackIcon = trackStatusConfig.icon;
                      
                      return (
                        <div key={track.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`h-8 w-8 rounded-full ${trackStatusConfig.bgColor} flex items-center justify-center`}>
                              <TrackIcon className={`h-4 w-4 ${trackStatusConfig.color}`} />
                            </div>
                            {index < tracking.length - 1 && (
                              <div className="w-0.5 h-12 bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`${trackStatusConfig.bgColor} ${trackStatusConfig.color}`}>
                                {trackStatusConfig.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(track.created_at)}
                              </span>
                            </div>
                            {track.comment && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {track.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Demandes de Documents Administratifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="search">Rechercher</Label>
            <Input
              id="search"
              placeholder="Rechercher par nom d'étudiant ou type de document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2"
            />
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune demande trouvée
            </p>
          ) : (
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  En attente
                  {requestsByStatus.pending.length > 0 && (
                    <Badge variant="secondary">{requestsByStatus.pending.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="in_progress" className="flex items-center gap-2">
                  En cours
                  {requestsByStatus.in_progress.length > 0 && (
                    <Badge variant="secondary">{requestsByStatus.in_progress.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  Complété
                  {requestsByStatus.completed.length > 0 && (
                    <Badge variant="secondary">{requestsByStatus.completed.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rejected" className="flex items-center gap-2">
                  Rejeté
                  {requestsByStatus.rejected.length > 0 && (
                    <Badge variant="secondary">{requestsByStatus.rejected.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-6">
                {requestsByStatus.pending.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune demande en attente</p>
                ) : (
                  requestsByStatus.pending.map(renderRequestCard)
                )}
              </TabsContent>

              <TabsContent value="in_progress" className="space-y-4 mt-6">
                {requestsByStatus.in_progress.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune demande en cours</p>
                ) : (
                  requestsByStatus.in_progress.map(renderRequestCard)
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 mt-6">
                {requestsByStatus.completed.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune demande complétée</p>
                ) : (
                  requestsByStatus.completed.map(renderRequestCard)
                )}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4 mt-6">
                {requestsByStatus.rejected.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune demande rejetée</p>
                ) : (
                  requestsByStatus.rejected.map(renderRequestCard)
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

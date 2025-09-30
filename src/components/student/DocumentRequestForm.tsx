import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Send, History, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDocumentRequests } from "@/hooks/useDocumentRequests";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface DocumentRequestFormProps {
  studentId: string;
  schoolId: string;
}

const DOCUMENT_TYPES = [
  { value: 'certificat_scolarite', label: 'Certificat de scolarité' },
  { value: 'releve_notes', label: 'Relevé de notes' },
  { value: 'attestation_reussite', label: 'Attestation de réussite' },
  { value: 'attestation_inscription', label: 'Attestation d\'inscription' },
  { value: 'autre', label: 'Autre document' },
];

const STATUS_CONFIG = {
  pending: { label: 'En attente', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  in_progress: { label: 'En cours', icon: AlertCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { label: 'Complété', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  rejected: { label: 'Rejeté', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

export const DocumentRequestForm = ({ studentId, schoolId }: DocumentRequestFormProps) => {
  const [documentType, setDocumentType] = useState('');
  const [reason, setReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showTracking, setShowTracking] = useState(false);

  const { requests, tracking, loading, createRequest, fetchTracking } = useDocumentRequests(schoolId, studentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentType) {
      return;
    }

    await createRequest({
      school_id: schoolId,
      student_id: studentId,
      document_type: documentType,
      reason: reason.trim() || undefined,
    });

    // Reset form
    setDocumentType('');
    setReason('');
  };

  const handleViewTracking = async (requestId: string) => {
    setSelectedRequest(requestId);
    await fetchTracking(requestId);
    setShowTracking(true);
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

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Demande de Document Administratif
          </CardTitle>
          <CardDescription>
            Remplissez le formulaire pour demander un document officiel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">Type de document *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Sélectionnez un type de document" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motif de la demande (optionnel)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez pourquoi vous avez besoin de ce document..."
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={!documentType}>
              <Send className="h-4 w-4 mr-2" />
              Envoyer la demande
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Historique de mes demandes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Vous n'avez pas encore fait de demande
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;
                const docType = DOCUMENT_TYPES.find(t => t.value === request.document_type);

                return (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold">{docType?.label || request.document_type}</h3>
                        </div>
                        {request.reason && (
                          <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
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

                    <Separator />

                    <Dialog open={showTracking && selectedRequest === request.id} onOpenChange={(open) => {
                      if (!open) {
                        setShowTracking(false);
                        setSelectedRequest(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleViewTracking(request.id)}
                        >
                          <History className="h-4 w-4 mr-2" />
                          Voir le suivi
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Suivi de la demande</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {tracking.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">Aucun suivi disponible</p>
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import { useState } from 'react';
import { useAdmissions } from '@/hooks/useAdmissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Eye, Trash2, Check, X, UserPlus, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AdmissionDetailDialog } from './AdmissionDetailDialog';
import { ConvertToStudentDialog } from './ConvertToStudentDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AdmissionsManagementProps {
  schoolId: string;
  schoolIdentifier: string;
  canManage?: boolean;
  canConvert?: boolean;
  canDelete?: boolean;
}

export function AdmissionsManagement({ 
  schoolId, 
  schoolIdentifier, 
  canManage = true, 
  canConvert = true, 
  canDelete = true 
}: AdmissionsManagementProps) {
  const { admissions, loading, updateAdmissionStatus, deleteAdmission } = useAdmissions(schoolId);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [admissionToDelete, setAdmissionToDelete] = useState<string | null>(null);
  const [refuseDialogOpen, setRefuseDialogOpen] = useState(false);
  const [admissionToRefuse, setAdmissionToRefuse] = useState<any>(null);
  const [refuseReason, setRefuseReason] = useState('');

  const publicFormUrl = `${window.location.origin}/school/${schoolIdentifier}/admission`;

  const nouveauAdmissions = admissions.filter(a => a.status === 'nouveau');
  const enCoursAdmissions = admissions.filter(a => a.status === 'en_cours');
  const traiteAdmissions = admissions.filter(a => a.status === 'traite');
  const refuseAdmissions = admissions.filter(a => a.status === 'refuse');

  const handleViewDetails = (admission: any) => {
    setSelectedAdmission(admission);
    setDetailDialogOpen(true);
  };

  const handleConvert = (admission: any) => {
    setSelectedAdmission(admission);
    setConvertDialogOpen(true);
  };

  const handleDelete = (admission: any) => {
    // Protection: ne pas supprimer les admissions traitées, en cours ou refusées
    if (admission.status === 'traite' || admission.status === 'en_cours' || admission.status === 'refuse' || admission.converted_to_student_id) {
      return;
    }
    setAdmissionToDelete(admission.id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (admissionToDelete) {
      await deleteAdmission(admissionToDelete);
      setDeleteDialogOpen(false);
      setAdmissionToDelete(null);
    }
  };

  const handleStatusChange = async (admissionId: string, newStatus: 'nouveau' | 'en_cours' | 'traite') => {
    await updateAdmissionStatus(admissionId, newStatus);
  };

  const handleRefuse = (admission: any) => {
    setAdmissionToRefuse(admission);
    setRefuseDialogOpen(true);
  };

  const confirmRefuse = async () => {
    if (!admissionToRefuse || !refuseReason.trim()) {
      return;
    }
    await updateAdmissionStatus(admissionToRefuse.id, 'refuse', refuseReason);
    setRefuseDialogOpen(false);
    setAdmissionToRefuse(null);
    setRefuseReason('');
  };

  const renderAdmissionCard = (admission: any) => (
    <Card key={admission.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {admission.civility} {admission.firstname} {admission.lastname}
            </CardTitle>
            <CardDescription>
              {admission.email} • {admission.phone}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {format(new Date(admission.created_at), 'dd MMM yyyy', { locale: fr })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Formation:</span>
            <p className="font-medium">{admission.cycles?.name}</p>
            {admission.options?.name && (
              <p className="text-sm text-muted-foreground">{admission.options.name}</p>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Ville:</span>
            <p className="font-medium">{admission.city}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Niveau:</span>
            <p className="font-medium">{admission.education_level}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Dernier établ.:</span>
            <p className="font-medium text-xs">{admission.last_institution}</p>
          </div>
        </div>

        {admission.notes && (
          <div className="pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              {admission.status === 'refuse' ? 'Motif du refus:' : 'Notes:'}
            </span>
            <p className="text-sm mt-1">{admission.notes}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(admission)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Détails
          </Button>

          {admission.status === 'nouveau' && canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(admission.id, 'en_cours')}
            >
              <Check className="h-4 w-4 mr-1" />
              En cours
            </Button>
          )}

          {admission.status === 'en_cours' && canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(admission.id, 'traite')}
              >
                <Check className="h-4 w-4 mr-1" />
                Traité
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRefuse(admission)}
              >
                <Ban className="h-4 w-4 mr-1" />
                Refuser
              </Button>
            </>
          )}

          {admission.status === 'traite' && !admission.converted_to_student_id && canConvert && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleConvert(admission)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Convertir
            </Button>
          )}

          {(admission.status === 'nouveau' && !admission.converted_to_student_id && canDelete) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(admission)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Admissions</h2>
          <p className="text-muted-foreground">
            Gérez les demandes d'admission des candidats
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.open(publicFormUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Formulaire Public
        </Button>
      </div>

      <Tabs defaultValue="nouveau" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nouveau">
            Nouvelles ({nouveauAdmissions.length})
          </TabsTrigger>
          <TabsTrigger value="en_cours">
            En cours ({enCoursAdmissions.length})
          </TabsTrigger>
          <TabsTrigger value="traite">
            Traité ({traiteAdmissions.length})
          </TabsTrigger>
          <TabsTrigger value="refuse">
            Refusé ({refuseAdmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nouveau" className="space-y-4 mt-6">
          {nouveauAdmissions.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Aucune nouvelle demande
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {nouveauAdmissions.map(renderAdmissionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="en_cours" className="space-y-4 mt-6">
          {enCoursAdmissions.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Aucune demande en cours de traitement
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {enCoursAdmissions.map(renderAdmissionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="traite" className="space-y-4 mt-6">
          {traiteAdmissions.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Aucune demande traitée
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {traiteAdmissions.map(renderAdmissionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="refuse" className="space-y-4 mt-6">
          {refuseAdmissions.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Aucune demande refusée
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {refuseAdmissions.map(renderAdmissionCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedAdmission && (
        <>
          <AdmissionDetailDialog
            admission={selectedAdmission}
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
          />
          <ConvertToStudentDialog
            admission={selectedAdmission}
            schoolId={schoolId}
            open={convertDialogOpen}
            onOpenChange={setConvertDialogOpen}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la demande?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La demande d'admission sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={refuseDialogOpen} onOpenChange={setRefuseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la demande d'admission</DialogTitle>
            <DialogDescription>
              Veuillez indiquer le motif du refus. Cette information sera enregistrée.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="refuseReason">Motif du refus *</Label>
              <Textarea
                id="refuseReason"
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
                placeholder="Expliquez la raison du refus..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefuseDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRefuse}
              disabled={!refuseReason.trim()}
            >
              Refuser l'admission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

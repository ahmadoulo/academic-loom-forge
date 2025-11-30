import { useState } from 'react';
import { useAdmissions } from '@/hooks/useAdmissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Eye, Trash2, Check, X, UserPlus } from 'lucide-react';
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

interface AdmissionsManagementProps {
  schoolId: string;
  schoolIdentifier: string;
}

export function AdmissionsManagement({ schoolId, schoolIdentifier }: AdmissionsManagementProps) {
  const { admissions, loading, updateAdmissionStatus, deleteAdmission } = useAdmissions(schoolId);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [admissionToDelete, setAdmissionToDelete] = useState<string | null>(null);

  const publicFormUrl = `${window.location.origin}/school/${schoolIdentifier}/admission`;

  const nouveauAdmissions = admissions.filter(a => a.status === 'nouveau');
  const enCoursAdmissions = admissions.filter(a => a.status === 'en_cours');
  const traiteAdmissions = admissions.filter(a => a.status === 'traite');

  const handleViewDetails = (admission: any) => {
    setSelectedAdmission(admission);
    setDetailDialogOpen(true);
  };

  const handleConvert = (admission: any) => {
    setSelectedAdmission(admission);
    setConvertDialogOpen(true);
  };

  const handleDelete = (admissionId: string) => {
    setAdmissionToDelete(admissionId);
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
            <span className="text-sm text-muted-foreground">Notes:</span>
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

          {admission.status === 'nouveau' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(admission.id, 'en_cours')}
            >
              <Check className="h-4 w-4 mr-1" />
              En cours
            </Button>
          )}

          {admission.status === 'en_cours' && (
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
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(admission.id, 'nouveau')}
              >
                <X className="h-4 w-4 mr-1" />
                Nouveau
              </Button>
            </>
          )}

          {admission.status === 'traite' && !admission.converted_to_student_id && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleConvert(admission)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Convertir
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(admission.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nouveau">
            Nouvelles demandes ({nouveauAdmissions.length})
          </TabsTrigger>
          <TabsTrigger value="en_cours">
            En cours ({enCoursAdmissions.length})
          </TabsTrigger>
          <TabsTrigger value="traite">
            Traité ({traiteAdmissions.length})
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
    </div>
  );
}

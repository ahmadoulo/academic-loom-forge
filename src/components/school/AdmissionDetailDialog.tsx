import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AdmissionDetailDialogProps {
  admission: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdmissionDetailDialog({ admission, open, onOpenChange }: AdmissionDetailDialogProps) {
  if (!admission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de la demande d'admission</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div>
            <Badge variant={
              admission.status === 'nouveau' ? 'default' :
              admission.status === 'en_cours' ? 'secondary' : 'outline'
            }>
              {admission.status === 'nouveau' ? 'Nouvelle demande' :
               admission.status === 'en_cours' ? 'En cours de traitement' : 'Traité'}
            </Badge>
            {admission.converted_to_student_id && (
              <Badge variant="secondary" className="ml-2 bg-green-500 text-white">
                Converti en étudiant
              </Badge>
            )}
          </div>

          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Civilité</p>
                <p className="font-medium">{admission.civility}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prénom</p>
                <p className="font-medium">{admission.firstname}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="font-medium">{admission.lastname}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nationalité</p>
                <p className="font-medium">{admission.nationality}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ville</p>
                <p className="font-medium">{admission.city}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <p className="font-medium">{admission.phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{admission.email}</p>
              </div>
            </div>
          </div>

          {/* Formation Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Formation souhaitée</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cycle</p>
                <p className="font-medium">{admission.cycles?.name}</p>
              </div>
              {admission.options?.name && (
                <div>
                  <p className="text-sm text-muted-foreground">Option</p>
                  <p className="font-medium">{admission.options.name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Niveau d'études</p>
                <p className="font-medium">{admission.education_level}</p>
              </div>
            </div>
          </div>

          {/* Previous Institution */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Dernier établissement</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Établissement</p>
                <p className="font-medium">{admission.last_institution}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">
                  {admission.last_institution_type === 'public' ? 'Public' :
                   admission.last_institution_type === 'private' ? 'Privé' : 'Mission'}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {admission.notes && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Notes internes</h3>
              <p className="text-sm">{admission.notes}</p>
            </div>
          )}

          {/* Dates */}
          <div className="space-y-3 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date de demande</p>
                <p className="font-medium">
                  {format(new Date(admission.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
              {admission.converted_at && (
                <div>
                  <p className="text-muted-foreground">Date de conversion</p>
                  <p className="font-medium">
                    {format(new Date(admission.converted_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

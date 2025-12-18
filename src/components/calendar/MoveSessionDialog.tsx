import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MoveSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionTitle: string;
  originalDate: Date;
  newDate: Date;
  startTime?: string;
  endTime?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function MoveSessionDialog({
  open,
  onOpenChange,
  sessionTitle,
  originalDate,
  newDate,
  startTime,
  endTime,
  onConfirm,
  loading = false,
}: MoveSessionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Déplacer la séance
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-foreground font-medium text-base">
                {sessionTitle}
              </p>
              
              {startTime && endTime && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{startTime.slice(0, 5)} - {endTime.slice(0, 5)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <Badge variant="outline" className="mb-2">Actuelle</Badge>
                  <p className="font-semibold text-foreground">
                    {format(originalDate, "EEEE d", { locale: fr })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(originalDate, "MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                
                <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                
                <div className="text-center">
                  <Badge className="mb-2 bg-primary">Nouvelle</Badge>
                  <p className="font-semibold text-foreground">
                    {format(newDate, "EEEE d", { locale: fr })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(newDate, "MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Voulez-vous déplacer cette séance à la nouvelle date ?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? "Déplacement..." : "Confirmer le déplacement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

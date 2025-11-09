import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, Calendar, User, Clock } from "lucide-react";
import { useMemo } from "react";

interface ApproveRescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionTitle: string;
  originalDate: string;
  proposedDate: string;
  reason: string;
  teacherName?: string;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  loading?: boolean;
}

export function ApproveRescheduleDialog({
  open,
  onOpenChange,
  sessionTitle,
  originalDate,
  proposedDate,
  reason,
  teacherName,
  onApprove,
  onReject,
  loading,
}: ApproveRescheduleDialogProps) {
  // Parse reason to extract text and times if JSON
  const parsedReason = useMemo(() => {
    try {
      const parsed = JSON.parse(reason);
      return {
        text: parsed.reason || reason,
        startTime: parsed.proposedStartTime,
        endTime: parsed.proposedEndTime
      };
    } catch {
      return { text: reason };
    }
  }, [reason]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Demande de report de séance
          </DialogTitle>
          <DialogDescription>
            Un professeur souhaite reporter cette séance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-semibold mb-2">{sessionTitle}</h4>
            {teacherName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <User className="h-4 w-4" />
                <span>Professeur: {teacherName}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <div className="text-sm">
                  <span className="text-muted-foreground">Date actuelle: </span>
                  <span className="font-medium">
                    {format(new Date(originalDate), "EEEE dd MMMM yyyy", { locale: fr })}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Date proposée: </span>
                  <span className="font-medium text-primary">
                    {format(new Date(proposedDate), "EEEE dd MMMM yyyy", { locale: fr })}
                  </span>
                </div>
              </div>
            </div>

            {(parsedReason.startTime || parsedReason.endTime) && (
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  {parsedReason.startTime && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Heure de début proposée: </span>
                      <span className="font-medium text-primary">{parsedReason.startTime}</span>
                    </div>
                  )}
                  {parsedReason.endTime && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Heure de fin proposée: </span>
                      <span className="font-medium text-primary">{parsedReason.endTime}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Motif</label>
              <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                {parsedReason.text}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Fermer
          </Button>
          <Button
            variant="destructive"
            onClick={onReject}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Refuser
          </Button>
          <Button
            onClick={onApprove}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Validation..." : "Valider le report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
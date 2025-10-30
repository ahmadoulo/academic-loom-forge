import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RescheduleSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sessionTitle: string;
  currentDate: string;
  isTeacher: boolean;
  onReschedule: (data: {
    sessionId: string;
    reason: string;
    newDate?: Date;
  }) => Promise<void>;
}

export function RescheduleSessionDialog({
  open,
  onOpenChange,
  sessionId,
  sessionTitle,
  currentDate,
  isTeacher,
  onReschedule,
}: RescheduleSessionDialogProps) {
  const [reason, setReason] = useState("");
  const [newDate, setNewDate] = useState<Date>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setLoading(true);
    try {
      await onReschedule({
        sessionId,
        reason: reason.trim(),
        newDate,
      });
      setReason("");
      setNewDate(undefined);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reporter la séance</DialogTitle>
          <DialogDescription>
            {sessionTitle} - {format(new Date(currentDate), "dd MMMM yyyy", { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motif du report <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Expliquez la raison du report..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>
              {isTeacher ? "Proposer une nouvelle date (optionnel)" : "Nouvelle date (optionnel)"}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newDate ? format(newDate, "dd MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={setNewDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            {isTeacher && (
              <p className="text-sm text-muted-foreground">
                Si vous proposez une date, l'administration devra valider le changement.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || loading}
          >
            {loading ? "Enregistrement..." : "Reporter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
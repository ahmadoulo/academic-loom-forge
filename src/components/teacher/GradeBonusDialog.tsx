import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

interface GradeBonusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  currentGrade: number;
  currentBonus: number;
  onAddBonus: (bonus: number, reason: string) => Promise<void>;
}

export function GradeBonusDialog({
  open,
  onOpenChange,
  studentName,
  currentGrade,
  currentBonus,
  onAddBonus
}: GradeBonusDialogProps) {
  const [selectedBonus, setSelectedBonus] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bonusOptions = [1, 2, 3, 4, 5];

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Veuillez justifier le bonus');
      return;
    }

    if (reason.trim().length < 10) {
      toast.error('La justification doit contenir au moins 10 caractères');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddBonus(selectedBonus, reason.trim());
      setReason('');
      setSelectedBonus(1);
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding bonus:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Ajouter un Bonus
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Student Info */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Étudiant</p>
            <p className="font-medium">{studentName}</p>
          </div>

          {/* Current Grade */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Note actuelle</p>
              <p className="text-2xl font-bold">{currentGrade.toFixed(2)}</p>
            </div>
            {currentBonus > 0 && (
              <div className="ml-auto">
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3" />
                  Bonus actuel: +{currentBonus}
                </Badge>
              </div>
            )}
          </div>

          {/* Bonus Selection */}
          <div className="space-y-3">
            <Label>Sélectionnez le bonus</Label>
            <div className="flex gap-2">
              {bonusOptions.map((bonus) => (
                <button
                  key={bonus}
                  type="button"
                  onClick={() => setSelectedBonus(bonus)}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    selectedBonus === bonus
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl font-bold">+{bonus}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    → {(currentGrade + bonus).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-3">
            <Label htmlFor="reason">
              Justification du bonus <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Expliquez pourquoi cet étudiant mérite ce bonus (efforts, progression, participation...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 caractères • {reason.length}/500
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-2">Aperçu</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Note finale:</span>
              <span className="font-bold text-lg">
                {currentGrade.toFixed(2)} + {selectedBonus} = {(currentGrade + selectedBonus).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? 'Ajout...' : 'Ajouter le Bonus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

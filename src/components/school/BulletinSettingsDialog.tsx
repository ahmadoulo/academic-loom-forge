import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { BulletinSettings } from "@/hooks/useBulletinSettings";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BulletinSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: BulletinSettings | null;
  loading: boolean;
  onUpdate: (updates: Partial<Omit<BulletinSettings, 'id' | 'school_id'>>) => Promise<boolean>;
}

export const BulletinSettingsDialog = ({
  open,
  onOpenChange,
  settings,
  loading,
  onUpdate
}: BulletinSettingsDialogProps) => {
  const [localSettings, setLocalSettings] = React.useState<Partial<BulletinSettings>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (settings) {
      setLocalSettings({
        show_weighted_average: settings.show_weighted_average,
        show_ranking: settings.show_ranking,
        show_mention: settings.show_mention,
        show_decision: settings.show_decision,
        show_observations: settings.show_observations,
        custom_footer_text: settings.custom_footer_text
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const success = await onUpdate(localSettings);
    setSaving(false);
    
    if (success) {
      toast.success("Paramètres enregistrés");
      onOpenChange(false);
    } else {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (loading || !settings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            Paramètres du Bulletin
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Personnalisez l'affichage et le contenu des bulletins
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-4 sm:px-6">
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">Affichage</h4>
              
              <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-lg border bg-card">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <Label htmlFor="weighted" className="text-xs sm:text-sm">Moyenne pondérée</Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                    Calcul par coefficient
                  </p>
                </div>
                <Switch
                  id="weighted"
                  checked={localSettings.show_weighted_average}
                  onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_weighted_average: v }))}
                />
              </div>

              <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-lg border bg-card">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <Label htmlFor="ranking" className="text-xs sm:text-sm">Classement</Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Rang de l'étudiant
                  </p>
                </div>
                <Switch
                  id="ranking"
                  checked={localSettings.show_ranking}
                  onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_ranking: v }))}
                />
              </div>

              <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-lg border bg-card">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <Label htmlFor="mention" className="text-xs sm:text-sm">Mention</Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Très bien, Bien, Passable...
                  </p>
                </div>
                <Switch
                  id="mention"
                  checked={localSettings.show_mention}
                  onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_mention: v }))}
                />
              </div>

              <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-lg border bg-card">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <Label htmlFor="decision" className="text-xs sm:text-sm">Décision</Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Validé / Non validé
                  </p>
                </div>
                <Switch
                  id="decision"
                  checked={localSettings.show_decision}
                  onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_decision: v }))}
                />
              </div>

              <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-lg border bg-card">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <Label htmlFor="observations" className="text-xs sm:text-sm">Observations</Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Zone d'observations
                  </p>
                </div>
                <Switch
                  id="observations"
                  checked={localSettings.show_observations}
                  onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_observations: v }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pied de page</h4>
              <Textarea
                placeholder="Texte personnalisé..."
                value={localSettings.custom_footer_text || ''}
                onChange={(e) => setLocalSettings(s => ({ ...s, custom_footer_text: e.target.value }))}
                rows={2}
                className="text-xs sm:text-sm"
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 px-4 pb-4 sm:px-6 sm:pb-6 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

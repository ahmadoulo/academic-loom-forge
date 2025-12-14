import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { BulletinSettings } from "@/hooks/useBulletinSettings";

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
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres du Bulletin
          </DialogTitle>
          <DialogDescription>
            Personnalisez l'affichage et le contenu des bulletins de notes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Affichage</h4>
            
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="space-y-0.5">
                <Label htmlFor="weighted">Moyenne pondérée (Coefficient)</Label>
                <p className="text-xs text-muted-foreground">
                  Activer le calcul par coefficient pour les classes concernées
                </p>
              </div>
              <Switch
                id="weighted"
                checked={localSettings.show_weighted_average}
                onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_weighted_average: v }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="space-y-0.5">
                <Label htmlFor="ranking">Classement</Label>
                <p className="text-xs text-muted-foreground">
                  Afficher le rang de l'étudiant dans sa classe
                </p>
              </div>
              <Switch
                id="ranking"
                checked={localSettings.show_ranking}
                onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_ranking: v }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="space-y-0.5">
                <Label htmlFor="mention">Mention</Label>
                <p className="text-xs text-muted-foreground">
                  Afficher la mention (Très bien, Bien, Passable...)
                </p>
              </div>
              <Switch
                id="mention"
                checked={localSettings.show_mention}
                onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_mention: v }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="space-y-0.5">
                <Label htmlFor="decision">Décision</Label>
                <p className="text-xs text-muted-foreground">
                  Afficher la décision (Validé / Non validé)
                </p>
              </div>
              <Switch
                id="decision"
                checked={localSettings.show_decision}
                onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_decision: v }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="space-y-0.5">
                <Label htmlFor="observations">Observations</Label>
                <p className="text-xs text-muted-foreground">
                  Afficher une zone d'observations sur le bulletin
                </p>
              </div>
              <Switch
                id="observations"
                checked={localSettings.show_observations}
                onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_observations: v }))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pied de page personnalisé</h4>
            <Textarea
              placeholder="Texte personnalisé pour le pied de page du bulletin..."
              value={localSettings.custom_footer_text || ''}
              onChange={(e) => setLocalSettings(s => ({ ...s, custom_footer_text: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

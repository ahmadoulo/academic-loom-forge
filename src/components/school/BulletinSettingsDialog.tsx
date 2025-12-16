import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Settings, Save, Check, Palette } from "lucide-react";
import { toast } from "sonner";
import { BulletinSettings, BULLETIN_TEMPLATES, PRESET_COLORS, BulletinTemplate } from "@/hooks/useBulletinSettings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        custom_footer_text: settings.custom_footer_text,
        template_style: settings.template_style || 'classic',
        primary_color: settings.primary_color || '#333333',
        secondary_color: settings.secondary_color || '#666666',
        accent_color: settings.accent_color || '#0066cc',
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

  const handlePresetSelect = (preset: typeof PRESET_COLORS[0]) => {
    setLocalSettings(s => ({
      ...s,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent
    }));
  };

  if (loading || !settings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            Paramètres du Bulletin
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Personnalisez le modèle, les couleurs et le contenu
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="template" className="w-full">
          <TabsList className="w-full justify-start px-4 sm:px-6 bg-transparent border-b rounded-none h-auto pb-0">
            <TabsTrigger value="template" className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Modèle
            </TabsTrigger>
            <TabsTrigger value="colors" className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Couleurs
            </TabsTrigger>
            <TabsTrigger value="content" className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Contenu
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[55vh]">
            {/* TAB: MODÈLE */}
            <TabsContent value="template" className="px-4 sm:px-6 py-4 mt-0">
              <div className="grid grid-cols-2 gap-3">
                {BULLETIN_TEMPLATES.map((template) => {
                  const primaryCol = localSettings.primary_color || '#333';
                  const accentCol = localSettings.accent_color || '#0066cc';
                  
                  return (
                    <div
                      key={template.id}
                      onClick={() => setLocalSettings(s => ({ ...s, template_style: template.id }))}
                      className={cn(
                        "relative p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                        localSettings.template_style === template.id
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30"
                      )}
                    >
                      {localSettings.template_style === template.id && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      
                      {/* Template-specific preview */}
                      <div className="w-full h-20 rounded mb-2 border overflow-hidden bg-white relative">
                        {template.id === 'classic' && (
                          <>
                            <div className="absolute inset-1 border-2" style={{ borderColor: primaryCol }} />
                            <div className="absolute inset-2 border" style={{ borderColor: primaryCol }} />
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-muted" />
                            <div className="absolute top-9 left-3 right-3 h-2 rounded" style={{ backgroundColor: primaryCol }} />
                            <div className="absolute top-12 left-3 right-3 space-y-1">
                              <div className="h-1 bg-muted rounded" />
                              <div className="h-1 bg-muted rounded w-3/4" />
                            </div>
                          </>
                        )}
                        {template.id === 'modern' && (
                          <>
                            <div className="h-6" style={{ backgroundColor: primaryCol }} />
                            <div className="h-0.5" style={{ backgroundColor: accentCol }} />
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white" />
                            <div className="absolute top-8 left-2 right-2 flex gap-1">
                              <div className="flex-1 h-4 rounded bg-muted/50" />
                              <div className="flex-1 h-4 rounded bg-muted/50" />
                            </div>
                            <div className="absolute bottom-2 left-2 right-2 h-3 rounded" style={{ backgroundColor: primaryCol }} />
                          </>
                        )}
                        {template.id === 'minimal' && (
                          <>
                            <div className="p-2">
                              <div className="flex items-center gap-1 mb-2">
                                <div className="w-2 h-2 rounded bg-muted" />
                                <div className="h-1.5 w-10 bg-muted rounded" />
                              </div>
                              <div className="h-0.5 bg-muted/30 mb-2" />
                              <div className="text-[8px] font-bold mb-1" style={{ color: primaryCol }}>Bulletin</div>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <div className="h-1 w-12 bg-muted rounded" />
                                  <div className="h-1 w-4 bg-muted rounded" />
                                </div>
                                <div className="flex justify-between">
                                  <div className="h-1 w-10 bg-muted rounded" />
                                  <div className="h-1 w-4 bg-muted rounded" />
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        {template.id === 'elegant' && (
                          <>
                            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: primaryCol }} />
                            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: primaryCol }} />
                            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: primaryCol }} />
                            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: primaryCol }} />
                            <div className="absolute top-5 left-1/2 -translate-x-1/2">
                              <div className="w-4 h-4 rounded-full border" style={{ borderColor: accentCol }} />
                            </div>
                            <div className="absolute top-11 left-4 right-4 h-2 border rounded" style={{ borderColor: primaryCol }} />
                            <div className="absolute bottom-3 left-4 right-4 h-3 rounded" style={{ backgroundColor: primaryCol }}>
                              <div className="absolute left-0 top-0 w-0 h-0 border-l-4 border-t-4" style={{ borderLeftColor: 'transparent', borderTopColor: accentCol }} />
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base">{template.icon}</span>
                        <h4 className="font-medium text-sm">{template.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-tight">{template.description}</p>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* TAB: COULEURS */}
            <TabsContent value="colors" className="px-4 sm:px-6 py-4 mt-0">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Palettes prédéfinies
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_COLORS.map((preset, idx) => {
                      const isSelected = 
                        localSettings.primary_color === preset.primary &&
                        localSettings.secondary_color === preset.secondary;
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => handlePresetSelect(preset)}
                          className={cn(
                            "p-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                            isSelected ? "border-primary ring-1 ring-primary" : "border-muted"
                          )}
                        >
                          <div className="flex gap-1 mb-1.5">
                            <div 
                              className="h-4 w-4 rounded-full" 
                              style={{ backgroundColor: preset.primary }}
                            />
                            <div 
                              className="h-4 w-4 rounded-full" 
                              style={{ backgroundColor: preset.secondary }}
                            />
                            <div 
                              className="h-4 w-4 rounded-full" 
                              style={{ backgroundColor: preset.accent }}
                            />
                          </div>
                          <p className="text-xs font-medium truncate">{preset.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <h4 className="text-sm font-medium mb-3">Couleurs personnalisées</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Principale</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={localSettings.primary_color || '#333333'}
                          onChange={(e) => setLocalSettings(s => ({ ...s, primary_color: e.target.value }))}
                          className="h-8 w-full rounded border cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Secondaire</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={localSettings.secondary_color || '#666666'}
                          onChange={(e) => setLocalSettings(s => ({ ...s, secondary_color: e.target.value }))}
                          className="h-8 w-full rounded border cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Accent</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={localSettings.accent_color || '#0066cc'}
                          onChange={(e) => setLocalSettings(s => ({ ...s, accent_color: e.target.value }))}
                          className="h-8 w-full rounded border cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium mb-2">Aperçu</h4>
                  <div className="p-3 border rounded-lg bg-white">
                    <div 
                      className="h-6 rounded mb-2 flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: localSettings.primary_color }}
                    >
                      BULLETIN DE NOTES
                    </div>
                    <div className="flex gap-2">
                      <div 
                        className="h-3 w-16 rounded"
                        style={{ backgroundColor: localSettings.secondary_color }}
                      />
                      <div 
                        className="h-3 w-12 rounded"
                        style={{ backgroundColor: localSettings.accent_color }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB: CONTENU */}
            <TabsContent value="content" className="px-4 sm:px-6 py-4 mt-0">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Éléments à afficher</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border bg-card">
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="weighted" className="text-xs sm:text-sm">Moyenne pondérée</Label>
                    </div>
                    <Switch
                      id="weighted"
                      checked={localSettings.show_weighted_average}
                      onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_weighted_average: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border bg-card">
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="ranking" className="text-xs sm:text-sm">Classement</Label>
                    </div>
                    <Switch
                      id="ranking"
                      checked={localSettings.show_ranking}
                      onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_ranking: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border bg-card">
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="mention" className="text-xs sm:text-sm">Mention</Label>
                    </div>
                    <Switch
                      id="mention"
                      checked={localSettings.show_mention}
                      onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_mention: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border bg-card">
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="decision" className="text-xs sm:text-sm">Décision</Label>
                    </div>
                    <Switch
                      id="decision"
                      checked={localSettings.show_decision}
                      onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_decision: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border bg-card">
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="observations" className="text-xs sm:text-sm">Observations</Label>
                    </div>
                    <Switch
                      id="observations"
                      checked={localSettings.show_observations}
                      onCheckedChange={(v) => setLocalSettings(s => ({ ...s, show_observations: v }))}
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pied de page</h4>
                  <Textarea
                    placeholder="Texte personnalisé pour le pied de page..."
                    value={localSettings.custom_footer_text || ''}
                    onChange={(e) => setLocalSettings(s => ({ ...s, custom_footer_text: e.target.value }))}
                    rows={2}
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

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

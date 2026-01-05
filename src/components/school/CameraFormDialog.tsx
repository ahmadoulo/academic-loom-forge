import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Video, Loader2 } from "lucide-react";
import { SchoolCamera } from "@/hooks/useSchoolCameras";

interface CameraFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CameraFormData) => void;
  isLoading?: boolean;
  camera?: SchoolCamera | null;
}

export interface CameraFormData {
  name: string;
  rtsp_url: string;
  description?: string;
  location?: string;
  is_active?: boolean;
}

export function CameraFormDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading,
  camera 
}: CameraFormDialogProps) {
  const [formData, setFormData] = useState<CameraFormData>({
    name: "",
    rtsp_url: "",
    description: "",
    location: "",
    is_active: true,
  });

  // Reset form when dialog opens with a camera or without
  useEffect(() => {
    if (open) {
      if (camera) {
        setFormData({
          name: camera.name || "",
          rtsp_url: camera.rtsp_url || "",
          description: camera.description || "",
          location: camera.location || "",
          is_active: camera.is_active ?? true,
        });
      } else {
        setFormData({
          name: "",
          rtsp_url: "",
          description: "",
          location: "",
          is_active: true,
        });
      }
    }
  }, [open, camera]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.rtsp_url.trim()) return;
    onSubmit(formData);
  };

  const isEditing = !!camera;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>
              {isEditing ? "Modifier la caméra" : "Ajouter une caméra"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la caméra *</Label>
            <Input
              id="name"
              placeholder="Ex: Caméra Entrée Principale"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rtsp_url">URL du flux RTSP *</Label>
            <Input
              id="rtsp_url"
              placeholder="rtsp://exemple.com:1935/app/stream"
              value={formData.rtsp_url}
              onChange={(e) => setFormData({ ...formData, rtsp_url: e.target.value })}
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Format: rtsp://[serveur]:[port]/[application]/[stream]
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Emplacement</Label>
            <Input
              id="location"
              placeholder="Ex: Bâtiment A - Rez-de-chaussée"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description optionnelle de la caméra..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {isEditing && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <Label htmlFor="is_active" className="font-medium">Caméra active</Label>
                <p className="text-xs text-muted-foreground">
                  Désactiver pour masquer la caméra sans la supprimer
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim() || !formData.rtsp_url.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Announcement } from "@/hooks/useAnnouncements";

interface AnnouncementEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Announcement>) => void;
  announcement?: Announcement | null;
}

export function AnnouncementEditorModal({ open, onClose, onSave, announcement }: AnnouncementEditorModalProps) {
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    body: '',
    visibility: 'all',
    pinned: false,
  });

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        body: announcement.body,
        visibility: announcement.visibility,
        pinned: announcement.pinned,
      });
    } else {
      setFormData({
        title: '',
        body: '',
        visibility: 'all',
        pinned: false,
      });
    }
  }, [announcement, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {announcement ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Contenu *</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibilité</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value) => setFormData({ ...formData, visibility: value as Announcement['visibility'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="students">Étudiants</SelectItem>
                <SelectItem value="teachers">Professeurs</SelectItem>
                <SelectItem value="class">Classe spécifique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="pinned">Épingler l'annonce</Label>
              <p className="text-sm text-muted-foreground">
                L'annonce apparaîtra en haut de la liste
              </p>
            </div>
            <Switch
              id="pinned"
              checked={formData.pinned}
              onCheckedChange={(checked) => setFormData({ ...formData, pinned: checked })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {announcement ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

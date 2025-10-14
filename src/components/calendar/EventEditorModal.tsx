import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Event } from "@/hooks/useEvents";

interface EventEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Event>) => void;
  event?: Event | null;
}

export function EventEditorModal({ open, onClose, onSave, event }: EventEditorModalProps) {
  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    location: '',
    scope: 'school',
    published: true,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        start_at: event.start_at,
        end_at: event.end_at,
        location: event.location || '',
        scope: event.scope,
        published: event.published,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        start_at: '',
        end_at: '',
        location: '',
        scope: 'school',
        published: true,
      });
    }
  }, [event, open]);

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
            {event ? 'Modifier l\'événement' : 'Nouvel événement'}
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_at">Date et heure de début *</Label>
              <Input
                id="start_at"
                type="datetime-local"
                value={formData.start_at ? new Date(formData.start_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, start_at: new Date(e.target.value).toISOString() })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_at">Date et heure de fin *</Label>
              <Input
                id="end_at"
                type="datetime-local"
                value={formData.end_at ? new Date(formData.end_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, end_at: new Date(e.target.value).toISOString() })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope">Portée</Label>
            <Select
              value={formData.scope}
              onValueChange={(value) => setFormData({ ...formData, scope: value as Event['scope'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="school">École</SelectItem>
                <SelectItem value="class">Classe</SelectItem>
                <SelectItem value="subject">Matière</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {event ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

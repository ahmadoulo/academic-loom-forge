import { useState } from "react";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { useEvents } from "@/hooks/useEvents";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Plus, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function EventsPage() {
  const { user } = useCustomAuth();
  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  
  const isAdmin = user?.role === "admin_school" || user?.role === "superadmin";

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_at: "",
    end_at: "",
    location: "",
    scope: "school",
    published: true,
    attendance_enabled: false,
    links: [] as string[],
    attachments: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData = {
      ...formData,
      created_by: user?.id || null,
      class_id: null,
      subject_id: null,
    };

    const success = editingEvent
      ? await updateEvent(editingEvent.id, eventData)
      : await createEvent(eventData);

    if (success) {
      setIsModalOpen(false);
      setEditingEvent(null);
      setFormData({
        title: "",
        description: "",
        start_at: "",
        end_at: "",
        location: "",
        scope: "school",
        published: true,
        attendance_enabled: false,
        links: [],
        attachments: [],
      });
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      start_at: event.start_at,
      end_at: event.end_at,
      location: event.location || "",
      scope: event.scope,
      published: event.published,
      attendance_enabled: event.attendance_enabled || false,
      links: event.links || [],
      attachments: event.attachments || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      await deleteEvent(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedHeader
        title="Événements"
        onSettingsClick={() => {}}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">📅 Événements</h1>
            <p className="text-muted-foreground mt-1">
              Tous les événements scolaires
            </p>
          </div>
          
          {isAdmin && (
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Créer un événement
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucun événement pour le moment
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(event.start_at), "d MMM yyyy", { locale: fr })}
                        </div>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{event.scope}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {event.description}
                    </p>
                  )}
                  
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  )}

                  {isAdmin && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(event)}
                        className="flex-1"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Modifier l'événement" : "Créer un événement"}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de l'événement
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_at">Date de début *</Label>
                <Input
                  id="start_at"
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="end_at">Date de fin *</Label>
                <Input
                  id="end_at"
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Salle de conférence, gymnase..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingEvent ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

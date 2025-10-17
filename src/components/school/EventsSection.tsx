import { useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Plus, Edit2, Trash2, CalendarDays, Clock } from "lucide-react";
import { format, isSameDay, isPast, isFuture } from "date-fns";
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

interface EventsSectionProps {
  schoolId: string;
  isAdmin?: boolean;
}

export function EventsSection({ schoolId, isAdmin = false }: EventsSectionProps) {
  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents(schoolId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_at: "",
    end_at: "",
    location: "",
    scope: "school",
    published: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData = {
      ...formData,
      created_by: null,
      class_id: null,
      subject_id: null,
      school_id: schoolId,
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
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      await deleteEvent(id);
    }
  };

  const getEventStatus = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isPast(end)) {
      return { label: 'Terminé', color: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800' };
    } else if (isFuture(start)) {
      return { label: 'À venir', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
    } else {
      return { label: 'En cours', color: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-800">
              <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Événements</h2>
          </div>
          <p className="text-muted-foreground ml-[52px]">
            Découvrez tous les événements à venir
          </p>
        </div>
        
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2 shadow-md">
            <Plus className="w-4 h-4" />
            Nouvel événement
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Chargement des événements...</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <CalendarDays className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Aucun événement</h3>
                <p className="text-muted-foreground max-w-md">
                  {isAdmin 
                    ? "Créez votre premier événement pour planifier les activités de votre établissement."
                    : "Aucun événement n'est prévu pour le moment. Revenez plus tard !"}
                </p>
              </div>
              {isAdmin && (
                <Button onClick={() => setIsModalOpen(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un événement
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const status = getEventStatus(event.start_at, event.end_at);
            const startDate = new Date(event.start_at);
            const endDate = new Date(event.end_at);
            const isSameDayEvent = isSameDay(startDate, endDate);
            
            return (
              <Card 
                key={event.id} 
                className="group hover:shadow-xl transition-all duration-300 overflow-hidden hover:border-primary/50"
              >
                <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <Badge variant="outline" className={status.color}>
                      {status.label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {event.scope === 'school' ? 'École' : 'Classe'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold leading-tight">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2.5 text-foreground">
                      <Calendar className="w-4 h-4 flex-shrink-0 text-primary" />
                      <span>
                        {format(startDate, "d MMMM yyyy", { locale: fr })}
                        {!isSameDayEvent && ` - ${format(endDate, "d MMMM yyyy", { locale: fr })}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                      </span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(event)}
                        className="flex-1 group-hover:border-primary/50"
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
            );
          })}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingEvent ? "Modifier l'événement" : "Créer un événement"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de votre événement
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Journée portes ouvertes"
                className="text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez votre événement..."
                rows={4}
                className="text-base resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_at" className="text-base font-semibold">Date et heure de début *</Label>
                <Input
                  id="start_at"
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  className="text-base"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_at" className="text-base font-semibold">Date et heure de fin *</Label>
                <Input
                  id="end_at"
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                  className="text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-base font-semibold">Lieu</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Salle de conférence, gymnase, amphi..."
                className="text-base"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                size="lg"
              >
                Annuler
              </Button>
              <Button type="submit" size="lg">
                {editingEvent ? "Mettre à jour" : "Publier l'événement"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

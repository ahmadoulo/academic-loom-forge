import { useState, useMemo } from "react";
import { useEvents } from "@/hooks/useEvents";
import { useEventAttendance } from "@/hooks/useEventAttendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Plus, Edit2, Trash2, CalendarDays, Clock, QrCode, Users, Eye, CheckCircle, CalendarClock } from "lucide-react";
import { format, isSameDay, isPast, isFuture, parseISO } from "date-fns";
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
import { Checkbox } from "@/components/ui/checkbox";
import { EventQRCodeGenerator } from "./EventQRCodeGenerator";
import { EventAttendanceList } from "./EventAttendanceList";
import { AttachmentUploader } from "./AttachmentUploader";
import { AttachmentDisplay } from "./AttachmentDisplay";

interface EventsSectionProps {
  schoolId: string;
  isAdmin?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

interface ActiveSession {
  event: any;
  session: {
    id: string;
    session_code: string;
    expires_at: string;
  };
}

interface ViewingAttendance {
  event: any;
}

// Helper to format datetime-local value without timezone conversion
const formatDateTimeLocal = (isoString: string): string => {
  if (!isoString) return "";
  // Parse the ISO string and format for datetime-local input
  const date = parseISO(isoString);
  return format(date, "yyyy-MM-dd'T'HH:mm");
};

// Helper to create ISO string from datetime-local without timezone shift
const toISOStringWithoutTimezone = (dateTimeLocal: string): string => {
  if (!dateTimeLocal) return "";
  // Parse the local datetime and create an ISO string that preserves the local time
  // by treating it as UTC (preventing timezone offset)
  const [datePart, timePart] = dateTimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create date in UTC to avoid timezone conversion
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  return date.toISOString();
};

export function EventsSection({ 
  schoolId, 
  isAdmin = false,
  canCreate = isAdmin,
  canEdit = isAdmin,
  canDelete = isAdmin
}: EventsSectionProps) {
  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents(schoolId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [viewingAttendance, setViewingAttendance] = useState<ViewingAttendance | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

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

  // Split events into upcoming and past
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    const upcoming: any[] = [];
    const past: any[] = [];
    
    events.forEach((event: any) => {
      const endDate = parseISO(event.end_at);
      if (isPast(endDate)) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    });
    
    // Sort upcoming by start date ascending
    upcoming.sort((a, b) => parseISO(a.start_at).getTime() - parseISO(b.start_at).getTime());
    // Sort past by end date descending (most recent first)
    past.sort((a, b) => parseISO(b.end_at).getTime() - parseISO(a.end_at).getTime());
    
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

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
      start_at: formatDateTimeLocal(event.start_at),
      end_at: formatDateTimeLocal(event.end_at),
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

  const getEventStatus = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (isPast(end)) {
      return { label: 'Terminé', color: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800', icon: CheckCircle };
    } else if (isFuture(start)) {
      return { label: 'À venir', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: CalendarClock };
    } else {
      return { label: 'En cours', color: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800', icon: Clock };
    }
  };

  // Render event card
  const renderEventCard = (event: any) => {
    const status = getEventStatus(event.start_at, event.end_at);
    const startDate = parseISO(event.start_at);
    const endDate = parseISO(event.end_at);
    const isSameDayEvent = isSameDay(startDate, endDate);
    const canGenerateQR = event.attendance_enabled && !isPast(endDate);
    
    return (
      <Card 
        key={event.id} 
        className="group hover:shadow-xl transition-all duration-300 overflow-hidden hover:border-primary/50"
      >
        <div className={`h-2 ${isPast(endDate) ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`} />
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={status.color}>
                {status.label}
              </Badge>
              {event.attendance_enabled && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Présence
                </Badge>
              )}
            </div>
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
          
          {/* Attachments Display */}
          <AttachmentDisplay 
            links={event.links || []} 
            attachments={event.attachments || []} 
          />
          
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

          {(canEdit || canDelete || event.attendance_enabled) && (
            <div className="space-y-2 pt-4 border-t">
              {/* Attendance buttons for events with attendance enabled */}
              {event.attendance_enabled && (
                <div className="flex gap-2">
                  {canGenerateQR && canEdit && (
                    <EventQRButton 
                      event={event} 
                      schoolId={schoolId}
                      onSessionCreated={(session) => setActiveSession({ event, session })}
                    />
                  )}
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingAttendance({ event })}
                      className="flex-1 gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Voir présences
                    </Button>
                  )}
                </div>
              )}
              
              {(canEdit || canDelete) && (
                <div className="flex gap-2">
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(event)}
                      className="flex-1 group-hover:border-primary/50"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // If showing attendance list
  if (viewingAttendance) {
    return (
      <EventAttendanceList
        event={viewingAttendance.event}
        schoolId={schoolId}
        onBack={() => setViewingAttendance(null)}
      />
    );
  }

  // If showing QR code generator
  if (activeSession) {
    return (
      <EventQRCodeGenerator
        event={{
          ...activeSession.event,
          school_id: schoolId
        }}
        session={activeSession.session}
        onBack={() => setActiveSession(null)}
      />
    );
  }

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
        
        {canCreate && (
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
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upcoming" | "past")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="upcoming" className="gap-2">
              <CalendarClock className="w-4 h-4" />
              À venir ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Terminé ({pastEvents.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-0">
            {upcomingEvents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Aucun événement à venir</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {canCreate ? "Créez un nouvel événement pour commencer." : "Revenez plus tard !"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map(renderEventCard)}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="mt-0">
            {pastEvents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Aucun événement passé</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Les événements terminés apparaîtront ici.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastEvents.map(renderEventCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
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

            {/* Attendance Enabled Checkbox */}
            <div className="flex items-center space-x-3 p-4 rounded-lg border bg-muted/30">
              <Checkbox
                id="attendance_enabled"
                checked={formData.attendance_enabled}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, attendance_enabled: checked === true })
                }
              />
              <div className="space-y-1">
                <Label 
                  htmlFor="attendance_enabled" 
                  className="text-base font-semibold cursor-pointer flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Activer la prise de présence
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permet de générer un QR code pour que les étudiants puissent marquer leur présence à l'événement
                </p>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="pt-4 border-t">
              <AttachmentUploader
                type="events"
                schoolId={schoolId}
                links={formData.links}
                attachments={formData.attachments}
                onLinksChange={(links) => setFormData({ ...formData, links })}
                onAttachmentsChange={(attachments) => setFormData({ ...formData, attachments })}
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

// Helper component for generating QR code
function EventQRButton({ 
  event, 
  schoolId,
  onSessionCreated 
}: { 
  event: any; 
  schoolId: string;
  onSessionCreated: (session: { id: string; session_code: string; expires_at: string }) => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { createSession, sessions } = useEventAttendance(event.id, schoolId);

  const handleClick = async () => {
    // Check for existing active session
    const activeSession = sessions.find(s => 
      s.is_active && new Date(s.expires_at) > new Date()
    );

    if (activeSession) {
      onSessionCreated({
        id: activeSession.id,
        session_code: activeSession.session_code,
        expires_at: activeSession.expires_at
      });
      return;
    }

    setIsGenerating(true);
    const result = await createSession(event.id, schoolId, 120);
    setIsGenerating(false);

    if (result.data) {
      onSessionCreated({
        id: result.data.id,
        session_code: result.data.session_code,
        expires_at: result.data.expires_at
      });
    }
  };

  const activeSession = sessions.find(s => 
    s.is_active && new Date(s.expires_at) > new Date()
  );

  return (
    <Button
      variant={activeSession ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isGenerating}
      className="flex-1 gap-2"
    >
      <QrCode className="w-4 h-4" />
      {isGenerating ? "..." : activeSession ? "QR Code" : "Générer QR"}
    </Button>
  );
}
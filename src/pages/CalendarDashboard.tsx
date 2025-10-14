import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEvents } from "@/hooks/useEvents";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { WeekViewCalendar } from "@/components/calendar/WeekViewCalendar";
import { MiniCalendarSidebar } from "@/components/calendar/MiniCalendarSidebar";
import { EventEditorModal } from "@/components/calendar/EventEditorModal";
import { AnnouncementEditorModal } from "@/components/calendar/AnnouncementEditorModal";
import { Event } from "@/hooks/useEvents";
import { Announcement } from "@/hooks/useAnnouncements";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { startOfWeek, endOfWeek, addDays } from "date-fns";

export default function CalendarDashboard() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Calculate week range for events query
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const { events, loading: eventsLoading, createEvent, updateEvent, deleteEvent } = useEvents({
    from: weekStart,
    to: addDays(weekEnd, 1),
  });

  const {
    announcements,
    loading: announcementsLoading,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  } = useAnnouncements();

  const canEdit = profile?.role === 'school_admin' || profile?.role === 'global_admin';

  const handleEventSave = (data: Partial<Event>) => {
    if (selectedEvent) {
      updateEvent(selectedEvent.id, data);
    } else {
      createEvent(data as Omit<Event, 'id' | 'created_at' | 'updated_at' | 'created_by'>);
    }
    setSelectedEvent(null);
  };

  const handleAnnouncementSave = (data: Partial<Announcement>) => {
    if (selectedAnnouncement) {
      updateAnnouncement(selectedAnnouncement.id, data);
    } else {
      createAnnouncement(data as Omit<Announcement, 'id' | 'created_at' | 'updated_at' | 'created_by'>);
    }
    setSelectedAnnouncement(null);
  };

  const handleEventEdit = (event: Event) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
  };

  const handleAnnouncementEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setAnnouncementModalOpen(true);
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setEventModalOpen(true);
  };

  const handleCreateAnnouncement = () => {
    setSelectedAnnouncement(null);
    setAnnouncementModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedHeader 
        title="Calendrier" 
        onSettingsClick={() => {}} 
      />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Calendrier</h1>
                <p className="text-muted-foreground">
                  Gérez vos événements et annonces
                </p>
              </div>
            </div>

            {canEdit && (
              <div className="flex gap-2">
                <Button onClick={handleCreateEvent}>
                  <Plus className="mr-2 h-4 w-4" />
                  Événement
                </Button>
                <Button variant="outline" onClick={handleCreateAnnouncement}>
                  <Plus className="mr-2 h-4 w-4" />
                  Annonce
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Week View */}
          <div>
            {eventsLoading ? (
              <div className="flex items-center justify-center h-[600px] bg-card rounded-xl border">
                <div className="text-muted-foreground">Chargement...</div>
              </div>
            ) : (
              <WeekViewCalendar
                events={events}
                selectedDate={selectedDate}
                onEventClick={handleEventEdit}
              />
            )}
          </div>

          {/* Sidebar */}
          <div>
            <MiniCalendarSidebar
              selectedDate={selectedDate}
              onDateSelect={(date) => date && setSelectedDate(date)}
              events={events}
              announcements={announcements}
              onEventEdit={handleEventEdit}
              onEventDelete={deleteEvent}
              onAnnouncementEdit={handleAnnouncementEdit}
              onAnnouncementDelete={deleteAnnouncement}
              onCreateEvent={handleCreateEvent}
              onCreateAnnouncement={handleCreateAnnouncement}
              canEdit={canEdit}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <EventEditorModal
        open={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleEventSave}
        event={selectedEvent}
      />

      <AnnouncementEditorModal
        open={announcementModalOpen}
        onClose={() => {
          setAnnouncementModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        onSave={handleAnnouncementSave}
        announcement={selectedAnnouncement}
      />
    </div>
  );
}

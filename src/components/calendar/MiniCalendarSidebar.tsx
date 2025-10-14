import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { Event } from "@/hooks/useEvents";
import { Announcement } from "@/hooks/useAnnouncements";
import { EventCard } from "./EventCard";
import { AnnouncementCard } from "./AnnouncementCard";
import { format, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface MiniCalendarSidebarProps {
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  events: Event[];
  announcements: Announcement[];
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (id: string) => void;
  onAnnouncementEdit?: (announcement: Announcement) => void;
  onAnnouncementDelete?: (id: string) => void;
  onCreateEvent?: () => void;
  onCreateAnnouncement?: () => void;
  canEdit?: boolean;
}

export function MiniCalendarSidebar({
  selectedDate,
  onDateSelect,
  events,
  announcements,
  onEventEdit,
  onEventDelete,
  onAnnouncementEdit,
  onAnnouncementDelete,
  onCreateEvent,
  onCreateAnnouncement,
  canEdit = false,
}: MiniCalendarSidebarProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'announcements'>('events');

  const upcomingEvents = events
    .filter((event) => new Date(event.start_at) >= new Date())
    .slice(0, 5);

  const eventDates = events.map((event) => parseISO(event.start_at));

  return (
    <div className="space-y-6">
      {/* Mini Calendar */}
      <Card className="p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          locale={fr}
          modifiers={{
            hasEvent: eventDates,
          }}
          modifiersStyles={{
            hasEvent: {
              fontWeight: 'bold',
              textDecoration: 'underline',
            },
          }}
          className="rounded-lg"
        />
      </Card>

      {/* Tabs */}
      <Card className="p-4">
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'events' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('events')}
            className="flex-1"
          >
            Événements
          </Button>
          <Button
            variant={activeTab === 'announcements' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('announcements')}
            className="flex-1"
          >
            Annonces
          </Button>
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Prochains événements</h3>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCreateEvent}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={onEventEdit}
                      onDelete={onEventDelete}
                      canEdit={canEdit}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun événement à venir
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Annonces récentes</h3>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCreateAnnouncement}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {announcements.length > 0 ? (
                  announcements.slice(0, 10).map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      onEdit={onAnnouncementEdit}
                      onDelete={onAnnouncementDelete}
                      canEdit={canEdit}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucune annonce
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </Card>
    </div>
  );
}

import { Event } from "@/hooks/useEvents";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface WeekViewCalendarProps {
  events: Event[];
  selectedDate: Date;
  onEventClick?: (event: Event) => void;
}

export function WeekViewCalendar({ events, selectedDate, onEventClick }: WeekViewCalendarProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)); // Mon-Fri
  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM - 6 PM

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter((event) => {
      const eventStart = parseISO(event.start_at);
      const eventHour = eventStart.getHours();
      return isSameDay(eventStart, day) && eventHour === hour;
    });
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'school':
        return 'bg-primary/10 border-primary text-primary';
      case 'class':
        return 'bg-accent/10 border-accent text-accent-foreground';
      case 'subject':
        return 'bg-secondary/10 border-secondary text-secondary-foreground';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Header with days */}
      <div className="grid grid-cols-6 border-b bg-muted/30">
        <div className="p-3 text-sm font-medium text-muted-foreground border-r">
          Horaire
        </div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "p-3 text-center border-r last:border-r-0",
              isSameDay(day, new Date()) && "bg-primary/5"
            )}
          >
            <div className="text-xs font-medium text-muted-foreground uppercase">
              {format(day, "EEE", { locale: fr })}
            </div>
            <div
              className={cn(
                "text-lg font-semibold mt-1",
                isSameDay(day, new Date()) ? "text-primary" : "text-foreground"
              )}
            >
              {format(day, "d", { locale: fr })}
            </div>
          </div>
        ))}
      </div>

      {/* Time slots */}
      <div className="overflow-auto max-h-[600px]">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-6 border-b last:border-b-0 min-h-[80px]">
            <div className="p-3 text-sm font-medium text-muted-foreground border-r bg-muted/20">
              {hour}:00
            </div>
            {weekDays.map((day) => {
              const dayEvents = getEventsForDayAndHour(day, hour);
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="p-2 border-r last:border-r-0 space-y-1"
                >
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={cn(
                        "w-full text-left p-2 rounded-lg border text-xs font-medium transition-all hover:shadow-md",
                        getScopeColor(event.scope)
                      )}
                    >
                      <div className="font-semibold truncate">{event.title}</div>
                      <div className="text-xs opacity-80 mt-0.5">
                        {format(parseISO(event.start_at), "HH:mm")} -{" "}
                        {format(parseISO(event.end_at), "HH:mm")}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

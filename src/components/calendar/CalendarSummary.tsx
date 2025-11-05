import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format, isToday, isTomorrow, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  title: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  type: string;
  class_name?: string;
  is_rescheduled?: boolean;
  reschedule_reason?: string;
  reschedule_status?: string;
  proposed_new_date?: string;
  original_session_date?: string;
}

interface CalendarSummaryProps {
  events: CalendarEvent[];
  title?: string;
}

export function CalendarSummary({ events, title = "Séances à venir" }: CalendarSummaryProps) {
  const now = new Date();
  const weekStart = startOfWeek(now, { locale: fr });
  const weekEnd = endOfWeek(now, { locale: fr });

  const upcomingEvents = events
    .filter(e => {
      if (!e.session_date) return false;
      const eventDate = new Date(e.session_date);
      return eventDate >= now && isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
    })
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return "Demain";
    return format(date, "EEEE d MMMM", { locale: fr });
  };

  return (
    <Card className="border-primary/10 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <Badge variant="outline" className="font-normal">
            Semaine en cours
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="group relative flex items-start gap-4 p-4 border rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200 bg-card"
              >
                <div className="flex-shrink-0 w-16 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {format(parseISO(event.session_date), "dd", { locale: fr })}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(parseISO(event.session_date), "MMM", { locale: fr })}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-base leading-tight truncate">
                      {event.title}
                    </h4>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {event.is_rescheduled && (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-600/20 text-xs">
                          Reporté
                        </Badge>
                      )}
                      <Badge 
                        variant={event.type === 'course' ? 'default' : event.type === 'exam' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {event.type === 'course' ? 'Cours' : event.type === 'exam' ? 'Examen' : 'Devoir'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-medium">{getDateLabel(event.session_date)}</span>
                      {event.is_rescheduled && event.proposed_new_date && (
                        <span className="text-orange-600 font-medium">
                          → {format(parseISO(event.proposed_new_date), "d MMM", { locale: fr })}
                        </span>
                      )}
                    </div>
                    
                    {event.start_time && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{event.start_time}</span>
                        {event.end_time && <span>- {event.end_time}</span>}
                      </div>
                    )}
                    
                    {event.class_name && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {event.class_name}
                      </span>
                    )}
                  </div>
                  
                  {event.is_rescheduled && event.reschedule_reason && (
                    <p className="text-xs italic text-orange-600/80 mt-1">
                      {event.reschedule_reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              Aucune séance prévue cette semaine
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Profitez-en pour vous reposer !
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
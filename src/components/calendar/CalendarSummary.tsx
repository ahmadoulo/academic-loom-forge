import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
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
  const upcomingEvents = events
    .filter(e => e.session_date && new Date(e.session_date) >= new Date())
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    .slice(0, 5);

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return "Demain";
    return format(date, "EEEE d MMMM", { locale: fr });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium truncate">{event.title}</span>
                    {event.is_rescheduled && (
                      <Badge variant="outline" className="shrink-0 bg-orange-500/10 text-orange-600 border-orange-600/20">
                        Reporté
                      </Badge>
                    )}
                    <Badge 
                      variant={event.type === 'course' ? 'default' : event.type === 'exam' ? 'destructive' : 'secondary'}
                      className="shrink-0"
                    >
                      {event.type === 'course' ? 'Cours' : event.type === 'exam' ? 'Examen' : 'Devoir'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{getDateLabel(event.session_date)}</span>
                      {event.is_rescheduled && event.proposed_new_date && (
                        <span className="text-orange-600 ml-2">
                          → {format(parseISO(event.proposed_new_date), "d MMM", { locale: fr })}
                        </span>
                      )}
                    </div>
                    
                    {event.start_time && (
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{event.start_time}</span>
                        {event.end_time && <span> - {event.end_time}</span>}
                      </div>
                    )}
                    
                    {event.is_rescheduled && event.reschedule_reason && (
                      <div className="mt-1 text-xs italic text-muted-foreground">
                        Raison: {event.reschedule_reason}
                      </div>
                    )}
                    
                    {event.class_name && (
                      <div className="mt-1">Classe: {event.class_name}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-6">
            Aucune séance prévue
          </p>
        )}
      </CardContent>
    </Card>
  );
}
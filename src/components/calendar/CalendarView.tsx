import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  type: string;
  class_name?: string;
  teacher_name?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | undefined;
}

export function CalendarView({ events, onDateSelect, selectedDate }: CalendarViewProps) {
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.session_date && isSameDay(new Date(event.session_date), date)
    );
  };

  const getDatesWithEvents = () => {
    return events
      .filter(e => e.session_date)
      .map(e => new Date(e.session_date));
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Calendrier</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateSelect(date)}
            locale={fr}
            modifiers={{
              hasEvent: getDatesWithEvents()
            }}
            modifiersClassNames={{
              hasEvent: "bg-primary/20 font-bold"
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate 
              ? `Séances du ${format(selectedDate, "d MMMM yyyy", { locale: fr })}`
              : "Sélectionnez une date"
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).length > 0 ? (
                getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className="p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{event.title}</h4>
                      <Badge variant={
                        event.type === 'course' ? 'default' : 
                        event.type === 'exam' ? 'destructive' : 
                        'secondary'
                      }>
                        {event.type === 'course' ? 'Cours' : 
                         event.type === 'exam' ? 'Examen' : 
                         'Devoir'}
                      </Badge>
                    </div>
                    
                    {event.start_time && event.end_time && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Clock className="h-4 w-4" />
                        <span>{event.start_time} - {event.end_time}</span>
                      </div>
                    )}
                    
                    {event.class_name && (
                      <p className="text-sm text-muted-foreground">
                        Classe: {event.class_name}
                      </p>
                    )}
                    
                    {event.teacher_name && (
                      <p className="text-sm text-muted-foreground">
                        Professeur: {event.teacher_name}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Aucune séance prévue ce jour
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Cliquez sur une date pour voir les séances
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
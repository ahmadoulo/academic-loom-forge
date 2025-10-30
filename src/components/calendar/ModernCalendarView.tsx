import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, MoreVertical, Edit, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CalendarEvent {
  id: string;
  title: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  type: string;
  class_name?: string;
  teacher_name?: string;
  is_rescheduled?: boolean;
  reschedule_reason?: string;
  reschedule_status?: string;
  proposed_new_date?: string;
  original_session_date?: string;
}

interface ModernCalendarViewProps {
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | undefined;
  canManage?: boolean;
  isTeacher?: boolean;
  onReschedule?: (sessionId: string) => void;
  onApproveReschedule?: (sessionId: string) => void;
}

export function ModernCalendarView({ 
  events, 
  onDateSelect, 
  selectedDate, 
  canManage = false,
  isTeacher = false,
  onReschedule,
  onApproveReschedule,
}: ModernCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: fr });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.session_date && isSameDay(new Date(event.session_date), date)
    );
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500';
      case 'exam':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-l-4 border-red-500';
      default:
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-l-4 border-purple-500';
    }
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'bg-blue-500';
      case 'exam':
        return 'bg-red-500';
      default:
        return 'bg-purple-500';
    }
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendrier</h2>
          <p className="text-muted-foreground mt-1">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleToday} size="sm">
            Aujourd'hui
          </Button>
          <div className="flex items-center border rounded-lg">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePreviousMonth}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextMonth}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Calendar */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Week days header */}
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {weekDays.map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 auto-rows-[minmax(100px,1fr)]">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isDayToday = isToday(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={idx}
                    onClick={() => onDateSelect(day)}
                    className={cn(
                      "relative border-r border-b p-2 text-left transition-all hover:bg-muted/50 min-h-[100px]",
                      !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                      isSelected && "bg-primary/10 ring-2 ring-primary ring-inset",
                      isDayToday && "bg-accent"
                    )}
                  >
                    <div className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium mb-1",
                      isDayToday && "bg-primary text-primary-foreground",
                      isSelected && !isDayToday && "bg-primary/20"
                    )}>
                      {format(day, 'd')}
                    </div>
                    
                     <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={cn(
                            "text-xs p-1 rounded truncate flex items-center gap-1",
                            getEventColor(event.type)
                          )}
                        >
                          <div className="flex-1 truncate">
                            {event.start_time && (
                              <span className="font-medium">{event.start_time} </span>
                            )}
                            {event.title}
                          </div>
                          {event.reschedule_status === 'pending' && (
                            <Badge variant="outline" className="text-[10px] px-1 bg-orange-50 text-orange-600 border-orange-200">
                              Demandé
                            </Badge>
                          )}
                          {event.reschedule_reason && !event.proposed_new_date && event.reschedule_status !== 'pending' && (
                            <Badge variant="destructive" className="text-[10px] px-1 bg-red-100 text-red-700 border-red-300">
                              Reporté
                            </Badge>
                          )}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground pl-1">
                          +{dayEvents.length - 2} autres
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Events sidebar */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/50">
            <CardTitle className="text-lg">
              {selectedDate ? (
                <>
                  {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                  {isToday(selectedDate) && (
                    <Badge variant="secondary" className="ml-2">Aujourd'hui</Badge>
                  )}
                </>
              ) : (
                "Sélectionnez une date"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 max-h-[600px] overflow-y-auto">
            {selectedDate ? (
              <div className="space-y-3">
                {getEventsForDate(selectedDate).length > 0 ? (
                  getEventsForDate(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "p-4 rounded-lg transition-all hover:shadow-md relative",
                        getEventColor(event.type)
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">{event.title}</h4>
                          {event.reschedule_status === 'pending' && (
                            <Badge variant="outline" className="mt-1 bg-orange-100 text-orange-700 border-orange-300">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Report demandé
                            </Badge>
                          )}
                          {event.reschedule_reason && !event.proposed_new_date && event.reschedule_status !== 'pending' && (
                            <Badge variant="destructive" className="mt-1 bg-red-100 text-red-700 border-red-300">
                              Reporté
                            </Badge>
                          )}
                          {event.is_rescheduled && event.reschedule_status === 'approved' && event.proposed_new_date && (
                            <Badge variant="outline" className="mt-1 bg-blue-100 text-blue-700 border-blue-300">
                              Reprogrammé
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary"
                            className={cn("text-white", getEventBadgeColor(event.type))}
                          >
                            {event.type === 'course' ? 'Cours' : 
                             event.type === 'exam' ? 'Examen' : 
                             'Devoir'}
                          </Badge>
                          {canManage && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {event.reschedule_status === 'pending' && !isTeacher && onApproveReschedule && (
                                  <DropdownMenuItem onClick={() => onApproveReschedule(event.id)}>
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Examiner la demande
                                  </DropdownMenuItem>
                                )}
                                {(!event.reschedule_status || event.reschedule_status !== 'pending') && onReschedule && (
                                  <DropdownMenuItem onClick={() => onReschedule(event.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Reporter la séance
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {event.start_time && event.end_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 opacity-70" />
                            <span className="font-medium">
                              {event.start_time} - {event.end_time}
                            </span>
                          </div>
                        )}
                        
                        {event.class_name && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 opacity-70" />
                            <span>Classe: {event.class_name}</span>
                          </div>
                        )}
                        
                        {event.teacher_name && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 opacity-70" />
                            <span>Professeur: {event.teacher_name}</span>
                          </div>
                        )}

                        {event.reschedule_status === 'pending' && event.proposed_new_date && (
                          <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                            <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">
                              Nouvelle date proposée:
                            </p>
                            <p className="text-sm font-semibold">
                              {format(new Date(event.proposed_new_date), "EEEE dd MMMM yyyy", { locale: fr })}
                            </p>
                            {event.reschedule_reason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Motif: {event.reschedule_reason}
                              </p>
                            )}
                          </div>
                        )}

                        {event.is_rescheduled && event.original_session_date && event.reschedule_status === 'approved' && (
                          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Date originale: {format(new Date(event.original_session_date), "dd/MM/yyyy", { locale: fr })}
                            </p>
                            {event.reschedule_reason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Motif: {event.reschedule_reason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground">
                      <p className="text-lg font-medium mb-2">Aucune séance</p>
                      <p className="text-sm">Pas d'événement prévu ce jour</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium mb-2">Calendrier interactif</p>
                <p className="text-sm">Cliquez sur une date pour voir les séances</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

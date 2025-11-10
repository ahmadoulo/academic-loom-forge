import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, MoreVertical, Edit, AlertTriangle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Helper function to parse reschedule reason
  const parseRescheduleReason = (reason: string | undefined) => {
    if (!reason) return { text: '', startTime: undefined, endTime: undefined };
    
    try {
      const parsed = JSON.parse(reason);
      return {
        text: parsed.reason || reason,
        startTime: parsed.proposedStartTime,
        endTime: parsed.proposedEndTime
      };
    } catch {
      return { text: reason, startTime: undefined, endTime: undefined };
    }
  };

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
    setCurrentWeek(today);
    onDateSelect(today);
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
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

  // Week view helpers
  const weekStart = startOfWeek(currentWeek, { locale: fr });
  const weekEnd = endOfWeek(currentWeek, { locale: fr });
  const weekDaysArray = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6h to 21h

  const getEventsForDateAndHour = (date: Date, hour: number) => {
    return events.filter(event => {
      if (!event.session_date || !isSameDay(new Date(event.session_date), date)) {
        return false;
      }
      if (!event.start_time || !event.end_time) return false;
      
      const [startHour, startMinute] = event.start_time.split(':').map(Number);
      const [endHour, endMinute] = event.end_time.split(':').map(Number);
      
      // Check if the event overlaps with this hour slot
      const eventStartsBeforeOrDuringHour = startHour <= hour;
      const eventEndsAfterHourStarts = endHour > hour || (endHour === hour && endMinute > 0);
      
      return eventStartsBeforeOrDuringHour && eventEndsAfterHourStarts && startHour === hour;
    });
  };

  const getEventDuration = (event: CalendarEvent) => {
    if (!event.start_time || !event.end_time) return 1;
    const startHour = parseInt(event.start_time.split(':')[0]);
    const endHour = parseInt(event.end_time.split(':')[0]);
    return Math.max(1, endHour - startHour);
  };

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
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleToday} size="sm">
            Aujourd'hui
          </Button>
          <div className="flex items-center border rounded-lg">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={viewMode === 'month' ? handlePreviousMonth : handlePreviousWeek}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 text-sm font-medium min-w-[140px] text-center">
              {viewMode === 'month' 
                ? format(currentMonth, 'MMMM yyyy', { locale: fr })
                : `${format(weekStart, 'd', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`
              }
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={viewMode === 'month' ? handleNextMonth : handleNextWeek}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="h-8 px-3 text-xs font-medium"
            >
              MOIS
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="h-8 px-3 text-xs font-medium"
            >
              SEMAINE
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Calendar */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {viewMode === 'month' ? (
              <>
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
            </>
            ) : (
              // Week View
              <ScrollArea className="h-[600px]">
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/50">
                  <div className="p-3 border-r" />
                  {weekDaysArray.map((day) => (
                    <div 
                      key={day.toISOString()} 
                      className={cn(
                        "p-3 text-center border-r",
                        isToday(day) && "bg-primary/10"
                      )}
                    >
                      <div className="text-xs text-muted-foreground font-medium">
                        {format(day, 'EEE', { locale: fr })}
                      </div>
                      <div className={cn(
                        "text-lg font-semibold mt-1",
                        isToday(day) && "text-primary"
                      )}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="relative">
                  {hours.map((hour) => (
                    <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b min-h-[80px]">
                      <div className="p-2 text-sm font-medium text-muted-foreground border-r bg-muted/30 sticky left-0">
                        {hour.toString().padStart(2, '0')} h
                      </div>
                      {weekDaysArray.map((day) => {
                        const cellEvents = getEventsForDateAndHour(day, hour);
                        const isCurrentDay = isToday(day);
                        
                        return (
                          <div
                            key={`${day.toISOString()}-${hour}`}
                            className={cn(
                              "border-r p-1 relative min-h-[80px]",
                              isCurrentDay && "bg-primary/5"
                            )}
                            onClick={() => onDateSelect(day)}
                          >
                            {cellEvents.map((event) => {
                              const duration = getEventDuration(event);
                              return (
                                <div
                                  key={event.id}
                                  className={cn(
                                    "text-xs p-2 rounded mb-1 cursor-pointer hover:opacity-90 transition-opacity",
                                    getEventColor(event.type),
                                    duration > 1 && "mb-2"
                                  )}
                                  style={{
                                    minHeight: `${duration * 60}px`
                                  }}
                                >
                                  <div className="font-semibold truncate">{event.title}</div>
                                  {event.start_time && event.end_time && (
                                    <div className="text-[10px] opacity-80 mt-0.5">
                                      {event.start_time} - {event.end_time}
                                    </div>
                                  )}
                                  {event.class_name && (
                                    <div className="text-[10px] opacity-70 truncate mt-0.5">
                                      {event.class_name}
                                    </div>
                                  )}
                                  {event.reschedule_status === 'pending' && (
                                    <Badge variant="outline" className="text-[9px] px-1 mt-1 bg-orange-50 text-orange-600 border-orange-200">
                                      Demandé
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
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
                            {event.reschedule_reason && (() => {
                              const parsed = parseRescheduleReason(event.reschedule_reason);
                              return (
                                <>
                                  {(parsed.startTime || parsed.endTime) && (
                                    <div className="text-xs mt-2 space-y-0.5">
                                      {parsed.startTime && (
                                        <p className="text-orange-700 dark:text-orange-300">
                                          Heure de début: <span className="font-medium">{parsed.startTime}</span>
                                        </p>
                                      )}
                                      {parsed.endTime && (
                                        <p className="text-orange-700 dark:text-orange-300">
                                          Heure de fin: <span className="font-medium">{parsed.endTime}</span>
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {parsed.text && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Motif: {parsed.text}
                                    </p>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {event.is_rescheduled && event.original_session_date && event.reschedule_status === 'approved' && (
                          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Date originale: {format(new Date(event.original_session_date), "dd/MM/yyyy", { locale: fr })}
                            </p>
                            {event.reschedule_reason && (() => {
                              const parsed = parseRescheduleReason(event.reschedule_reason);
                              return parsed.text && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Motif: {parsed.text}
                                </p>
                              );
                            })()}
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

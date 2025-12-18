import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, BookOpen, User, MoreVertical, Edit, AlertTriangle, Calendar, Filter, X, GraduationCap, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MoveSessionDialog } from "./MoveSessionDialog";

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

interface FilterOption {
  id: string;
  name: string;
}

interface ModernCalendarViewProps {
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | undefined;
  canManage?: boolean;
  isTeacher?: boolean;
  onReschedule?: (sessionId: string) => void;
  onApproveReschedule?: (sessionId: string) => void;
  onMoveSession?: (sessionId: string, newDate: Date) => Promise<void>;
  classes?: FilterOption[];
  teachers?: FilterOption[];
  showFilters?: boolean;
}

export function ModernCalendarView({ 
  events, 
  onDateSelect, 
  selectedDate, 
  canManage = false,
  isTeacher = false,
  onReschedule,
  onApproveReschedule,
  onMoveSession,
  classes = [],
  teachers = [],
  showFilters = false,
}: ModernCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  
  // Drag and drop state
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<Date | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ event: CalendarEvent; newDate: Date } | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Filter events based on selected class and teacher
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesClass = selectedClass === "all" || event.class_name === selectedClass;
      const matchesTeacher = selectedTeacher === "all" || event.teacher_name === selectedTeacher;
      return matchesClass && matchesTeacher;
    });
  }, [events, selectedClass, selectedTeacher]);

  // Get unique class names and teacher names from events for filtering
  const uniqueClasses = useMemo(() => {
    const classSet = new Set<string>();
    events.forEach(e => e.class_name && classSet.add(e.class_name));
    return Array.from(classSet).sort();
  }, [events]);

  const uniqueTeachers = useMemo(() => {
    const teacherSet = new Set<string>();
    events.forEach(e => e.teacher_name && teacherSet.add(e.teacher_name));
    return Array.from(teacherSet).sort();
  }, [events]);

  const hasActiveFilters = selectedClass !== "all" || selectedTeacher !== "all";

  const clearFilters = () => {
    setSelectedClass("all");
    setSelectedTeacher("all");
  };

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
    return filteredEvents.filter(event => 
      event.session_date && isSameDay(new Date(event.session_date), date)
    );
  };

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setCurrentWeek(today);
    onDateSelect(today);
  };

  const getEventTypeStyles = (type: string) => {
    switch (type) {
      case 'course':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/40',
          border: 'border-l-blue-500',
          text: 'text-blue-700 dark:text-blue-300',
          badge: 'bg-blue-500 text-white',
          dot: 'bg-blue-500'
        };
      case 'exam':
        return {
          bg: 'bg-red-50 dark:bg-red-950/40',
          border: 'border-l-red-500',
          text: 'text-red-700 dark:text-red-300',
          badge: 'bg-red-500 text-white',
          dot: 'bg-red-500'
        };
      default:
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/40',
          border: 'border-l-purple-500',
          text: 'text-purple-700 dark:text-purple-300',
          badge: 'bg-purple-500 text-white',
          dot: 'bg-purple-500'
        };
    }
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Week view helpers
  const weekStart = startOfWeek(currentWeek, { locale: fr });
  const weekEnd = endOfWeek(currentWeek, { locale: fr });
  const weekDaysArray = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 16 }, (_, i) => i + 6);

  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter(event => 
      event.session_date && isSameDay(new Date(event.session_date), date)
    );
  };

  const getEventStartHour = (event: CalendarEvent) => {
    if (!event.start_time) return 0;
    const [hour] = event.start_time.split(':').map(Number);
    return hour;
  };

  const getEventDurationInHours = (event: CalendarEvent) => {
    if (!event.start_time || !event.end_time) return 1;
    const [startHour, startMinute] = event.start_time.split(':').map(Number);
    const [endHour, endMinute] = event.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    return (endMinutes - startMinutes) / 60;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    if (!canManage || !onMoveSession) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    setDraggedEvent(event);
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDropTargetDate(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    if (!draggedEvent || !canManage || !onMoveSession) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetDate(date);
  };

  const handleDragLeave = () => {
    setDropTargetDate(null);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (!draggedEvent || !canManage || !onMoveSession) return;
    
    // Don't move if dropping on the same date
    if (isSameDay(new Date(draggedEvent.session_date), date)) {
      setDraggedEvent(null);
      setDropTargetDate(null);
      return;
    }
    
    // Open confirmation dialog
    setPendingMove({ event: draggedEvent, newDate: date });
    setMoveDialogOpen(true);
    setDraggedEvent(null);
    setDropTargetDate(null);
  };

  const handleConfirmMove = async () => {
    if (!pendingMove || !onMoveSession) return;
    
    setIsMoving(true);
    try {
      await onMoveSession(pendingMove.event.id, pendingMove.newDate);
      setMoveDialogOpen(false);
      setPendingMove(null);
    } catch (error) {
      console.error('Error moving session:', error);
    } finally {
      setIsMoving(false);
    }
  };

  const handleCancelMove = () => {
    setMoveDialogOpen(false);
    setPendingMove(null);
  };

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4">
        {/* Top row: Title and navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Calendrier</h2>
            <p className="text-sm text-muted-foreground">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={handleToday} size="sm" className="h-9">
              Aujourd'hui
            </Button>
            <div className="flex items-center bg-muted/50 rounded-lg p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={viewMode === 'month' ? handlePreviousMonth : handlePreviousWeek}
                className="h-8 w-8"
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
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center bg-muted/50 rounded-lg p-1">
              <Button
                variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="h-8 px-3 text-xs font-medium"
              >
                Mois
              </Button>
              <Button
                variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="h-8 px-3 text-xs font-medium"
              >
                Semaine
              </Button>
            </div>
          </div>
        </div>

        {/* Filters row */}
        {showFilters && (uniqueClasses.length > 0 || uniqueTeachers.length > 0) && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filtres</span>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {uniqueClasses.length > 0 && (
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[180px] h-9 bg-background">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Toutes les classes" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {uniqueClasses.map(className => (
                    <SelectItem key={className} value={className}>{className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {uniqueTeachers.length > 0 && (
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="w-[200px] h-9 bg-background">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Tous les professeurs" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les professeurs</SelectItem>
                  {uniqueTeachers.map(teacherName => (
                    <SelectItem key={teacherName} value={teacherName}>{teacherName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4 mr-1" />
                Effacer
              </Button>
            )}

            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-auto">
                {filteredEvents.length} séance{filteredEvents.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-4">
        {/* Calendar */}
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {viewMode === 'month' ? (
              <>
                {/* Week days header */}
                <div className="grid grid-cols-7 border-b">
                  {weekDays.map(day => (
                    <div key={day} className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar days */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    const dayEvents = getEventsForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isDayToday = isToday(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isDropTarget = dropTargetDate && isSameDay(day, dropTargetDate);

                    return (
                      <div
                        key={idx}
                        onClick={() => onDateSelect(day)}
                        onDragOver={(e) => handleDragOver(e, day)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day)}
                        className={cn(
                          "relative border-r border-b p-2 text-left transition-all hover:bg-muted/50 min-h-[110px] cursor-pointer",
                          !isCurrentMonth && "bg-muted/20 text-muted-foreground/50",
                          isSelected && "bg-primary/5 ring-2 ring-primary ring-inset",
                          isDropTarget && "bg-primary/10 ring-2 ring-primary ring-dashed",
                        )}
                      >
                        <div className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors",
                          isDayToday && "bg-primary text-primary-foreground",
                          isSelected && !isDayToday && "bg-primary/20 text-primary"
                        )}>
                          {format(day, 'd')}
                        </div>
                        
                        <div className="space-y-1 mt-1">
                          {dayEvents.slice(0, 3).map(event => {
                            const styles = getEventTypeStyles(event.type);
                            const isDraggable = canManage && !!onMoveSession;
                            const isRescheduled = event.is_rescheduled && event.reschedule_status === 'approved';
                            
                            return (
                              <div
                                key={event.id}
                                draggable={isDraggable}
                                onDragStart={(e) => handleDragStart(e, event)}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                  "text-xs px-1.5 py-0.5 rounded truncate flex items-center gap-1",
                                  styles.bg, styles.text,
                                  isDraggable && "cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
                                  draggedEvent?.id === event.id && "opacity-50"
                                )}
                              >
                                <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", styles.dot)} />
                                <span className="truncate font-medium">
                                  {event.start_time?.slice(0, 5)} {event.title}
                                </span>
                                {isRescheduled && (
                                  <span className="flex-shrink-0 px-1 py-0.5 text-[10px] font-semibold rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                                    Reporté
                                  </span>
                                )}
                                {event.reschedule_status === 'pending' && (
                                  <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                )}
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-primary font-medium pl-1 hover:underline">
                              +{dayEvents.length - 3} autres
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              // Week View
              <ScrollArea className="h-[600px]">
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 z-20 bg-background">
                  <div className="p-3 border-r bg-muted/30" />
                  {weekDaysArray.map((day) => (
                    <div 
                      key={day.toISOString()} 
                      className={cn(
                        "p-3 text-center border-r",
                        isToday(day) && "bg-primary/5"
                      )}
                    >
                      <div className="text-xs text-muted-foreground font-medium uppercase">
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
                
                <div className="relative grid grid-cols-[60px_repeat(7,1fr)]">
                  <div className="sticky left-0 z-10 bg-background">
                    {hours.map((hour) => (
                      <div 
                        key={hour} 
                        className="h-16 border-b border-r bg-muted/20 px-2 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                    ))}
                  </div>
                  
                  {weekDaysArray.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentDay = isToday(day);
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "relative border-r",
                          isCurrentDay && "bg-primary/5"
                        )}
                      >
                        {hours.map((hour) => (
                          <div
                            key={hour}
                            className="h-16 border-b hover:bg-muted/30 cursor-pointer transition-colors"
                            onClick={() => onDateSelect(day)}
                          />
                        ))}
                        
                        <div className="absolute inset-0 pointer-events-none">
                          {dayEvents.map((event, idx) => {
                            const startHour = getEventStartHour(event);
                            const duration = getEventDurationInHours(event);
                            const topPosition = (startHour - 6) * 64;
                            const height = Math.max(duration * 64, 32);
                            const styles = getEventTypeStyles(event.type);
                            
                            return (
                              <div
                                key={event.id}
                                className={cn(
                                  "absolute left-0.5 right-0.5 rounded-md shadow-sm pointer-events-auto cursor-pointer hover:shadow-md transition-shadow overflow-hidden border-l-2",
                                  styles.bg, styles.border
                                )}
                                style={{
                                  top: `${topPosition}px`,
                                  height: `${height}px`,
                                  zIndex: 5 + idx
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDateSelect(day);
                                }}
                              >
                                <div className="p-1.5 h-full flex flex-col">
                                  <div className={cn("font-semibold text-xs truncate", styles.text)}>{event.title}</div>
                                  {event.start_time && (
                                    <div className={cn("text-xs opacity-80", styles.text)}>
                                      {event.start_time?.slice(0, 5)} - {event.end_time?.slice(0, 5)}
                                    </div>
                                  )}
                                  {event.class_name && (
                                    <div className={cn("text-xs font-medium mt-auto truncate", styles.text)}>
                                      {event.class_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Events sidebar - Redesigned */}
        <Card className="shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedDate ? format(selectedDate, 'EEEE d MMMM', { locale: fr }) : "Sélectionnez une date"}
                </h3>
                {selectedDate && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {selectedDateEvents.length} séance{selectedDateEvents.length !== 1 ? 's' : ''} prévue{selectedDateEvents.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {selectedDate && isToday(selectedDate) && (
                <Badge className="bg-primary/10 text-primary border-0">Aujourd'hui</Badge>
              )}
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
            <div className="p-4">
              {selectedDate ? (
                selectedDateEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => {
                      const styles = getEventTypeStyles(event.type);
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "rounded-lg border-l-4 p-4 transition-all hover:shadow-md",
                            styles.bg, styles.border
                          )}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={cn("font-semibold text-base", styles.text)}>{event.title}</h4>
                                <Badge className={cn("text-xs", styles.badge)}>
                                  {event.type === 'course' ? 'Cours' : event.type === 'exam' ? 'Examen' : 'Devoir'}
                                </Badge>
                                {event.is_rescheduled && event.reschedule_status === 'approved' && (
                                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800">
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Reporté
                                  </Badge>
                                )}
                              </div>
                              {event.reschedule_status === 'pending' && (
                                <Badge variant="outline" className="mt-2 bg-orange-50 text-orange-600 border-orange-200">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Demande de report
                                </Badge>
                              )}
                            </div>
                            
                            {canManage && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                          
                          {/* Details */}
                          <div className="space-y-2">
                            {event.start_time && event.end_time && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{event.start_time?.slice(0, 5)} - {event.end_time?.slice(0, 5)}</span>
                              </div>
                            )}
                            
                            {event.class_name && (
                              <div className="flex items-center gap-2 text-sm">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span>{event.class_name}</span>
                              </div>
                            )}
                            
                            {event.teacher_name && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{event.teacher_name}</span>
                              </div>
                            )}
                          </div>

                          {/* Reschedule info */}
                          {event.reschedule_status === 'pending' && event.proposed_new_date && (
                            <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                              <div className="flex items-center gap-2 text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">
                                <Calendar className="h-3 w-3" />
                                Nouvelle date proposée
                              </div>
                              <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                                {format(new Date(event.proposed_new_date), "EEEE dd MMMM yyyy", { locale: fr })}
                              </p>
                              {event.reschedule_reason && (() => {
                                const parsed = parseRescheduleReason(event.reschedule_reason);
                                return parsed.text && (
                                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                    Motif: {parsed.text}
                                  </p>
                                );
                              })()}
                            </div>
                          )}

                          {event.is_rescheduled && event.original_session_date && event.reschedule_status === 'approved' && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                Date originale: {format(new Date(event.original_session_date), "dd/MM/yyyy", { locale: fr })}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-base font-medium text-muted-foreground mb-1">Aucune séance</p>
                    <p className="text-sm text-muted-foreground/70">Pas d'événement prévu ce jour</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-base font-medium text-muted-foreground mb-1">Calendrier interactif</p>
                  <p className="text-sm text-muted-foreground/70">Cliquez sur une date pour voir les détails</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Move Session Confirmation Dialog */}
      {pendingMove && (
        <MoveSessionDialog
          open={moveDialogOpen}
          onOpenChange={handleCancelMove}
          sessionTitle={pendingMove.event.title}
          originalDate={new Date(pendingMove.event.session_date)}
          newDate={pendingMove.newDate}
          startTime={pendingMove.event.start_time || undefined}
          endTime={pendingMove.event.end_time || undefined}
          onConfirm={handleConfirmMove}
          loading={isMoving}
        />
      )}
    </div>
  );
}

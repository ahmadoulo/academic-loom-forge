import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, BookOpen, User, MoreVertical, Edit, AlertTriangle, Calendar, Filter, X, GraduationCap, RefreshCw, GripVertical, Move } from "lucide-react";
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
  
  // Drag and drop state (unified for mouse and touch)
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<Date | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ event: CalendarEvent; newDate: Date } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Touch drag state
  const touchStartRef = useRef<{ x: number; y: number; event: CalendarEvent } | null>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const dayRefsRef = useRef<Map<string, HTMLDivElement>>(new Map());

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
          dot: 'bg-blue-500',
          ghostBg: 'bg-blue-100/90 dark:bg-blue-900/90'
        };
      case 'exam':
        return {
          bg: 'bg-red-50 dark:bg-red-950/40',
          border: 'border-l-red-500',
          text: 'text-red-700 dark:text-red-300',
          badge: 'bg-red-500 text-white',
          dot: 'bg-red-500',
          ghostBg: 'bg-red-100/90 dark:bg-red-900/90'
        };
      default:
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/40',
          border: 'border-l-purple-500',
          text: 'text-purple-700 dark:text-purple-300',
          badge: 'bg-purple-500 text-white',
          dot: 'bg-purple-500',
          ghostBg: 'bg-purple-100/90 dark:bg-purple-900/90'
        };
    }
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Week view helpers
  const weekStart = startOfWeek(currentWeek, { locale: fr });
  const weekEnd = endOfWeek(currentWeek, { locale: fr });
  const weekDaysArray = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7h to 20h

  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter(event => 
      event.session_date && isSameDay(new Date(event.session_date), date)
    );
  };

  const getEventStartHour = (event: CalendarEvent) => {
    if (!event.start_time) return 8;
    const [hour] = event.start_time.split(':').map(Number);
    return hour;
  };

  const getEventStartMinutes = (event: CalendarEvent) => {
    if (!event.start_time) return 0;
    const [, minutes] = event.start_time.split(':').map(Number);
    return minutes || 0;
  };

  const getEventDurationInMinutes = (event: CalendarEvent) => {
    if (!event.start_time || !event.end_time) return 60;
    const [startHour, startMinute] = event.start_time.split(':').map(Number);
    const [endHour, endMinute] = event.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + (startMinute || 0);
    const endMinutes = endHour * 60 + (endMinute || 0);
    return Math.max(endMinutes - startMinutes, 30);
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Create and remove drag ghost for touch
  const createDragGhost = useCallback((event: CalendarEvent, x: number, y: number) => {
    if (dragGhostRef.current) {
      document.body.removeChild(dragGhostRef.current);
    }
    
    const ghost = document.createElement('div');
    const styles = getEventTypeStyles(event.type);
    ghost.className = `fixed pointer-events-none z-50 px-3 py-2 rounded-lg shadow-xl border-l-4 ${styles.ghostBg} ${styles.border} ${styles.text}`;
    ghost.style.transform = 'translate(-50%, -50%)';
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y}px`;
    ghost.style.minWidth = '120px';
    ghost.style.maxWidth = '200px';
    ghost.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
        </svg>
        <span class="font-medium text-sm truncate">${event.title}</span>
      </div>
    `;
    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;
  }, []);

  const updateDragGhost = useCallback((x: number, y: number) => {
    if (dragGhostRef.current) {
      dragGhostRef.current.style.left = `${x}px`;
      dragGhostRef.current.style.top = `${y}px`;
    }
  }, []);

  const removeDragGhost = useCallback(() => {
    if (dragGhostRef.current) {
      document.body.removeChild(dragGhostRef.current);
      dragGhostRef.current = null;
    }
  }, []);

  // Find date at position for touch
  const findDateAtPosition = useCallback((x: number, y: number): Date | null => {
    for (const [dateStr, element] of dayRefsRef.current.entries()) {
      const rect = element.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return new Date(dateStr);
      }
    }
    return null;
  }, []);

  // Mouse drag handlers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    if (!canManage || !onMoveSession) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    setDraggedEvent(event);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDropTargetDate(null);
    setIsDragging(false);
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
      handleDragEnd();
      return;
    }
    
    // Open confirmation dialog
    setPendingMove({ event: draggedEvent, newDate: date });
    setMoveDialogOpen(true);
    handleDragEnd();
  };

  // Touch drag handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, event: CalendarEvent) => {
    if (!canManage || !onMoveSession) return;
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      event
    };
  }, [canManage, onMoveSession]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !canManage || !onMoveSession) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Start dragging if moved more than 10px
    if (!isDragging && (deltaX > 10 || deltaY > 10)) {
      setIsDragging(true);
      setDraggedEvent(touchStartRef.current.event);
      createDragGhost(touchStartRef.current.event, touch.clientX, touch.clientY);
      e.preventDefault();
    }
    
    if (isDragging) {
      e.preventDefault();
      updateDragGhost(touch.clientX, touch.clientY);
      
      // Find target date
      const targetDate = findDateAtPosition(touch.clientX, touch.clientY);
      setDropTargetDate(targetDate);
    }
  }, [canManage, onMoveSession, isDragging, createDragGhost, updateDragGhost, findDateAtPosition]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    if (isDragging && draggedEvent && dropTargetDate) {
      // Don't move if dropping on the same date
      if (!isSameDay(new Date(draggedEvent.session_date), dropTargetDate)) {
        setPendingMove({ event: draggedEvent, newDate: dropTargetDate });
        setMoveDialogOpen(true);
      }
    }
    
    removeDragGhost();
    setIsDragging(false);
    setDraggedEvent(null);
    setDropTargetDate(null);
    touchStartRef.current = null;
  }, [isDragging, draggedEvent, dropTargetDate, removeDragGhost]);

  // Register day ref
  const registerDayRef = useCallback((date: Date, element: HTMLDivElement | null) => {
    const key = date.toISOString();
    if (element) {
      dayRefsRef.current.set(key, element);
    } else {
      dayRefsRef.current.delete(key);
    }
  }, []);

  // Cleanup ghost on unmount
  useEffect(() => {
    return () => {
      removeDragGhost();
    };
  }, [removeDragGhost]);

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

  // Render a draggable event pill for month view
  const renderMonthEventPill = (event: CalendarEvent) => {
    const styles = getEventTypeStyles(event.type);
    const isDraggable = canManage && !!onMoveSession;
    const isRescheduled = event.is_rescheduled && event.reschedule_status === 'approved';
    const isBeingDragged = draggedEvent?.id === event.id;
    
    return (
      <div
        key={event.id}
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, event)}
        onDragEnd={handleDragEnd}
        onTouchStart={(e) => handleTouchStart(e, event)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "text-xs px-2 py-1 rounded-md flex items-center gap-1.5 transition-all select-none",
          styles.bg, styles.text,
          isDraggable && "cursor-grab active:cursor-grabbing touch-none",
          isDraggable && "hover:shadow-md hover:scale-[1.02]",
          isBeingDragged && "opacity-40 scale-95"
        )}
      >
        {isDraggable && (
          <GripVertical className="h-3 w-3 opacity-40 flex-shrink-0" />
        )}
        <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", styles.dot)} />
        <span className="truncate font-medium flex-1 min-w-0">
          {event.start_time?.slice(0, 5)} {event.title}
        </span>
        {isRescheduled && (
          <span className="flex-shrink-0 px-1 py-0.5 text-[9px] font-semibold rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
            Reporté
          </span>
        )}
        {event.reschedule_status === 'pending' && (
          <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />
        )}
      </div>
    );
  };

  // Render week view event card
  const renderWeekEventCard = (event: CalendarEvent, day: Date, columnEvents: CalendarEvent[], eventIndex: number) => {
    const startHour = getEventStartHour(event);
    const startMinutes = getEventStartMinutes(event);
    const durationMinutes = getEventDurationInMinutes(event);
    
    // Calculate position (7h is the first hour displayed)
    const topPosition = ((startHour - 7) * 60 + startMinutes) * (48 / 60); // 48px per hour
    const height = Math.max(durationMinutes * (48 / 60), 36); // Minimum 36px height
    
    const styles = getEventTypeStyles(event.type);
    const isDraggable = canManage && !!onMoveSession;
    const isBeingDragged = draggedEvent?.id === event.id;
    const isRescheduled = event.is_rescheduled && event.reschedule_status === 'approved';
    
    // Handle overlapping events
    const overlappingEvents = columnEvents.filter(other => {
      if (other.id === event.id) return false;
      const otherStart = getEventStartHour(other) * 60 + getEventStartMinutes(other);
      const otherEnd = otherStart + getEventDurationInMinutes(other);
      const eventStart = startHour * 60 + startMinutes;
      const eventEnd = eventStart + durationMinutes;
      return !(eventEnd <= otherStart || eventStart >= otherEnd);
    });
    
    const width = overlappingEvents.length > 0 ? `calc(${100 / (overlappingEvents.length + 1)}% - 4px)` : 'calc(100% - 8px)';
    const leftOffset = overlappingEvents.length > 0 ? `calc(${(eventIndex % (overlappingEvents.length + 1)) * (100 / (overlappingEvents.length + 1))}% + 4px)` : '4px';
    
    return (
      <div
        key={event.id}
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, event)}
        onDragEnd={handleDragEnd}
        onTouchStart={(e) => handleTouchStart(e, event)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "absolute rounded-md shadow-sm border-l-[3px] overflow-hidden transition-all",
          styles.bg, styles.border,
          isDraggable && "cursor-grab active:cursor-grabbing touch-none",
          isDraggable && "hover:shadow-lg hover:z-30",
          isBeingDragged && "opacity-40 scale-95"
        )}
        style={{
          top: `${topPosition}px`,
          height: `${height}px`,
          left: leftOffset,
          width: width,
          zIndex: 10 + eventIndex
        }}
        onClick={(e) => {
          e.stopPropagation();
          onDateSelect(day);
        }}
      >
        <div className="p-1.5 h-full flex flex-col overflow-hidden">
          <div className="flex items-start gap-1">
            {isDraggable && <Move className="h-3 w-3 opacity-40 flex-shrink-0 mt-0.5" />}
            <div className={cn("font-semibold text-[11px] leading-tight truncate flex-1", styles.text)}>
              {event.title}
            </div>
            {isRescheduled && (
              <RefreshCw className="h-3 w-3 text-orange-500 flex-shrink-0" />
            )}
          </div>
          {height >= 48 && event.start_time && (
            <div className={cn("text-[10px] opacity-75 mt-0.5", styles.text)}>
              {event.start_time?.slice(0, 5)} - {event.end_time?.slice(0, 5)}
            </div>
          )}
          {height >= 60 && event.class_name && (
            <div className={cn("text-[10px] font-medium mt-auto truncate", styles.text)}>
              {event.class_name}
            </div>
          )}
        </div>
      </div>
    );
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
              {canManage && onMoveSession && (
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  Glissez pour déplacer
                </span>
              )}
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
      <div className="grid lg:grid-cols-[1fr_380px] gap-4" ref={calendarRef}>
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
                        ref={(el) => registerDayRef(day, el)}
                        onClick={() => onDateSelect(day)}
                        onDragOver={(e) => handleDragOver(e, day)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day)}
                        className={cn(
                          "relative border-r border-b p-2 text-left transition-all hover:bg-muted/50 min-h-[120px] cursor-pointer",
                          !isCurrentMonth && "bg-muted/20 text-muted-foreground/50",
                          isSelected && "bg-primary/5 ring-2 ring-primary ring-inset",
                          isDropTarget && "bg-primary/20 ring-2 ring-primary ring-dashed scale-[0.98]",
                        )}
                      >
                        <div className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors",
                          isDayToday && "bg-primary text-primary-foreground",
                          isSelected && !isDayToday && "bg-primary/20 text-primary"
                        )}>
                          {format(day, 'd')}
                        </div>
                        
                        <div className="space-y-1 mt-1.5">
                          {dayEvents.slice(0, 3).map(event => renderMonthEventPill(event))}
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
              // Week View - Improved layout
              <div className="overflow-hidden">
                {/* Week header */}
                <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b bg-muted/30">
                  <div className="p-2 border-r" />
                  {weekDaysArray.map((day) => (
                    <div 
                      key={day.toISOString()} 
                      ref={(el) => registerDayRef(day, el)}
                      className={cn(
                        "p-2 text-center border-r transition-colors",
                        isToday(day) && "bg-primary/10",
                        dropTargetDate && isSameDay(day, dropTargetDate) && "bg-primary/20"
                      )}
                      onDragOver={(e) => handleDragOver(e, day)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day)}
                    >
                      <div className="text-[10px] text-muted-foreground font-medium uppercase">
                        {format(day, 'EEE', { locale: fr })}
                      </div>
                      <div className={cn(
                        "text-base font-semibold",
                        isToday(day) && "text-primary"
                      )}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Time grid */}
                <ScrollArea className="h-[560px]">
                  <div className="relative grid grid-cols-[50px_repeat(7,1fr)] min-w-[700px]">
                    {/* Hours column */}
                    <div className="sticky left-0 z-10 bg-background">
                      {hours.map((hour) => (
                        <div 
                          key={hour} 
                          className="h-12 border-b border-r px-1 flex items-start pt-0.5 text-[10px] font-medium text-muted-foreground bg-muted/10"
                        >
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>
                    
                    {/* Day columns */}
                    {weekDaysArray.map((day) => {
                      const dayEvents = getEventsForDay(day);
                      const isCurrentDay = isToday(day);
                      const isDropTargetDay = dropTargetDate && isSameDay(day, dropTargetDate);
                      
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "relative border-r",
                            isCurrentDay && "bg-primary/5",
                            isDropTargetDay && "bg-primary/10"
                          )}
                          onDragOver={(e) => handleDragOver(e, day)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, day)}
                        >
                          {/* Hour slots */}
                          {hours.map((hour) => (
                            <div
                              key={hour}
                              className="h-12 border-b hover:bg-muted/30 cursor-pointer transition-colors"
                              onClick={() => onDateSelect(day)}
                            />
                          ))}
                          
                          {/* Events overlay */}
                          <div className="absolute inset-0 overflow-hidden">
                            {dayEvents.map((event, idx) => renderWeekEventCard(event, day, dayEvents, idx))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events sidebar */}
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

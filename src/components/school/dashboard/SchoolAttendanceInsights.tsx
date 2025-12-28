import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { 
  CalendarDays, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
  School,
  BarChart3,
  Clock,
  UserX
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  status: string;
  date: string;
  is_justified: boolean;
}

interface ClassData {
  id: string;
  name: string;
}

interface StudentData {
  id: string;
  class_id: string;
}

interface AbsenceByClassData {
  classId: string;
  className: string;
  totalAbsences: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
  totalStudents: number;
  absenceRate: number;
  attendanceRate: number;
}

interface SchoolAttendanceInsightsProps {
  schoolId: string;
  classes: ClassData[];
  students: StudentData[];
}

type DateRange = 'today' | 'week' | 'month' | 'custom';

export function SchoolAttendanceInsights({ schoolId, classes, students }: SchoolAttendanceInsightsProps) {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Calculer les dates en fonction de la plage sélectionnée
  const dateFilter = useMemo(() => {
    const today = new Date();
    switch (dateRange) {
      case 'today':
        return { start: today, end: today };
      case 'week':
        return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'custom':
        return customDate ? { start: customDate, end: customDate } : { start: today, end: today };
      default:
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  }, [dateRange, customDate]);

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!schoolId) return;

      try {
        setLoading(true);
        const startDate = format(dateFilter.start, 'yyyy-MM-dd');
        const endDate = format(dateFilter.end, 'yyyy-MM-dd');

        const { data, error } = await supabase
          .from('attendance')
          .select('id, student_id, class_id, status, date, is_justified')
          .gte('date', startDate)
          .lte('date', endDate);

        if (error) throw error;

        // Filtrer par les classes de l'école
        const schoolClassIds = classes.map(c => c.id);
        const filteredData = (data || []).filter(a => schoolClassIds.includes(a.class_id));
        
        setAttendance(filteredData);
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [schoolId, dateFilter, classes]);

  // Calculer les absences par classe
  const absencesByClass = useMemo((): AbsenceByClassData[] => {
    if (!classes.length || !students.length) return [];

    const filteredClasses = selectedClass === 'all' 
      ? classes 
      : classes.filter(c => c.id === selectedClass);

    return filteredClasses.map(classItem => {
      const classStudents = students.filter(s => s.class_id === classItem.id);
      const classAttendance = attendance.filter(a => a.class_id === classItem.id);
      const classAbsences = classAttendance.filter(a => a.status === 'absent');
      const justifiedAbsences = classAbsences.filter(a => a.is_justified).length;
      const unjustifiedAbsences = classAbsences.filter(a => !a.is_justified).length;
      const totalPresent = classAttendance.filter(a => a.status === 'present').length;
      const totalRecords = classAttendance.length;

      return {
        classId: classItem.id,
        className: classItem.name,
        totalAbsences: classAbsences.length,
        justifiedAbsences,
        unjustifiedAbsences,
        totalStudents: classStudents.length,
        absenceRate: totalRecords > 0 ? (classAbsences.length / totalRecords) * 100 : 0,
        attendanceRate: totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0
      };
    }).sort((a, b) => b.absenceRate - a.absenceRate);
  }, [classes, students, attendance, selectedClass]);

  // Statistiques globales
  const globalStats = useMemo(() => {
    const totalRecords = attendance.length;
    const totalAbsences = attendance.filter(a => a.status === 'absent').length;
    const totalPresent = attendance.filter(a => a.status === 'present').length;
    const justifiedAbsences = attendance.filter(a => a.status === 'absent' && a.is_justified).length;
    const unjustifiedAbsences = attendance.filter(a => a.status === 'absent' && !a.is_justified).length;

    return {
      totalRecords,
      totalAbsences,
      totalPresent,
      justifiedAbsences,
      unjustifiedAbsences,
      attendanceRate: totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0,
      absenceRate: totalRecords > 0 ? Math.round((totalAbsences / totalRecords) * 100) : 0
    };
  }, [attendance]);

  // Top classes avec le plus d'absences
  const topAbsentClasses = useMemo(() => {
    return absencesByClass
      .filter(c => c.totalAbsences > 0)
      .slice(0, 5);
  }, [absencesByClass]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Suivi des Absences</CardTitle>
                <CardDescription>Données en temps réel de l'établissement</CardDescription>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                <SelectTrigger className="w-[140px]">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="custom">Date précise</SelectItem>
                </SelectContent>
              </Select>

              {dateRange === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {customDate ? format(customDate, 'dd MMM yyyy', { locale: fr }) : 'Choisir'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={setCustomDate}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              )}

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[160px]">
                  <School className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de présence</p>
                <p className="text-2xl font-bold text-green-600">{globalStats.attendanceRate}%</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <Progress value={globalStats.attendanceRate} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absences totales</p>
                <p className="text-2xl font-bold text-red-600">{globalStats.totalAbsences}</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-full">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Sur {globalStats.totalRecords} enregistrements
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Non justifiées</p>
                <p className="text-2xl font-bold text-amber-600">{globalStats.unjustifiedAbsences}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-full">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Requièrent une attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Justifiées</p>
                <p className="text-2xl font-bold text-blue-600">{globalStats.justifiedAbsences}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-full">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Avec justificatif valide
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Absences par classe */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-base">Absences par Classe</CardTitle>
                <CardDescription className="text-xs">
                  {format(dateFilter.start, 'dd MMM', { locale: fr })} - {format(dateFilter.end, 'dd MMM yyyy', { locale: fr })}
                </CardDescription>
              </div>
            </div>
            {globalStats.attendanceRate >= 90 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                Bonne assiduité
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {topAbsentClasses.length > 0 ? (
            <div className="space-y-3">
              {topAbsentClasses.map((item) => (
                <div 
                  key={item.classId} 
                  className="p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{item.className}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.totalStudents} étudiants
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={item.absenceRate > 15 ? "destructive" : item.absenceRate > 10 ? "outline" : "secondary"}
                        className="font-mono"
                      >
                        {item.absenceRate.toFixed(1)}% absences
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-muted-foreground">
                        {item.totalAbsences} absences
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground">
                        {item.unjustifiedAbsences} non justifiées
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">
                        {item.justifiedAbsences} justifiées
                      </span>
                    </div>
                  </div>

                  <Progress 
                    value={item.attendanceRate} 
                    className="h-1.5 mt-3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Présence: {item.attendanceRate.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">Aucune absence enregistrée</p>
              <p className="text-sm">Pour la période sélectionnée</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, BookOpen } from "lucide-react";
import { format, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface Assignment {
  id: string;
  title: string;
  session_date: string;
  start_time?: string | null;
  end_time?: string | null;
  type: string;
  classes?: {
    name: string;
  };
}

interface StudentUpcomingCoursesSectionProps {
  assignments: Assignment[];
}

export const StudentUpcomingCoursesSection = ({ assignments }: StudentUpcomingCoursesSectionProps) => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Lundi
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Dimanche

  // Filtrer uniquement les cours de la semaine en cours
  const weekCourses = assignments
    .filter(a => {
      if (a.type !== 'course' || !a.session_date) return false;
      const sessionDate = new Date(a.session_date);
      return sessionDate >= weekStart && sessionDate <= weekEnd && sessionDate >= today;
    })
    .sort((a, b) => {
      if (a.session_date === b.session_date) {
        return (a.start_time || '').localeCompare(b.start_time || '');
      }
      return a.session_date.localeCompare(b.session_date);
    });

  // Grouper par jour
  const coursesByDay: { [key: string]: Assignment[] } = {
    'Lundi': [],
    'Mardi': [],
    'Mercredi': [],
    'Jeudi': [],
    'Vendredi': [],
    'Samedi': [],
  };

  weekCourses.forEach(course => {
    const courseDate = new Date(course.session_date);
    const dayName = format(courseDate, 'EEEE', { locale: fr });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    if (coursesByDay[capitalizedDay]) {
      coursesByDay[capitalizedDay].push(course);
    }
  });

  // Trouver le premier jour avec des cours pour l'onglet par défaut
  const defaultDay = Object.keys(coursesByDay).find(day => coursesByDay[day].length > 0) || 'Lundi';

  const renderCourseCard = (course: Assignment) => {
    const courseDate = new Date(course.session_date);
    const isToday = isSameDay(courseDate, today);

    return (
      <Card key={course.id} className={`${isToday ? 'border-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">{course.title}</h4>
            </div>
            {isToday && <Badge variant="default">Aujourd'hui</Badge>}
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(courseDate, 'd MMMM', { locale: fr })}
            </div>
            {course.start_time && course.end_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {course.start_time} - {course.end_time}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (weekCourses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Séances de la semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aucune séance programmée cette semaine
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Séances de la semaine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultDay} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {Object.keys(coursesByDay).map(day => (
              <TabsTrigger 
                key={day} 
                value={day}
                disabled={coursesByDay[day].length === 0}
                className="text-xs sm:text-sm"
              >
                {day}
                {coursesByDay[day].length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {coursesByDay[day].length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.keys(coursesByDay).map(day => (
            <TabsContent key={day} value={day} className="mt-4">
              {coursesByDay[day].length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {coursesByDay[day].map(renderCourseCard)}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Aucune séance ce jour
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

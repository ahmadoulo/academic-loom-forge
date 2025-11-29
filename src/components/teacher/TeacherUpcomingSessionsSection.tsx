import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";

interface Assignment {
  id: string;
  title: string;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  type: string;
  class_id: string;
  subjects?: {
    name: string;
  } | null;
}

interface ClassInfo {
  id: string;
  name: string;
}

interface TeacherUpcomingSessionsSectionProps {
  assignments: Assignment[];
  teacherClasses: ClassInfo[];
}

export const TeacherUpcomingSessionsSection = ({ assignments, teacherClasses }: TeacherUpcomingSessionsSectionProps) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Lundi
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Dimanche

  // Filtrer les séances de la semaine en cours (à partir de demain)
  const weekSessions = assignments
    .filter(a => {
      if (!a.session_date) return false;
      const sessionDate = new Date(a.session_date);
      return a.session_date >= tomorrowStr && sessionDate >= tomorrow && sessionDate <= weekEnd;
    })
    .sort((a, b) => {
      if (a.session_date === b.session_date) {
        return (a.start_time || '').localeCompare(b.start_time || '');
      }
      return (a.session_date || '').localeCompare(b.session_date || '');
    });

  // Grouper par classe
  const sessionsByClass: { [classId: string]: Assignment[] } = {};
  teacherClasses.forEach(cls => {
    sessionsByClass[cls.id] = weekSessions.filter(s => s.class_id === cls.id);
  });

  // Trouver la première classe avec des sessions pour l'onglet par défaut
  const defaultClass = teacherClasses.find(cls => sessionsByClass[cls.id]?.length > 0)?.id || teacherClasses[0]?.id;

  const renderSessionCard = (session: Assignment) => {
    if (!session.session_date) return null;

    return (
      <Card key={session.id}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold">{session.title}</h4>
              {session.subjects && (
                <Badge variant="outline" className="mt-1">{session.subjects.name}</Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(session.session_date), 'EEEE d MMMM', { locale: fr })}
            </div>
            {session.start_time && session.end_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {session.start_time} - {session.end_time}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (weekSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
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
          <Calendar className="h-5 w-5" />
          Séances de la semaine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultClass} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${teacherClasses.length}, minmax(0, 1fr))` }}>
            {teacherClasses.map(cls => (
              <TabsTrigger 
                key={cls.id} 
                value={cls.id}
                disabled={!sessionsByClass[cls.id] || sessionsByClass[cls.id].length === 0}
                className="text-xs sm:text-sm truncate"
              >
                {cls.name}
                {sessionsByClass[cls.id]?.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {sessionsByClass[cls.id].length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {teacherClasses.map(cls => (
            <TabsContent key={cls.id} value={cls.id} className="mt-4">
              {sessionsByClass[cls.id]?.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {sessionsByClass[cls.id].map(renderSessionCard)}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Aucune séance cette semaine pour {cls.name}
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

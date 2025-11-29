import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  type: string;
  subjects?: {
    id: string;
    name: string;
  } | null;
}

interface SessionsListProps {
  assignments: Assignment[];
  onSelectSession: (assignment: Assignment) => void;
}

export function SessionsList({ assignments, onSelectSession }: SessionsListProps) {
  const today = new Date().toISOString().split('T')[0];
  
  // Filtrer SEULEMENT les séances d'aujourd'hui (pour la prise de présence)
  const validSessions = assignments.filter(a => a.session_date && a.type === 'course');
  const todaySessions = validSessions
    .filter(a => a.session_date === today)
    .sort((a, b) => {
      // Trier par heure de début
      return (a.start_time || '').localeCompare(b.start_time || '');
    });

  const renderSessionCard = (assignment: Assignment) => {
    if (!assignment.session_date) return null;
    
    return (
      <Card 
        key={assignment.id} 
        className="cursor-pointer hover:shadow-md transition-shadow border-primary"
        onClick={() => onSelectSession(assignment)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{assignment.title}</h3>
                <Badge variant="default" className="bg-primary">Aujourd'hui</Badge>
              </div>
              {assignment.subjects && (
                <Badge variant="outline">{assignment.subjects.name}</Badge>
              )}
              {assignment.description && (
                <p className="text-sm text-muted-foreground mt-2">{assignment.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(assignment.session_date), 'EEEE d MMMM', { locale: fr })}
            </div>
            {assignment.start_time && assignment.end_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {assignment.start_time} - {assignment.end_time}
              </div>
            )}
          </div>

          <Button 
            className="w-full mt-3" 
            variant="default"
            onClick={(e) => {
              e.stopPropagation();
              onSelectSession(assignment);
            }}
          >
            <Users className="h-4 w-4 mr-2" />
            Prendre les présences
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {todaySessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Séances d'aujourd'hui</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {todaySessions.map(renderSessionCard)}
          </div>
        </div>
      )}

      {todaySessions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">Aucune séance aujourd'hui</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
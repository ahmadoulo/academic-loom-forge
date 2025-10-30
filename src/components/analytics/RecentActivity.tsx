import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { TrendingUp, User, School, GraduationCap, BookOpen, Clock } from "lucide-react";

interface Activity {
  id: string;
  type: "grade" | "student" | "class" | "teacher" | "subject";
  title: string;
  description: string;
  timestamp: string;
  status?: "success" | "warning" | "error";
  studentName?: string;
  teacherName?: string;
}

interface RecentActivityProps {
  activities: Activity[];
  title?: string;
}

export function RecentActivity({ activities, title = "Activité récente" }: RecentActivityProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case "grade": return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case "student": return <User className="h-5 w-5 text-green-600" />;
      case "class": return <School className="h-5 w-5 text-purple-600" />;
      case "teacher": return <GraduationCap className="h-5 w-5 text-orange-600" />;
      case "subject": return <BookOpen className="h-5 w-5 text-indigo-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status?: Activity['status']) => {
    switch (status) {
      case "success": return "bg-green-50 text-green-700 border-green-200";
      case "warning": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "error": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucune activité récente</p>
              <p className="text-sm text-muted-foreground">Les activités apparaîtront ici</p>
            </div>
          ) : (
            activities.slice(0, 6).map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-md transition-all duration-200 bg-card">
                {/* Avatar ou icône */}
                <div className="flex-shrink-0">
                  {activity.type === "student" && activity.studentName ? (
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                        {getInitials(activity.studentName)}
                      </AvatarFallback>
                    </Avatar>
                  ) : activity.type === "teacher" && activity.teacherName ? (
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold">
                        {getInitials(activity.teacherName)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border-2 border-background shadow-sm">
                      {getActivityIcon(activity.type)}
                    </div>
                  )}
                </div>
                
                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-base truncate text-foreground">{activity.title}</h4>
                    {activity.status && (
                      <Badge className={`text-xs font-medium border ${getStatusColor(activity.status)}`}>
                        {activity.status === "success" ? "Réussi" : 
                         activity.status === "warning" ? "Attention" : 
                         activity.status === "error" ? "Erreur" : activity.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {activities.length > 6 && (
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Et {activities.length - 6} autres activités...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Activity {
  id: string;
  type: "grade" | "student" | "class" | "teacher" | "subject";
  title: string;
  description: string;
  timestamp: string;
  status?: "success" | "warning" | "error";
}

interface RecentActivityProps {
  activities: Activity[];
  title?: string;
}

export function RecentActivity({ activities, title = "Activité récente" }: RecentActivityProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case "grade": return "📝";
      case "student": return "👨‍🎓";
      case "class": return "🏫";
      case "teacher": return "👨‍🏫";
      case "subject": return "📚";
      default: return "📋";
    }
  };

  const getStatusColor = (status?: Activity['status']) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucune activité récente
            </p>
          ) : (
            activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="text-lg">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{activity.title}</h4>
                    {activity.status && (
                      <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
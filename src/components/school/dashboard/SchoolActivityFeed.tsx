import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Clock, 
  TrendingUp, 
  User, 
  School,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Activity {
  id: string;
  type: "grade" | "student" | "class" | "teacher" | "subject";
  title: string;
  description: string;
  timestamp: string;
  status?: "success" | "warning" | "error";
}

interface SchoolActivityFeedProps {
  activities: Activity[];
}

export function SchoolActivityFeed({ activities }: SchoolActivityFeedProps) {
  const getStatusIcon = (status?: Activity['status']) => {
    switch (status) {
      case "success": return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "warning": return <AlertCircle className="h-3 w-3 text-amber-500" />;
      case "error": return <AlertCircle className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: Activity['type']) => {
    switch (type) {
      case "grade": return <TrendingUp className="h-4 w-4" />;
      case "student": return <User className="h-4 w-4" />;
      case "class": return <School className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeBgColor = (type: Activity['type']) => {
    switch (type) {
      case "grade": return "bg-blue-100 dark:bg-blue-900/30 text-blue-600";
      case "student": return "bg-green-100 dark:bg-green-900/30 text-green-600";
      case "class": return "bg-purple-100 dark:bg-purple-900/30 text-purple-600";
      default: return "bg-gray-100 dark:bg-gray-900/30 text-gray-600";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-muted">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-base">Activité Récente</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune activité récente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
              >
                <div className={`p-2 rounded-lg shrink-0 ${getTypeBgColor(activity.type)}`}>
                  {getTypeIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    {getStatusIcon(activity.status)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

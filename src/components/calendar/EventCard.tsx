import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Edit, Trash2 } from "lucide-react";
import { Event } from "@/hooks/useEvents";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
}

export function EventCard({ event, onEdit, onDelete, canEdit = false }: EventCardProps) {
  const startTime = format(new Date(event.start_at), "HH:mm", { locale: fr });
  const endTime = format(new Date(event.end_at), "HH:mm", { locale: fr });

  const getScopeBadgeVariant = (scope: string) => {
    switch (scope) {
      case 'school':
        return 'default';
      case 'class':
        return 'secondary';
      case 'subject':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-foreground">{event.title}</h4>
            <Badge variant={getScopeBadgeVariant(event.scope)}>
              {event.scope}
            </Badge>
          </div>
          
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{startTime} - {endTime}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit?.(event)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete?.(event.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

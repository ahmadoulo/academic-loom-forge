import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin, Edit, Trash2 } from "lucide-react";
import { Announcement } from "@/hooks/useAnnouncements";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
}

export function AnnouncementCard({ announcement, onEdit, onDelete, canEdit = false }: AnnouncementCardProps) {
  const getVisibilityBadgeVariant = (visibility: string) => {
    switch (visibility) {
      case 'all':
        return 'default';
      case 'students':
        return 'secondary';
      case 'teachers':
        return 'outline';
      case 'class':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card className={`p-4 hover:shadow-md transition-all duration-200 ${announcement.pinned ? 'border-primary' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {announcement.pinned && <Pin className="h-4 w-4 text-primary" />}
            <h4 className="font-semibold text-foreground">{announcement.title}</h4>
            <Badge variant={getVisibilityBadgeVariant(announcement.visibility)}>
              {announcement.visibility}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-3">
            {announcement.body}
          </p>
          
          <div className="text-xs text-muted-foreground">
            {format(new Date(announcement.created_at), "d MMMM yyyy", { locale: fr })}
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit?.(announcement)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete?.(announcement.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

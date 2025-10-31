import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Mail, User, Calendar, Filter, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface NotificationHistory {
  id: string;
  recipient_type: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  message: string;
  class_id: string | null;
  sent_at: string;
  classes?: { name: string } | null;
}

interface NotificationHistorySectionProps {
  schoolId: string;
}

export function NotificationHistorySection({ schoolId }: NotificationHistorySectionProps) {
  const [notifications, setNotifications] = useState<NotificationHistory[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<NotificationHistory | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [schoolId]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, filterType, searchQuery]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('school_notifications')
        .select(`
          *,
          classes (
            name
          )
        `)
        .eq('school_id', schoolId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(n => n.recipient_type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(n =>
        n.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'student':
        return 'bg-blue-500';
      case 'parent':
        return 'bg-green-500';
      case 'teacher':
        return 'bg-purple-500';
      case 'staff':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'student':
        return 'Étudiant';
      case 'parent':
        return 'Parent';
      case 'teacher':
        return 'Professeur';
      case 'staff':
        return 'Staff';
      default:
        return type;
    }
  };

  const handleViewDetails = (notification: NotificationHistory) => {
    setSelectedNotification(notification);
    setIsDetailDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>Historique des notifications</CardTitle>
          </div>
          <CardDescription>
            Consultez toutes les notifications envoyées depuis la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom, email ou sujet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="student">Étudiants</SelectItem>
                <SelectItem value="parent">Parents</SelectItem>
                <SelectItem value="teacher">Professeurs</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[600px] pr-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune notification trouvée
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card key={notification.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getTypeColor(notification.recipient_type)}>
                              {getTypeLabel(notification.recipient_type)}
                            </Badge>
                            {notification.classes && (
                              <Badge variant="outline">
                                {notification.classes.name}
                              </Badge>
                            )}
                          </div>
                          
                          <h4 className="font-semibold text-lg">{notification.subject}</h4>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {notification.recipient_name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {notification.recipient_email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(notification.sent_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(notification)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la notification</DialogTitle>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getTypeColor(selectedNotification.recipient_type)}>
                  {getTypeLabel(selectedNotification.recipient_type)}
                </Badge>
                {selectedNotification.classes && (
                  <Badge variant="outline">
                    {selectedNotification.classes.name}
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Destinataire</label>
                  <p className="mt-1">{selectedNotification.recipient_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedNotification.recipient_email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date d'envoi</label>
                  <p className="mt-1">
                    {format(new Date(selectedNotification.sent_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sujet</label>
                  <p className="mt-1 font-semibold">{selectedNotification.subject}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Message</label>
                  <Card className="mt-2">
                    <CardContent className="p-4">
                      <p className="whitespace-pre-wrap">{selectedNotification.message}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

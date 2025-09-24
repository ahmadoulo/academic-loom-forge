import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Clock, Users, Eye, X } from "lucide-react";
import { useAttendance } from "@/hooks/useAttendance";
import { supabase } from "@/integrations/supabase/client";

interface ActiveSessionsPanelProps {
  teacherId: string;
  classes: Array<{
    id: string;
    name: string;
  }>;
  onViewSession: (session: any, classData: any) => void;
}

export const ActiveSessionsPanel = ({ teacherId, classes, onViewSession }: ActiveSessionsPanelProps) => {
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const { deactivateAttendanceSession } = useAttendance();

  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('attendance_sessions')
          .select('*')
          .eq('teacher_id', teacherId)
          .eq('is_active', true)
          .gt('expires_at', now)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setActiveSessions(data || []);
      } catch (err) {
        console.error('Error fetching active sessions:', err);
      }
    };

    fetchActiveSessions();

    // Setup realtime subscription
    const channel = supabase
      .channel('active-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_sessions'
        },
        () => {
          fetchActiveSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId]);

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expiré';

    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const handleCloseSession = async (sessionId: string) => {
    await deactivateAttendanceSession(sessionId);
  };

  const getClassData = (classId: string) => {
    return classes.find(c => c.id === classId);
  };

  if (activeSessions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          Sessions QR Code Actives ({activeSessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSessions.map((session) => {
            const classData = getClassData(session.class_id);
            if (!classData) return null;

            return (
              <Card key={session.id} className="border-2 border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {classData.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCloseSession(session.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {getTimeRemaining(session.expires_at)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Code:</span>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {session.session_code}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => onViewSession(session, classData)}
                      size="sm"
                      className="w-full"
                    >
                      <Eye className="h-3 w-3 mr-2" />
                      Voir la session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
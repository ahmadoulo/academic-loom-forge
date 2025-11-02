import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Calendar, Users, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AbsenceLog {
  id: string;
  assignment_id: string;
  session_date: string;
  sent_at: string;
  sent_count: number;
  assignment: {
    title: string;
    start_time: string;
    end_time: string;
    classes: {
      name: string;
    };
    subjects: {
      name: string;
    } | null;
  };
}

interface AbsenceNotificationHistoryProps {
  teacherId?: string;
  schoolId?: string;
}

export const AbsenceNotificationHistory = ({ teacherId, schoolId }: AbsenceNotificationHistoryProps) => {
  const [logs, setLogs] = useState<AbsenceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [teacherId, schoolId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // First get the logs
      const { data: logsData, error: logsError } = await supabase
        .from('absence_notifications_log')
        .select('id, assignment_id, session_date, sent_at, sent_count')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (logsError) {
        console.error('Error fetching logs:', logsError);
        throw logsError;
      }
      
      if (!logsData || logsData.length === 0) {
        console.log('No logs found');
        setLogs([]);
        return;
      }

      // Get unique assignment IDs
      const assignmentIds = [...new Set(logsData.map(log => log.assignment_id))];

      // Fetch assignment details with filter
      let assignmentsQuery = supabase
        .from('assignments')
        .select(`
          id,
          title,
          start_time,
          end_time,
          teacher_id,
          school_id,
          classes!inner(
            name
          ),
          subjects(
            name
          )
        `)
        .in('id', assignmentIds);

      // Filter by teacherId or schoolId
      if (teacherId) {
        assignmentsQuery = assignmentsQuery.eq('teacher_id', teacherId);
      } else if (schoolId) {
        assignmentsQuery = assignmentsQuery.eq('school_id', schoolId);
      }

      const { data: assignmentsData, error: assignmentsError } = await assignmentsQuery;

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }

      // Create a map of assignments
      const assignmentsMap = new Map(
        assignmentsData?.map(a => [a.id, a]) || []
      );

      // Transform the data structure, filtering out logs without matching assignments
      const transformedLogs = logsData
        .map(log => {
          const assignment = assignmentsMap.get(log.assignment_id);
          if (!assignment) return null;

          return {
            id: log.id,
            assignment_id: log.assignment_id,
            session_date: log.session_date,
            sent_at: log.sent_at,
            sent_count: log.sent_count,
            assignment: {
              title: assignment.title,
              start_time: assignment.start_time,
              end_time: assignment.end_time,
              classes: {
                name: assignment.classes.name
              },
              subjects: assignment.subjects
            }
          };
        })
        .filter((log): log is AbsenceLog => log !== null);

      console.log(`Found ${transformedLogs.length} notification logs`);
      setLogs(transformedLogs);
    } catch (error) {
      console.error('Error fetching absence notification logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filterDate
    ? logs.filter(log => log.session_date === filterDate)
    : logs;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Historique des Notifications d'Absence
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="filter-date" className="text-sm">Filtrer par date:</Label>
            <Input
              id="filter-date"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {filterDate 
                ? "Aucune notification pour cette date"
                : "Aucune notification d'absence envoyée"
              }
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <Card key={log.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Session Info */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-lg">{log.assignment.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{log.assignment.classes.name}</span>
                            {log.assignment.subjects && (
                              <>
                                <span>•</span>
                                <span>{log.assignment.subjects.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant={log.sent_count > 0 ? "default" : "secondary"}>
                          {log.sent_count > 0 ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {log.sent_count > 0 
                            ? `${log.sent_count} notification${log.sent_count > 1 ? 's' : ''} envoyée${log.sent_count > 1 ? 's' : ''}`
                            : "Aucune absence"
                          }
                        </Badge>
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Date séance:</span>
                          <span className="font-medium">
                            {format(new Date(log.session_date), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Envoyé le:</span>
                          <span className="font-medium">
                            {format(new Date(log.sent_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </div>

                      {/* Session Time */}
                      {log.assignment.start_time && log.assignment.end_time && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span>Horaire:</span>
                            <span className="font-medium text-foreground">
                              {log.assignment.start_time} - {log.assignment.end_time}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Status Message */}
                      <div className="pt-2 border-t">
                        {log.sent_count > 0 ? (
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            {log.sent_count} étudiant{log.sent_count > 1 ? 's' : ''} absent{log.sent_count > 1 ? 's' : ''} notifié{log.sent_count > 1 ? 's' : ''}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Tous les étudiants étaient présents
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

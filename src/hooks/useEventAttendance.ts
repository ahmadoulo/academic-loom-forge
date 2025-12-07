import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EventAttendanceRecord {
  id: string;
  event_id: string;
  session_id: string;
  school_id: string;
  participant_name: string;
  participant_email: string | null;
  participant_phone: string | null;
  student_id: string | null;
  marked_at: string;
  method: string;
  students?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string | null;
  };
}

interface EventAttendanceSession {
  id: string;
  event_id: string;
  school_id: string;
  session_code: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export const useEventAttendance = (eventId?: string, schoolId?: string) => {
  const [attendance, setAttendance] = useState<EventAttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<EventAttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAttendance = async () => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_attendance' as any)
        .select(`
          *,
          students(id, firstname, lastname, email)
        `)
        .eq('event_id', eventId)
        .order('marked_at', { ascending: false });

      if (error) throw error;
      setAttendance((data || []) as unknown as EventAttendanceRecord[]);
    } catch (err) {
      console.error('Error fetching event attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('event_attendance_sessions' as any)
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions((data || []) as unknown as EventAttendanceSession[]);
    } catch (err) {
      console.error('Error fetching event sessions:', err);
    }
  };

  const createSession = async (eventId: string, schoolId: string, expirationMinutes: number = 120) => {
    try {
      const sessionCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

      const { data, error } = await supabase
        .from('event_attendance_sessions' as any)
        .insert({
          event_id: eventId,
          school_id: schoolId,
          session_code: sessionCode,
          expires_at: expiresAt.toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Session créée",
        description: "Le QR code de présence a été généré avec succès",
      });

      await fetchSessions();
      return { data: data as unknown as EventAttendanceSession, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la session';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }
  };

  const deactivateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('event_attendance_sessions' as any)
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Session fermée",
        description: "La session de présence a été désactivée",
      });

      await fetchSessions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la fermeture de la session';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const markAttendance = async (data: {
    sessionCode: string;
    participantName: string;
    participantEmail?: string;
    participantPhone?: string;
    studentId?: string;
  }) => {
    try {
      // Validate session
      const { data: session, error: sessionError } = await supabase
        .from('event_attendance_sessions' as any)
        .select('*')
        .eq('session_code', data.sessionCode)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        throw new Error('Code QR invalide ou session expirée');
      }

      const sessionData = session as unknown as EventAttendanceSession;

      if (new Date(sessionData.expires_at) < new Date()) {
        throw new Error('La session a expiré');
      }

      // Check if already marked
      let existingQuery = supabase
        .from('event_attendance' as any)
        .select('id')
        .eq('event_id', sessionData.event_id);

      if (data.participantEmail) {
        existingQuery = existingQuery.eq('participant_email', data.participantEmail);
      } else if (data.studentId) {
        existingQuery = existingQuery.eq('student_id', data.studentId);
      }

      const { data: existing } = await existingQuery.maybeSingle();

      if (existing) {
        throw new Error('Vous avez déjà marqué votre présence pour cet événement');
      }

      // Insert attendance record
      const { data: insertedData, error: insertError } = await supabase
        .from('event_attendance' as any)
        .insert({
          event_id: sessionData.event_id,
          session_id: sessionData.id,
          school_id: sessionData.school_id,
          participant_name: data.participantName,
          participant_email: data.participantEmail || null,
          participant_phone: data.participantPhone || null,
          student_id: data.studentId || null,
          method: 'qr_scan'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Présence enregistrée",
        description: "Votre présence a été marquée avec succès",
      });

      return { data: insertedData, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la validation';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: errorMessage };
    }
  };

  const deleteAttendance = async (attendanceId: string) => {
    try {
      const { error } = await supabase
        .from('event_attendance' as any)
        .delete()
        .eq('id', attendanceId);

      if (error) throw error;

      toast({
        title: "Présence supprimée",
        description: "L'enregistrement a été supprimé",
      });

      await fetchAttendance();
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la présence",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchAttendance();
      fetchSessions();

      // Setup realtime subscription
      const attendanceChannel = supabase
        .channel(`event-attendance-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_attendance',
            filter: `event_id=eq.${eventId}`
          },
          () => {
            fetchAttendance();
          }
        )
        .subscribe();

      const sessionsChannel = supabase
        .channel(`event-sessions-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_attendance_sessions',
            filter: `event_id=eq.${eventId}`
          },
          () => {
            fetchSessions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(attendanceChannel);
        supabase.removeChannel(sessionsChannel);
      };
    }
  }, [eventId]);

  return {
    attendance,
    sessions,
    loading,
    createSession,
    deactivateSession,
    markAttendance,
    deleteAttendance,
    refetch: fetchAttendance
  };
};
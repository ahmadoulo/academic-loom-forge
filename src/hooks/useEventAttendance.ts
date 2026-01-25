import { useState, useEffect, useCallback } from "react";
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

const SESSION_KEYS = ["app_session_token", "sessionToken"]; // supports both auth hooks
const getSessionToken = () => {
  for (const key of SESSION_KEYS) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }
  return null;
};

export const useEventAttendance = (eventId?: string, schoolId?: string) => {
  const [attendance, setAttendance] = useState<EventAttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<EventAttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAttendance = useCallback(async () => {
    if (!eventId) return;

    const sessionToken = getSessionToken();
    if (!sessionToken) {
      // Not authenticated: do not fetch attendance (admin-only)
      setAttendance([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("get-event-attendance", {
        body: { sessionToken, eventId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Accès refusé");

      setAttendance((data.attendance || []) as EventAttendanceRecord[]);
    } catch (err) {
      // Intentionally quiet: a non-admin might hit this if UI is cached
      console.error("Error fetching event attendance:", err);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchSessions = useCallback(async () => {
    if (!eventId) return;

    const sessionToken = getSessionToken();
    if (!sessionToken) {
      setSessions([]);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("get-event-attendance-sessions", {
        body: { sessionToken, eventId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Accès refusé");

      setSessions((data.sessions || []) as EventAttendanceSession[]);
    } catch (err) {
      console.error("Error fetching event sessions:", err);
      setSessions([]);
    }
  }, [eventId]);

  const createSession = async (eventIdArg: string, schoolIdArg: string, expirationMinutes: number = 120) => {
    try {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error("Non authentifié");

      const { data, error } = await supabase.functions.invoke("create-event-attendance-session", {
        body: { sessionToken, eventId: eventIdArg, schoolId: schoolIdArg, expirationMinutes },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Erreur lors de la création de la session");

      toast({
        title: "Session créée",
        description: "Le QR code de présence a été généré avec succès",
      });

      await fetchSessions();
      return { data: data.session as EventAttendanceSession, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la création de la session";
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
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error("Non authentifié");

      const { data, error } = await supabase.functions.invoke("deactivate-event-attendance-session", {
        body: { sessionToken, sessionId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Erreur lors de la fermeture de la session");

      toast({
        title: "Session fermée",
        description: "La session de présence a été désactivée",
      });

      await fetchSessions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la fermeture de la session";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const markAttendance = async (payload: {
    sessionCode: string;
    participantName: string;
    participantEmail?: string;
    participantPhone?: string;
    studentId?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke("mark-event-attendance", {
        body: {
          sessionCode: payload.sessionCode,
          participantName: payload.participantName,
          participantEmail: payload.participantEmail || null,
          participantPhone: payload.participantPhone || null,
          studentId: payload.studentId || null,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Erreur lors de la validation");

      toast({
        title: "Présence enregistrée",
        description: "Votre présence a été marquée avec succès",
      });

      // Best-effort refresh for admins watching the list
      await fetchAttendance();

      return { data: data.attendance ?? null, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la validation";
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
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error("Non authentifié");

      const { data, error } = await supabase.functions.invoke("delete-event-attendance", {
        body: { sessionToken, attendanceId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Impossible de supprimer la présence");

      toast({
        title: "Présence supprimée",
        description: "L'enregistrement a été supprimé",
      });

      await fetchAttendance();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de supprimer la présence",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!eventId) return;

    const run = async () => {
      await Promise.all([fetchAttendance(), fetchSessions()]);
    };

    run();

    // Polling (realtime is disabled by RLS for non-service clients)
    const interval = window.setInterval(run, 5000);

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [eventId, fetchAttendance, fetchSessions]);

  return {
    attendance,
    sessions,
    loading,
    createSession,
    deactivateSession,
    markAttendance,
    deleteAttendance,
    refetch: fetchAttendance,
  };
};

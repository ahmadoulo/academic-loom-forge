import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  CalendarDays, 
  MapPin, 
  Clock, 
  AlertCircle, 
  Loader2, 
  PartyPopper,
  UserCheck,
  QrCode
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEventAttendance } from "@/hooks/useEventAttendance";
import { useToast } from "@/hooks/use-toast";

interface EventInfo {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  location: string | null;
  school_id: string;
}

interface SessionInfo {
  id: string;
  event_id: string;
  school_id: string;
  session_code: string;
  expires_at: string;
  is_active: boolean;
}

interface SchoolInfo {
  id: string;
  name: string;
  logo_url: string | null;
}

interface StudentInfo {
  id: string;
  firstname: string;
  lastname: string;
  email: string | null;
}

export default function EventAttendanceScan() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [authenticatedStudent, setAuthenticatedStudent] = useState<StudentInfo | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  const { markAttendance } = useEventAttendance();

  useEffect(() => {
    const validateSession = async () => {
      if (!sessionCode) {
        setError("Code de session invalide");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "get-event-attendance-scan-context",
          { body: { sessionCode } }
        );

        if (fnError) throw fnError;
        if (!data?.success) {
          setError(data?.message || "Session invalide ou expirée");
          setLoading(false);
          return;
        }

        setSession(data.session as SessionInfo);
        setEvent(data.event as EventInfo);
        setSchool(data.school as SchoolInfo);
        setLoading(false);
      } catch (err) {
        console.error('Error validating session:', err);
        setError("Une erreur est survenue");
        setLoading(false);
      }
    };

    validateSession();
  }, [sessionCode]);

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setError(null);

    try {
      if (!school) {
        throw new Error("École non trouvée");
      }

      const email = studentEmail.toLowerCase().trim();
      const { data, error: fnError } = await supabase.functions.invoke("find-student-by-email", {
        body: { schoolId: school.id, email },
      });

      if (fnError) throw fnError;
      if (!data?.success) {
        throw new Error(data?.message || "Email d'étudiant non trouvé dans cette école");
      }

      const student = data.student as StudentInfo;
      setAuthenticatedStudent(student);
      setIsAuthenticated(true);

      toast({
        title: "Authentification réussie",
        description: `Bienvenue ${student.firstname} ${student.lastname}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'authentification");
    } finally {
      setAuthenticating(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!sessionCode || !authenticatedStudent) return;

    setSubmitting(true);
    setError(null);

    const result = await markAttendance({
      sessionCode,
      participantName: `${authenticatedStudent.firstname} ${authenticatedStudent.lastname}`,
      participantEmail: authenticatedStudent.email || undefined,
      studentId: authenticatedStudent.id
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Chargement de l'événement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Session invalide</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-950/20 p-4">
        <Card className="w-full max-w-md border-green-200 dark:border-green-800 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <PartyPopper className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
              Présence enregistrée !
            </h2>
            <p className="text-muted-foreground mb-2">
              Merci {authenticatedStudent?.firstname} !
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Votre présence à l'événement <span className="font-semibold">{event?.title}</span> a été confirmée.
            </p>
            <Badge variant="outline" className="text-green-700 border-green-300 dark:border-green-700">
              {format(new Date(), "HH:mm", { locale: fr })}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg shadow-xl">
        {/* School Header */}
        {school && (
          <div className="flex items-center justify-center gap-3 p-4 border-b bg-muted/30">
            {school.logo_url && (
              <img 
                src={school.logo_url} 
                alt={school.name} 
                className="h-10 w-10 object-contain rounded"
              />
            )}
            <span className="font-semibold text-lg">{school.name}</span>
          </div>
        )}
        
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <QrCode className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">{event?.title}</CardTitle>
          {event?.description && (
            <CardDescription className="mt-2">{event.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Event Info */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {format(new Date(event!.start_at), "d MMM yyyy", { locale: fr })}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(event!.start_at), "HH:mm", { locale: fr })}
            </Badge>
            {event?.location && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </Badge>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isAuthenticated ? (
            <form onSubmit={handleAuthentication} className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Authentifiez-vous avec votre email étudiant pour marquer votre présence
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Email étudiant</Label>
                <Input
                  id="email"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="votre.email@etudiant.com"
                  className="h-12 text-base"
                  required
                  autoFocus
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold"
                disabled={authenticating || !studentEmail.trim()}
              >
                {authenticating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authentification...
                  </>
                ) : (
                  "S'authentifier"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                <UserCheck className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Authentifié en tant que <span className="font-semibold">{authenticatedStudent?.firstname} {authenticatedStudent?.lastname}</span>
                </AlertDescription>
              </Alert>
              
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Cliquez sur le bouton ci-dessous pour confirmer votre présence à l'événement
                </p>
                <p className="font-semibold text-primary">{event?.title}</p>
              </div>
              
              <Button 
                onClick={handleMarkAttendance}
                className="w-full h-12 text-base font-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Marquer ma présence
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Code de session: {sessionCode || "Non spécifié"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
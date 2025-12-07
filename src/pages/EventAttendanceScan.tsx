import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CalendarDays, MapPin, Clock, AlertCircle, Loader2, PartyPopper } from "lucide-react";
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
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const { markAttendance } = useEventAttendance();

  useEffect(() => {
    const validateSession = async () => {
      if (!sessionCode) {
        setError("Code de session invalide");
        setLoading(false);
        return;
      }

      try {
        // Fetch session
        const { data: sessionData, error: sessionError } = await supabase
          .from('event_attendance_sessions' as any)
          .select('*')
          .eq('session_code', sessionCode)
          .eq('is_active', true)
          .single();

        if (sessionError || !sessionData) {
          setError("Session invalide ou expirée");
          setLoading(false);
          return;
        }

        const typedSession = sessionData as unknown as SessionInfo;

        if (new Date(typedSession.expires_at) < new Date()) {
          setError("La session a expiré");
          setLoading(false);
          return;
        }

        setSession(typedSession);

        // Fetch event
        const { data: eventData, error: eventError } = await supabase
          .from('events' as any)
          .select('*')
          .eq('id', typedSession.event_id)
          .single();

        if (eventError || !eventData) {
          setError("Événement non trouvé");
          setLoading(false);
          return;
        }

        setEvent(eventData as unknown as EventInfo);

        // Fetch school
        const { data: schoolData } = await supabase
          .from('schools')
          .select('id, name, logo_url')
          .eq('id', typedSession.school_id)
          .single();

        if (schoolData) {
          setSchool(schoolData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error validating session:', err);
        setError("Une erreur est survenue");
        setLoading(false);
      }
    };

    validateSession();
  }, [sessionCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer votre nom",
        variant: "destructive"
      });
      return;
    }

    if (!sessionCode) return;

    setSubmitting(true);

    const result = await markAttendance({
      sessionCode,
      participantName: formData.name.trim(),
      participantEmail: formData.email.trim() || undefined,
      participantPhone: formData.phone.trim() || undefined
    });

    if (result.error) {
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

  if (error) {
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
              Merci {formData.name.split(' ')[0]} !
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
            <CalendarDays className="h-7 w-7 text-primary" />
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
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(event!.start_at), "d MMM yyyy à HH:mm", { locale: fr })}
            </Badge>
            {event?.location && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </Badge>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">
                Nom complet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Jean Dupont"
                className="h-12 text-base"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">
                Email <span className="text-muted-foreground text-sm">(optionnel)</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Ex: jean.dupont@email.com"
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base">
                Téléphone <span className="text-muted-foreground text-sm">(optionnel)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ex: 06 12 34 56 78"
                className="h-12 text-base"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold"
              disabled={submitting || !formData.name.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Confirmer ma présence
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
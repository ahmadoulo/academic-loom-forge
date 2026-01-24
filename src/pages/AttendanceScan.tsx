import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, CheckCircle, AlertCircle, UserCheck, Loader2, Eye, EyeOff } from "lucide-react";
import { useAttendance } from "@/hooks/useAttendance";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AttendanceScan = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { scanQRCode } = useAttendance();

  useEffect(() => {
    if (!sessionCode) {
      setError("Code de session invalide");
    }
  }, [sessionCode]);

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Appel à l'edge function d'authentification
      const { data, error: authError } = await supabase.functions.invoke('authenticate-user', {
        body: {
          email: studentEmail.toLowerCase().trim(),
          password: password
        }
      });

      if (authError) {
        throw new Error("Erreur de connexion au serveur");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Email ou mot de passe incorrect");
      }

      // Vérifier que l'utilisateur a un student_id lié
      if (!data.user?.student_id) {
        throw new Error("Ce compte n'est pas associé à un profil étudiant");
      }

      // Stocker le token de session
      localStorage.setItem("session_token", data.sessionToken);
      localStorage.setItem("session_expires_at", data.sessionExpiresAt);

      setStudentId(data.user.student_id);
      setStudentName(`${data.user.first_name} ${data.user.last_name}`);
      setIsAuthenticated(true);
      
      toast({
        title: "Authentification réussie",
        description: `Bienvenue ${data.user.first_name} ${data.user.last_name}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = async () => {
    if (!sessionCode || !studentId) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await scanQRCode(sessionCode, studentId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      setSuccess(true);
      toast({
        title: "Présence marquée!",
        description: "Votre présence a été enregistrée avec succès",
      });

      // Rediriger après 3 secondes
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du scan");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Présence marquée!</h2>
            <p className="text-muted-foreground mb-4">
              Votre présence a été enregistrée avec succès.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirection automatique dans quelques secondes...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <QrCode className="h-6 w-6 text-primary" />
            Eduvate - Présence
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {!isAuthenticated 
              ? "Connectez-vous avec votre compte étudiant" 
              : "Cliquez sur le bouton pour confirmer votre présence"
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isAuthenticated ? (
            <form onSubmit={handleAuthentication} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@etudiant.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !studentEmail.trim() || !password.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert>
                <UserCheck className="h-4 w-4" />
                <AlertDescription>
                  Connecté en tant que <strong>{studentName}</strong>. Cliquez ci-dessous pour marquer votre présence.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleScanQR}
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Marquage en cours...
                  </>
                ) : (
                  "Marquer ma présence"
                )}
              </Button>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Code de session: {sessionCode || "Non spécifié"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceScan;

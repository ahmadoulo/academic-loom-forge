import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, CheckCircle, AlertCircle, UserCheck } from "lucide-react";
import { useAttendance } from "@/hooks/useAttendance";
import { useStudents } from "@/hooks/useStudents";
import { useToast } from "@/hooks/use-toast";

const AttendanceScan = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [studentId, setStudentId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { scanQRCode } = useAttendance();
  const { students, loading: studentsLoading } = useStudents(undefined, undefined);

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
      // Attendre que les étudiants soient chargés
      if (studentsLoading) {
        throw new Error("Chargement des données en cours...");
      }

      console.log("Looking for student with email:", studentEmail);
      console.log("Available students:", students);
      
      // Trouver l'étudiant par email
      const student = students.find(s => 
        s.email?.toLowerCase().trim() === studentEmail.toLowerCase().trim()
      );

      if (!student) {
        throw new Error("Email d'étudiant non trouvé");
      }

      // Authentification simple (dans un vrai système, vous utiliseriez une vraie authentification)
      setStudentId(student.id);
      setIsAuthenticated(true);
      
      toast({
        title: "Authentification réussie",
        description: `Bienvenue ${student.firstname} ${student.lastname}`,
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
              ? "Authentifiez-vous pour marquer votre présence" 
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
                <Label htmlFor="email">Email étudiant</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@etudiant.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !studentEmail.trim()}
              >
                {loading ? "Authentification..." : "S'authentifier"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert>
                <UserCheck className="h-4 w-4" />
                <AlertDescription>
                  Authentification réussie! Cliquez sur le bouton ci-dessous pour marquer votre présence.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleScanQR}
                className="w-full"
                disabled={loading}
              >
                {loading ? "Marquage en cours..." : "Marquer ma présence"}
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
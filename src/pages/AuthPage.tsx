import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { useSchools } from "@/hooks/useSchools";
import { GraduationCap, LogIn, UserPlus } from "lucide-react";

export default function AuthPage() {
  const { signIn, signUp, isAuthenticated, loading } = useAuth();
  const { schools } = useSchools();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "student" as UserRole,
    school_id: "",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // L'utilisateur est déjà connecté, le laisser naviguer librement
    // La redirection sera gérée par le hook useAuth seulement lors de la connexion
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vous êtes déjà connecté</h1>
          <p className="text-muted-foreground mb-6">
            Vous pouvez retourner au tableau de bord ou vous connecter avec un autre compte.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
            >
              Tableau de bord
            </Button>
            <Button 
              onClick={() => navigate("/auth")}
              className="bg-gradient-primary hover:opacity-90"
            >
              Autre compte
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(formData.email, formData.password);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(formData.email, formData.password, {
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
      school_id: formData.school_id || undefined,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            EduVate
          </h1>
          <p className="text-muted-foreground mt-2">
            Plateforme de gestion académique moderne
          </p>
        </div>

        <Card className="shadow-large border-0 bg-gradient-card backdrop-blur-sm">
          <div className="w-full">

            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
              <CardDescription>
                Connectez-vous à votre compte EduVate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Mot de passe</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-gradient-primary hover:opacity-90 shadow-medium">
                  Se connecter
                </Button>
              </form>

              <div className="mt-6 p-4 bg-primary-light/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Comptes de démonstration :</h4>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p><strong>Admin Global:</strong> admin@eduvate.com</p>
                  <p><strong>Admin École:</strong> school@eduvate.com</p>
                  <p><strong>Professeur:</strong> teacher@eduvate.com</p>
                  <p><strong>Étudiant:</strong> student@eduvate.com</p>
                  <p><strong>Parent:</strong> parent@eduvate.com</p>
                  <p className="pt-1"><em>Mot de passe: password123</em></p>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
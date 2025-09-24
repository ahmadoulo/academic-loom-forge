import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { GraduationCap } from "lucide-react";

export default function AuthPage() {
  const { loginWithCredentials, user, loading, checkAuthStatus } = useCustomAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Check authentication status on component mount
  React.useEffect(() => {
    checkAuthStatus();
  }, []);

  const isAuthenticated = !!user;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Rediriger vers le dashboard approprié selon le rôle
    switch (user.role) {
      case 'global_admin':
        return <Navigate to="/admin" replace />;
      case 'school_admin':
        return <Navigate to="/school" replace />;
      case 'teacher':
        return <Navigate to="/teacher" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      case 'parent':
        return <Navigate to="/parent" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithCredentials({
        email: formData.email,
        password: formData.password,
      });
    } catch (error) {
      // Error already handled in useCustomAuth
    }
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
            Connectez-vous à votre compte
          </p>
        </div>

        <Card className="shadow-large border-0 bg-gradient-card backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
            <CardDescription>
              Saisissez vos identifiants pour accéder à votre espace
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

            <p className="text-center text-sm text-muted-foreground mt-4">
              Vous n'avez pas de compte ? Contactez votre administrateur.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
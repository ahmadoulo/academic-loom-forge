import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2 } from "lucide-react";
import { useCustomAuth } from "@/hooks/useCustomAuth";

const AuthPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, loading, loginWithCredentials, checkAuthStatus } = useCustomAuth();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Vérification de l'authentification...</span>
        </div>
      </div>
    );
  }

  if (user && user.is_active) {
    console.log('DEBUG AuthPage - Redirection pour utilisateur:', user);
    
    // Rediriger vers le dashboard approprié selon le rôle
    switch (user.role) {
      case 'global_admin':
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'school_admin':
        if (user.school_id) {
          return <Navigate to={`/school/${user.school_id}`} replace />;
        } else {
          return <Navigate to="/admin" replace />;
        }
      case 'teacher':
        if (user.teacher_id) {
          return <Navigate to={`/teacher/${user.teacher_id}`} replace />;
        } else {
          return <Navigate to="/admin" replace />;
        }
      case 'student':
        return <Navigate to="/dashboard" replace />;
      case 'parent':
        return <Navigate to="/dashboard" replace />;
      default:
        return <Navigate to="/admin" replace />;
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      console.log('DEBUG: Tentative de connexion avec:', formData.email);
      await loginWithCredentials({
        email: formData.email,
        password: formData.password,
      });
    } catch (error) {
      console.error('DEBUG: Erreur de connexion:', error);
    } finally {
      setIsSubmitting(false);
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
            <CardTitle className="text-2xl font-bold text-center">
              Connexion
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Entrez vos identifiants pour accéder à votre espace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connexion...</span>
                  </div>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Authentification avec base de données interne
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Table: user_credentials
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
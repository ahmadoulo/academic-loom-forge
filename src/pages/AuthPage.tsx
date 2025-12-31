import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, Mail, Lock, ArrowRight, Shield, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ViewMode = "login" | "forgot-password";

const AuthPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [resetEmail, setResetEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetStatus, setResetStatus] = useState<"idle" | "success" | "error">("idle");
  const [resetMessage, setResetMessage] = useState("");
  
  const { user, loading, initialized, isAuthenticated, login, getRedirectPath } = useAuth();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (initialized && isAuthenticated && user) {
      const redirectPath = getRedirectPath();
      console.log('User authenticated, redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [initialized, isAuthenticated, user, navigate, getRedirectPath]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-16 w-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow animate-pulse">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const success = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      
      if (success) {
        console.log('Login successful, waiting for redirect...');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !resetEmail.trim()) return;
    
    setIsSubmitting(true);
    setResetStatus("idle");
    setResetMessage("");
    
    try {
      const { data, error } = await supabase.functions.invoke("request-password-reset", {
        body: { email: resetEmail.trim().toLowerCase() }
      });

      if (error) {
        console.error("Password reset error:", error);
        setResetStatus("error");
        setResetMessage("Une erreur est survenue. Veuillez réessayer.");
        return;
      }

      if (data?.success) {
        setResetStatus("success");
        setResetMessage(data.message || "Un email de réinitialisation a été envoyé.");
        toast.success("Email envoyé", { description: "Vérifiez votre boîte de réception." });
      } else {
        setResetStatus("error");
        if (data?.error === "not_found") {
          setResetMessage("Aucun compte trouvé avec cette adresse email. Veuillez contacter votre administration.");
        } else if (data?.error === "inactive") {
          setResetMessage("Votre compte est inactif. Veuillez contacter votre administration.");
        } else {
          setResetMessage(data?.message || data?.error || "Une erreur est survenue.");
        }
      }
    } catch (err) {
      console.error("Password reset exception:", err);
      setResetStatus("error");
      setResetMessage("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForgotPasswordForm = () => {
    setViewMode("login");
    setResetEmail("");
    setResetStatus("idle");
    setResetMessage("");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">EduVate</h1>
              <p className="text-white/80 text-sm">Plateforme de gestion scolaire</p>
            </div>
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Gérez votre établissement en toute simplicité
          </h2>
          
          <p className="text-white/90 text-lg mb-10 max-w-md">
            Une solution complète pour la gestion des élèves, des enseignants, des notes et de l'emploi du temps.
          </p>
          
          <div className="space-y-4">
            {[
              "Gestion des présences en temps réel",
              "Suivi des notes et bulletins",
              "Emploi du temps intelligent",
              "Communication parent-école"
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-white/95">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-white/10 rounded-full" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full" />
      </div>

      {/* Right side - Login/Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
                <GraduationCap className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">EduVate</h1>
            <p className="text-muted-foreground text-sm mt-1">Plateforme de gestion scolaire</p>
          </div>

          {viewMode === "login" ? (
            <Card className="border-0 shadow-large bg-card/80 backdrop-blur-sm">
              <CardHeader className="space-y-2 pb-6">
                <CardTitle className="text-2xl font-bold text-center text-foreground">
                  Connexion
                </CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  Entrez vos identifiants pour accéder à votre espace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Adresse email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        autoComplete="email"
                        className="pl-10 h-11 border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-foreground">
                        Mot de passe
                      </Label>
                      <button
                        type="button"
                        onClick={() => setViewMode("forgot-password")}
                        className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        autoComplete="current-password"
                        className="pl-10 h-11 border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Connexion en cours...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Se connecter</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </form>
                
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Connexion sécurisée</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full h-10 border-input hover:bg-muted/50 transition-colors"
                    onClick={() => navigate('/student-registration')}
                  >
                    Première connexion ? Activer mon compte étudiant
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-large bg-card/80 backdrop-blur-sm">
              <CardHeader className="space-y-2 pb-6">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetForgotPasswordForm}
                    className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-foreground">
                      Mot de passe oublié
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">
                      Entrez votre adresse email pour recevoir un lien de réinitialisation
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {resetStatus === "success" ? (
                  <div className="text-center py-4">
                    <div className="flex justify-center mb-4">
                      <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Email envoyé !</h3>
                    <p className="text-muted-foreground text-sm mb-6">{resetMessage}</p>
                    <Button
                      variant="outline"
                      onClick={resetForgotPasswordForm}
                      className="w-full"
                    >
                      Retour à la connexion
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                        Adresse email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={resetEmail}
                          onChange={(e) => {
                            setResetEmail(e.target.value);
                            setResetStatus("idle");
                            setResetMessage("");
                          }}
                          required
                          autoComplete="email"
                          className="pl-10 h-11 border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                    
                    {resetStatus === "error" && resetMessage && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{resetMessage}</p>
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                      disabled={isSubmitting || !resetEmail.trim()}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Vérification...</span>
                        </div>
                      ) : (
                        <span>Envoyer le lien de réinitialisation</span>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetForgotPasswordForm}
                      className="w-full text-muted-foreground"
                    >
                      Annuler
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
          
          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} EduVate. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { 
  Loader2, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  Users,
  BarChart3,
  Calendar,
  Bell,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import eduvateLogoLight from "@/assets/eduvate-logo.png";
import eduvateIcon from "@/assets/eduvate-icon.png";

type ViewMode = "login" | "forgot-password";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const floatingAnimation = {
  y: [0, -8, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut" as const
  }
};

const features = [
  { icon: Users, text: "Gestion des élèves et enseignants", delay: 0 },
  { icon: BarChart3, text: "Suivi des notes et bulletins", delay: 0.1 },
  { icon: Calendar, text: "Emploi du temps intelligent", delay: 0.2 },
  { icon: Bell, text: "Notifications en temps réel", delay: 0.3 },
  { icon: BookOpen, text: "Cahiers de textes numériques", delay: 0.4 },
];

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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const { user, loading, initialized, isAuthenticated, login, getRedirectPath } = useAuth();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (initialized && isAuthenticated && user) {
      const redirectPath = getRedirectPath();
      navigate(redirectPath, { replace: true });
    }
  }, [initialized, isAuthenticated, user, navigate, getRedirectPath]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0066cc]/5 via-background to-[#00a3cc]/5">
        <motion.div 
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.img 
            src={eduvateIcon}
            alt="EduVate"
            className="h-16 w-16"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Chargement...</span>
          </div>
        </motion.div>
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
        body: { 
          email: resetEmail.trim().toLowerCase(),
          appUrl: window.location.origin,
        }
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
    <div className="min-h-screen flex overflow-hidden">
      {/* Left side - Branding & Info with modern design */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Gradient background matching EduVate brand colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0066cc] via-[#0080ff] to-[#00a3cc]" />
        
        {/* Animated mesh pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.15%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        </div>

        {/* Floating decorative elements */}
        <motion.div 
          className="absolute top-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-32 left-10 w-56 h-56 bg-white/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
        />
        <motion.div 
          className="absolute top-1/2 right-16 w-28 h-28 bg-cyan-400/20 rounded-full blur-xl"
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full">
          {/* Logo with white background for visibility */}
          <motion.div 
            className="flex items-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="bg-white rounded-2xl p-3 shadow-xl"
              whileHover={{ scale: 1.05 }}
              animate={floatingAnimation}
            >
              <img 
                src={eduvateLogoLight}
                alt="EduVate"
                className="h-12 w-auto"
              />
            </motion.div>
          </motion.div>
          
          {/* Main heading with stagger animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Simplifiez la gestion
              <span className="block mt-2 text-white/90">de votre établissement</span>
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-md">
              La plateforme tout-en-un pour une gestion scolaire efficace et moderne.
            </p>
          </motion.div>
          
          {/* Features list with stagger animation */}
          <motion.div 
            className="space-y-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="flex items-center gap-4 group"
                variants={fadeInUp}
                transition={{ delay: 0.4 + feature.delay }}
                whileHover={{ x: 10 }}
              >
                <motion.div 
                  className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:bg-white/25 transition-colors"
                  whileHover={{ scale: 1.1 }}
                >
                  <feature.icon className="h-5 w-5 text-white" />
                </motion.div>
                <span className="text-white/90 font-medium text-lg">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom copyright */}
          <motion.div 
            className="absolute bottom-8 left-12 xl:left-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} EduVate. Tous droits réservés.
            </p>
          </motion.div>
        </div>

        {/* Bottom decorative gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/15 to-transparent" />
      </motion.div>

      {/* Right side - Login/Forgot Password Form */}
      <motion.div 
        className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-background via-background to-muted/20 relative"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.015]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(211_100%_50%)_1px,transparent_0)] bg-[size:48px_48px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo with animation */}
          <motion.div 
            className="lg:hidden text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div 
              className="flex justify-center mb-4"
              animate={floatingAnimation}
            >
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <img 
                  src={eduvateLogoLight}
                  alt="EduVate"
                  className="h-10 w-auto"
                />
              </div>
            </motion.div>
          </motion.div>

          <AnimatePresence mode="wait">
            {viewMode === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-xl bg-card/95 backdrop-blur-sm overflow-hidden">
                  {/* Top accent line */}
                  <div className="h-1 bg-gradient-to-r from-[#0066cc] via-[#0080ff] to-[#00a3cc]" />
                  
                  <CardHeader className="space-y-2 pb-6 pt-8">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <CardTitle className="text-2xl font-bold text-center text-foreground">
                        Connexion
                      </CardTitle>
                      <CardDescription className="text-center text-muted-foreground mt-2">
                        Accédez à votre espace EduVate
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pb-8">
                    <form onSubmit={handleSignIn} className="space-y-5">
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Label htmlFor="email" className="text-sm font-medium text-foreground">
                          Adresse email
                        </Label>
                        <div className="relative group">
                          <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${focusedInput === 'email' ? 'text-[#0080ff]' : 'text-muted-foreground'}`} />
                          <Input
                            id="email"
                            type="email"
                            placeholder="votre@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            onFocus={() => setFocusedInput('email')}
                            onBlur={() => setFocusedInput(null)}
                            required
                            autoComplete="email"
                            className="pl-10 h-12 border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-[#0080ff]/20 focus:border-[#0080ff] transition-all rounded-xl"
                          />
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Label htmlFor="password" className="text-sm font-medium text-foreground">
                          Mot de passe
                        </Label>
                        <div className="relative group">
                          <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10 transition-colors ${focusedInput === 'password' ? 'text-[#0080ff]' : 'text-muted-foreground'}`} />
                          <PasswordInput
                            id="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            onFocus={() => setFocusedInput('password')}
                            onBlur={() => setFocusedInput(null)}
                            required
                            autoComplete="current-password"
                            className="pl-10 h-12 border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-[#0080ff]/20 focus:border-[#0080ff] transition-all rounded-xl"
                          />
                        </div>
                      </motion.div>

                      <motion.div 
                        className="text-right"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <button
                          type="button"
                          onClick={() => setViewMode("forgot-password")}
                          className="text-sm text-[#0080ff] hover:text-[#0066cc] font-medium transition-colors hover:underline underline-offset-4"
                        >
                          Mot de passe oublié ?
                        </button>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Button 
                          type="submit" 
                          className="w-full h-12 bg-gradient-to-r from-[#0066cc] via-[#0080ff] to-[#00a3cc] hover:opacity-90 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
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
                      </motion.div>

                      {/* Activate account section */}
                      <motion.div 
                        className="pt-6 mt-6 border-t border-border"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <div className="text-center space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Première connexion ?
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 rounded-xl"
                            onClick={() => navigate('/activate-account')}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            Activer mon compte
                          </Button>
                        </div>
                      </motion.div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-xl bg-card/95 backdrop-blur-sm overflow-hidden">
                  {/* Top accent line */}
                  <div className="h-1 bg-gradient-to-r from-[#0066cc] via-[#0080ff] to-[#00a3cc]" />
                  
                  <CardHeader className="space-y-2 pb-6 pt-8">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <CardTitle className="text-2xl font-bold text-center text-foreground">
                        Réinitialisation
                      </CardTitle>
                      <CardDescription className="text-center text-muted-foreground mt-2">
                        Entrez votre email pour recevoir un lien de réinitialisation
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pb-8">
                    {resetStatus === "success" ? (
                      <motion.div 
                        className="text-center py-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <motion.div 
                          className="flex justify-center mb-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        >
                          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                          </div>
                        </motion.div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Email envoyé !</h3>
                        <p className="text-muted-foreground text-sm mb-6">{resetMessage}</p>
                        <Button
                          onClick={resetForgotPasswordForm}
                          variant="outline"
                          className="rounded-xl"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Retour à la connexion
                        </Button>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleForgotPassword} className="space-y-5">
                        {resetStatus === "error" && (
                          <motion.div 
                            className="bg-destructive/10 border border-destructive/20 rounded-xl p-4"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="flex items-start gap-3">
                              <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-destructive">{resetMessage}</p>
                            </div>
                          </motion.div>
                        )}
                        
                        <motion.div 
                          className="space-y-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
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
                              onChange={(e) => setResetEmail(e.target.value)}
                              required
                              autoComplete="email"
                              className="pl-10 h-12 rounded-xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-[#0080ff]/20 focus:border-[#0080ff]"
                            />
                          </div>
                        </motion.div>

                        <motion.div 
                          className="flex flex-col gap-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Button 
                            type="submit" 
                            className="w-full h-12 bg-gradient-to-r from-[#0066cc] via-[#0080ff] to-[#00a3cc] hover:opacity-90 text-white font-semibold rounded-xl"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Envoi en cours...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>Envoyer le lien</span>
                                <Mail className="h-4 w-4" />
                              </div>
                            )}
                          </Button>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={resetForgotPasswordForm}
                            className="rounded-xl text-muted-foreground hover:text-foreground"
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Retour à la connexion
                          </Button>
                        </motion.div>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <motion.p 
            className="text-center text-xs text-muted-foreground mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            © {new Date().getFullYear()} EduVate. Tous droits réservés.
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;

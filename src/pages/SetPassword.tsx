import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock, CheckCircle2, XCircle, Loader2, ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import { validatePassword, getStrengthColor, getStrengthLabel } from '@/utils/passwordUtils';
import { cn } from '@/lib/utils';
import eduvateLogoLight from '@/assets/eduvate-logo.png';
import eduvateIcon from '@/assets/eduvate-icon.png';

export default function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [mode, setMode] = useState<'activation' | 'reset'>('activation');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const token = searchParams.get('token');

  // Real-time password validation
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      toast.error("Lien invalide");
      navigate('/auth');
      return;
    }

    try {
      const cleanToken = token.trim();
      console.log('🔍 Validating token via edge function...');

      const { data, error } = await supabase.functions.invoke('validate-invitation-token', {
        body: { token: cleanToken }
      });

      console.log('📥 Token validation response:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        toast.error("Erreur de validation du lien");
        navigate('/auth');
        return;
      }

      if (!data?.valid) {
        console.log('❌ Token invalid:', data?.error);
        toast.error(data?.error || "Lien invalide ou expiré");
        navigate('/auth');
        return;
      }

      console.log('✅ Token is valid, mode:', data.mode);
      setMode(data.mode === 'reset' ? 'reset' : 'activation');
      setUserEmail(data.email || '');
      setValidating(false);
    } catch (err) {
      console.error('Token validation error:', err);
      toast.error('Erreur lors de la validation du lien');
      navigate('/auth');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation with clear messages
    if (!passwordValidation.valid) {
      toast.error('Le mot de passe ne respecte pas les critères de sécurité', {
        description: passwordValidation.errors.slice(0, 2).join('. '),
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (!token) {
      toast.error('Token invalide. Veuillez recommencer.');
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Appel de l\'edge function set-user-password...');
      
      const { data, error } = await supabase.functions.invoke('set-user-password', {
        body: {
          token: token.trim(),
          password: password
        }
      });

      console.log('📥 Réponse de l\'edge function:', { 
        success: !!data?.success,
        error,
        data 
      });

      if (error) {
        console.error('❌ Erreur lors de l\'appel de l\'edge function:', error);
        // Parse specific error messages
        if (error.message?.includes('complexity') || error.message?.includes('password')) {
          toast.error('Le mot de passe ne respecte pas les critères de complexité', {
            description: 'Minimum 12 caractères avec majuscule, minuscule, chiffre et caractère spécial',
          });
        } else {
          toast.error(`Erreur: ${error.message}`);
        }
        return;
      }

      if (data?.error) {
        console.error('❌ Erreur retournée par l\'edge function:', data.error);
        // Parse password complexity errors
        if (data.error.includes('caractères') || data.error.includes('majuscule') || data.error.includes('minuscule')) {
          toast.error('Mot de passe non conforme', {
            description: data.error,
          });
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (!data?.success) {
        console.error('❌ L\'edge function n\'a pas retourné de succès');
        toast.error('Erreur lors de la définition du mot de passe');
        return;
      }

      console.log('✅ Mot de passe défini avec succès');
      toast.success('Mot de passe défini avec succès !', {
        description: 'Vous pouvez maintenant vous connecter.',
      });
      
      setTimeout(() => {
        navigate('/auth');
      }, 1500);
    } catch (err: any) {
      console.error('❌ Erreur lors de la définition du mot de passe:', err);
      toast.error('Erreur lors de la définition du mot de passe', {
        description: 'Veuillez réessayer ou contacter l\'administration.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0066cc]/5 via-background to-[#00a3cc]/5">
        <motion.div 
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.img 
            src={eduvateIcon}
            alt="EduVate"
            className="h-16 w-16"
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Validation du lien...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#0066cc]/5 via-background to-[#00a3cc]/5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-20 w-72 h-72 bg-[#0080ff]/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-[#00a3cc]/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="flex justify-center mb-4"
            animate={{ 
              y: [0, -6, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl bg-card/95 backdrop-blur-sm overflow-hidden">
            {/* Top accent line */}
            <div className="h-1 bg-gradient-to-r from-[#0066cc] via-[#0080ff] to-[#00a3cc]" />
            
            <CardHeader className="space-y-3 pb-4 pt-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="mx-auto"
              >
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#0066cc] to-[#00a3cc] flex items-center justify-center mx-auto shadow-lg">
                  {mode === 'reset' ? (
                    <KeyRound className="h-7 w-7 text-white" />
                  ) : (
                    <ShieldCheck className="h-7 w-7 text-white" />
                  )}
                </div>
              </motion.div>
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {mode === 'reset' ? 'Nouveau mot de passe' : 'Activez votre compte'}
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                  {userEmail && (
                    <span className="block text-sm mb-1">
                      Compte : <span className="font-medium text-foreground">{userEmail}</span>
                    </span>
                  )}
                  {mode === 'reset' 
                    ? 'Créez un nouveau mot de passe sécurisé'
                    : 'Définissez votre mot de passe pour commencer'
                  }
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="pb-8 px-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password field */}
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <PasswordInput
                      id="password"
                      placeholder="Votre mot de passe sécurisé"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-[#0080ff]/20 focus:border-[#0080ff]"
                      required
                    />
                  </div>
                  
                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <motion.div 
                      className="space-y-3 mt-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              getStrengthColor(passwordValidation.strength)
                            )}
                            initial={{ width: 0 }}
                            animate={{ 
                              width: passwordValidation.strength === 'weak' ? '33%' : 
                                     passwordValidation.strength === 'medium' ? '66%' : '100%' 
                            }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs font-semibold min-w-[60px] text-right",
                          passwordValidation.strength === 'weak' && "text-destructive",
                          passwordValidation.strength === 'medium' && "text-amber-500",
                          passwordValidation.strength === 'strong' && "text-green-500"
                        )}>
                          {getStrengthLabel(passwordValidation.strength)}
                        </span>
                      </div>
                      
                      {/* Requirements checklist */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 rounded-xl p-3">
                        {[
                          { label: '12+ caractères', valid: password.length >= 12 },
                          { label: 'Majuscule (A-Z)', valid: /[A-Z]/.test(password) },
                          { label: 'Minuscule (a-z)', valid: /[a-z]/.test(password) },
                          { label: 'Chiffre (0-9)', valid: /[0-9]/.test(password) },
                          { label: 'Spécial (!@#$...)', valid: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) },
                        ].map((req, idx) => (
                          <motion.div 
                            key={idx} 
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            {req.valid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className={cn(
                              "transition-colors",
                              req.valid ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                            )}>
                              {req.label}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Confirm password field */}
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <PasswordInput
                      id="confirmPassword"
                      placeholder="Retapez votre mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-background/50 focus:bg-background focus:ring-2 focus:ring-[#0080ff]/20 focus:border-[#0080ff]"
                      required
                    />
                  </div>
                  
                  {/* Match indicator */}
                  {confirmPassword.length > 0 && (
                    <motion.div 
                      className={cn(
                        "flex items-center gap-2 text-xs mt-2 p-2 rounded-lg",
                        passwordsMatch ? "bg-green-50 dark:bg-green-900/20" : "bg-destructive/10"
                      )}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {passwordsMatch ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 dark:text-green-400 font-medium">Les mots de passe correspondent</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-destructive" />
                          <span className="text-destructive font-medium">Les mots de passe ne correspondent pas</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-[#0066cc] via-[#0080ff] to-[#00a3cc] hover:opacity-90 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl mt-2"
                    disabled={loading || !passwordValidation.valid || !passwordsMatch}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Enregistrement...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{mode === 'reset' ? 'Réinitialiser le mot de passe' : 'Activer mon compte'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.p 
          className="text-center text-xs text-muted-foreground mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          © {new Date().getFullYear()} EduVate. Tous droits réservés.
        </motion.p>
      </div>
    </div>
  );
}

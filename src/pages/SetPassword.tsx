import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock, Shield, CheckCircle2, XCircle, Loader2, GraduationCap, ArrowRight, KeyRound } from 'lucide-react';
import { validatePassword, getStrengthColor, getStrengthLabel } from '@/utils/passwordUtils';
import { cn } from '@/lib/utils';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-16 w-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow animate-pulse">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Validation du lien...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
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
            {mode === 'reset' 
              ? 'Réinitialisez votre mot de passe'
              : 'Activez votre compte'
            }
          </h2>
          
          <p className="text-white/90 text-lg mb-10 max-w-md">
            {mode === 'reset'
              ? 'Créez un nouveau mot de passe sécurisé pour accéder à votre espace.'
              : 'Définissez votre mot de passe pour accéder à toutes les fonctionnalités de la plateforme.'
            }
          </p>
          
          <div className="space-y-4">
            {[
              "Minimum 12 caractères",
              "Une majuscule et une minuscule",
              "Au moins un chiffre",
              "Au moins un caractère spécial"
            ].map((requirement, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-white/95">{requirement}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-white/10 rounded-full" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full" />
      </div>

      {/* Right side - Form */}
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

          <Card className="border-0 shadow-large bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-2 pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <KeyRound className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">
                    {mode === 'reset' ? 'Nouveau mot de passe' : 'Créer votre mot de passe'}
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-muted-foreground">
                {userEmail && (
                  <span className="block text-sm mb-1">
                    Compte : <span className="font-medium text-foreground">{userEmail}</span>
                  </span>
                )}
                Choisissez un mot de passe sécurisé pour votre compte
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password field */}
                <div className="space-y-2">
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
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                  
                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-300 rounded-full",
                              getStrengthColor(passwordValidation.strength)
                            )}
                            style={{ 
                              width: passwordValidation.strength === 'weak' ? '33%' : 
                                     passwordValidation.strength === 'medium' ? '66%' : '100%' 
                            }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs font-medium",
                          passwordValidation.strength === 'weak' && "text-destructive",
                          passwordValidation.strength === 'medium' && "text-yellow-600",
                          passwordValidation.strength === 'strong' && "text-green-600"
                        )}>
                          {getStrengthLabel(passwordValidation.strength)}
                        </span>
                      </div>
                      
                      {/* Requirements checklist */}
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        {[
                          { label: '12+ caractères', valid: password.length >= 12 },
                          { label: 'Majuscule', valid: /[A-Z]/.test(password) },
                          { label: 'Minuscule', valid: /[a-z]/.test(password) },
                          { label: 'Chiffre', valid: /[0-9]/.test(password) },
                          { label: 'Spécial (!@#...)', valid: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) },
                        ].map((req, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            {req.valid ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className={cn(
                              req.valid ? "text-green-600" : "text-muted-foreground"
                            )}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password field */}
                <div className="space-y-2">
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
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                  
                  {/* Match indicator */}
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs mt-1">
                      {passwordsMatch ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-green-600">Les mots de passe correspondent</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                          <span className="text-destructive">Les mots de passe ne correspondent pas</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-primary text-primary-foreground hover:opacity-95 font-semibold rounded-lg transition-all duration-200 shadow-medium hover:shadow-large"
                  disabled={loading || !passwordValidation.valid || !passwordsMatch}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enregistrement...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{mode === 'reset' ? 'Réinitialiser' : 'Activer mon compte'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
              
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Connexion sécurisée avec chiffrement</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} EduVate. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}

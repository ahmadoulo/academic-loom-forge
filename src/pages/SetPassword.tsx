import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export default function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      console.error('❌ Aucun token fourni');
      toast.error('Token d\'invitation invalide');
      navigate('/auth');
      return;
    }

    try {
      console.log('🔍 Validation du token:', token);
      console.log('🔍 Longueur du token:', token.length);
      
      // Nettoyer le token des espaces blancs
      const cleanToken = token.trim();
      
      const { data: account, error } = await supabase
        .from('student_accounts')
        .select('id, email, student_id, school_id, invitation_token, invitation_expires_at, is_active, password_hash')
        .eq('invitation_token', cleanToken)
        .maybeSingle();

      console.log('📥 Résultat de la requête:', { 
        accountFound: !!account, 
        accountId: account?.id,
        hasToken: !!account?.invitation_token,
        hasExpiration: !!account?.invitation_expires_at,
        error 
      });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        toast.error('Erreur lors de la validation du token');
        navigate('/auth');
        return;
      }

      if (!account) {
        console.error('❌ Aucun compte trouvé avec ce token');
        toast.error('Token d\'invitation invalide');
        navigate('/auth');
        return;
      }

      // Vérifier si le compte est déjà actif
      if (account.is_active && account.password_hash) {
        console.log('✅ Compte déjà actif');
        toast.info('Votre compte est déjà actif');
        navigate('/auth');
        return;
      }

      // Vérifier l'expiration du token
      if (!account.invitation_expires_at) {
        console.error('❌ Pas de date d\'expiration');
        toast.error('Token invalide');
        navigate('/auth');
        return;
      }

      const expiresAt = new Date(account.invitation_expires_at);
      const now = new Date();
      
      console.log('📅 Vérification expiration:', { 
        expiresAt: expiresAt.toISOString(), 
        now: now.toISOString(), 
        isExpired: now > expiresAt
      });
      
      // Vérifier si le token a expiré (la date actuelle est APRÈS la date d'expiration)
      if (now > expiresAt) {
        console.error('❌ Token expiré');
        toast.error('Le lien d\'invitation a expiré. Demandez un nouveau lien.');
        navigate('/auth');
        return;
      }

      console.log('✅ Token valide, affichage du formulaire');
      setValidating(false);
    } catch (err) {
      console.error('❌ Erreur de validation:', err);
      toast.error('Erreur lors de la validation du token');
      navigate('/auth');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
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
      console.log('🔐 Appel de l\'edge function pour définir le mot de passe');
      
      // Appeler l'edge function qui gère la définition du mot de passe de manière sécurisée
      const { data, error } = await supabase.functions.invoke('set-student-password', {
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
        toast.error(`Erreur: ${error.message}`);
        return;
      }

      if (data?.error) {
        console.error('❌ Erreur retournée par l\'edge function:', data.error);
        toast.error(data.error);
        return;
      }

      if (!data?.success) {
        console.error('❌ L\'edge function n\'a pas retourné de succès');
        toast.error('Erreur lors de la définition du mot de passe');
        return;
      }

      console.log('✅ Mot de passe défini avec succès');
      toast.success('Mot de passe défini avec succès ! Vous pouvez maintenant vous connecter.');
      
      // Rediriger vers la page d'authentification après 1.5 secondes
      setTimeout(() => {
        navigate('/auth');
      }, 1500);
    } catch (err: any) {
      console.error('❌ Erreur lors de la définition du mot de passe:', err);
      toast.error(`Erreur: ${err?.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <p>Validation en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Définir votre mot de passe</CardTitle>
              <CardDescription>
                Choisissez un mot de passe sécurisé pour votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 8 caractères"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Retapez votre mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Définir le mot de passe'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

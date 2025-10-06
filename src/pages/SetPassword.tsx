import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import bcrypt from 'bcryptjs';

export default function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
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
      setAccountId(account.id);
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

    if (!accountId) {
      toast.error('Session invalide. Veuillez recommencer.');
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Début de la mise à jour du mot de passe pour le compte:', accountId);
      
      // Hasher le mot de passe avec bcrypt (10 rounds)
      const passwordHash = await bcrypt.hash(password, 10);
      console.log('✅ Mot de passe hashé avec succès');

      // Vérifier que le compte existe avant la mise à jour
      const { data: accountCheck, error: checkError } = await supabase
        .from('student_accounts')
        .select('id, email')
        .eq('id', accountId)
        .maybeSingle();

      console.log('🔍 Vérification du compte:', {
        found: !!accountCheck,
        accountId: accountCheck?.id,
        email: accountCheck?.email,
        checkError
      });

      if (checkError || !accountCheck) {
        console.error('❌ Compte non trouvé pour la mise à jour');
        toast.error('Compte introuvable. Le lien a peut-être expiré.');
        navigate('/auth');
        return;
      }

      // Mettre à jour le compte dans student_accounts
      const { error: updateError } = await supabase
        .from('student_accounts')
        .update({
          password_hash: passwordHash,
          is_active: true,
          invitation_token: null,
          invitation_expires_at: null
        })
        .eq('id', accountId);

      console.log('📥 Résultat de la mise à jour:', { 
        success: !updateError,
        updateError
      });

      if (updateError) {
        console.error('❌ Erreur Supabase lors de la mise à jour:', updateError);
        toast.error(`Erreur: ${updateError.message}`);
        return;
      }

      // Vérifier que la mise à jour a bien été effectuée
      const { data: verifyAccount, error: verifyError } = await supabase
        .from('student_accounts')
        .select('id, email, is_active, password_hash')
        .eq('id', accountId)
        .maybeSingle();

      console.log('✅ Vérification après mise à jour:', {
        found: !!verifyAccount,
        isActive: verifyAccount?.is_active,
        hasPassword: !!verifyAccount?.password_hash,
        verifyError
      });

      if (!verifyAccount || !verifyAccount.is_active || !verifyAccount.password_hash) {
        console.error('❌ La mise à jour n\'a pas été enregistrée correctement');
        toast.error('Erreur lors de l\'activation du compte. Veuillez réessayer.');
        return;
      }

      console.log('✅ Compte activé avec succès:', {
        id: verifyAccount.id,
        email: verifyAccount.email,
        is_active: verifyAccount.is_active
      });
      
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

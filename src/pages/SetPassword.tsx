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
  const token = searchParams.get('token');

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      console.error('Aucun token fourni');
      toast.error('Token d\'invitation invalide');
      navigate('/auth');
      return;
    }

    try {
      console.log('Validation du token:', token);
      
      const { data: account, error } = await supabase
        .from('student_accounts')
        .select('id, email, invitation_token, invitation_expires_at, is_active')
        .eq('invitation_token', token)
        .maybeSingle();

      console.log('Résultat de la requête:', { account, error });

      if (error) {
        console.error('Erreur Supabase:', error);
        toast.error('Erreur lors de la validation du token');
        navigate('/auth');
        return;
      }

      if (!account) {
        console.error('Aucun compte trouvé avec ce token');
        toast.error('Token d\'invitation invalide ou expiré');
        navigate('/auth');
        return;
      }

      if (account.is_active) {
        console.log('Compte déjà actif');
        toast.info('Votre compte est déjà actif');
        navigate('/auth');
        return;
      }

      if (!account.invitation_expires_at) {
        console.error('Pas de date d\'expiration');
        toast.error('Token invalide');
        navigate('/auth');
        return;
      }

      const expiresAt = new Date(account.invitation_expires_at);
      const now = new Date();
      console.log('Vérification expiration:', { expiresAt, now, expired: expiresAt < now });
      
      if (expiresAt < now) {
        toast.error('Le lien d\'invitation a expiré. Demandez un nouveau lien.');
        navigate('/auth');
        return;
      }

      console.log('Token valide, affichage du formulaire');
      setValidating(false);
    } catch (err) {
      console.error('Erreur de validation:', err);
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

    setLoading(true);

    try {
      // Hasher le mot de passe
      const passwordHash = await bcrypt.hash(password, 10);
      console.log('Password hashed, updating account...');

      // Mettre à jour le compte
      const { data: updatedAccount, error } = await supabase
        .from('student_accounts')
        .update({
          password_hash: passwordHash,
          is_active: true,
          invitation_token: null,
          invitation_expires_at: null
        })
        .eq('invitation_token', token)
        .select();

      console.log('Update result:', { updatedAccount, error });

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      if (!updatedAccount || updatedAccount.length === 0) {
        toast.error('Token invalide ou expiré');
        return;
      }

      toast.success('Mot de passe défini avec succès ! Vous pouvez maintenant vous connecter.');
      navigate('/auth');
    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur lors de la définition du mot de passe');
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

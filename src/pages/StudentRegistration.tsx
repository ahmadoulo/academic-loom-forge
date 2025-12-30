import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Building2, ArrowLeft } from 'lucide-react';

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [schoolIdentifier, setSchoolIdentifier] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Vérifier si l'école existe
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('identifier', schoolIdentifier)
        .single();

      if (schoolError || !school) {
        toast.error('Identifiant d\'école invalide');
        setLoading(false);
        return;
      }

      // Vérifier si un compte étudiant existe avec cet email dans app_users
      const { data: account, error: accountError } = await supabase
        .from('app_users')
        .select('id, email, is_active, student_id, app_user_roles(role)')
        .eq('email', email)
        .eq('school_id', school.id)
        .maybeSingle();

      if (accountError) {
        toast.error('Erreur lors de la vérification du compte');
        setLoading(false);
        return;
      }

      if (!account) {
        toast.error('Aucun compte trouvé avec cet email pour cette école. Contactez votre administrateur.');
        setLoading(false);
        return;
      }

      // Vérifier que c'est bien un compte étudiant
      const roles = account.app_user_roles as { role: string }[] | null;
      const isStudent = roles?.some(r => r.role === 'student');
      
      if (!isStudent) {
        toast.error('Ce compte n\'est pas un compte étudiant.');
        setLoading(false);
        return;
      }

      if (account.is_active) {
        toast.info('Votre compte est déjà actif. Vous pouvez vous connecter.');
        navigate('/auth');
        return;
      }

      // Envoyer l'email d'invitation
      const { error: inviteError } = await supabase.functions.invoke('send-student-invitation', {
        body: { 
          accountId: account.id,
          email: account.email
        }
      });

      if (inviteError) {
        console.error('Erreur lors de l\'envoi de l\'invitation:', inviteError);
        toast.error('Erreur lors de l\'envoi de l\'email d\'invitation');
        setLoading(false);
        return;
      }

      toast.success('Email d\'invitation envoyé ! Vérifiez votre boîte de réception.');
      
    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la connexion
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Inscription Étudiant</CardTitle>
              <CardDescription>
                Créez votre compte étudiant pour accéder à la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolIdentifier">Identifiant de l'école</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="schoolIdentifier"
                      type="text"
                      placeholder="ex: lycee-victor-hugo"
                      value={schoolIdentifier}
                      onChange={(e) => setSchoolIdentifier(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Contactez votre école si vous ne connaissez pas cet identifiant
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Vérification...' : 'Recevoir l\'invitation'}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Vous recevrez un email pour définir votre mot de passe
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

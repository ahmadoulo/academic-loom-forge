import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Building2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [schoolIdentifier, setSchoolIdentifier] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('verify-student-account', {
        body: { 
          email: email.trim().toLowerCase(),
          schoolIdentifier: schoolIdentifier.trim(),
          appUrl: window.location.origin,
        }
      });

      if (error) {
        console.error('Erreur edge function:', error);
        setStatus('error');
        setMessage('Une erreur est survenue. Veuillez réessayer.');
        return;
      }

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Email d\'activation envoyé ! Vérifiez votre boîte de réception.');
        if (data.warning) {
          console.warn('Warning:', data.warning);
        }
      } else {
        setStatus('error');
        setMessage(data.message || 'Erreur lors de la vérification');
        
        // Rediriger vers connexion si déjà actif
        if (data.error === 'already_active') {
          setTimeout(() => navigate('/auth'), 2000);
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
      setStatus('error');
      setMessage('Une erreur inattendue est survenue');
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
              <CardTitle>Activer mon compte étudiant</CardTitle>
              <CardDescription>
                Entrez votre email et l'identifiant de votre école pour recevoir un lien d'activation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === 'success' ? (
                <div className="space-y-4">
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      {message}
                    </AlertDescription>
                  </Alert>
                  <p className="text-sm text-muted-foreground text-center">
                    Consultez votre boîte email (pensez à vérifier les spams)
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setStatus('idle');
                      setEmail('');
                      setSchoolIdentifier('');
                    }}
                  >
                    Renvoyer un email
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {status === 'error' && message && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}

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
                        disabled={loading}
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
                        disabled={loading}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Contactez votre école si vous ne connaissez pas cet identifiant
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Vérification en cours...' : 'Recevoir le lien d\'activation'}
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    Vous recevrez un email pour définir votre mot de passe
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
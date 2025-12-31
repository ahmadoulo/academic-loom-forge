import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Building2, ArrowLeft, CheckCircle, AlertCircle, GraduationCap, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AccountType = 'student' | 'teacher';

export default function AccountActivation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [schoolIdentifier, setSchoolIdentifier] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('student');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const functionName = accountType === 'student' 
        ? 'verify-student-account' 
        : 'verify-teacher-account';

      const { data, error } = await supabase.functions.invoke(functionName, {
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
          toast.info('Votre compte est déjà actif');
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

  const resetForm = () => {
    setStatus('idle');
    setEmail('');
    setSchoolIdentifier('');
    setMessage('');
  };

  const getAccountTypeLabel = () => {
    return accountType === 'student' ? 'étudiant' : 'professeur';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <div className="max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la connexion
          </Button>

          <Card className="border-0 shadow-large bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-bold text-foreground">Première connexion</CardTitle>
              <CardDescription className="text-muted-foreground">
                Activez votre compte en entrant vos informations ci-dessous.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === 'success' ? (
                <div className="space-y-5">
                  <Alert className="border-green-500/30 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-400">{message}</AlertDescription>
                  </Alert>

                  <p className="text-sm text-muted-foreground text-center">
                    Consultez votre boîte email (pensez à vérifier les spams)
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={resetForm}
                  >
                    Renvoyer un email
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <Tabs value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="student" className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Étudiant
                      </TabsTrigger>
                      <TabsTrigger value="teacher" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Professeur
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {status === 'error' && message && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{message}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Adresse email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="votre.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11"
                          required
                          disabled={loading}
                          autoComplete="email"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        L'email renseigné par votre école dans votre fiche {getAccountTypeLabel()}.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schoolIdentifier">Identifiant de l'école</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="schoolIdentifier"
                          type="text"
                          placeholder="ex: lycee-victor-hugo"
                          value={schoolIdentifier}
                          onChange={(e) => setSchoolIdentifier(e.target.value)}
                          className="pl-10 h-11"
                          required
                          disabled={loading}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cet identifiant vous est fourni par votre établissement.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-primary text-primary-foreground hover:opacity-95 font-semibold rounded-lg transition-all duration-200 shadow-medium hover:shadow-large"
                      disabled={loading}
                    >
                      {loading ? 'Vérification en cours...' : "Recevoir le lien d'activation"}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      Vous recevrez un email pour définir votre mot de passe.
                    </p>
                  </form>
                </div>
              )}
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

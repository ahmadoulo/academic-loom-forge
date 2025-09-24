import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { useSchools } from "@/hooks/useSchools";
import { GraduationCap, LogIn, UserPlus } from "lucide-react";

export default function AuthPage() {
  const { signIn, signUp, isAuthenticated, loading } = useAuth();
  const { schools } = useSchools();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "student" as UserRole,
    school_id: "",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(formData.email, formData.password);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(formData.email, formData.password, {
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
      school_id: formData.school_id || undefined,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            EduVate
          </h1>
          <p className="text-muted-foreground mt-2">
            Plateforme de gestion académique moderne
          </p>
        </div>

        <Card className="shadow-large border-0 bg-gradient-card backdrop-blur-sm">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Connexion
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Inscription
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
                <CardDescription>
                  Connectez-vous à votre compte EduVate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 bg-gradient-primary hover:opacity-90 shadow-medium">
                    Se connecter
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-primary-light/50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Comptes de démonstration :</h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p><strong>Admin Global:</strong> admin@eduvate.com</p>
                    <p><strong>Admin École:</strong> school@eduvate.com</p>
                    <p><strong>Professeur:</strong> teacher@eduvate.com</p>
                    <p><strong>Étudiant:</strong> student@eduvate.com</p>
                    <p><strong>Parent:</strong> parent@eduvate.com</p>
                    <p className="pt-1"><em>Mot de passe: password123</em></p>
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="signup">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold">Inscription</CardTitle>
                <CardDescription>
                  Créez votre compte EduVate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Prénom</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Nom</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Étudiant</SelectItem>
                        <SelectItem value="teacher">Professeur</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="school_admin">Admin École</SelectItem>
                        <SelectItem value="global_admin">Admin Global</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(formData.role !== 'global_admin') && (
                    <div className="space-y-2">
                      <Label htmlFor="school">École</Label>
                      <Select
                        value={formData.school_id}
                        onValueChange={(value) => setFormData({ ...formData, school_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une école" />
                        </SelectTrigger>
                        <SelectContent>
                          {schools.map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 shadow-medium">
                    Créer le compte
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
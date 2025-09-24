import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GraduationCap, 
  Shield, 
  Clock, 
  Brain, 
  Users, 
  BarChart3, 
  BookOpen, 
  Building, 
  Lock, 
  Zap,
  Database,
  Globe,
  Settings,
  LogIn,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useSchools } from "@/hooks/useSchools";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { UserManagement } from "@/components/settings/UserManagement";
import { RoleManagement } from "@/components/settings/RoleManagement";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";

export default function Index() {
  const { isAuthenticated, profile, loading } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("profile");

  const navigate = useNavigate();
  const { schools, getSchoolByIdentifier } = useSchools();
  const { toast } = useToast();
  const [schoolId, setSchoolId] = useState("");
  const [teacherId, setTeacherId] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Bienvenue sur EduVate</h1>
          <p className="text-muted-foreground mb-6">
            Connectez-vous pour accéder à votre tableau de bord
          </p>
          <Button 
            onClick={() => navigate("/auth")}
            className="bg-gradient-primary hover:opacity-90"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  // Get available settings tabs based on user role
  const getAvailableSettingsTabs = () => {
    const baseTabs = ["profile"];
    if (profile?.role === 'global_admin') {
      return [...baseTabs, "users", "roles", "system"];
    }
    if (profile?.role === 'school_admin') {
      return [...baseTabs, "users", "notifications"];
    }
    return baseTabs;
  };

  const handleSchoolAccess = async () => {
    if (schoolId) {
      try {
        const school = await getSchoolByIdentifier(schoolId);
        if (school) {
          navigate(`/school/${school.id}`);
        } else {
          toast({
            variant: "destructive",
            title: "École non trouvée",
            description: "L'identifiant saisi ne correspond à aucune école."
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de récupérer les informations de l'école."
        });
      }
    }
  };

  const handleTeacherAccess = () => {
    if (teacherId) {
      navigate(`/teacher/${teacherId}`);
    }
  };

  if (showSettings) {
    const availableTabs = getAvailableSettingsTabs();
    return (
      <SettingsLayout 
        activeTab={activeSettingsTab} 
        onTabChange={setActiveSettingsTab}
        availableTabs={availableTabs}
      >
        <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab}>
          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>
          <TabsContent value="notifications">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Notifications</h3>
              <p className="text-muted-foreground">Fonctionnalité à venir...</p>
            </div>
          </TabsContent>
          <TabsContent value="system">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Paramètres système</h3>
              <p className="text-muted-foreground">Fonctionnalité à venir...</p>
            </div>
          </TabsContent>
        </Tabs>
        <div className="mt-8 flex justify-start">
          <Button variant="outline" onClick={() => setShowSettings(false)}>
            ← Retour au tableau de bord
          </Button>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      <AuthenticatedHeader 
        title="EduVate Dashboard" 
        onSettingsClick={() => setShowSettings(true)} 
      />
      
      {/* Dashboard Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Bienvenue, {profile?.first_name} !
                </h1>
                <p className="text-muted-foreground mt-2">
                  Voici votre tableau de bord EduVate
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres
                </Button>
                <Button
                  onClick={() => navigate("/auth")}
                  className="flex items-center gap-2 bg-gradient-primary hover:opacity-90"
                >
                  <LogIn className="h-4 w-4" />
                  Autres comptes
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            <Card className="shadow-lg border-0 bg-card hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 bg-gradient-to-r from-primary to-primary-dark rounded-xl flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <Badge className="bg-primary/10 text-primary">
                    Admin
                  </Badge>
                </div>
                <CardTitle className="text-xl">Administration Globale</CardTitle>
                <CardDescription>
                  Gestion complète de toutes les écoles et utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate("/admin")}
                  className="w-full bg-gradient-to-r from-primary to-primary-dark hover:opacity-90"
                  disabled={profile?.role !== 'global_admin'}
                >
                  Accéder
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-card hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-600">
                    École
                  </Badge>
                </div>
                <CardTitle className="text-xl">Gestion École</CardTitle>
                <CardDescription>
                  Administrez votre établissement scolaire
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate("/school")}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90"
                  disabled={!['global_admin', 'school_admin'].includes(profile?.role || '')}
                >
                  Accéder
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-card hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-green-500/10 text-green-600">
                    Prof
                  </Badge>
                </div>
                <CardTitle className="text-xl">Interface Professeur</CardTitle>
                <CardDescription>
                  Gérez vos classes et vos élèves
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate("/teacher")}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90"
                  disabled={!['global_admin', 'school_admin', 'teacher'].includes(profile?.role || '')}
                >
                  Accéder
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Advanced SaaS Features Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
                Fonctionnalités Avancées
              </h2>
              <p className="text-muted-foreground">
                Découvrez les capacités révolutionnaires d'EduVate
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-medium border-0 bg-gradient-card backdrop-blur-sm hover:shadow-glow transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">Gestion IA Utilisateurs</CardTitle>
                  <CardDescription>
                    Intelligence artificielle pour la gestion automatique et les recommandations personnalisées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">ML</Badge>
                    <Badge variant="secondary" className="bg-accent/10 text-accent">Auto</Badge>
                    <Badge variant="secondary" className="bg-success/10 text-success">Prédictif</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-medium border-0 bg-gradient-card backdrop-blur-sm hover:shadow-glow transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">Analytics Temps Réel</CardTitle>
                  <CardDescription>
                    Tableaux de bord dynamiques avec métriques en temps réel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-accent/10 text-accent">Real-time</Badge>
                    <Badge variant="secondary" className="bg-warning/10 text-warning">Dashboard</Badge>
                    <Badge variant="secondary" className="bg-destructive/10 text-destructive">Insights</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-medium border-0 bg-gradient-card backdrop-blur-sm hover:shadow-glow transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">Sécurité Entreprise</CardTitle>
                  <CardDescription>
                    Chiffrement bout-en-bout, authentification multi-facteurs, conformité RGPD
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-destructive/10 text-destructive">Enterprise</Badge>
                    <Badge variant="secondary" className="bg-success/10 text-success">RGPD</Badge>
                    <Badge variant="secondary" className="bg-warning/10 text-warning">Audit</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="shadow-medium border-0 bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Écoles connectées</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <Building className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-medium border-0 bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                    <p className="text-2xl font-bold">1,247</p>
                  </div>
                  <Users className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-medium border-0 bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Classes actives</p>
                    <p className="text-2xl font-bold">86</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-medium border-0 bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Temps de disponibilité</p>
                    <p className="text-2xl font-bold">99.9%</p>
                  </div>
                  <Zap className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="shadow-large border-0 bg-gradient-hero text-white">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Découvrez la puissance d'EduVate
              </h2>
              <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
                Plateforme SaaS complète pour la gestion académique moderne
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 px-8 py-3 text-lg font-semibold shadow-xl"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Essai Gratuit
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary px-8 py-3 text-lg font-semibold"
                >
                  En savoir plus
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
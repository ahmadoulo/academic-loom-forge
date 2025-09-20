import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GraduationCap, Users, School, BookOpen, LogIn, ArrowRight, Star, Zap, Shield, BarChart } from "lucide-react";

const Index = () => {
  const [schoolId, setSchoolId] = useState("");
  const [teacherId, setTeacherId] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary via-primary-dark to-secondary overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
        <div className="relative container mx-auto px-6 py-24 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <GraduationCap className="h-16 w-16 text-white" />
              <div className="absolute -top-2 -right-2 h-6 w-6 bg-accent rounded-full flex items-center justify-center">
                <Star className="h-3 w-3 text-accent-foreground" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white">
              Academic<span className="text-accent">Pro</span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl mb-6 text-white/90 max-w-3xl mx-auto font-medium">
            La plateforme SaaS de gestion académique nouvelle génération
          </p>
          <p className="text-lg mb-8 text-white/80 max-w-2xl mx-auto">
            IA intégrée • Analytics avancés • Interface moderne • Multi-établissements
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => window.location.href = '/admin'}
              className="text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Users className="h-5 w-5 mr-2" />
              Administration Globale
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-4 border-white/20 text-white hover:bg-white/10 shadow-lg"
                >
                  <School className="h-5 w-5 mr-2" />
                  Accès École
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Accès École</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Identifiant de votre école"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                  />
                  <Button 
                    onClick={() => schoolId && (window.location.href = `/school/${schoolId}`)}
                    disabled={!schoolId}
                    className="w-full"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Accéder au tableau de bord
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-4 border-white/20 text-white hover:bg-white/10 shadow-lg"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Interface Professeur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Accès Professeur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Votre identifiant professeur"
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                  />
                  <Button 
                    onClick={() => teacherId && (window.location.href = `/teacher/${teacherId}`)}
                    disabled={!teacherId}
                    className="w-full"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Accéder à l'interface
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-center gap-6 text-white/70">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm">Temps réel</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="text-sm">IA intégrée</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Fonctionnalités SaaS Avancées
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Une solution complète avec intelligence artificielle intégrée pour révolutionner la gestion académique
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Gestion IA des Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Création automatique de comptes avec suggestions IA et détection de doublons intelligente
              </p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary" className="text-xs">Auto-import</Badge>
                <Badge variant="secondary" className="text-xs">Détection IA</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <BarChart className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Analytics Temps Réel</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Tableaux de bord interactifs avec prédictions IA et insights automatiques
              </p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary" className="text-xs">Temps réel</Badge>
                <Badge variant="secondary" className="text-xs">Prédictif</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Notes Intelligentes</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Saisie vocale, auto-complétion et suggestions basées sur l'historique des élèves
              </p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary" className="text-xs">Vocal</Badge>
                <Badge variant="secondary" className="text-xs">Auto-ML</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <School className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Multi-Établissements SaaS</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Architecture cloud native avec isolation des données et facturation automatisée
              </p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary" className="text-xs">Cloud</Badge>
                <Badge variant="secondary" className="text-xs">Isolé</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Sécurité Enterprise</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Chiffrement end-to-end, audit trails et conformité RGPD automatique
              </p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary" className="text-xs">RGPD</Badge>
                <Badge variant="secondary" className="text-xs">Audit</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">API & Intégrations</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                API REST complète avec webhooks et intégrations natives (Office 365, Google Workspace)
              </p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary" className="text-xs">REST API</Badge>
                <Badge variant="secondary" className="text-xs">Webhooks</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/30 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à transformer votre établissement ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Rejoignez plus de 1000+ établissements qui font confiance à AcademicPro pour leur gestion académique
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-4">
              Démarrer l'essai gratuit
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4">
              Planifier une démo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

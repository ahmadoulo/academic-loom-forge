import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, School, BookOpen } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="container mx-auto px-6 py-24 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <GraduationCap className="h-12 w-12" />
            <h1 className="text-4xl md:text-6xl font-bold">AcademicPro</h1>
          </div>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
            Plateforme de gestion académique moderne pour établissements scolaires
          </p>
          <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
            Gérez les notes, absences et communications entre professeurs, étudiants et parents en toute simplicité
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => window.location.href = '/admin'}
              className="text-lg px-8 py-3"
            >
              <Users className="h-5 w-5 mr-2" />
              Administration Globale
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-3 border-white/20 text-white hover:bg-white/10"
              onClick={() => {
                const schoolId = prompt("Entrez l'identifiant de votre école:");
                if (schoolId) window.location.href = `/school/${schoolId}`;
              }}
            >
              <School className="h-5 w-5 mr-2" />
              Accès École
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-3 border-white/20 text-white hover:bg-white/10"
              onClick={() => {
                const teacherId = prompt("Entrez votre identifiant professeur:");
                if (teacherId) window.location.href = `/teacher/${teacherId}`;
              }}
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Interface Professeur
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Fonctionnalités Principales
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Une solution complète pour la gestion académique moderne
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Gestion Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Créez et gérez facilement les comptes professeurs, étudiants et parents
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Notes & Évaluations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Saisie des notes, calcul automatique des moyennes et génération de bulletins
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <School className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Multi-Établissements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gérez plusieurs établissements depuis une interface centralisée
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;

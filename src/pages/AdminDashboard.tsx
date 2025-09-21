import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, School, Users, TrendingUp, Trash2, Building, GraduationCap, BookOpen, Loader2 } from "lucide-react";
import { useSchools } from "@/hooks/useSchools";
import { useTeachers } from "@/hooks/useTeachers";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { SchoolCard } from "@/components/admin/SchoolCard";
import { StatsCard } from "@/components/analytics/StatsCard";
import { QuickActions } from "@/components/analytics/QuickActions";
import { RecentActivity } from "@/components/analytics/RecentActivity";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const AdminDashboard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: "", identifier: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; schoolId?: string; schoolName?: string }>({ open: false });

  const { schools, loading, createSchool } = useSchools();
  const { teachers } = useTeachers();
  const { students } = useStudents();
  const { classes } = useClasses();
  const { subjects } = useSubjects();

  // Calculate stats
  const stats = useMemo(() => {
    const totalTeachers = teachers.length;
    const totalStudents = students.length;
    const totalClasses = classes.length;
    const totalSubjects = subjects.length;
    
    return {
      totalSchools: schools.length,
      totalTeachers,
      totalStudents,
      totalClasses,
      totalSubjects,
      avgStudentsPerClass: totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0,
      avgSubjectsPerClass: totalClasses > 0 ? Math.round(totalSubjects / totalClasses) : 0
    };
  }, [schools, teachers, students, classes, subjects]);

  // Generate recent activities
  const recentActivities = useMemo(() => {
    const activities: any[] = [];
    
    // Recent schools
    schools.slice(0, 2).forEach(school => {
      activities.push({
        id: `school-${school.id}`,
        type: 'school' as const,
        title: `École créée: ${school.name}`,
        description: `Identifiant: ${school.identifier}`,
        timestamp: school.created_at,
        status: 'success' as const
      });
    });

    // Recent teachers
    teachers.slice(0, 2).forEach(teacher => {
      const school = schools.find(s => s.id === teacher.school_id);
      activities.push({
        id: `teacher-${teacher.id}`,
        type: 'teacher' as const,
        title: `Professeur ajouté: ${teacher.firstname} ${teacher.lastname}`,
        description: school ? `École: ${school.name}` : 'École non trouvée',
        timestamp: teacher.created_at,
        status: 'success' as const
      });
    });

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [schools, teachers]);

  const quickActions = [
    {
      title: "Nouvelle École",
      description: "Créer un nouvel établissement",
      icon: School,
      onClick: () => setIsDialogOpen(true),
      variant: "default" as const
    },
    {
      title: "Gestion des Utilisateurs",
      description: "Gérer les utilisateurs système",
      icon: Users,
      onClick: () => console.log("Gestion utilisateurs"),
      variant: "outline" as const
    },
    {
      title: "Rapports",
      description: "Générer des rapports détaillés",
      icon: TrendingUp,
      onClick: () => console.log("Rapports"),
      variant: "outline" as const
    },
    {
      title: "Configuration",
      description: "Paramètres globaux",
      icon: Building,
      onClick: () => console.log("Configuration"),
      variant: "outline" as const
    }
  ];

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name.trim()) return;

    setIsSubmitting(true);
    try {
      const identifier = newSchool.identifier.trim() || `SCH${String(schools.length + 1).padStart(3, '0')}`;
      await createSchool({
        name: newSchool.name,
        identifier
      });
      setNewSchool({ name: "", identifier: "" });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la création de l'école:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (!deleteDialog.schoolId) return;
    
    try {
      // TODO: Implement delete school functionality
      console.log("Suppression de l'école:", deleteDialog.schoolId);
      setDeleteDialog({ open: false });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const handleViewSchool = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      window.location.href = `/school/${school.identifier}`;
    }
  };

  const handleEditSchool = (schoolId: string) => {
    console.log("Edit school:", schoolId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement des données...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Tableau de bord Administrateur" userRole="admin" />
      
      <main className="container mx-auto px-6 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Écoles"
            value={stats.totalSchools}
            icon={School}
            description="Établissements enregistrés"
            change={`${stats.totalSchools} active${stats.totalSchools > 1 ? 's' : ''}`}
            changeType="positive"
          />
          <StatsCard
            title="Total Professeurs"
            value={stats.totalTeachers}
            icon={GraduationCap}
            description="Enseignants actifs"
            change={`Répartis dans ${stats.totalSchools} école${stats.totalSchools > 1 ? 's' : ''}`}
            changeType="neutral"
          />
          <StatsCard
            title="Total Étudiants"
            value={stats.totalStudents}
            icon={Users}
            description="Étudiants inscrits"
            change={`Moyenne ${stats.avgStudentsPerClass} par classe`}
            changeType="positive"
          />
          <StatsCard
            title="Total Classes"
            value={stats.totalClasses}
            icon={Building}
            description="Classes créées"
            change={`${stats.totalSubjects} matières total`}
            changeType="neutral"
          />
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <QuickActions actions={quickActions} />
          </div>
          <div className="lg:col-span-2">
            <RecentActivity activities={recentActivities} />
          </div>
        </div>

        {/* Schools Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Gestion des Écoles</CardTitle>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle École
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune école enregistrée</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par créer votre première école pour gérer les étudiants et les professeurs.
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une école
                  </Button>
                </div>
              ) : (
                schools.map((school) => {
                  const schoolTeachers = teachers.filter(t => t.school_id === school.id);
                  const schoolStudents = students.filter(s => s.school_id === school.id);
                  const schoolClasses = classes.filter(c => c.school_id === school.id);
                  
                  return (
                    <div key={school.id} className="relative">
                      <SchoolCard 
                        school={{
                          id: school.id,
                          name: school.name,
                          identifier: school.identifier,
                          studentsCount: schoolStudents.length,
                          teachersCount: schoolTeachers.length,
                          classesCount: schoolClasses.length,
                          createdAt: school.created_at
                        }}
                        onView={handleViewSchool}
                        onEdit={handleEditSchool}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setDeleteDialog({ 
                          open: true, 
                          schoolId: school.id, 
                          schoolName: school.name 
                        })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Create School Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un Nouvel Établissement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSchool} className="space-y-4">
            <div>
              <Label htmlFor="school-name">Nom de l'établissement</Label>
              <Input
                id="school-name"
                value={newSchool.name}
                onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                placeholder="Ex: Lycée Victor Hugo"
                required
              />
            </div>
            <div>
              <Label htmlFor="school-identifier">Identifiant (optionnel)</Label>
              <Input
                id="school-identifier"
                value={newSchool.identifier}
                onChange={(e) => setNewSchool({ ...newSchool, identifier: e.target.value })}
                placeholder="Ex: LVH2024 (généré automatiquement si vide)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer l'École
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Supprimer l'école"
        description={`Êtes-vous sûr de vouloir supprimer l'école "${deleteDialog.schoolName}" ? Cette action est irréversible et supprimera toutes les données associées (étudiants, professeurs, classes, etc.).`}
        onConfirm={handleDeleteSchool}
      />
    </div>
  );
};

export default AdminDashboard;
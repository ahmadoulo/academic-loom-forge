import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { SchoolCard } from "@/components/admin/SchoolCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, School, TrendingUp, Users, BookOpen } from "lucide-react";

// Mock data - will be replaced with real database calls
const mockSchools = [
  {
    id: "1",
    name: "Lycée Victor Hugo",
    identifier: "LVH001",
    studentsCount: 450,
    teachersCount: 35,
    classesCount: 18,
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "2", 
    name: "Collège Marie Curie",
    identifier: "CMC002",
    studentsCount: 320,
    teachersCount: 28,
    classesCount: 12,
    createdAt: "2024-02-10T10:00:00Z"
  }
];

const AdminDashboard = () => {
  const [schools, setSchools] = useState(mockSchools);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");

  const handleCreateSchool = () => {
    if (!newSchoolName.trim()) return;
    
    const identifier = `SCH${String(schools.length + 1).padStart(3, '0')}`;
    const newSchool = {
      id: String(Date.now()),
      name: newSchoolName,
      identifier,
      studentsCount: 0,
      teachersCount: 0,
      classesCount: 0,
      createdAt: new Date().toISOString()
    };
    
    setSchools([...schools, newSchool]);
    setNewSchoolName("");
    setIsCreateDialogOpen(false);
  };

  const handleViewSchool = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      // Navigate to school dashboard
      window.location.href = `/school/${school.identifier}`;
    }
  };

  const handleEditSchool = (schoolId: string) => {
    console.log("Edit school:", schoolId);
  };

  const totalStudents = schools.reduce((sum, school) => sum + school.studentsCount, 0);
  const totalTeachers = schools.reduce((sum, school) => sum + school.teachersCount, 0);
  const totalClasses = schools.reduce((sum, school) => sum + school.classesCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Tableau de Bord Global" userRole="admin" />
      
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Écoles</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{schools.length}</div>
              <p className="text-xs text-muted-foreground">Établissements actifs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Étudiants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Total réseau</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professeurs</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalTeachers}</div>
              <p className="text-xs text-muted-foreground">Enseignants actifs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalClasses}</div>
              <p className="text-xs text-muted-foreground">Classes gérées</p>
            </CardContent>
          </Card>
        </div>

        {/* Schools Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Établissements Scolaires</h2>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle École
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un Nouvel Établissement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="school-name">Nom de l'établissement</Label>
                  <Input
                    id="school-name"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    placeholder="Ex: Lycée Victor Hugo"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleCreateSchool}>
                    Créer l'École
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Schools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => (
            <SchoolCard
              key={school.id}
              school={school}
              onView={handleViewSchool}
              onEdit={handleEditSchool}
            />
          ))}
        </div>
        
        {schools.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun établissement</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre premier établissement scolaire.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une École
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
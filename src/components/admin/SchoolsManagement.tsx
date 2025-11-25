import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Search, 
  Plus,
  Eye,
  Edit,
  MapPin,
  Phone
} from "lucide-react";
import { useSchools } from "@/hooks/useSchools";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SchoolForm } from "./SchoolForm";

interface SchoolsManagementProps {
  onAddSchool: () => void;
  onEditSchool: (schoolId: string) => void;
  onViewSchool: (schoolId: string) => void;
}

export function SchoolsManagement({ onAddSchool, onEditSchool, onViewSchool }: SchoolsManagementProps) {
  const { schools } = useSchools();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.identifier.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleEdit = (school: any) => {
    setEditingSchool(school);
    setShowSchoolDialog(true);
  };

  const handleAdd = () => {
    setEditingSchool(null);
    setShowSchoolDialog(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gestion des Écoles</h2>
            <p className="text-muted-foreground">
              {filteredSchools.length} école(s) trouvée(s)
            </p>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une École
          </Button>
        </div>

        {/* Search & Filters */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une école..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schools Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school) => (
            <Card key={school.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{school.name}</CardTitle>
                      <CardDescription className="text-xs">{school.identifier}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {school.city && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{school.city}</span>
                  </div>
                )}
                {school.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{school.phone}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onViewSchool(school.id)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(school)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSchools.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune école trouvée</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {searchTerm
                  ? "Essayez d'ajuster vos critères de recherche"
                  : "Commencez par ajouter votre première école"}
              </p>
              {!searchTerm && (
                <Button onClick={handleAdd} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter une École
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* School Dialog */}
      <Dialog open={showSchoolDialog} onOpenChange={(open) => {
        setShowSchoolDialog(open);
        if (!open) setEditingSchool(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchool ? "Modifier l'École" : "Ajouter une École"}
            </DialogTitle>
          </DialogHeader>
          <SchoolForm
            editingSchool={editingSchool}
            onSuccess={() => {
              setShowSchoolDialog(false);
              setEditingSchool(null);
            }}
            onCancel={() => {
              setShowSchoolDialog(false);
              setEditingSchool(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
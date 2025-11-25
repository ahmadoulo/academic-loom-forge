import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Building2, 
  Search, 
  Plus,
  Eye,
  Edit
} from "lucide-react";
import { useSchools } from "@/hooks/useSchools";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SchoolForm } from "./SchoolForm";
import { SchoolDetailsDialog } from "./SchoolDetailsDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface SchoolsManagementProps {
  onAddSchool: () => void;
  onEditSchool: (schoolId: string) => void;
  onViewSchool: (schoolId: string) => void;
}

export function SchoolsManagement({ onAddSchool, onEditSchool, onViewSchool }: SchoolsManagementProps) {
  const navigate = useNavigate();
  const { schools } = useSchools();
  const { subscriptions } = useSubscriptions();
  const [searchTerm, setSearchTerm] = useState("");
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

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

  const handleViewDetails = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setShowDetailsDialog(true);
  };

  const getSchoolSubscription = (schoolId: string) => {
    return subscriptions.find(sub => sub.school_id === schoolId);
  };

  const getSubscriptionBadge = (schoolId: string) => {
    const sub = getSchoolSubscription(schoolId);
    
    if (!sub) return <Badge variant="secondary">Aucun</Badge>;
    
    if (sub.is_trial) {
      const isExpired = new Date(sub.trial_end_date!) < new Date();
      return (
        <Badge variant={isExpired ? "destructive" : "default"}>
          {isExpired ? "Essai expiré" : "Essai gratuit"}
        </Badge>
      );
    }

    switch (sub.status) {
      case 'active':
        return <Badge variant="default">Actif</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expiré</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Annulé</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
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

        {/* Schools Table */}
        {filteredSchools.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>École</TableHead>
                    <TableHead>Propriétaire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Abonnement</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools.map((school) => {
                    const subscription = getSchoolSubscription(school.id);
                    return (
                      <TableRow key={school.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                                {school.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{school.name}</div>
                              <div className="text-xs text-muted-foreground">{school.identifier}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {school.owner ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-secondary text-xs">
                                  {school.owner.first_name[0]}{school.owner.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-sm">
                                <div className="font-medium">{school.owner.first_name} {school.owner.last_name}</div>
                                <div className="text-xs text-muted-foreground">{school.owner.email}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Non assigné</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={school.is_active ? "default" : "secondary"}>
                            {school.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getSubscriptionBadge(school.id)}
                            {subscription && subscription.is_trial && subscription.trial_end_date && (
                              <div className="text-xs text-muted-foreground">
                                Fin: {format(new Date(subscription.trial_end_date), "dd/MM/yyyy")}
                              </div>
                            )}
                            {subscription && !subscription.is_trial && (
                              <div className="text-xs text-muted-foreground">
                                Fin: {format(new Date(subscription.end_date), "dd/MM/yyyy")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(school.created_at), "dd/MM/yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(school.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Détails
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(school)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Modifier
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

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

      {/* School Details Dialog */}
      <SchoolDetailsDialog
        schoolId={selectedSchoolId}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </>
  );
}
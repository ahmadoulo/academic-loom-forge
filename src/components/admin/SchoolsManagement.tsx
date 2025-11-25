import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Eye, Edit, ArrowUpDown, Filter, X } from "lucide-react";
import { useSchools } from "@/hooks/useSchools";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SchoolsManagementProps {
  onAddSchool: () => void;
  onEditSchool: (schoolId: string) => void;
  onViewSchool: (schoolId: string) => void;
}

export function SchoolsManagement({ onAddSchool, onEditSchool, onViewSchool }: SchoolsManagementProps) {
  const { schools, loading } = useSchools();
  const { subscriptions } = useSubscriptions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const schoolsWithSubscriptions = useMemo(() => {
    return schools.map(school => {
      const schoolSubs = subscriptions.filter(sub => sub.school_id === school.id);
      const activeSub = schoolSubs.find(sub => sub.status === 'active' || sub.status === 'trial');
      
      return {
        ...school,
        subscription: activeSub,
        isActive: !!activeSub,
        isTrial: activeSub?.is_trial || false,
        subscriptionStatus: activeSub?.status || 'none'
      };
    });
  }, [schools, subscriptions]);

  const filteredSchools = useMemo(() => {
    let filtered = [...schoolsWithSubscriptions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(school =>
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.identifier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(school =>
        statusFilter === 'active' ? school.isActive : !school.isActive
      );
    }

    // Subscription filter
    if (subscriptionFilter !== 'all') {
      filtered = filtered.filter(school => {
        if (subscriptionFilter === 'trial') return school.isTrial;
        if (subscriptionFilter === 'paid') return school.isActive && !school.isTrial;
        if (subscriptionFilter === 'expired') return !school.isActive;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });

    return filtered;
  }, [schoolsWithSubscriptions, searchTerm, statusFilter, subscriptionFilter, sortBy, sortOrder]);

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || subscriptionFilter !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSubscriptionFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Écoles</h2>
          <p className="text-muted-foreground">Gérez toutes vos écoles et leurs abonnements</p>
        </div>
        <Button onClick={onAddSchool} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une École
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nom de l'école..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>

            {/* Subscription Filter */}
            <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut d'abonnement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="trial">Essai</SelectItem>
                <SelectItem value="paid">Payant</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-') as ['name' | 'date', 'asc' | 'desc'];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
            >
              <SelectTrigger>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date de création (récent → ancien)</SelectItem>
                <SelectItem value="date-asc">Date de création (ancien → récent)</SelectItem>
                <SelectItem value="name-asc">Nom (A → Z)</SelectItem>
                <SelectItem value="name-desc">Nom (Z → A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
              <span className="text-sm text-muted-foreground">
                {filteredSchools.length} école(s) trouvée(s)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schools Table */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-5 gap-4 pb-3 border-b text-sm font-medium text-muted-foreground">
              <div>ÉCOLE</div>
              <div>PROPRIÉTAIRE</div>
              <div>STATUT</div>
              <div>ABONNEMENT</div>
              <div>DATE DE CRÉATION</div>
              <div>ACTIONS</div>
            </div>

            {/* Rows */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : filteredSchools.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune école trouvée
              </div>
            ) : (
              filteredSchools.map((school) => (
                <div key={school.id} className="grid grid-cols-5 gap-4 py-3 items-center hover:bg-muted/50 rounded-lg px-2 transition-colors">
                  <div>
                    <div className="font-medium">{school.name}</div>
                    <div className="text-sm text-muted-foreground">{school.identifier}</div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {school.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">Admin</div>
                    </div>
                  </div>

                  <div>
                    {school.isActive ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <div>
                    {school.subscription ? (
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={school.isTrial ? 'outline' : 'default'}
                          className={
                            school.isTrial 
                              ? 'bg-blue-50 text-blue-600 border-blue-200' 
                              : 'bg-primary/10 text-primary'
                          }
                        >
                          {school.isTrial ? 'Trial' : school.subscription.plan_type}
                        </Badge>
                        {school.subscription.end_date && (
                          <span className="text-xs text-muted-foreground">
                            Fin: {format(new Date(school.subscription.end_date), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        Aucun
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {format(new Date(school.created_at), 'dd/MM/yyyy', { locale: fr })}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewSchool(school.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Détails
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEditSchool(school.id)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, UserPlus, Search, Loader2, X, User, Mail
} from 'lucide-react';
import { useSchoolRoles, type SchoolRole } from '@/hooks/useSchoolRoles';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UserRoleAssignmentProps {
  schoolId: string;
  canEdit?: boolean;
}

interface SchoolUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  roles: { role_id: string; role_name: string }[];
}

const ROLE_COLORS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
};

export function UserRoleAssignment({ schoolId, canEdit = true }: UserRoleAssignmentProps) {
  const { user } = useAuth();
  const { roles, userRoles, assignRoleToUser, removeRoleFromUser, loading: rolesLoading } = useSchoolRoles(schoolId);
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SchoolUser | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  // Fetch users for this school
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Get users for this school (excluding students and teachers with accounts)
        const { data: appUsers, error } = await supabase
          .from('app_users')
          .select('id, email, first_name, last_name, is_active')
          .eq('school_id', schoolId)
          .order('last_name');

        if (error) throw error;

        // Get user roles for each user
        const usersWithRoles: SchoolUser[] = await Promise.all(
          (appUsers || []).map(async (appUser) => {
            const { data: roleData } = await supabase
              .from('user_school_roles')
              .select(`
                school_role_id,
                role:school_roles(id, name)
              `)
              .eq('user_id', appUser.id)
              .eq('school_id', schoolId);

            return {
              ...appUser,
              roles: (roleData || []).map((r: any) => ({
                role_id: r.school_role_id,
                role_name: r.role?.name || 'Unknown',
              })),
            };
          })
        );

        setUsers(usersWithRoles);
      } catch (err) {
        console.error('Error fetching users:', err);
        toast.error('Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchUsers();
    }
  }, [schoolId, userRoles]);

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId || !user?.id) return;

    await assignRoleToUser(selectedUser.id, selectedRoleId, user.id);
    setIsAssignDialogOpen(false);
    setSelectedUser(null);
    setSelectedRoleId('');
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    await removeRoleFromUser(userId, roleId);
  };

  const getRoleColorClass = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    return ROLE_COLORS[role?.color || 'blue'] || ROLE_COLORS.blue;
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(query) ||
      u.first_name.toLowerCase().includes(query) ||
      u.last_name.toLowerCase().includes(query)
    );
  });

  const getAvailableRolesForUser = (userId: string) => {
    const userAssignedRoleIds = users.find(u => u.id === userId)?.roles.map(r => r.role_id) || [];
    return roles.filter(r => !userAssignedRoleIds.includes(r.id));
  };

  if (loading || rolesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Aucun rôle disponible</h3>
          <p className="text-muted-foreground">
            Créez d'abord des rôles dans l'onglet "Gestion des rôles" pour pouvoir les attribuer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Attribution des rôles</h2>
          <p className="text-muted-foreground">Assignez des rôles personnalisés aux utilisateurs</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Roles Summary */}
      <div className="flex flex-wrap gap-2">
        {roles.map(role => (
          <Badge key={role.id} className={ROLE_COLORS[role.color || 'blue']}>
            {role.name} ({role.users_count || 0})
          </Badge>
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>
            {filteredUsers.length} utilisateur(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôles attribués</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(u => {
                  const availableRoles = getAvailableRolesForUser(u.id);
                  
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {u.first_name} {u.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 ? (
                            <span className="text-sm text-muted-foreground">Aucun rôle</span>
                          ) : canEdit ? (
                            u.roles.map(r => (
                              <Badge 
                                key={r.role_id} 
                                className={`${getRoleColorClass(r.role_name)} pr-1`}
                              >
                                {r.role_name}
                                <button
                                  onClick={() => handleRemoveRole(u.id, r.role_id)}
                                  className="ml-1 hover:bg-black/10 rounded p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            u.roles.map(r => (
                              <Badge 
                                key={r.role_id} 
                                className={getRoleColorClass(r.role_name)}
                              >
                                {r.role_name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit && availableRoles.length > 0 && (
                          <Dialog 
                            open={isAssignDialogOpen && selectedUser?.id === u.id}
                            onOpenChange={(open) => {
                              setIsAssignDialogOpen(open);
                              if (!open) {
                                setSelectedUser(null);
                                setSelectedRoleId('');
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedUser(u)}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Attribuer
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Attribuer un rôle</DialogTitle>
                                <DialogDescription>
                                  Choisissez un rôle à attribuer à {u.first_name} {u.last_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Rôle</Label>
                                  <Select
                                    value={selectedRoleId}
                                    onValueChange={setSelectedRoleId}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionner un rôle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableRoles.map(role => (
                                        <SelectItem key={role.id} value={role.id}>
                                          <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${ROLE_COLORS[role.color || 'blue'].split(' ')[0]}`} />
                                            {role.name}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setIsAssignDialogOpen(false)}
                                >
                                  Annuler
                                </Button>
                                <Button 
                                  onClick={handleAssignRole}
                                  disabled={!selectedRoleId}
                                >
                                  Attribuer
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

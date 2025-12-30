import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { useSchools } from "@/hooks/useSchools";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { UserPlus, Search, MoreVertical, Edit, Trash2, Mail, Key } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface AppUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  school_id: string | null;
  is_active: boolean;
  app_user_roles: { role: string; school_id: string | null }[];
}

export function UserManagement() {
  const { profile } = useAuth();
  const { schools } = useSchools();
  const { createUserCredential, loading } = useCustomAuth();
  
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "student" as UserRole,
    school_id: "",
    password: "",
  });

  // Fetch users from app_users table
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const { data, error } = await supabase
        .from('app_users')
        .select('id, email, first_name, last_name, school_id, is_active, app_user_roles(role, school_id)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers((data || []) as AppUser[]);
    } catch (err) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setUsersLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateUser = async () => {
    try {
      const generatedPassword = generatePassword();
      
      const result = await createUserCredential({
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
        school_id: newUser.school_id || undefined,
        password: generatedPassword,
      });

      if (result) {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(generatedPassword);
          toast.success(`Utilisateur créé! Mot de passe copié: ${generatedPassword}`, { duration: 10000 });
        } else {
          toast.success(`Utilisateur créé! Mot de passe: ${generatedPassword}`, { duration: 10000 });
        }

        setIsCreateDialogOpen(false);
        setNewUser({
          email: "",
          first_name: "",
          last_name: "",
          role: "student",
          school_id: "",
          password: "",
        });
        
        fetchUsers();
      }
    } catch (error) {
      // Error already handled in useCustomAuth hook
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId, requestedBy: profile?.id || 'admin' }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      if (navigator.clipboard && data.newPassword) {
        await navigator.clipboard.writeText(data.newPassword);
        toast.success(`Nouveau mot de passe copié: ${data.newPassword}`, { duration: 10000 });
      } else {
        toast.success(`Nouveau mot de passe: ${data.newPassword}`, { duration: 10000 });
      }
    } catch (error) {
      toast.error('Erreur lors de la génération du mot de passe');
    }
  };

  const getRoleBadge = (roles: { role: string }[]) => {
    const role = roles[0]?.role || 'unknown';
    const roleConfig: Record<string, { label: string; className: string }> = {
      global_admin: { label: "Admin Global", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
      admin: { label: "Admin", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
      school_admin: { label: "Admin École", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      teacher: { label: "Professeur", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      student: { label: "Étudiant", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
    };
    
    const config = roleConfig[role] || { label: role, className: "" };
    return <Badge variant="secondary" className={config.className}>{config.label}</Badge>;
  };

  const getSchoolName = (schoolId: string | null) => {
    if (!schoolId) return "Toutes les écoles";
    const school = schools.find(s => s.id === schoolId);
    return school?.name || "École inconnue";
  };

  const deleteUser = async (userId: string) => {
    try {
      await supabase.from('app_user_roles').delete().eq('user_id', userId);
      const { error } = await supabase.from('app_users').delete().eq('id', userId);
      if (error) throw error;
      
      toast.success('Utilisateur supprimé avec succès');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const canManageUsers = profile?.role === 'global_admin' || profile?.role === 'admin' || profile?.role === 'school_admin';

  if (usersLoading || loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Chargement des utilisateurs...</p>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Accès restreint</h3>
        <p className="text-muted-foreground">
          Vous n'avez pas les permissions nécessaires pour gérer les utilisateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-4 items-start">
        <div className="w-full">
          <h2 className="text-xl lg:text-2xl font-bold">Gestion des utilisateurs</h2>
          <p className="text-muted-foreground text-sm lg:text-base">
            Gérez les comptes utilisateurs et leurs permissions
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
              <UserPlus className="h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Ajoutez un nouvel utilisateur à la plateforme
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-first-name">Prénom</Label>
                  <Input
                    id="new-first-name"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-last-name">Nom</Label>
                  <Input
                    id="new-last-name"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-role">Rôle</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Étudiant</SelectItem>
                    <SelectItem value="teacher">Professeur</SelectItem>
                    {(profile?.role === 'global_admin' || profile?.role === 'admin') && (
                      <>
                        <SelectItem value="school_admin">Admin École</SelectItem>
                        <SelectItem value="global_admin">Admin Global</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {newUser.role !== 'global_admin' && (
                <div className="space-y-2">
                  <Label htmlFor="new-school">École</Label>
                  <Select
                    value={newUser.school_id}
                    onValueChange={(value) => setNewUser({ ...newUser, school_id: value })}
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
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                  Annuler
                </Button>
                <Button onClick={handleCreateUser} className="bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg lg:text-xl">Liste des utilisateurs</CardTitle>
          <CardDescription>
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des utilisateurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Utilisateur</TableHead>
                  <TableHead className="hidden sm:table-cell">Rôle</TableHead>
                  <TableHead className="hidden md:table-cell">École</TableHead>
                  <TableHead className="hidden lg:table-cell">Statut</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="min-w-0">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-xs bg-gradient-primary text-white">
                            {user.first_name[0]}{user.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                          <div className="sm:hidden mt-1">
                            {getRoleBadge(user.app_user_roles)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {getRoleBadge(user.app_user_roles)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm truncate max-w-[150px]">{getSchoolName(user.school_id)}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                            <Key className="h-4 w-4 mr-2" />
                            Réinitialiser mot de passe
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Envoyer un email
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Search, MoreVertical, Trash2, Key, Copy, Check, AlertTriangle, Filter, Loader2, Shield } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useHybridAuth } from "@/hooks/useHybridAuth";
import { useSchoolRoles, SchoolRole } from "@/hooks/useSchoolRoles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SchoolUserManagementProps {
  schoolId: string;
  canEdit?: boolean;
}

interface AppUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  app_user_roles: { role: string }[];
  user_school_roles?: { school_role_id: string; role?: { name: string; color: string } }[];
}

// User types for creation
// Only staff type for this form - teachers/students are managed elsewhere
type UserType = 'staff';

const STAFF_LABEL = 'Personnel administratif';

export function SchoolUserManagement({ schoolId, canEdit = true }: SchoolUserManagementProps) {
  const { user: currentUser } = useHybridAuth();
  const { roles: schoolRoles, loading: rolesLoading } = useSchoolRoles(schoolId);
  
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  
  // Password reset dialog states
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<AppUser | null>(null);
  const [newPasswordGenerated, setNewPasswordGenerated] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordCopied, setResetPasswordCopied] = useState(false);
  
  const [newUser, setNewUser] = useState({
    email: "",
    first_name: "",
    last_name: "",
    user_type: "staff" as UserType,
    school_role_id: "", // For staff with custom permissions
  });

  // Fetch ONLY staff users for this school (not teachers or students)
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      
      // Get users for this school - filter only staff (no teacher_id, no student_id)
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('id, email, first_name, last_name, is_active, teacher_id, student_id')
        .eq('school_id', schoolId)
        .is('teacher_id', null)
        .is('student_id', null)
        .order('created_at', { ascending: false });
      
      if (usersError) throw usersError;
      
      if (!usersData || usersData.length === 0) {
        setUsers([]);
        return;
      }
      
      const userIds = usersData.map(u => u.id);
      
      // Fetch roles for these users
      const { data: rolesData, error: rolesError } = await supabase
        .from('app_user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
      
      // Silent error handling for roles fetch
      
      // Fetch school-specific roles
      const { data: schoolRolesData, error: schoolRolesError } = await supabase
        .from('user_school_roles')
        .select('user_id, school_role_id, school_roles(name, color)')
        .eq('school_id', schoolId)
        .in('user_id', userIds);
      
      // Silent error handling for school roles fetch
      
      // Combine the data
      const combinedUsers: AppUser[] = usersData.map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
        app_user_roles: (rolesData || [])
          .filter(r => r.user_id === user.id)
          .map(r => ({ role: r.role })),
        user_school_roles: (schoolRolesData || [])
          .filter(sr => sr.user_id === user.id)
          .map(sr => ({
            school_role_id: sr.school_role_id,
            role: sr.school_roles as unknown as { name: string; color: string }
          }))
      }));
      
      setUsers(combinedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setUsersLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, [schoolId]);

  // Filter by role and search term
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (roleFilter === 'all') return matchesSearch;
    
    // Check app_user_role
    const appRole = user.app_user_roles[0]?.role;
    if (roleFilter === 'school_staff') {
      return matchesSearch && appRole === roleFilter;
    }
    
    // Check custom school role
    const hasSchoolRole = user.user_school_roles?.some(usr => usr.school_role_id === roleFilter);
    return matchesSearch && hasSchoolRole;
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGeneratePassword = () => {
    const password = generatePassword();
    setGeneratedPassword(password);
    setShowPassword(true);
    setPasswordCopied(false);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordCopied(true);
      toast.success("Mot de passe copié!");
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const handleCreateUser = async () => {
    if (!generatedPassword) {
      toast.error('Veuillez générer un mot de passe d\'abord');
      return;
    }

    if (!newUser.email || !newUser.first_name || !newUser.last_name) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    // For staff, require a school role
    if (newUser.user_type === 'staff' && !newUser.school_role_id) {
      toast.error('Veuillez sélectionner un rôle pour le personnel');
      return;
    }

    setIsCreating(true);
    try {
      // Staff users always get school_staff role
      const appRole = 'school_staff';

      const requestBody: any = {
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: appRole,
        schoolId: schoolId,
        password: generatedPassword,
        createdBy: currentUser?.id,
        sessionToken: localStorage.getItem('app_session_token'),
      };

      // Add school role ID only for staff
      if (newUser.user_type === 'staff' && newUser.school_role_id) {
        requestBody.schoolRoleId = newUser.school_role_id;
      }

      console.log('Creating user with:', requestBody);

      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: requestBody
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erreur lors de la création');
      }
      
      if (data?.error) {
        console.error('API error:', data.error);
        throw new Error(data.error);
      }

      toast.success(`${STAFF_LABEL} créé avec succès!`);
      setIsCreateDialogOpen(false);
      setNewUser({ email: "", first_name: "", last_name: "", user_type: "staff", school_role_id: "" });
      setGeneratedPassword("");
      setShowPassword(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Create user error:', error);
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const openResetPasswordDialog = (user: AppUser) => {
    setResetPasswordUser(user);
    setNewPasswordGenerated("");
    setResetPasswordCopied(false);
    setResetPasswordDialogOpen(true);
  };

  const executePasswordReset = async () => {
    if (!resetPasswordUser || !currentUser) return;
    
    setIsResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId: resetPasswordUser.id, requestedBy: currentUser.id }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setNewPasswordGenerated(data.newPassword);
      toast.success('Mot de passe réinitialisé!');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const copyNewPassword = async () => {
    try {
      await navigator.clipboard.writeText(newPasswordGenerated);
      setResetPasswordCopied(true);
      toast.success("Mot de passe copié!");
      setTimeout(() => setResetPasswordCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Delete user_school_roles first
      await supabase.from('user_school_roles').delete().eq('user_id', userId);
      // Delete app_user_roles
      await supabase.from('app_user_roles').delete().eq('user_id', userId);
      // Then delete user
      const { error } = await supabase.from('app_users').delete().eq('id', userId);
      if (error) throw error;
      
      toast.success('Utilisateur supprimé avec succès');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const getRoleBadges = (user: AppUser) => {
    const badges: React.ReactNode[] = [];
    const appRole = user.app_user_roles[0]?.role;
    
    // App role badge
    const roleConfig: Record<string, { label: string; className: string }> = {
      teacher: { label: "Professeur", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
      student: { label: "Étudiant", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
      school_admin: { label: "Administrateur", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      school_staff: { label: "Personnel", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
    };
    
    if (appRole && roleConfig[appRole]) {
      badges.push(
        <Badge key="app-role" variant="secondary" className={roleConfig[appRole].className}>
          {roleConfig[appRole].label}
        </Badge>
      );
    }
    
    // Custom school roles
    if (user.user_school_roles && user.user_school_roles.length > 0) {
      user.user_school_roles.forEach((usr, idx) => {
        if (usr.role) {
          const colorClasses: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
            pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
          };
          badges.push(
            <Badge 
              key={`school-role-${idx}`} 
              variant="secondary" 
              className={colorClasses[usr.role.color] || 'bg-muted text-muted-foreground'}
            >
              {usr.role.name}
            </Badge>
          );
        }
      });
    }
    
    return badges.length > 0 ? badges : <Badge variant="secondary" className="bg-muted text-muted-foreground">Aucun rôle</Badge>;
  };

  if (usersLoading || rolesLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-4 items-start">
        <div className="w-full">
          <h2 className="text-xl lg:text-2xl font-bold">Gestion des utilisateurs</h2>
          <p className="text-muted-foreground text-sm lg:text-base">
            Gérez tous les comptes utilisateurs de votre école
          </p>
        </div>
        
        {canEdit && (
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setNewUser({ email: "", first_name: "", last_name: "", user_type: "staff", school_role_id: "" });
              setGeneratedPassword("");
              setShowPassword(false);
              setPasswordCopied(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
                <UserPlus className="h-4 w-4" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un utilisateur</DialogTitle>
              <DialogDescription>
                Créez un compte pour un membre de votre établissement
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Staff Info */}
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-medium text-primary">{STAFF_LABEL}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Les comptes professeurs et étudiants sont gérés dans leurs sections respectives.
                </p>
              </div>
              {/* School Role for Staff */}
              {newUser.user_type === 'staff' && (
                <div className="space-y-2">
                  <Label>Rôle personnalisé *</Label>
                  {schoolRoles.length === 0 ? (
                    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                        Créez d'abord des rôles dans l'onglet "Rôles & Permissions"
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select
                      value={newUser.school_role_id}
                      onValueChange={(value) => setNewUser({ ...newUser, school_role_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolRoles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ 
                                  backgroundColor: role.color === 'blue' ? '#3b82f6' : 
                                    role.color === 'green' ? '#22c55e' : 
                                    role.color === 'purple' ? '#a855f7' : 
                                    role.color === 'orange' ? '#f97316' : 
                                    role.color === 'red' ? '#ef4444' : 
                                    role.color === 'teal' ? '#14b8a6' : 
                                    role.color === 'pink' ? '#ec4899' : '#6b7280'
                                }}
                              />
                              <span>{role.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {newUser.school_role_id && (
                    <p className="text-xs text-muted-foreground">
                      {schoolRoles.find(r => r.id === newUser.school_role_id)?.description}
                    </p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-first-name">Prénom *</Label>
                  <Input
                    id="new-first-name"
                    placeholder="Jean"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-last-name">Nom *</Label>
                  <Input
                    id="new-last-name"
                    placeholder="Dupont"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Email *</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="jean.dupont@ecole.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <Label>Mot de passe</Label>
                {!showPassword ? (
                  <Button type="button" variant="outline" onClick={handleGeneratePassword} className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Générer un mot de passe
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                      <code className="flex-1 text-sm font-mono select-all">{generatedPassword}</code>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={copyPassword}
                        className="shrink-0"
                      >
                        {passwordCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                        Copiez ce mot de passe maintenant. Il ne sera plus affiché après la création.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreateUser} 
                disabled={
                  isCreating || 
                  !newUser.email || 
                  !newUser.first_name || 
                  !newUser.last_name || 
                  !generatedPassword ||
                  (newUser.user_type === 'staff' && !newUser.school_role_id)
                }
                className="bg-gradient-primary hover:opacity-90"
              >
                {isCreating ? "Création..." : "Créer l'utilisateur"}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg lg:text-xl">Liste des utilisateurs</CardTitle>
          <CardDescription>
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des utilisateurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  <SelectItem value="school_staff">Personnel administratif</SelectItem>
                  {schoolRoles.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Rôles personnalisés</div>
                      {schoolRoles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Utilisateur</TableHead>
                  <TableHead className="hidden sm:table-cell">Rôle(s)</TableHead>
                  <TableHead className="hidden lg:table-cell">Statut</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src="" alt={`${user.first_name} ${user.last_name}`} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {user.first_name[0]}{user.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="sm:hidden mt-1 flex flex-wrap gap-1">{getRoleBadges(user)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">{getRoleBadges(user)}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={user.is_active ? "default" : "secondary"} className={user.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}>
                        {user.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                openResetPasswordDialog(user);
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Réinitialiser le mot de passe
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                deleteUser(user.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Password Reset Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              {resetPasswordUser && (
                <>Réinitialiser le mot de passe de <strong>{resetPasswordUser.first_name} {resetPasswordUser.last_name}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {!newPasswordGenerated ? (
            <div className="space-y-4">
              <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Cette action générera un nouveau mot de passe temporaire.
                </AlertDescription>
              </Alert>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={executePasswordReset}
                  disabled={isResettingPassword}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    "Réinitialiser"
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                  <code className="flex-1 text-sm font-mono select-all">{newPasswordGenerated}</code>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyNewPassword}
                    className="shrink-0"
                  >
                    {resetPasswordCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                  Copiez ce mot de passe maintenant et transmettez-le à l'utilisateur.
                </AlertDescription>
              </Alert>
              <DialogFooter>
                <Button onClick={() => {
                  setResetPasswordDialogOpen(false);
                  setNewPasswordGenerated("");
                  setResetPasswordUser(null);
                }}>
                  Fermer
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

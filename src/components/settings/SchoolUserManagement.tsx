import React, { useState, useEffect, useMemo } from "react";
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
import { UserPlus, Search, MoreVertical, Trash2, Key, Copy, Check, AlertTriangle, Filter, Loader2, Shield, RefreshCw, Clock, Users, GraduationCap, BookOpen, UserCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolRoles, SchoolRole } from "@/hooks/useSchoolRoles";
import { generateSecurePassword } from "@/utils/passwordUtils";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface SchoolUserManagementProps {
  schoolId: string;
  canEdit?: boolean;
}

interface SchoolUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  teacher_id?: string | null;
  student_id?: string | null;
  app_user_roles: { role: string; school_id?: string }[];
}

type UserTypeFilter = 'all' | 'student' | 'teacher' | 'staff';

export function SchoolUserManagement({ schoolId, canEdit = true }: SchoolUserManagementProps) {
  const { user: currentUser } = useAuth();
  const { roles: schoolRoles, loading: rolesLoading } = useSchoolRoles(schoolId);
  
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<UserTypeFilter>("all");
  
  // Create staff dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  
  // Password reset dialog
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<SchoolUser | null>(null);
  const [newPasswordGenerated, setNewPasswordGenerated] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordCopied, setResetPasswordCopied] = useState(false);
  
  const [newUser, setNewUser] = useState({
    email: "",
    first_name: "",
    last_name: "",
    school_role_id: "",
  });

  // Fetch ALL users for this school via Edge Function (bypasses RLS)
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      
      const sessionToken = localStorage.getItem("app_session_token") || localStorage.getItem("sessionToken");
      
      if (!sessionToken) {
        toast.error("Session expirée, veuillez vous reconnecter");
        setUsers([]);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('list-app-users', {
        body: { sessionToken, schoolId }
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setUsers(data?.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error("Erreur lors du chargement des utilisateurs");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchUsers();
    }
  }, [schoolId]);

  // User type detection
  const getUserType = (user: SchoolUser): 'student' | 'teacher' | 'staff' => {
    const appRole = user.app_user_roles?.[0]?.role;
    if (appRole === 'student' || user.student_id) return 'student';
    if (appRole === 'teacher' || user.teacher_id) return 'teacher';
    return 'staff';
  };

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const students = users.filter(u => getUserType(u) === 'student').length;
    const teachers = users.filter(u => getUserType(u) === 'teacher').length;
    const staff = users.filter(u => getUserType(u) === 'staff').length;
    const active = users.filter(u => u.is_active).length;
    return { total, students, teachers, staff, active };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const matchesSearch = 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      // User type filter
      if (userTypeFilter === 'all') return matchesSearch;
      
      const userType = getUserType(user);
      return matchesSearch && userType === userTypeFilter;
    });
  }, [users, searchTerm, userTypeFilter]);

  // Generate password
  const handleGeneratePassword = () => {
    const password = generateSecurePassword(16);
    setGeneratedPassword(password);
    setShowPassword(true);
    setPasswordCopied(false);
  };

  const copyPassword = async (password: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Mot de passe copié!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  // Create staff user
  const handleCreateUser = async () => {
    if (!generatedPassword) {
      toast.error("Veuillez générer un mot de passe d'abord");
      return;
    }

    if (!newUser.email || !newUser.first_name || !newUser.last_name) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (!newUser.school_role_id) {
      toast.error("Veuillez sélectionner un rôle pour le personnel");
      return;
    }

    setIsCreating(true);
    try {
      const sessionToken = localStorage.getItem("app_session_token") || localStorage.getItem("sessionToken");
      
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: {
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: 'school_staff',
          schoolId,
          password: generatedPassword,
          createdBy: currentUser?.id,
          sessionToken,
          schoolRoleId: newUser.school_role_id,
        }
      });

      if (error) throw new Error(error.message || "Erreur lors de la création");
      if (data?.error) throw new Error(data.error);

      toast.success("Personnel créé avec succès!");
      setIsCreateDialogOpen(false);
      setNewUser({ email: "", first_name: "", last_name: "", school_role_id: "" });
      setGeneratedPassword("");
      setShowPassword(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  };

  // Reset password
  const openResetPasswordDialog = (user: SchoolUser) => {
    setResetPasswordUser(user);
    setNewPasswordGenerated("");
    setResetPasswordCopied(false);
    setResetPasswordDialogOpen(true);
  };

  const executePasswordReset = async () => {
    if (!resetPasswordUser || !currentUser) return;
    
    setIsResettingPassword(true);
    try {
      const sessionToken = localStorage.getItem("app_session_token") || localStorage.getItem("sessionToken");
      
      if (!sessionToken) {
        toast.error("Session expirée, veuillez vous reconnecter");
        return;
      }
      
      const newPassword = generateSecurePassword(16);
      
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { sessionToken, userId: resetPasswordUser.id, newPassword }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setNewPasswordGenerated(data.newPassword);
      toast.success("Mot de passe réinitialisé!");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la réinitialisation");
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    try {
      const sessionToken = localStorage.getItem("app_session_token") || localStorage.getItem("sessionToken");
      
      if (!sessionToken) {
        toast.error("Session expirée, veuillez vous reconnecter");
        return;
      }

      const { data, error } = await supabase.functions.invoke("delete-user-account", {
        body: { sessionToken, userId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erreur lors de la suppression");
      
      toast.success("Utilisateur supprimé avec succès");
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la suppression");
    }
  };

  // Role badge
  const getRoleBadge = (user: SchoolUser) => {
    const userType = getUserType(user);
    const roleConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      student: { 
        label: "Étudiant", 
        icon: <GraduationCap className="h-3 w-3" />,
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200" 
      },
      teacher: { 
        label: "Professeur", 
        icon: <BookOpen className="h-3 w-3" />,
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" 
      },
      staff: { 
        label: "Personnel", 
        icon: <Shield className="h-3 w-3" />,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200" 
      },
    };
    
    const config = roleConfig[userType];
    return (
      <Badge variant="secondary" className={`${config.className} gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Format last login
  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return <span className="text-muted-foreground text-sm">Jamais connecté</span>;
    
    try {
      const date = new Date(lastLogin);
      const relative = formatDistanceToNow(date, { addSuffix: true, locale: fr });
      return (
        <div className="flex flex-col">
          <span className="text-sm">{relative}</span>
          <span className="text-xs text-muted-foreground">
            {format(date, "dd/MM/yyyy HH:mm", { locale: fr })}
          </span>
        </div>
      );
    } catch {
      return <span className="text-muted-foreground text-sm">-</span>;
    }
  };

  if (usersLoading || rolesLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
          <p className="text-muted-foreground">
            Gérez tous les comptes utilisateurs de votre école
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={usersLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          {canEdit && (
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) {
                setNewUser({ email: "", first_name: "", last_name: "", school_role_id: "" });
                setGeneratedPassword("");
                setShowPassword(false);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nouveau personnel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Créer un personnel administratif</DialogTitle>
                  <DialogDescription>
                    Les comptes professeurs et étudiants sont gérés dans leurs sections respectives.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
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
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
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
                          <code className="flex-1 text-sm font-mono select-all truncate">{generatedPassword}</code>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyPassword(generatedPassword, setPasswordCopied)}
                            className="shrink-0"
                          >
                            {passwordCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
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
                    disabled={isCreating || !newUser.email || !newUser.first_name || !newUser.last_name || !generatedPassword || !newUser.school_role_id}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {isCreating ? "Création..." : "Créer l'utilisateur"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <GraduationCap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.students}</p>
                <p className="text-sm text-muted-foreground">Étudiants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.teachers}</p>
                <p className="text-sm text-muted-foreground">Professeurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.staff}</p>
                <p className="text-sm text-muted-foreground">Personnel</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Liste des utilisateurs</CardTitle>
          <CardDescription>
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={userTypeFilter} onValueChange={(v) => setUserTypeFilter(v as UserTypeFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  <SelectItem value="student">Étudiants</SelectItem>
                  <SelectItem value="teacher">Professeurs</SelectItem>
                  <SelectItem value="staff">Personnel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Utilisateur</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Dernière connexion</TableHead>
                  <TableHead className="hidden sm:table-cell">Statut</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                          <div className="md:hidden mt-1">{getRoleBadge(user)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getRoleBadge(user)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatLastLogin(user.last_login)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge 
                        variant={user.is_active ? "default" : "secondary"} 
                        className={user.is_active 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200" 
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }
                      >
                        {user.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={(e) => {
                              e.preventDefault();
                              openResetPasswordDialog(user);
                            }}>
                              <Key className="mr-2 h-4 w-4" />
                              Réinitialiser le mot de passe
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.first_name} ${user.last_name} ?`)) {
                                  deleteUser(user.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <UserCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
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
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
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
                  <code className="flex-1 text-sm font-mono select-all truncate">{newPasswordGenerated}</code>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyPassword(newPasswordGenerated, setResetPasswordCopied)}
                    className="shrink-0"
                  >
                    {resetPasswordCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
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

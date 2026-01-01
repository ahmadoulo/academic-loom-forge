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
import { UserPlus, Search, MoreVertical, Edit, Trash2, Key, Copy, Check, AlertTriangle, Filter } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useHybridAuth } from "@/hooks/useHybridAuth";

interface SchoolUserManagementProps {
  schoolId: string;
}

interface AppUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  app_user_roles: { role: string }[];
}

type SchoolRole = 'school_admin' | 'admission' | 'accountant' | 'secretary';

const SCHOOL_ROLES: { value: SchoolRole; label: string }[] = [
  { value: 'school_admin', label: 'Administrateur' },
  { value: 'admission', label: 'Admission' },
  { value: 'accountant', label: 'Comptabilité / Finance' },
  { value: 'secretary', label: 'Secrétariat' },
];

export function SchoolUserManagement({ schoolId }: SchoolUserManagementProps) {
  const { user: currentUser } = useHybridAuth();
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
    role: "school_admin" as SchoolRole,
  });

  // Fetch users for this school from app_users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const { data, error } = await supabase
        .from('app_users')
        // Explicit FK needed because app_user_roles has multiple relations to app_users
        .select('id, email, first_name, last_name, is_active, app_user_roles!app_user_roles_user_id_fkey(role)')
        .eq('school_id', schoolId)
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
  }, [schoolId]);

  // Filter by role and search term - exclude teacher/student roles
  const filteredUsers = users.filter(user => {
    const userRole = user.app_user_roles[0]?.role || '';
    // Exclude teacher and student roles - they are managed in their own sections
    if (userRole === 'teacher' || userRole === 'student') return false;
    
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || userRole === roleFilter;
    return matchesSearch && matchesRole;
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

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: {
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role,
          schoolId: schoolId,
          password: generatedPassword,
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const roleLabel = SCHOOL_ROLES.find(r => r.value === newUser.role)?.label || 'Utilisateur';
      toast.success(`${roleLabel} créé avec succès!`);
      setIsCreateDialogOpen(false);
      setNewUser({ email: "", first_name: "", last_name: "", role: "school_admin" });
      setGeneratedPassword("");
      setShowPassword(false);
      fetchUsers();
    } catch (error: any) {
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
      // Delete roles first
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

  const getRoleBadge = (roles: { role: string }[]) => {
    const role = roles[0]?.role || 'unknown';
    const roleConfig: Record<string, { label: string; className: string }> = {
      teacher: { label: "Professeur", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
      student: { label: "Étudiant", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
      school_admin: { label: "Administrateur", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      admission: { label: "Admission", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
      accountant: { label: "Comptabilité", className: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
      secretary: { label: "Secrétariat", className: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
    };
    
    const config = roleConfig[role] || { label: role, className: "bg-muted text-muted-foreground" };
    return <Badge variant="secondary" className={config.className}>{config.label}</Badge>;
  };

  if (usersLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-4 items-start">
        <div className="w-full">
          <h2 className="text-xl lg:text-2xl font-bold">Gestion des utilisateurs</h2>
          <p className="text-muted-foreground text-sm lg:text-base">
            Gérez les comptes utilisateurs de votre école
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setNewUser({ email: "", first_name: "", last_name: "", role: "school_admin" });
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un utilisateur</DialogTitle>
              <DialogDescription>
                Ajoutez un nouvel utilisateur pour gérer votre école
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-role">Profil *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: SchoolRole) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un profil" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleCreateUser} 
                disabled={isCreating || !newUser.email || !newUser.first_name || !newUser.last_name || !generatedPassword}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isCreating ? "Création..." : "Créer l'utilisateur"}
              </Button>
            </DialogFooter>
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par profil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les profils</SelectItem>
                  {SCHOOL_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Utilisateur</TableHead>
                  <TableHead className="hidden sm:table-cell">Rôle</TableHead>
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
                          <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                            <Key className="h-4 w-4 mr-2" />
                            Réinitialiser mot de passe
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

      {/* Password Reset Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={(open) => {
        setResetPasswordDialogOpen(open);
        if (!open) {
          setResetPasswordUser(null);
          setNewPasswordGenerated("");
          setResetPasswordCopied(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              {resetPasswordUser && `Pour ${resetPasswordUser.first_name} ${resetPasswordUser.last_name}`}
            </DialogDescription>
          </DialogHeader>
          
          {!newPasswordGenerated ? (
            <div className="space-y-4">
              <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Cette action va générer un nouveau mot de passe pour cet utilisateur. L'ancien mot de passe ne fonctionnera plus.
                </AlertDescription>
              </Alert>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={executePasswordReset}
                  disabled={isResettingPassword}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {isResettingPassword ? "Génération..." : "Générer nouveau mot de passe"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg border">
                  <code className="flex-1 text-lg font-mono font-semibold select-all">{newPasswordGenerated}</code>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyNewPassword}
                    className="shrink-0"
                  >
                    {resetPasswordCopied ? (
                      <><Check className="h-4 w-4 mr-2 text-green-600" /> Copié</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-2" /> Copier</>
                    )}
                  </Button>
                </div>
              </div>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ce mot de passe ne sera plus affiché après fermeture. Assurez-vous de l'avoir copié!
                </AlertDescription>
              </Alert>
              <DialogFooter>
                <Button onClick={() => setResetPasswordDialogOpen(false)} className="w-full">
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

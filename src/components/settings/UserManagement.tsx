import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useSchools } from "@/hooks/useSchools";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Clock, Copy, Edit, Eye, EyeOff, Filter, Key, Mail, MoreVertical, RefreshCw, Search, Trash2, UserPlus } from "lucide-react";
import { generateSecurePassword } from "@/utils/passwordUtils";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type UserRole = "global_admin" | "school_admin";

interface AppUserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  school_id: string | null;
  is_active: boolean;
  last_login: string | null;
  app_user_roles: { role: string; school_id: string | null }[];
}

export function UserManagement() {
  const { user, primaryRole, primarySchoolId } = useAuth();
  const { schools } = useSchools();
  const { createUserCredential, loading: creating } = useCustomAuth();

  const [rows, setRows] = useState<AppUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Password reset dialog state
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<AppUserRow | null>(null);
  const [newPasswordGenerated, setNewPasswordGenerated] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  
  const [newUser, setNewUser] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "school_admin" as UserRole,
    school_id: "",
  });


  const canManageUsers = primaryRole === "global_admin" || primaryRole === "school_admin";

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const sessionToken =
        localStorage.getItem("app_session_token") || localStorage.getItem("sessionToken");

      if (!sessionToken) {
        throw new Error("Session manquante");
      }

      const { data, error } = await supabase.functions.invoke("list-app-users", {
        body: {
          sessionToken,
          // Optional: scope for school admins
          schoolId: primaryRole === "school_admin" ? primarySchoolId ?? undefined : undefined,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erreur lors du chargement");
      setRows((data.users || []) as AppUserRow[]);
    } catch {
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Preselect school for school_admins
    if (primaryRole === "school_admin" && primarySchoolId) {
      setNewUser((prev) => ({ ...prev, role: "school_admin", school_id: primarySchoolId }));
    }
    fetchUsers();
  }, [primaryRole, primarySchoolId]);


  // Get unique roles from data for filter
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    rows.forEach(u => {
      u.app_user_roles.forEach(r => roles.add(r.role));
    });
    return Array.from(roles);
  }, [rows]);

  const filteredUsers = useMemo(() => {
    let filtered = rows;
    
    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter(u => 
        u.app_user_roles.some(r => r.role === roleFilter)
      );
    }
    
    // Filter by school
    if (schoolFilter !== "all") {
      if (schoolFilter === "global") {
        filtered = filtered.filter(u => !u.school_id);
      } else {
        filtered = filtered.filter(u => u.school_id === schoolFilter);
      }
    }
    
    // Filter by search term
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter((u) =>
        u.email.toLowerCase().includes(q) || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [rows, searchTerm, roleFilter, schoolFilter]);

  const generateNewPassword = () => {
    const password = generateSecurePassword(16);
    setGeneratedPassword(password);
    return password;
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      toast.success("Mot de passe copié dans le presse-papier");
    }
  };

  const handleCreateUser = async () => {
    if (!generatedPassword) {
      toast.error("Veuillez générer un mot de passe");
      return;
    }

    if (newUser.role === "school_admin" && !newUser.school_id) {
      toast.error("Veuillez sélectionner une école");
      return;
    }


    try {
      const result = await createUserCredential({
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
        school_id: newUser.role === "school_admin" ? newUser.school_id : undefined,
        password: generatedPassword,
      });


      if (!result) return;

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(generatedPassword);
        toast.success(`Utilisateur créé. Mot de passe copié: ${generatedPassword}`, { duration: 10000 });
      } else {
        toast.success(`Utilisateur créé. Mot de passe: ${generatedPassword}`, { duration: 10000 });
      }

      setIsCreateDialogOpen(false);
      setNewUser({ email: "", first_name: "", last_name: "", role: "school_admin", school_id: "" });
      setGeneratedPassword("");
      setShowPassword(false);
      fetchUsers();

    } catch {
      // handled in hook
    }
  };

  const handleResetPassword = async (userRow: AppUserRow) => {
    setResetPasswordUser(userRow);
    setNewPasswordGenerated("");
    setPasswordCopied(false);
    setResetPasswordDialogOpen(true);
  };

  const executePasswordReset = async () => {
    if (!resetPasswordUser) return;
    
    try {
      setIsResettingPassword(true);
      const sessionToken = localStorage.getItem("app_session_token") || localStorage.getItem("sessionToken");
      
      if (!sessionToken) {
        toast.error("Session expirée, veuillez vous reconnecter");
        return;
      }
      
      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        body: { 
          sessionToken,
          userId: resetPasswordUser.id 
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setNewPasswordGenerated(data?.newPassword || "");
      toast.success("Mot de passe réinitialisé avec succès");
    } catch {
      toast.error("Erreur lors de la réinitialisation");
      setResetPasswordDialogOpen(false);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const copyNewPassword = async () => {
    if (newPasswordGenerated && navigator.clipboard) {
      await navigator.clipboard.writeText(newPasswordGenerated);
      setPasswordCopied(true);
      toast.success("Mot de passe copié dans le presse-papier");
    }
  };

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

      toast.success("Utilisateur supprimé");
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la suppression de l'utilisateur");
    }
  };

  const getSchoolName = (schoolId: string | null) => {
    if (!schoolId) return "Toutes les écoles";
    return schools.find((s) => s.id === schoolId)?.name || "École inconnue";
  };

  const getRoleBadge = (roles: { role: string }[]) => {
    const role = roles[0]?.role || "unknown";
    const roleConfig: Record<string, { label: string; className: string }> = {
      global_admin: { label: "Admin Global", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
      school_admin: { label: "Admin École", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      teacher: { label: "Professeur", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      student: { label: "Étudiant", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
    };

    const cfg = roleConfig[role] || { label: role, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge variant="secondary" className={cfg.className}>
        {cfg.label}
      </Badge>
    );
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      global_admin: "Admin Global",
      school_admin: "Admin École",
      teacher: "Professeur",
      student: "Étudiant",
    };
    return labels[role] || role;
  };

  if (loading || creating) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Chargement des utilisateurs...</p>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Accès restreint</h3>
        <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour gérer les utilisateurs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-4 items-start">
        <div className="w-full">
          <h2 className="text-xl lg:text-2xl font-bold">Gestion des utilisateurs</h2>
          <p className="text-muted-foreground text-sm lg:text-base">Gérez les comptes utilisateurs et leurs permissions</p>
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
              <DialogDescription>Ajoutez un nouvel utilisateur à la plateforme</DialogDescription>
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
                  onValueChange={(value: UserRole) =>
                    setNewUser({
                      ...newUser,
                      role: value,
                      school_id: value === "global_admin" ? "" : newUser.school_id,
                    })
                  }
                  disabled={primaryRole === "school_admin"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school_admin">Admin École</SelectItem>
                    {primaryRole === "global_admin" && <SelectItem value="global_admin">Admin Global</SelectItem>}
                  </SelectContent>
                </Select>
                {primaryRole === "school_admin" && (
                  <p className="text-xs text-muted-foreground">Vous ne pouvez créer que des Admin École.</p>
                )}
              </div>


              {newUser.role === "school_admin" && (
                <div className="space-y-2">
                  <Label htmlFor="new-school">École</Label>
                  <Select
                    value={newUser.school_id}
                    onValueChange={(value) => setNewUser({ ...newUser, school_id: value })}
                    disabled={primaryRole === "school_admin"}
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
                  {primaryRole === "school_admin" && primarySchoolId && (
                    <p className="text-xs text-muted-foreground">Votre école est sélectionnée automatiquement.</p>
                  )}
                </div>
              )}


              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={generatedPassword}
                      onChange={(e) => setGeneratedPassword(e.target.value)}
                      placeholder="Cliquez sur Générer"
                      className="pr-10"
                    />
                    {generatedPassword && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => generateNewPassword()}
                    title="Générer un mot de passe"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  {generatedPassword && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(generatedPassword)}
                      title="Copier le mot de passe"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {!generatedPassword && (
                  <p className="text-xs text-muted-foreground">
                    Cliquez sur le bouton pour générer un mot de passe sécurisé
                  </p>
                )}
              </div>

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
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? "s" : ""} trouvé{filteredUsers.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des utilisateurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Role filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {availableRoles.map(role => (
                  <SelectItem key={role} value={role}>{getRoleLabel(role)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* School filter */}
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par école" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les écoles</SelectItem>
                <SelectItem value="global">Global (sans école)</SelectItem>
                {schools.map(school => (
                  <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Utilisateur</TableHead>
                  <TableHead className="hidden sm:table-cell">Rôle</TableHead>
                  <TableHead className="hidden md:table-cell">École</TableHead>
                  <TableHead className="hidden lg:table-cell">Dernière connexion</TableHead>
                  <TableHead className="hidden xl:table-cell">Statut</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="min-w-0">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-xs bg-gradient-primary text-white">
                            {u.first_name?.[0]}{u.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{u.first_name} {u.last_name}</div>
                          <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                          <div className="sm:hidden mt-1">{getRoleBadge(u.app_user_roles)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{getRoleBadge(u.app_user_roles)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm truncate max-w-[150px]">{getSchoolName(u.school_id)}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {u.last_login ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span title={format(new Date(u.last_login), "PPPp", { locale: fr })}>
                            {formatDistanceToNow(new Date(u.last_login), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Jamais connecté</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Badge variant={u.is_active ? "default" : "secondary"}>{u.is_active ? "Actif" : "Inactif"}</Badge>
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
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              handleResetPassword(u);
                            }}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Réinitialiser mot de passe
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Envoyer un email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={(e) => {
                              e.preventDefault();
                              deleteUser(u.id);
                            }}
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
          setPasswordCopied(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              {resetPasswordUser && (
                <span>
                  Réinitialisation pour <strong>{resetPasswordUser.first_name} {resetPasswordUser.last_name}</strong> ({resetPasswordUser.email})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {!newPasswordGenerated ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Un nouveau mot de passe sera généré automatiquement. Vous pourrez le copier et le communiquer à l'utilisateur.
              </p>
              <DialogFooter className="gap-2">
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
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm font-medium">Nouveau mot de passe</Label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 p-3 bg-background rounded border font-mono text-lg select-all">
                    {newPasswordGenerated}
                  </code>
                  <Button
                    variant={passwordCopied ? "default" : "outline"}
                    size="icon"
                    onClick={copyNewPassword}
                    className={passwordCopied ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {passwordCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {passwordCopied ? "✓ Mot de passe copié !" : "Cliquez sur le bouton pour copier le mot de passe"}
                </p>
              </div>
              
              <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ Notez ce mot de passe et transmettez-le à l'utilisateur de façon sécurisée. Il ne sera plus affiché après la fermeture de cette fenêtre.
                </p>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={() => setResetPasswordDialogOpen(false)}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
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

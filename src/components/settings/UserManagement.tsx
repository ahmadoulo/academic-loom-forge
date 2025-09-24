import { useState } from "react";
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
import { useUsers } from "@/hooks/useUsers";
import { UserPlus, Search, MoreVertical, Edit, Trash2, Mail, Key, Copy } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export function UserManagement() {
  const { profile } = useAuth();
  const { schools } = useSchools();
  const { users, loading, createUser, updateUserPassword, deleteUser } = useUsers(profile?.school_id);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "student" as UserRole,
    school_id: "",
  });

  // Mock users data - in real app, this would come from API
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async () => {
    try {
      const result = await createUser({
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
        school_id: newUser.school_id || undefined,
      });

      if (result) {
        setIsCreateDialogOpen(false);
        setNewUser({
          email: "",
          first_name: "",
          last_name: "",
          role: "student",
          school_id: "",
        });
      }
    } catch (error) {
      // Error already handled in useUsers hook
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await updateUserPassword(userId);
    } catch (error) {
      // Error already handled in useUsers hook
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      global_admin: { label: "Admin Global", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
      school_admin: { label: "Admin École", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      teacher: { label: "Professeur", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      student: { label: "Étudiant", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
      parent: { label: "Parent", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, className: "" };
    return <Badge variant="secondary" className={config.className}>{config.label}</Badge>;
  };

  const getSchoolName = (schoolId: string | null) => {
    if (!schoolId) return "Toutes les écoles";
    const school = schools.find(s => s.id === schoolId);
    return school?.name || "École inconnue";
  };

  const canManageUsers = profile?.role === 'global_admin' || profile?.role === 'school_admin';

  if (loading) {
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
                    <SelectItem value="parent">Parent</SelectItem>
                    {profile?.role === 'global_admin' && (
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
                             {getRoleBadge(user.role)}
                           </div>
                         </div>
                       </div>
                     </TableCell>
                     <TableCell className="hidden sm:table-cell">
                       {getRoleBadge(user.role)}
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
                          <DropdownMenuItem onClick={() => handleResetPassword(user.user_id)}>
                            <Key className="h-4 w-4 mr-2" />
                            Réinitialiser mot de passe
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Envoyer un email
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteUser(user.user_id)}
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
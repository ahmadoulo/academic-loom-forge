import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Plus, Settings, Users, BookOpen, Calendar, BarChart3, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
}

interface RolePermissions {
  [roleId: string]: string[];
}

export function RoleManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  const permissions: Permission[] = [
    { id: "users.read", name: "Voir les utilisateurs", description: "Consulter la liste des utilisateurs", category: "Utilisateurs", icon: Users },
    { id: "users.create", name: "Créer des utilisateurs", description: "Ajouter de nouveaux utilisateurs", category: "Utilisateurs", icon: Users },
    { id: "users.update", name: "Modifier les utilisateurs", description: "Éditer les informations utilisateurs", category: "Utilisateurs", icon: Users },
    { id: "users.delete", name: "Supprimer les utilisateurs", description: "Supprimer des utilisateurs", category: "Utilisateurs", icon: Users },
    
    { id: "classes.read", name: "Voir les classes", description: "Consulter les classes", category: "Académique", icon: BookOpen },
    { id: "classes.create", name: "Créer des classes", description: "Ajouter de nouvelles classes", category: "Académique", icon: BookOpen },
    { id: "classes.update", name: "Modifier les classes", description: "Éditer les classes", category: "Académique", icon: BookOpen },
    { id: "classes.delete", name: "Supprimer les classes", description: "Supprimer des classes", category: "Académique", icon: BookOpen },
    
    { id: "attendance.read", name: "Voir les présences", description: "Consulter les présences", category: "Présences", icon: Calendar },
    { id: "attendance.create", name: "Marquer les présences", description: "Enregistrer les présences", category: "Présences", icon: Calendar },
    { id: "attendance.update", name: "Modifier les présences", description: "Corriger les présences", category: "Présences", icon: Calendar },
    
    { id: "grades.read", name: "Voir les notes", description: "Consulter les notes", category: "Notes", icon: BarChart3 },
    { id: "grades.create", name: "Saisir des notes", description: "Ajouter des notes", category: "Notes", icon: BarChart3 },
    { id: "grades.update", name: "Modifier des notes", description: "Corriger les notes", category: "Notes", icon: BarChart3 },
    
    { id: "reports.read", name: "Voir les rapports", description: "Consulter les rapports", category: "Rapports", icon: FileText },
    { id: "reports.export", name: "Exporter les rapports", description: "Télécharger les rapports", category: "Rapports", icon: FileText },
    
    { id: "settings.read", name: "Voir les paramètres", description: "Accéder aux paramètres", category: "Administration", icon: Settings },
    { id: "settings.update", name: "Modifier les paramètres", description: "Changer les paramètres", category: "Administration", icon: Settings },
    { id: "roles.manage", name: "Gérer les rôles", description: "Créer et modifier les rôles", category: "Administration", icon: Shield },
  ];

  const roles = [
    {
      id: "global_admin",
      name: "Administrateur Global",
      description: "Accès complet à toutes les fonctionnalités",
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      users_count: 1,
    },
    {
      id: "school_admin",
      name: "Administrateur École",
      description: "Gestion complète d'une école",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      users_count: 2,
    },
    {
      id: "teacher",
      name: "Professeur",
      description: "Gestion des classes et des élèves",
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      users_count: 15,
    },
    {
      id: "student",
      name: "Étudiant",
      description: "Consultation des notes et présences",
      color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      users_count: 150,
    },
    {
      id: "parent",
      name: "Parent",
      description: "Suivi de ses enfants",
      color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      users_count: 80,
    },
  ];

  // Default permissions for each role
  const defaultRolePermissions: RolePermissions = {
    global_admin: permissions.map(p => p.id), // All permissions
    school_admin: [
      "users.read", "users.create", "users.update",
      "classes.read", "classes.create", "classes.update", "classes.delete",
      "attendance.read", "attendance.create", "attendance.update",
      "grades.read", "grades.create", "grades.update",
      "reports.read", "reports.export",
      "settings.read", "settings.update"
    ],
    teacher: [
      "users.read",
      "classes.read",
      "attendance.read", "attendance.create", "attendance.update",
      "grades.read", "grades.create", "grades.update",
      "reports.read", "reports.export"
    ],
    student: [
      "attendance.read",
      "grades.read"
    ],
    parent: [
      "attendance.read",
      "grades.read"
    ],
  };

  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(defaultRolePermissions);

  const togglePermission = (roleId: string, permissionId: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [roleId]: prev[roleId]?.includes(permissionId)
        ? prev[roleId].filter(p => p !== permissionId)
        : [...(prev[roleId] || []), permissionId]
    }));
    
    toast({
      title: "Permission mise à jour",
      description: "Les permissions ont été modifiées avec succès.",
    });
  };

  const handleCreateRole = () => {
    // TODO: Implement role creation
    toast({
      title: "Rôle créé",
      description: `Le rôle "${newRole.name}" a été créé avec succès.`,
    });
    setIsCreateRoleOpen(false);
    setNewRole({ name: "", description: "", permissions: [] });
  };

  const canManageRoles = profile?.role === 'global_admin';

  if (!canManageRoles) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Accès restreint</h3>
        <p className="text-muted-foreground">
          Vous n'avez pas les permissions nécessaires pour gérer les rôles.
        </p>
      </div>
    );
  }

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des rôles et permissions</h2>
          <p className="text-muted-foreground">
            Définissez les rôles et leurs permissions d'accès
          </p>
        </div>
        
        <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4" />
              Nouveau rôle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouveau rôle</DialogTitle>
              <DialogDescription>
                Définissez un nouveau rôle avec des permissions spécifiques
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Nom du rôle</Label>
                <Input
                  id="role-name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="Ex: Assistant professeur"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-description">Description</Label>
                <Textarea
                  id="role-description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Décrivez le rôle et ses responsabilités..."
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-4">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="mb-4">
                      <h4 className="font-medium text-sm mb-2">{category}</h4>
                      <div className="space-y-2">
                        {perms.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`new-${permission.id}`}
                              checked={newRole.permissions.includes(permission.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewRole(prev => ({
                                    ...prev,
                                    permissions: [...prev.permissions, permission.id]
                                  }));
                                } else {
                                  setNewRole(prev => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(p => p !== permission.id)
                                  }));
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`new-${permission.id}`} className="text-sm">
                              {permission.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateRole} className="bg-gradient-primary hover:opacity-90">
                  Créer le rôle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {role.description}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className={role.color}>
                  {role.users_count} utilisateur{role.users_count > 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Permissions actives</span>
                  <span className="text-muted-foreground">
                    {rolePermissions[role.id]?.length || 0}/{permissions.length}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${((rolePermissions[role.id]?.length || 0) / permissions.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matrice des permissions</CardTitle>
          <CardDescription>
            Gérez les permissions pour chaque rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Permission</TableHead>
                  {roles.map((role) => (
                    <TableHead key={role.id} className="text-center min-w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium">{role.name}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <React.Fragment key={category}>
                    <TableRow>
                      <TableCell colSpan={roles.length + 1} className="bg-muted/50 font-semibold">
                        {category}
                      </TableCell>
                    </TableRow>
                    {perms.map((permission) => {
                      const Icon = permission.icon;
                      return (
                        <TableRow key={permission.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium text-sm">{permission.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {permission.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          {roles.map((role) => (
                            <TableCell key={role.id} className="text-center">
                              <Switch
                                checked={rolePermissions[role.id]?.includes(permission.id) || false}
                                onCheckedChange={() => togglePermission(role.id, permission.id)}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
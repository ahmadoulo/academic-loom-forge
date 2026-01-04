import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, Plus, Trash2, Edit2, Users, ChevronRight, 
  BookOpen, GraduationCap, Calendar, FileText, Settings,
  DollarSign, Bell, ClipboardList, Loader2, Wand2
} from 'lucide-react';
import { 
  useSchoolRoles, 
  SCHOOL_PERMISSIONS, 
  DEFAULT_ROLE_TEMPLATES,
  type SchoolRole 
} from '@/hooks/useSchoolRoles';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface SchoolRoleManagementProps {
  schoolId: string;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Tableau de bord': Settings,
  'Admissions': ClipboardList,
  'Étudiants': Users,
  'Professeurs': GraduationCap,
  'Classes': BookOpen,
  'Matières': BookOpen,
  'Présences': Calendar,
  'Notes': FileText,
  'Planning': Calendar,
  'Communication': Bell,
  'Documents': FileText,
  'Finance': DollarSign,
  'Administration': Settings,
};

const ROLE_COLORS = [
  { value: 'blue', label: 'Bleu', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'purple', label: 'Violet', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { value: 'green', label: 'Vert', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  { value: 'red', label: 'Rouge', class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  { value: 'pink', label: 'Rose', class: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
  { value: 'teal', label: 'Turquoise', class: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
];

export function SchoolRoleManagement({ schoolId }: SchoolRoleManagementProps) {
  const {
    roles,
    loading,
    createRole,
    createRoleFromTemplate,
    updateRole,
    deleteRole,
    toggleRolePermission,
  } = useSchoolRoles(schoolId);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<SchoolRole | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; role?: SchoolRole }>({ open: false });
  const [activeView, setActiveView] = useState<'cards' | 'matrix'>('cards');
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    color: 'blue',
    permissions: [] as string[],
  });
  const [creating, setCreating] = useState(false);

  // Group permissions by category
  const groupedPermissions = Object.entries(SCHOOL_PERMISSIONS).reduce((acc, [key, value]) => {
    const category = value.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ key, ...value });
    return acc;
  }, {} as Record<string, { key: string; name: string; description: string; category: string }[]>);

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) return;

    setCreating(true);
    const result = await createRole(newRole);
    setCreating(false);

    if (result) {
      setIsCreateDialogOpen(false);
      setNewRole({ name: '', description: '', color: 'blue', permissions: [] });
    }
  };

  const handleCreateFromTemplate = async (templateKey: keyof typeof DEFAULT_ROLE_TEMPLATES) => {
    setCreating(true);
    await createRoleFromTemplate(templateKey);
    setCreating(false);
    setIsTemplateDialogOpen(false);
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    await updateRole(editingRole.id, {
      name: editingRole.name,
      description: editingRole.description || undefined,
      color: editingRole.color || undefined,
    });
    setEditingRole(null);
  };

  const handleDeleteRole = async () => {
    if (!deleteConfirm.role) return;
    await deleteRole(deleteConfirm.role.id);
    setDeleteConfirm({ open: false });
  };

  const getRoleColorClass = (color: string | null) => {
    const colorObj = ROLE_COLORS.find(c => c.value === color);
    return colorObj?.class || ROLE_COLORS[0].class;
  };

  const toggleNewRolePermission = (permKey: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permKey)
        ? prev.permissions.filter(p => p !== permKey)
        : [...prev.permissions, permKey],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des rôles</h2>
          <p className="text-muted-foreground">Créez et gérez les rôles pour votre établissement</p>
        </div>
        <div className="flex gap-2">
          {/* Template Dialog */}
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                <span className="hidden sm:inline">Modèles</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer à partir d'un modèle</DialogTitle>
                <DialogDescription>
                  Choisissez un modèle pré-configuré pour démarrer rapidement
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                {Object.entries(DEFAULT_ROLE_TEMPLATES).map(([key, template]) => (
                  <Card 
                    key={key} 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleCreateFromTemplate(key as keyof typeof DEFAULT_ROLE_TEMPLATES)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge className={getRoleColorClass(template.color)}>
                          {template.permissions.length} perms
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        {template.permissions.slice(0, 4).map(p => (
                          <Badge key={p} variant="outline" className="text-xs">
                            {SCHOOL_PERMISSIONS[p as keyof typeof SCHOOL_PERMISSIONS]?.name || p}
                          </Badge>
                        ))}
                        {template.permissions.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.permissions.length - 4}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-gradient-primary">
                <Plus className="h-4 w-4" />
                Nouveau rôle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Créer un nouveau rôle</DialogTitle>
                <DialogDescription>
                  Définissez un rôle avec des permissions spécifiques
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role-name">Nom du rôle *</Label>
                      <Input
                        id="role-name"
                        value={newRole.name}
                        onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Assistant administratif"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role-color">Couleur</Label>
                      <Select
                        value={newRole.color}
                        onValueChange={(value) => setNewRole(prev => ({ ...prev, color: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_COLORS.map(color => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className={`h-3 w-3 rounded-full ${color.class.split(' ')[0]}`} />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-desc">Description</Label>
                    <Textarea
                      id="role-desc"
                      value={newRole.description}
                      onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Décrivez les responsabilités de ce rôle..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="border rounded-lg divide-y">
                      {Object.entries(groupedPermissions).map(([category, perms]) => {
                        const Icon = CATEGORY_ICONS[category] || Shield;
                        const selectedCount = perms.filter(p => newRole.permissions.includes(p.key)).length;
                        
                        return (
                          <div key={category} className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{category}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {selectedCount}/{perms.length}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {perms.map(perm => (
                                <label
                                  key={perm.key}
                                  className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={newRole.permissions.includes(perm.key)}
                                    onChange={() => toggleNewRolePermission(perm.key)}
                                    className="rounded"
                                  />
                                  <span>{perm.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateRole} 
                  disabled={!newRole.name.trim() || creating}
                  className="bg-gradient-primary"
                >
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer le rôle
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Roles Cards */}
      {roles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucun rôle personnalisé</h3>
            <p className="text-muted-foreground mb-4">
              Créez des rôles pour gérer les accès de votre équipe
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
                <Wand2 className="h-4 w-4 mr-2" />
                Utiliser un modèle
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un rôle
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'cards' | 'matrix')} className="space-y-4">
          <TabsList>
            <TabsTrigger value="cards">Vue cartes</TabsTrigger>
            <TabsTrigger value="matrix">Matrice des permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="cards">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map(role => (
                <Card key={role.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getRoleColorClass(role.color)}>
                            {role.name}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs line-clamp-2">
                          {role.description || 'Aucune description'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingRole(role)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteConfirm({ open: true, role })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{role.users_count || 0} utilisateur(s)</span>
                      </div>
                      <span>{role.permissions?.length || 0} permissions</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-primary h-2 rounded-full transition-all"
                        style={{ 
                          width: `${((role.permissions?.length || 0) / Object.keys(SCHOOL_PERMISSIONS).length) * 100}%` 
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="matrix">
            <Card>
              <CardHeader>
                <CardTitle>Matrice des permissions</CardTitle>
                <CardDescription>
                  Gérez les permissions de chaque rôle en un clic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px] sticky left-0 bg-background">
                          Permission
                        </TableHead>
                        {roles.map(role => (
                          <TableHead key={role.id} className="text-center min-w-[120px]">
                            <Badge className={getRoleColorClass(role.color)}>
                              {role.name}
                            </Badge>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedPermissions).map(([category, perms]) => (
                        <React.Fragment key={category}>
                          <TableRow>
                            <TableCell 
                              colSpan={roles.length + 1} 
                              className="bg-muted/50 font-semibold sticky left-0"
                            >
                              <div className="flex items-center gap-2">
                                {React.createElement(CATEGORY_ICONS[category] || Shield, { 
                                  className: "h-4 w-4" 
                                })}
                                {category}
                              </div>
                            </TableCell>
                          </TableRow>
                          {perms.map(perm => (
                            <TableRow key={perm.key}>
                              <TableCell className="sticky left-0 bg-background">
                                <div>
                                  <div className="font-medium text-sm">{perm.name}</div>
                                  <div className="text-xs text-muted-foreground">{perm.description}</div>
                                </div>
                              </TableCell>
                              {roles.map(role => (
                                <TableCell key={role.id} className="text-center">
                                  <Switch
                                    checked={role.permissions?.includes(perm.key) || false}
                                    onCheckedChange={() => toggleRolePermission(role.id, perm.key)}
                                  />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
          </DialogHeader>
          {editingRole && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom</Label>
                <Input
                  id="edit-name"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea
                  id="edit-desc"
                  value={editingRole.description || ''}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <Select
                  value={editingRole.color || 'blue'}
                  onValueChange={(value) => setEditingRole({ ...editingRole, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_COLORS.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${color.class.split(' ')[0]}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingRole(null)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateRole}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open })}
        onConfirm={handleDeleteRole}
        title="Supprimer le rôle"
        description={`Êtes-vous sûr de vouloir supprimer le rôle "${deleteConfirm.role?.name}" ? Cette action retirera ce rôle à tous les utilisateurs qui l'ont.`}
      />
    </div>
  );
}

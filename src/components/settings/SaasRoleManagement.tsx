import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useSaasRoles } from "@/hooks/useSaasRoles";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";

const AVAILABLE_PERMISSIONS = [
  { id: "schools.all", label: "Écoles - Tous droits", section: "Écoles" },
  { id: "schools.read", label: "Écoles - Lecture", section: "Écoles" },
  { id: "schools.create", label: "Écoles - Création", section: "Écoles" },
  { id: "schools.update", label: "Écoles - Modification", section: "Écoles" },
  { id: "schools.delete", label: "Écoles - Suppression", section: "Écoles" },
  { id: "subscriptions.all", label: "Abonnements - Tous droits", section: "Abonnements" },
  { id: "subscriptions.read", label: "Abonnements - Lecture", section: "Abonnements" },
  { id: "subscriptions.create", label: "Abonnements - Création", section: "Abonnements" },
  { id: "subscriptions.update", label: "Abonnements - Modification", section: "Abonnements" },
  { id: "users.all", label: "Utilisateurs - Tous droits", section: "Utilisateurs" },
  { id: "users.read", label: "Utilisateurs - Lecture", section: "Utilisateurs" },
  { id: "users.create", label: "Utilisateurs - Création", section: "Utilisateurs" },
  { id: "users.update", label: "Utilisateurs - Modification", section: "Utilisateurs" },
  { id: "analytics.read", label: "Analytiques - Lecture", section: "Analytiques" },
  { id: "support.all", label: "Support - Tous droits", section: "Support" },
];

export function SaasRoleManagement() {
  const { roles, loading, createRole, updateRole, deleteRole } = useSaasRoles();
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.section]) {
      acc[perm.section] = [];
    }
    acc[perm.section].push(perm);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
      } else {
        await createRole(formData);
      }
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error saving role:", error);
    }
  };

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || [],
    });
    setShowDialog(true);
  };

  const handleDelete = async (roleId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rôle ?")) {
      try {
        await deleteRole(roleId);
      } catch (error) {
        console.error("Error deleting role:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissions: [],
    });
    setEditingRole(null);
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Rôles & Permissions
        </h2>
        <p className="text-muted-foreground">
          Gérez les rôles et leurs permissions dans le système SaaS
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            resetForm();
            setShowDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un rôle
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rôle</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Aucun rôle trouvé
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      {role.name}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground truncate">
                      {role.description || "Aucune description"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {role.permissions.length} permission(s)
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {role.is_system ? (
                      <Badge variant="outline">Système</Badge>
                    ) : (
                      <Badge variant="default">Personnalisé</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(role)}
                        disabled={role.is_system}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(role.id)}
                        disabled={role.is_system}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Role Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Modifier le rôle" : "Créer un rôle"}
            </DialogTitle>
            <DialogDescription>
              Définissez le nom, la description et les permissions du rôle
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du rôle</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Administrateur, Support..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description du rôle et de ses responsabilités"
                rows={3}
              />
            </div>
            <div className="space-y-4">
              <Label>Permissions</Label>
              <div className="border rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedPermissions).map(([section, perms]) => (
                  <div key={section} className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">
                      {section}
                    </h4>
                    <div className="space-y-2 pl-4">
                      {perms.map((perm) => (
                        <div key={perm.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={perm.id}
                            checked={formData.permissions.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <label
                            htmlFor={perm.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {perm.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingRole ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

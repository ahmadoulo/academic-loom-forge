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
import { useSchoolRoles } from "@/hooks/useSchoolRoles";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";

const AVAILABLE_PERMISSIONS = [
  { id: "students.all", label: "Étudiants - Tous droits", section: "Étudiants" },
  { id: "students.read", label: "Étudiants - Lecture", section: "Étudiants" },
  { id: "students.create", label: "Étudiants - Création", section: "Étudiants" },
  { id: "students.update", label: "Étudiants - Modification", section: "Étudiants" },
  { id: "students.delete", label: "Étudiants - Suppression", section: "Étudiants" },
  { id: "teachers.all", label: "Professeurs - Tous droits", section: "Professeurs" },
  { id: "teachers.read", label: "Professeurs - Lecture", section: "Professeurs" },
  { id: "teachers.create", label: "Professeurs - Création", section: "Professeurs" },
  { id: "teachers.update", label: "Professeurs - Modification", section: "Professeurs" },
  { id: "teachers.delete", label: "Professeurs - Suppression", section: "Professeurs" },
  { id: "classes.all", label: "Classes - Tous droits", section: "Classes" },
  { id: "classes.read", label: "Classes - Lecture", section: "Classes" },
  { id: "classes.create", label: "Classes - Création", section: "Classes" },
  { id: "classes.update", label: "Classes - Modification", section: "Classes" },
  { id: "classes.delete", label: "Classes - Suppression", section: "Classes" },
  { id: "grades.all", label: "Notes - Tous droits", section: "Notes" },
  { id: "grades.read", label: "Notes - Lecture", section: "Notes" },
  { id: "grades.create", label: "Notes - Création", section: "Notes" },
  { id: "grades.update", label: "Notes - Modification", section: "Notes" },
  { id: "attendance.all", label: "Présences - Tous droits", section: "Présences" },
  { id: "attendance.read", label: "Présences - Lecture", section: "Présences" },
  { id: "attendance.create", label: "Présences - Création", section: "Présences" },
  { id: "reports.read", label: "Rapports - Lecture", section: "Rapports" },
  { id: "settings.read", label: "Paramètres - Lecture", section: "Paramètres" },
  { id: "settings.update", label: "Paramètres - Modification", section: "Paramètres" },
];

interface SchoolRoleManagementProps {
  schoolId: string;
}

export function SchoolRoleManagement({ schoolId }: SchoolRoleManagementProps) {
  const { roles, loading, createRole, updateRole, deleteRole } =
    useSchoolRoles(schoolId);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({
    school_id: schoolId,
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
      school_id: schoolId,
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
      school_id: schoolId,
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
          Gérez les rôles et leurs permissions dans votre école
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
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
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
                placeholder="Ex: Directeur, Secrétaire..."
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
                        <div
                          key={perm.id}
                          className="flex items-center space-x-2"
                        >
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

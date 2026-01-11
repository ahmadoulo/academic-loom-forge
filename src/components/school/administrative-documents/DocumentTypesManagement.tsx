import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  FileText,
  Loader2,
  GraduationCap
} from "lucide-react";
import { 
  useAdministrativeDocuments, 
  AdministrativeDocumentType 
} from "@/hooks/useAdministrativeDocuments";
import { useCycles } from "@/hooks/useCycles";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface DocumentTypesManagementProps {
  schoolId: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function DocumentTypesManagement({
  schoolId,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: DocumentTypesManagementProps) {
  const { documentTypes, loadingTypes, createDocumentType, updateDocumentType, deleteDocumentType } = 
    useAdministrativeDocuments(schoolId);
  const { cycles, loading: loadingCycles } = useCycles(schoolId);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<AdministrativeDocumentType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cycle_id: "",
    year_level: "",
    is_required: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      cycle_id: "",
      year_level: "",
      is_required: true,
    });
    setEditingType(null);
  };

  const openEditDialog = (docType: AdministrativeDocumentType) => {
    setEditingType(docType);
    setFormData({
      name: docType.name,
      description: docType.description || "",
      cycle_id: docType.cycle_id,
      year_level: docType.year_level?.toString() || "",
      is_required: docType.is_required,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.cycle_id) return;

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      cycle_id: formData.cycle_id,
      year_level: formData.year_level ? parseInt(formData.year_level) : undefined,
      is_required: formData.is_required,
    };

    if (editingType) {
      await updateDocumentType.mutateAsync({ id: editingType.id, ...data });
    } else {
      await createDocumentType.mutateAsync(data);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDocumentType.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  // Group by cycle
  const groupedByCycle = documentTypes.reduce((acc, dt) => {
    const cycleName = dt.cycles?.name || "Sans cycle";
    if (!acc[cycleName]) acc[cycleName] = [];
    acc[cycleName].push(dt);
    return acc;
  }, {} as Record<string, AdministrativeDocumentType[]>);

  if (loadingTypes || loadingCycles) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Types de Documents</h3>
          <p className="text-sm text-muted-foreground">
            Définissez les documents requis par cycle et niveau
          </p>
        </div>
        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingType ? "Modifier le type" : "Nouveau type de document"}
                </DialogTitle>
                <DialogDescription>
                  {editingType 
                    ? "Modifiez les informations du type de document" 
                    : "Créez un nouveau type de document administratif"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du document *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Bulletin Semestre 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description optionnelle..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cycle">Cycle *</Label>
                  <Select
                    value={formData.cycle_id}
                    onValueChange={(v) => setFormData(p => ({ ...p, cycle_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      {cycles.map((cycle) => (
                        <SelectItem key={cycle.id} value={cycle.id}>
                          {cycle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year_level">Niveau d'année (optionnel)</Label>
                  <Select
                    value={formData.year_level}
                    onValueChange={(v) => setFormData(p => ({ ...p, year_level: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les niveaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les niveaux</SelectItem>
                      <SelectItem value="1">1ère année</SelectItem>
                      <SelectItem value="2">2ème année</SelectItem>
                      <SelectItem value="3">3ème année</SelectItem>
                      <SelectItem value="4">4ème année</SelectItem>
                      <SelectItem value="5">5ème année</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Si spécifié, seuls les étudiants de ce niveau ou supérieur seront concernés
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Document requis</Label>
                    <p className="text-xs text-muted-foreground">
                      Marquer comme obligatoire pour la complétion
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_required}
                    onCheckedChange={(checked) => setFormData(p => ({ ...p, is_required: checked }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.cycle_id || createDocumentType.isPending || updateDocumentType.isPending}
                >
                  {(createDocumentType.isPending || updateDocumentType.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingType ? "Mettre à jour" : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {documentTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg">Aucun type de document</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Commencez par créer des types de documents pour vos cycles
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCycle).map(([cycleName, docs]) => (
            <Card key={cycleName}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{cycleName}</CardTitle>
                  <Badge variant="secondary">{docs.length} document(s)</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Requis</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground">{doc.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.year_level ? (
                            <Badge variant="outline">Année {doc.year_level}+</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Tous</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={doc.is_required ? "default" : "secondary"}>
                            {doc.is_required ? "Requis" : "Optionnel"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(doc)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(doc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer ce type de document ?"
        description="Cette action est irréversible. Les données de suivi existantes seront conservées."
        onConfirm={handleDelete}
      />
    </div>
  );
}

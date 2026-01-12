import { useState, useMemo } from "react";
import { 
  Card, 
  CardContent, 
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
  GraduationCap,
  AlertCircle,
  Info
} from "lucide-react";
import { 
  useAdministrativeDocuments, 
  AdministrativeDocumentType 
} from "@/hooks/useAdministrativeDocuments";
import { useCycles, Cycle } from "@/hooks/useCycles";
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

  // Get selected cycle for year level options
  const selectedCycle = useMemo(() => {
    return cycles.find(c => c.id === formData.cycle_id);
  }, [cycles, formData.cycle_id]);

  // Generate year level options based on cycle duration
  const yearLevelOptions = useMemo(() => {
    if (!selectedCycle?.duration_years) return [];
    return Array.from({ length: selectedCycle.duration_years }, (_, i) => i + 1);
  }, [selectedCycle]);

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
  const groupedByCycle = useMemo(() => {
    const grouped = documentTypes.reduce((acc, dt) => {
      const cycleName = dt.cycles?.name || "Sans cycle";
      const cycleId = dt.cycle_id;
      const key = `${cycleId}|${cycleName}`;
      if (!acc[key]) {
        acc[key] = {
          cycleName,
          cycleId,
          duration: dt.cycles?.duration_years,
          docs: []
        };
      }
      acc[key].docs.push(dt);
      return acc;
    }, {} as Record<string, { cycleName: string; cycleId: string; duration?: number; docs: AdministrativeDocumentType[] }>);

    return Object.values(grouped);
  }, [documentTypes]);

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
            Définissez les documents requis par cycle et niveau d'année
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
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cycle">Cycle *</Label>
                  <Select
                    value={formData.cycle_id}
                    onValueChange={(v) => setFormData(p => ({ ...p, cycle_id: v, year_level: "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      {cycles.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Aucun cycle configuré
                        </div>
                      ) : (
                        cycles.map((cycle) => (
                          <SelectItem key={cycle.id} value={cycle.id}>
                            <div className="flex items-center gap-2">
                              <span>{cycle.name}</span>
                              {cycle.duration_years && (
                                <span className="text-xs text-muted-foreground">
                                  ({cycle.duration_years} ans)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.cycle_id && (
                  <div className="space-y-2">
                    <Label htmlFor="year_level">Niveau d'année minimum</Label>
                    <Select
                      value={formData.year_level || "all"}
                      onValueChange={(v) => setFormData(p => ({ ...p, year_level: v === "all" ? "" : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les niveaux" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les niveaux du cycle</SelectItem>
                        {yearLevelOptions.map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            {level === 1 ? "1ère" : `${level}ème`} année et +
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                      <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <p>
                        Si vous sélectionnez "2ème année", seuls les étudiants en 2ème année ou plus seront concernés par ce document.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Document requis</Label>
                    <p className="text-xs text-muted-foreground">
                      Obligatoire pour la complétion du dossier
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

      {/* Info about cycles */}
      {cycles.length === 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Aucun cycle configuré
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Vous devez d'abord créer des cycles dans les paramètres de l'école avant de pouvoir définir des types de documents.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {documentTypes.length === 0 && cycles.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg">Aucun type de document</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-md">
              Commencez par créer des types de documents pour vos cycles.
              Chaque document sera automatiquement attribué aux étudiants du cycle correspondant.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedByCycle.map(({ cycleName, cycleId, duration, docs }) => (
            <Card key={cycleId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{cycleName}</CardTitle>
                    {duration && (
                      <Badge variant="outline" className="ml-2">
                        {duration} ans
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary">{docs.length} document(s)</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Niveau minimum</TableHead>
                      <TableHead>Statut</TableHead>
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
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.year_level ? (
                            <Badge variant="outline">
                              {doc.year_level === 1 ? "1ère" : `${doc.year_level}ème`} année+
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Tous les niveaux</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={doc.is_required ? "default" : "secondary"}>
                            {doc.is_required ? "Requis" : "Optionnel"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
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
        description="Cette action désactivera ce type de document. Les données de suivi existantes seront conservées."
        onConfirm={handleDelete}
      />
    </div>
  );
}

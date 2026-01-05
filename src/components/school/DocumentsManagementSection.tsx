import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDocumentTemplates } from "@/hooks/useDocumentTemplates";
import { DocumentTemplateForm } from "./DocumentTemplateForm";
import { DocumentGenerator } from "./DocumentGenerator";
import { Plus, FileText } from "lucide-react";
import { DocumentTemplate } from "@/hooks/useDocumentTemplates";
import { DocumentTemplateCard } from "./DocumentTemplateCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DocumentsManagementSectionProps {
  schoolId: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  enrollment_certificate: "Attestation d'inscription",
  attendance_certificate: "Attestation de scolarité",
  success_certificate: "Attestation de réussite",
  internship_certificate: "Attestation de stage",
  conduct_certificate: "Certificat de bonne conduite",
  custom: "Document personnalisé",
};

export const DocumentsManagementSection = ({ 
  schoolId, 
  canCreate = true, 
  canEdit = true, 
  canDelete = true 
}: DocumentsManagementSectionProps) => {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } =
    useDocumentTemplates(schoolId);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsFormOpen(true);
  };

  const handleEditTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  const handleGenerateDocument = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setIsGeneratorOpen(true);
  };

  const handleFormSubmit = (data: Omit<DocumentTemplate, "id" | "created_at" | "updated_at">) => {
    if (selectedTemplate) {
      updateTemplate.mutate({ ...data, id: selectedTemplate.id });
    } else {
      createTemplate.mutate(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (templateToDelete) {
      deleteTemplate.mutate(templateToDelete);
      setTemplateToDelete(null);
    }
  };

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Documents</h2>
          <p className="text-muted-foreground">
            Créez et gérez vos modèles de documents officiels
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau modèle
          </Button>
        )}
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun modèle de document</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre premier modèle de document
            </p>
            {canCreate && (
              <Button onClick={handleCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un modèle
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <DocumentTemplateCard
              key={template.id}
              template={template}
              onEdit={canEdit ? handleEditTemplate : undefined}
              onDelete={canDelete ? setTemplateToDelete : undefined}
              onGenerate={handleGenerateDocument}
            />
          ))}
        </div>
      )}

      <DocumentTemplateForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        template={selectedTemplate}
        schoolId={schoolId}
      />

      {selectedTemplate && (
        <DocumentGenerator
          open={isGeneratorOpen}
          onOpenChange={setIsGeneratorOpen}
          template={selectedTemplate}
          schoolId={schoolId}
        />
      )}

      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce modèle de document ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

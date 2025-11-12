import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentTemplate } from "@/hooks/useDocumentTemplates";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentTemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<DocumentTemplate, "id" | "created_at" | "updated_at">) => void;
  template?: DocumentTemplate | null;
  schoolId: string;
}

const TEMPLATE_TYPES = [
  { value: "enrollment_certificate", label: "Attestation d'inscription" },
  { value: "attendance_certificate", label: "Attestation de scolarité" },
  { value: "success_certificate", label: "Attestation de réussite" },
  { value: "internship_certificate", label: "Attestation de stage" },
  { value: "conduct_certificate", label: "Certificat de bonne conduite" },
  { value: "custom", label: "Document personnalisé" },
];

const DEFAULT_TEMPLATES: Record<string, string> = {
  enrollment_certificate: `Je soussigné(e), Directeur(trice) de {{school_name}}, certifie que l'élève {{student_name}}, né(e) le {{birth_date}}, CIN N° {{cin_number}}, est dûment inscrit(e) dans notre établissement pour l'année scolaire {{school_year}} en classe de {{class_name}}.

La présente attestation est délivrée pour servir et valoir ce que de droit.`,
  
  attendance_certificate: `Je soussigné(e), Directeur(trice) de {{school_name}}, certifie que l'élève {{student_name}}, né(e) le {{birth_date}}, CIN N° {{cin_number}}, poursuit actuellement sa scolarité dans notre établissement en classe de {{class_name}} pour l'année scolaire {{school_year}}.

La présente attestation de scolarité est délivrée pour servir et valoir ce que de droit.`,
  
  success_certificate: `Je soussigné(e), Directeur(trice) de {{school_name}}, certifie que l'élève {{student_name}}, né(e) le {{birth_date}}, CIN N° {{cin_number}}, a réussi avec succès son année scolaire {{school_year}} en classe de {{class_name}}.

La présente attestation est délivrée pour servir et valoir ce que de droit.`,
};

export const DocumentTemplateForm = ({
  open,
  onOpenChange,
  onSubmit,
  template,
  schoolId,
}: DocumentTemplateFormProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (template) {
      setName(template.name);
      setType(template.type);
      setContent(template.content);
    } else {
      setName("");
      setType("");
      setContent("");
    }
  }, [template, open]);

  const handleTypeChange = (value: string) => {
    setType(value);
    if (DEFAULT_TEMPLATES[value] && !template) {
      setContent(DEFAULT_TEMPLATES[value]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      school_id: schoolId,
      name,
      type,
      content,
      is_active: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Modifier le modèle" : "Créer un nouveau modèle"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du document</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Attestation d'inscription 2024-2025"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de document</Label>
            <Select value={type} onValueChange={handleTypeChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Variables disponibles :</strong>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <code>{"{{student_name}}"}</code>
                <code>{"{{student_firstname}}"}</code>
                <code>{"{{student_lastname}}"}</code>
                <code>{"{{cin_number}}"}</code>
                <code>{"{{birth_date}}"}</code>
                <code>{"{{class_name}}"}</code>
                <code>{"{{school_name}}"}</code>
                <code>{"{{school_address}}"}</code>
                <code>{"{{school_phone}}"}</code>
                <code>{"{{school_year}}"}</code>
                <code>{"{{date}}"}</code>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="content">Contenu du document</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Saisir le contenu du document avec les variables..."
              className="min-h-[300px] font-mono text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {template ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

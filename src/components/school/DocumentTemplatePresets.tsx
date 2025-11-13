import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

export interface DocumentPreset {
  id: string;
  name: string;
  description: string;
  footerColor: string;
  contentTemplate: string;
  footerTemplate: string;
  preview: string;
}

export const documentPresets: DocumentPreset[] = [
  {
    id: "modern",
    name: "Moderne",
    description: "Design épuré et professionnel",
    footerColor: "#1e40af",
    contentTemplate: `Je soussigné, Directeur de {{school_name}}, certifie que l'élève {{student_name}}, né(e) le {{birth_date}}, CIN N° {{cin_number}}, poursuit actuellement sa scolarité dans notre établissement en classe de {{class_name}} pour l'année scolaire {{school_year}}.

La présente attestation est délivrée pour servir et valoir ce que de droit.`,
    footerTemplate: `{{school_name}}
{{school_address}}, {{school_city}}, {{school_country}}
Tél: {{school_phone}} | Web: {{school_website}}`,
    preview: "Un design moderne avec un footer bleu professionnel"
  },
  {
    id: "classic",
    name: "Classique",
    description: "Style traditionnel et élégant",
    footerColor: "#7c3aed",
    contentTemplate: `Nous, soussignés, Direction de {{school_name}}, attestons par la présente que {{student_firstname}} {{student_lastname}}, né(e) le {{birth_date}}, portant le numéro CIN {{cin_number}}, est dûment inscrit(e) et poursuit ses études dans notre établissement en classe de {{class_name}} au titre de l'année scolaire {{school_year}}.

Cette attestation est établie à la demande de l'intéressé(e) pour servir et valoir ce que de droit.`,
    footerTemplate: `{{school_name}} - Établissement d'enseignement
Adresse: {{school_address}}, {{school_city}}
Contact: {{school_phone}} | {{school_website}}`,
    preview: "Style classique avec footer violet élégant"
  },
  {
    id: "minimal",
    name: "Minimaliste",
    description: "Simple et efficace",
    footerColor: "#059669",
    contentTemplate: `Attestation de scolarité

L'établissement {{school_name}} certifie que {{student_name}}, CIN: {{cin_number}}, est inscrit(e) en classe de {{class_name}} pour l'année {{school_year}}.

Date de naissance: {{birth_date}}`,
    footerTemplate: `{{school_name}}
{{school_address}} | {{school_phone}}`,
    preview: "Design minimaliste avec footer vert"
  },
  {
    id: "elegant",
    name: "Élégant",
    description: "Raffiné avec détails",
    footerColor: "#dc2626",
    contentTemplate: `ATTESTATION DE SCOLARITÉ

Nous, Direction de {{school_name}}, certifions que:

Nom et Prénom: {{student_name}}
Date de naissance: {{birth_date}}
CIN: {{cin_number}}
Classe: {{class_name}}
Année scolaire: {{school_year}}

L'élève susmentionné(e) poursuit sa scolarité dans notre établissement avec assiduité.

Cette attestation est délivrée pour servir et valoir ce que de droit.`,
    footerTemplate: `{{school_name}}
{{school_address}}, {{school_city}}, {{school_country}}
Téléphone: {{school_phone}} | Site web: {{school_website}}`,
    preview: "Style élégant avec footer rouge bordeaux"
  },
  {
    id: "custom",
    name: "Personnalisé",
    description: "Créez votre propre design",
    footerColor: "#1e40af",
    contentTemplate: "",
    footerTemplate: "",
    preview: "Commencez avec une page vierge"
  }
];

interface DocumentTemplatePresetsProps {
  selectedPreset: string;
  onSelectPreset: (preset: DocumentPreset) => void;
}

export const DocumentTemplatePresets = ({ selectedPreset, onSelectPreset }: DocumentTemplatePresetsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Choisir un modèle</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Sélectionnez un modèle prédéfini ou créez le vôtre
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {documentPresets.map((preset) => (
          <Card
            key={preset.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedPreset === preset.id 
                ? "ring-2 ring-primary border-primary" 
                : "hover:border-primary/50"
            }`}
            onClick={() => onSelectPreset(preset)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{preset.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {preset.description}
                  </p>
                </div>
                {selectedPreset === preset.id && (
                  <Check className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                )}
              </div>
              
              <div className="space-y-2">
                <div 
                  className="h-16 rounded border border-border flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: preset.footerColor }}
                >
                  Aperçu footer
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {preset.preview}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

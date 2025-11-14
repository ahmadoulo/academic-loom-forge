import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface DocumentPreset {
  id: string;
  name: string;
  description: string;
  footerColor: string;
  contentTemplate: string;
  footerTemplate: string;
  headerStyle: "modern" | "classic" | "minimal" | "elegant";
}

export const documentPresets: DocumentPreset[] = [
  {
    id: "modern",
    name: "Moderne",
    description: "Design épuré et professionnel",
    footerColor: "#1e40af",
    headerStyle: "modern",
    contentTemplate: `Je soussigné, Directeur de {{school_name}}, certifie que l'élève {{student_name}}, né(e) le {{birth_date}}, CIN N° {{cin_number}}, poursuit actuellement sa scolarité dans notre établissement en classe de {{class_name}} pour l'année scolaire {{school_year}}.

La présente attestation est délivrée pour servir et valoir ce que de droit.`,
    footerTemplate: `{{school_name}}
{{school_address}}, {{school_city}}, {{school_country}}
Tél: {{school_phone}} | Web: {{school_website}}`
  },
  {
    id: "classic",
    name: "Classique",
    description: "Style traditionnel et élégant",
    footerColor: "#7c3aed",
    headerStyle: "classic",
    contentTemplate: `Nous, soussignés, Direction de {{school_name}}, attestons par la présente que {{student_firstname}} {{student_lastname}}, né(e) le {{birth_date}}, portant le numéro CIN {{cin_number}}, est dûment inscrit(e) et poursuit ses études dans notre établissement en classe de {{class_name}} au titre de l'année scolaire {{school_year}}.

Cette attestation est établie à la demande de l'intéressé(e) pour servir et valoir ce que de droit.`,
    footerTemplate: `{{school_name}} - Établissement d'enseignement
Adresse: {{school_address}}, {{school_city}}
Contact: {{school_phone}} | {{school_website}}`
  },
  {
    id: "minimal",
    name: "Minimaliste",
    description: "Simple et efficace",
    footerColor: "#059669",
    headerStyle: "minimal",
    contentTemplate: `Attestation de scolarité

L'établissement {{school_name}} certifie que {{student_name}}, CIN: {{cin_number}}, est inscrit(e) en classe de {{class_name}} pour l'année {{school_year}}.

Date de naissance: {{birth_date}}`,
    footerTemplate: `{{school_name}}
{{school_address}} | {{school_phone}}`
  },
  {
    id: "elegant",
    name: "Élégant",
    description: "Raffiné avec détails",
    footerColor: "#dc2626",
    headerStyle: "elegant",
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
Téléphone: {{school_phone}} | Site web: {{school_website}}`
  },
  {
    id: "custom",
    name: "Personnalisé",
    description: "Créez votre propre design",
    footerColor: "#1e40af",
    headerStyle: "modern",
    contentTemplate: "",
    footerTemplate: ""
  }
];

interface DocumentTemplatePresetsProps {
  selectedPreset: string;
  onSelectPreset: (preset: DocumentPreset) => void;
}

const TemplatePreviewMini = ({ preset }: { preset: DocumentPreset }) => {
  const renderHeader = () => {
    switch (preset.headerStyle) {
      case "modern":
        return (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 border-b-2 border-blue-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                E
              </div>
              <div className="text-xs font-semibold text-blue-900">École</div>
            </div>
          </div>
        );
      case "classic":
        return (
          <div className="border-b-4 border-purple-600 p-3 bg-white">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-1">
                <div className="w-6 h-6 bg-purple-600 rounded-full"></div>
              </div>
              <div className="text-xs font-serif font-bold text-purple-900">ÉCOLE</div>
            </div>
          </div>
        );
      case "minimal":
        return (
          <div className="p-3 border-b border-gray-300">
            <div className="text-xs font-light text-gray-700">École</div>
          </div>
        );
      case "elegant":
        return (
          <div className="bg-red-50 p-3 border-l-4 border-red-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border-2 border-red-600 rounded flex items-center justify-center">
                <div className="w-4 h-4 bg-red-600"></div>
              </div>
              <div>
                <div className="text-xs font-bold text-red-900">ÉCOLE</div>
                <div className="text-[8px] text-red-700">Établissement d'Excellence</div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (preset.id === "custom") {
    return (
      <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4">
        <div className="text-3xl mb-2">✏️</div>
        <div className="text-xs font-medium text-gray-600 text-center">
          Créez votre<br/>propre design
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-[3/4] bg-white rounded-lg border border-border shadow-sm overflow-hidden text-[6px] leading-tight">
      {renderHeader()}
      
      <div className="p-3 space-y-2">
        <div className="text-center font-bold text-[8px]" style={{ color: preset.footerColor }}>
          ATTESTATION
        </div>
        
        <div className="space-y-1">
          <div className="h-1 bg-gray-200 rounded w-full"></div>
          <div className="h-1 bg-gray-200 rounded w-5/6"></div>
          <div className="h-1 bg-gray-200 rounded w-4/5"></div>
          <div className="h-1 bg-gray-100 rounded w-full"></div>
          <div className="h-1 bg-gray-200 rounded w-full"></div>
          <div className="h-1 bg-gray-200 rounded w-3/4"></div>
        </div>
        
        <div className="pt-2 text-right italic text-gray-400">
          <div className="h-1 bg-gray-100 rounded w-16 ml-auto"></div>
        </div>
      </div>
      
      <div 
        className="mt-auto p-2 text-white text-center"
        style={{ backgroundColor: preset.footerColor }}
      >
        <div className="h-1 bg-white/80 rounded w-3/4 mx-auto mb-1"></div>
        <div className="h-1 bg-white/60 rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  );
};

export const DocumentTemplatePresets = ({ selectedPreset, onSelectPreset }: DocumentTemplatePresetsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Choisir un modèle</h3>
        <p className="text-sm text-muted-foreground">
          Sélectionnez un modèle de document professionnel
        </p>
      </div>
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {documentPresets.map((preset) => (
            <Card
              key={preset.id}
              className={`cursor-pointer transition-all hover:shadow-lg group ${
                selectedPreset === preset.id 
                  ? "ring-2 ring-primary border-primary shadow-md" 
                  : "hover:border-primary/50"
              }`}
              onClick={() => onSelectPreset(preset)}
            >
              <div className="p-3 space-y-3">
                <div className="relative">
                  <TemplatePreviewMini preset={preset} />
                  {selectedPreset === preset.id && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">{preset.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {preset.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

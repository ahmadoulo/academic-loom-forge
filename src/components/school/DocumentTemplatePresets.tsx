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
          <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 p-4 border-b-2 border-blue-600 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/30 rounded-full -mr-10 -mt-10"></div>
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md flex items-center justify-center text-white text-sm font-bold">
                É
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-blue-900">École Moderne</div>
                <div className="text-[8px] text-blue-600">Excellence & Innovation</div>
              </div>
            </div>
          </div>
        );
      case "classic":
        return (
          <div className="p-4 bg-gradient-to-b from-white to-purple-50">
            <div className="border-2 border-purple-600 rounded p-3">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-2 shadow-sm">
                  <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full"></div>
                </div>
                <div className="text-sm font-serif font-bold text-purple-900">ÉCOLE CLASSIQUE</div>
                <div className="h-px bg-purple-300 w-16 mx-auto mt-2"></div>
              </div>
            </div>
          </div>
        );
      case "minimal":
        return (
          <div className="p-4 border-b border-gray-300 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-800 rounded"></div>
              <div className="text-xs font-light text-gray-700 tracking-wide">École Minimaliste</div>
            </div>
            <div className="h-px bg-gray-200 w-full mt-3"></div>
          </div>
        );
      case "elegant":
        return (
          <div className="relative p-4 bg-gradient-to-br from-red-50 to-white">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-600 to-red-800"></div>
            <div className="pl-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-2 border-red-600 rounded shadow-sm flex items-center justify-center bg-white">
                  <div className="w-5 h-5 bg-gradient-to-br from-red-600 to-red-700"></div>
                </div>
                <div>
                  <div className="text-sm font-bold text-red-900 tracking-tight">ÉCOLE ÉLÉGANTE</div>
                  <div className="text-[8px] text-red-700 font-serif italic">Tradition & Prestige</div>
                </div>
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
      <div className="aspect-[3/4] bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-4 hover:border-primary transition-colors">
        <div className="text-4xl mb-3">✨</div>
        <div className="text-sm font-semibold text-slate-700 text-center">
          Créez votre
        </div>
        <div className="text-xs text-slate-500 text-center mt-1">
          design personnalisé
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-[3/4] bg-white rounded-xl border border-border shadow-lg overflow-hidden text-[6px] leading-tight hover:shadow-xl transition-shadow">
      {renderHeader()}
      
      <div className="p-4 space-y-3">
        <div className="text-center font-bold text-[10px] tracking-wide" style={{ color: preset.footerColor }}>
          ATTESTATION DE SCOLARITÉ
        </div>
        
        <div className="space-y-1.5">
          <div className="h-1.5 bg-gradient-to-r from-gray-300 to-gray-200 rounded w-full"></div>
          <div className="h-1.5 bg-gradient-to-r from-gray-300 to-gray-200 rounded w-11/12"></div>
          <div className="h-1.5 bg-gradient-to-r from-gray-300 to-gray-200 rounded w-10/12"></div>
          <div className="h-1 bg-gray-100 rounded w-full"></div>
          <div className="h-1.5 bg-gradient-to-r from-gray-300 to-gray-200 rounded w-full"></div>
          <div className="h-1.5 bg-gradient-to-r from-gray-300 to-gray-200 rounded w-9/12"></div>
          <div className="h-1.5 bg-gradient-to-r from-gray-300 to-gray-200 rounded w-11/12"></div>
        </div>
        
        <div className="pt-3 flex justify-between items-center text-[8px]">
          <div className="text-gray-400">Fait le 14/11/2025</div>
          <div className="text-gray-500 italic">Signature</div>
        </div>
      </div>
      
      <div 
        className="mt-auto p-3 text-white text-center font-medium shadow-inner"
        style={{ 
          background: `linear-gradient(135deg, ${preset.footerColor} 0%, ${preset.footerColor}dd 100%)`
        }}
      >
        <div className="h-1.5 bg-white/90 rounded w-3/4 mx-auto mb-1.5 shadow-sm"></div>
        <div className="h-1 bg-white/70 rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  );
};

export const DocumentTemplatePresets = ({ selectedPreset, onSelectPreset }: DocumentTemplatePresetsProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Choisir un modèle</h3>
        <p className="text-sm text-muted-foreground">
          Sélectionnez un design professionnel pour vos documents officiels
        </p>
      </div>
      
      <ScrollArea className="h-[450px] pr-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
          {documentPresets.map((preset) => (
            <Card
              key={preset.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-xl group overflow-hidden ${
                selectedPreset === preset.id 
                  ? "ring-2 ring-primary border-primary shadow-lg scale-[1.02]" 
                  : "hover:border-primary/50 hover:scale-[1.01]"
              }`}
              onClick={() => onSelectPreset(preset)}
            >
              <div className="space-y-3">
                <div className="relative">
                  <TemplatePreviewMini preset={preset} />
                  {selectedPreset === preset.id && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg animate-in zoom-in-50">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                
                <div className="px-3 pb-3 space-y-1">
                  <h4 className="font-semibold text-sm">{preset.name}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
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

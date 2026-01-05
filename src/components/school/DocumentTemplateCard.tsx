import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Download } from "lucide-react";
import { DocumentTemplate } from "@/hooks/useDocumentTemplates";

interface DocumentTemplateCardProps {
  template: DocumentTemplate;
  onEdit?: (template: DocumentTemplate) => void;
  onDelete?: (id: string) => void;
  onGenerate: (template: DocumentTemplate) => void;
}

const getHeaderStylePreview = (style: string, footerColor: string) => {
  const rgb = hexToRgb(footerColor);
  
  switch (style) {
    case "modern":
      return (
        <div className="relative">
          <div style={{ backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` }} className="h-8 w-full flex items-center justify-center">
            <div style={{ color: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }} className="text-[6px] font-bold">ÉCOLE</div>
          </div>
          <div style={{ borderTopColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }} className="border-t-2 mt-2" />
        </div>
      );
    
    case "classic":
      return (
        <div className="flex flex-col items-center gap-1">
          <div style={{ borderColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }} className="border-2 rounded w-16 h-6 flex items-center justify-center">
            <div style={{ color: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }} className="text-[5px] font-bold">ÉCOLE</div>
          </div>
        </div>
      );
    
    case "minimal":
      return (
        <div className="space-y-1">
          <div className="text-[5px] text-muted-foreground">École</div>
          <div className="h-px bg-border" />
        </div>
      );
    
    case "elegant":
      return (
        <div className="flex gap-1 items-center">
          <div style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }} className="w-1 h-8" />
          <div style={{ color: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }} className="text-[6px] font-bold">ÉCOLE</div>
        </div>
      );
    
    default:
      return (
        <div className="text-[5px] text-center font-semibold text-foreground">ÉCOLE</div>
      );
  }
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 30, g: 64, b: 175 };
};

export const DocumentTemplateCard = ({
  template,
  onEdit,
  onDelete,
  onGenerate,
}: DocumentTemplateCardProps) => {
  const rgb = hexToRgb(template.footer_color || "#1e40af");
  const truncatedContent = template.content.slice(0, 150) + "...";

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{template.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {template.is_active ? "Actif" : "Inactif"}
            </p>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(template)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDelete(template.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Document Preview */}
        <div className="bg-background border rounded-lg p-2 shadow-sm">
          <div className="bg-card rounded border p-2 space-y-2 text-[7px]">
            {/* Header Preview */}
            {getHeaderStylePreview(template.header_style || "modern", template.footer_color || "#1e40af")}
            
            {/* Title */}
            <div className="text-center">
              <div style={{ color: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }} className="font-bold text-[6px] uppercase">
                {template.name}
              </div>
            </div>
            
            {/* Content Preview */}
            <div className="space-y-1 text-[5px] text-muted-foreground leading-tight">
              <div className="line-clamp-3">{truncatedContent}</div>
            </div>
            
            {/* Signature Area */}
            <div className="pt-2 text-[4px] text-muted-foreground italic text-right">
              Signature et cachet
            </div>
            
            {/* Footer Preview */}
            <div 
              style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
              className="h-4 -mx-2 -mb-2 flex items-center justify-center text-white text-[4px] rounded-b"
            >
              {template.footer_content ? (
                <div className="line-clamp-2 px-1">{template.footer_content.slice(0, 80)}</div>
              ) : (
                <div>Pied de page</div>
              )}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={() => onGenerate(template)}
          className="w-full"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Générer un document
        </Button>
      </CardContent>
    </Card>
  );
};

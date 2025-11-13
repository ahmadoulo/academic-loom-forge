import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocumentTemplatePreviewProps {
  name: string;
  content: string;
  footerColor: string;
  footerContent?: string;
  schoolName?: string;
  schoolLogo?: string;
}

export const DocumentTemplatePreview = ({
  name,
  content,
  footerColor,
  footerContent,
  schoolName,
  schoolLogo,
}: DocumentTemplatePreviewProps) => {
  const previewContent = content
    .replace(/\{\{student_name\}\}/g, "Jean Dupont")
    .replace(/\{\{student_firstname\}\}/g, "Jean")
    .replace(/\{\{student_lastname\}\}/g, "Dupont")
    .replace(/\{\{cin_number\}\}/g, "AB123456")
    .replace(/\{\{birth_date\}\}/g, "15/03/2005")
    .replace(/\{\{class_name\}\}/g, "Terminale S")
    .replace(/\{\{school_name\}\}/g, schoolName || "Nom de l'école")
    .replace(/\{\{school_address\}\}/g, "123 Rue de l'École")
    .replace(/\{\{school_phone\}\}/g, "+212 5XX-XXXXXX")
    .replace(/\{\{school_website\}\}/g, "www.ecole.ma")
    .replace(/\{\{school_year\}\}/g, "2024-2025")
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }));

  const previewFooter = footerContent
    ?.replace(/\{\{school_name\}\}/g, schoolName || "Nom de l'école")
    .replace(/\{\{school_address\}\}/g, "123 Rue de l'École")
    .replace(/\{\{school_phone\}\}/g, "+212 5XX-XXXXXX")
    .replace(/\{\{school_website\}\}/g, "www.ecole.ma")
    .replace(/\{\{school_city\}\}/g, "Casablanca")
    .replace(/\{\{school_country\}\}/g, "Maroc");

  return (
    <Card className="h-full border-2">
      <ScrollArea className="h-[600px]">
        <div className="p-8 bg-white" style={{ minHeight: "842px", width: "595px", margin: "0 auto" }}>
          {/* Header with logo */}
          <div className="text-center mb-6">
            {schoolLogo && (
              <div className="mb-4 flex justify-center">
                <img src={schoolLogo} alt="Logo" className="h-16 object-contain" />
              </div>
            )}
            {schoolName && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 uppercase mb-2">{schoolName}</h3>
              </div>
            )}
          </div>

          {/* Decorative line */}
          <div 
            className="w-full h-1 mb-6" 
            style={{ backgroundColor: footerColor }}
          />

          {/* Document title */}
          <h1 
            className="text-2xl font-bold text-center mb-8 uppercase"
            style={{ color: footerColor }}
          >
            {name || "Nom du document"}
          </h1>

          {/* Content */}
          <div className="text-sm text-gray-800 leading-relaxed mb-8 whitespace-pre-wrap">
            {previewContent || "Le contenu du document apparaîtra ici..."}
          </div>

          {/* Signature area */}
          <div className="mt-12 mb-8">
            <p className="text-sm text-gray-800">
              Fait le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="text-sm text-gray-800 italic text-right mt-4">
              Signature et cachet de l'établissement
            </p>
          </div>

          {/* Footer */}
          <div 
            className="absolute bottom-0 left-0 right-0 py-4 px-8 text-white text-center"
            style={{ backgroundColor: footerColor }}
          >
            {previewFooter ? (
              <div className="text-xs whitespace-pre-wrap leading-relaxed">{previewFooter}</div>
            ) : (
              <div className="text-xs">
                <p className="font-bold text-sm mb-1">{schoolName || "Nom de l'école"}</p>
                <p>123 Rue de l'École, Casablanca, Maroc</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
};

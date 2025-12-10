import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Link as LinkIcon, 
  X, 
  FileText, 
  Image as ImageIcon,
  Loader2,
  Plus
} from "lucide-react";

interface AttachmentUploaderProps {
  type: "events" | "annonces";
  schoolId: string;
  links: string[];
  attachments: string[];
  onLinksChange: (links: string[]) => void;
  onAttachmentsChange: (attachments: string[]) => void;
}

export function AttachmentUploader({
  type,
  schoolId,
  links,
  attachments,
  onLinksChange,
  onAttachmentsChange,
}: AttachmentUploaderProps) {
  const { toast } = useToast();
  const [newLink, setNewLink] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    
    // Validate URL
    try {
      new URL(newLink);
    } catch {
      toast({
        title: "URL invalide",
        description: "Veuillez entrer une URL valide (ex: https://exemple.com)",
        variant: "destructive",
      });
      return;
    }
    
    onLinksChange([...links, newLink.trim()]);
    setNewLink("");
  };

  const handleRemoveLink = (index: number) => {
    onLinksChange(links.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Fichier trop volumineux",
            description: `${file.name} dépasse 5MB`,
            variant: "destructive",
          });
          continue;
        }

        // Generate unique filename
        const ext = file.name.split(".").pop();
        const fileName = `${schoolId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `${type}/${fileName}`;

        const { error } = await supabase.storage
          .from("school-document")
          .upload(filePath, file);

        if (error) {
          console.error("Upload error:", error);
          toast({
            title: "Erreur d'upload",
            description: `Impossible d'uploader ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        newAttachments.push(filePath);
      }

      if (newAttachments.length > 0) {
        onAttachmentsChange([...attachments, ...newAttachments]);
        toast({
          title: "Fichiers uploadés",
          description: `${newAttachments.length} fichier(s) ajouté(s)`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleRemoveAttachment = async (index: number) => {
    const filePath = attachments[index];
    
    // Try to delete from storage
    try {
      await supabase.storage.from("school-document").remove([filePath]);
    } catch (error) {
      console.error("Delete error:", error);
    }

    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  const getFileName = (path: string) => {
    return path.split("/").pop() || path;
  };

  const isImage = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  };

  return (
    <div className="space-y-4">
      {/* Links Section */}
      <div className="space-y-2">
        <Label className="text-base font-semibold flex items-center gap-2">
          <LinkIcon className="w-4 h-4" />
          Liens
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://exemple.com"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLink())}
          />
          <Button type="button" variant="outline" onClick={handleAddLink}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {links.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {links.map((link, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1 max-w-[200px] pr-1"
              >
                <LinkIcon className="w-3 h-3 shrink-0" />
                <span className="truncate">{new URL(link).hostname}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="ml-1 p-0.5 hover:bg-destructive/20 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Files Section */}
      <div className="space-y-2">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Documents & Images
        </Label>
        <div className="flex items-center gap-2">
          <label className="flex-1">
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Upload en cours...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Glisser ou cliquer (max 5MB)
                  </span>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachments.map((attachment, index) => (
              <Badge
                key={index}
                variant="outline"
                className="flex items-center gap-1 max-w-[200px] pr-1"
              >
                {isImage(attachment) ? (
                  <ImageIcon className="w-3 h-3 shrink-0 text-green-600" />
                ) : (
                  <FileText className="w-3 h-3 shrink-0 text-blue-600" />
                )}
                <span className="truncate text-xs">{getFileName(attachment)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(index)}
                  className="ml-1 p-0.5 hover:bg-destructive/20 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
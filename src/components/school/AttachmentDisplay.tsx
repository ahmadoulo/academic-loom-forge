import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  ExternalLink, 
  FileText, 
  Image as ImageIcon,
  Download,
  Link as LinkIcon
} from "lucide-react";

interface AttachmentDisplayProps {
  links: string[];
  attachments: string[];
}

export function AttachmentDisplay({ links, attachments }: AttachmentDisplayProps) {
  const [attachmentUrls, setAttachmentUrls] = useState<{ path: string; url: string }[]>([]);

  useEffect(() => {
    const fetchUrls = async () => {
      if (!attachments || attachments.length === 0) {
        setAttachmentUrls([]);
        return;
      }

      const urls = await Promise.all(
        attachments.map(async (path) => {
          const { data } = await supabase.storage
            .from("school-document")
            .createSignedUrl(path, 3600); // 1 hour expiry
          
          return { path, url: data?.signedUrl || "" };
        })
      );

      setAttachmentUrls(urls.filter(u => u.url));
    };

    fetchUrls();
  }, [attachments]);

  const getFileName = (path: string) => {
    const name = path.split("/").pop() || path;
    // Remove timestamp prefix if present
    return name.replace(/^\d+-[a-z0-9]+\./, "");
  };

  const isImage = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  };

  if ((!links || links.length === 0) && (!attachments || attachments.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Links */}
      {links && links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((link, index) => {
            let hostname = "";
            try {
              hostname = new URL(link).hostname;
            } catch {
              hostname = link;
            }
            return (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 hover:bg-secondary/80 cursor-pointer transition-colors"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span className="max-w-[150px] truncate">{hostname}</span>
                  <ExternalLink className="w-3 h-3" />
                </Badge>
              </a>
            );
          })}
        </div>
      )}

      {/* Images Gallery */}
      {attachmentUrls.filter(a => isImage(a.path)).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachmentUrls
            .filter(a => isImage(a.path))
            .map((attachment, index) => (
              <a
                key={index}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group"
              >
                <img
                  src={attachment.url}
                  alt=""
                  className="w-20 h-20 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
              </a>
            ))}
        </div>
      )}

      {/* Documents */}
      {attachmentUrls.filter(a => !isImage(a.path)).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachmentUrls
            .filter(a => !isImage(a.path))
            .map((attachment, index) => (
              <a
                key={index}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 hover:bg-muted cursor-pointer transition-colors"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span className="max-w-[120px] truncate text-xs">
                    {getFileName(attachment.path)}
                  </span>
                  <Download className="w-3 h-3" />
                </Badge>
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
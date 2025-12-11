import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { 
  ExternalLink, 
  FileText, 
  Download,
  Link as LinkIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn
} from "lucide-react";

interface AttachmentDisplayProps {
  links: string[];
  attachments: string[];
}

export function AttachmentDisplay({ links, attachments }: AttachmentDisplayProps) {
  const [attachmentUrls, setAttachmentUrls] = useState<{ path: string; url: string }[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const imageAttachments = attachmentUrls.filter(a => isImage(a.path));
  const documentAttachments = attachmentUrls.filter(a => !isImage(a.path));

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? imageAttachments.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => 
      prev === imageAttachments.length - 1 ? 0 : prev + 1
    );
  };

  if ((!links || links.length === 0) && (!attachments || attachments.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Images Gallery - Inline display */}
      {imageAttachments.length > 0 && (
        <div className="space-y-2">
          {imageAttachments.length === 1 ? (
            // Single image - display large
            <div 
              className="relative cursor-pointer group rounded-xl overflow-hidden border border-border/50"
              onClick={() => handleImageClick(0)}
            >
              <img
                src={imageAttachments[0].url}
                alt="Attachment"
                className="w-full max-h-[400px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-3">
                  <ZoomIn className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ) : imageAttachments.length === 2 ? (
            // Two images - side by side
            <div className="grid grid-cols-2 gap-2">
              {imageAttachments.map((attachment, index) => (
                <div 
                  key={index}
                  className="relative cursor-pointer group rounded-xl overflow-hidden border border-border/50 aspect-[4/3]"
                  onClick={() => handleImageClick(index)}
                >
                  <img
                    src={attachment.url}
                    alt="Attachment"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Multiple images - grid layout
            <div className="grid grid-cols-3 gap-2">
              {imageAttachments.slice(0, 6).map((attachment, index) => (
                <div 
                  key={index}
                  className={`relative cursor-pointer group rounded-xl overflow-hidden border border-border/50 aspect-square ${
                    index === 0 && imageAttachments.length >= 3 ? 'col-span-2 row-span-2' : ''
                  }`}
                  onClick={() => handleImageClick(index)}
                >
                  <img
                    src={attachment.url}
                    alt="Attachment"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  {index === 5 && imageAttachments.length > 6 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">+{imageAttachments.length - 6}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                  className="flex items-center gap-1.5 hover:bg-secondary/80 cursor-pointer transition-colors py-1.5 px-3"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span className="max-w-[150px] truncate">{hostname}</span>
                  <ExternalLink className="w-3 h-3" />
                </Badge>
              </a>
            );
          })}
        </div>
      )}

      {/* Documents */}
      {documentAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {documentAttachments.map((attachment, index) => (
            <a
              key={index}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex"
            >
              <Badge
                variant="outline"
                className="flex items-center gap-2 hover:bg-muted cursor-pointer transition-colors py-1.5 px-3"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="max-w-[140px] truncate text-sm">
                  {getFileName(attachment.path)}
                </span>
                <Download className="w-3.5 h-3.5" />
              </Badge>
            </a>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Navigation arrows */}
            {imageAttachments.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            {/* Image */}
            {imageAttachments[currentImageIndex] && (
              <img
                src={imageAttachments[currentImageIndex].url}
                alt="Full size"
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Image counter */}
            {imageAttachments.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} / {imageAttachments.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

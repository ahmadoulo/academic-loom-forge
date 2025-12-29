import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  VideoOff, 
  Maximize2, 
  Volume2, 
  VolumeX,
  RefreshCw,
  MapPin,
  ExternalLink
} from "lucide-react";
import { SchoolCamera } from "@/hooks/useSchoolCameras";

interface CameraViewDialogProps {
  camera: SchoolCamera | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CameraViewDialog({ camera, open, onOpenChange }: CameraViewDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!camera) return null;

  // Convert RTSP to HLS/WebRTC if available (Wowza typically supports this)
  const getStreamUrl = (rtspUrl: string) => {
    // For Wowza streams, try to convert RTSP to HLS
    if (rtspUrl.includes('wowza.com')) {
      // Convert rtsp:// to https:// and change port/path for HLS
      const hlsUrl = rtspUrl
        .replace('rtsp://', 'https://')
        .replace(':1935/', ':443/')
        .replace(/\/app-[^/]+\//, '/app-$&/')
        + '/playlist.m3u8';
      return hlsUrl;
    }
    // For other RTSP streams, return as-is (may need conversion)
    return rtspUrl;
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleFullscreen = () => {
    const videoContainer = document.getElementById('camera-video-container');
    if (videoContainer) {
      if (!document.fullscreenElement) {
        videoContainer.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const openInNewTab = () => {
    window.open(camera.rtsp_url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{camera.name}</DialogTitle>
                {camera.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    {camera.location}
                  </div>
                )}
              </div>
            </div>
            <Badge variant={camera.is_active ? "default" : "secondary"}>
              {camera.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Container */}
          <div 
            id="camera-video-container"
            className="relative bg-black rounded-lg overflow-hidden aspect-video"
          >
            {isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Connexion au flux...</p>
                </div>
              </div>
            )}

            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <div className="flex flex-col items-center gap-3 text-center p-6">
                  <VideoOff className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Impossible de charger le flux</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Le flux RTSP nécessite une conversion pour être affiché dans le navigateur.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Réessayer
                    </Button>
                    <Button variant="outline" size="sm" onClick={openInNewTab}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ouvrir externalement
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Video element for HLS streams */}
            <video
              className="w-full h-full object-contain"
              autoPlay
              muted={isMuted}
              playsInline
              onLoadStart={() => setIsLoading(true)}
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            >
              <source src={getStreamUrl(camera.rtsp_url)} type="application/x-mpegURL" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>

            {/* Video Controls Overlay */}
            {!hasError && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={handleRefresh}
                    >
                      <RefreshCw className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={handleFullscreen}
                    >
                      <Maximize2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Camera Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">URL du flux</p>
              <p className="text-sm font-mono break-all mt-1">{camera.rtsp_url}</p>
            </div>
            {camera.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm mt-1">{camera.description}</p>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note :</strong> Les flux RTSP natifs nécessitent une conversion côté serveur pour être lus dans un navigateur. 
              Si le flux ne s'affiche pas, utilisez un lecteur externe compatible RTSP (VLC, etc.) avec l'URL fournie.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef, useEffect } from "react";
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
  ExternalLink,
  Play,
  Copy,
  Check
} from "lucide-react";
import { SchoolCamera } from "@/hooks/useSchoolCameras";
import Hls from "hls.js";
import { useToast } from "@/hooks/use-toast";

interface CameraViewDialogProps {
  camera: SchoolCamera | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CameraViewDialog({ camera, open, onOpenChange }: CameraViewDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { toast } = useToast();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [copied, setCopied] = useState(false);

  // Cleanup HLS on unmount or dialog close
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      stopStream();
      setIsPlaying(false);
      setHasError(false);
      setErrorMessage("");
    }
  }, [open]);

  if (!camera) return null;

  // Convert RTSP URL to HLS URL for Wowza streams
  const getHlsUrl = (rtspUrl: string): string | null => {
    try {
      // Parse RTSP URL: rtsp://host:port/application/stream
      const url = new URL(rtspUrl.replace('rtsp://', 'https://'));
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      if (pathParts.length >= 2) {
        const application = pathParts[0];
        const streamName = pathParts.slice(1).join('/');
        
        // Wowza HLS format: https://host/application/stream/playlist.m3u8
        return `https://${url.hostname}/${application}/${streamName}/playlist.m3u8`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const startStream = async () => {
    if (!videoRef.current || !camera) return;
    
    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");

    const hlsUrl = getHlsUrl(camera.rtsp_url);
    
    if (!hlsUrl) {
      setHasError(true);
      setErrorMessage("Format d'URL non supporté. Utilisez VLC avec l'URL RTSP.");
      setIsLoading(false);
      return;
    }

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setIsPlaying(true);
        videoRef.current?.play().catch(console.error);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data);
        
        if (data.fatal) {
          setIsLoading(false);
          setHasError(true);
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMessage("Le flux HLS n'est pas accessible. Le serveur ne fournit peut-être pas de flux HLS. Utilisez VLC.");
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setErrorMessage("Erreur de lecture du flux vidéo.");
              hls.recoverMediaError();
              break;
            default:
              setErrorMessage("Impossible de lire le flux. Utilisez VLC avec l'URL RTSP.");
          }
        }
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);
      
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      videoRef.current.src = hlsUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        setIsPlaying(true);
        videoRef.current?.play().catch(console.error);
      });
      videoRef.current.addEventListener('error', () => {
        setIsLoading(false);
        setHasError(true);
        setErrorMessage("Impossible de charger le flux. Utilisez VLC avec l'URL RTSP.");
      });
    } else {
      setIsLoading(false);
      setHasError(true);
      setErrorMessage("Votre navigateur ne supporte pas la lecture HLS.");
    }
  };

  const stopStream = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }
    setIsPlaying(false);
  };

  const handleRefresh = () => {
    stopStream();
    startStream();
  };

  const handleFullscreen = () => {
    const videoContainer = document.getElementById('camera-video-container');
    if (videoContainer) {
      if (!document.fullscreenElement) {
        videoContainer.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const copyRtspUrl = async () => {
    try {
      await navigator.clipboard.writeText(camera.rtsp_url);
      setCopied(true);
      toast({ title: "URL copiée", description: "L'URL RTSP a été copiée dans le presse-papier." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erreur", description: "Impossible de copier l'URL.", variant: "destructive" });
    }
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
            {/* Not started state */}
            {!isPlaying && !isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-6 rounded-full bg-primary/10 border border-primary/20">
                    <Video className="h-12 w-12 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-lg">Flux vidéo prêt</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cliquez pour démarrer la lecture
                    </p>
                  </div>
                  <Button onClick={startStream} size="lg" className="gap-2">
                    <Play className="h-5 w-5" />
                    Démarrer le flux
                  </Button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Connexion au flux...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
                <div className="flex flex-col items-center gap-4 text-center p-6 max-w-md">
                  <div className="p-4 rounded-full bg-destructive/10">
                    <VideoOff className="h-10 w-10 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">Flux non disponible</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {errorMessage}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleRefresh} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Réessayer
                    </Button>
                    <Button variant="outline" onClick={copyRtspUrl} className="gap-2">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Copier l'URL RTSP
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Video element */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              muted={isMuted}
              playsInline
              autoPlay={false}
            />

            {/* Video Controls Overlay */}
            {isPlaying && !hasError && (
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
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="text-xs font-medium text-white">LIVE</span>
                    </div>
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
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">URL du flux RTSP</p>
              <Button variant="ghost" size="sm" onClick={copyRtspUrl} className="gap-2 h-8">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copier
              </Button>
            </div>
            <p className="text-sm font-mono break-all bg-muted p-2 rounded">{camera.rtsp_url}</p>
            {camera.description && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm mt-1">{camera.description}</p>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Note :</strong> La lecture dans le navigateur nécessite que votre serveur de streaming expose un flux HLS. 
              Si le flux ne s'affiche pas, utilisez <strong>VLC Media Player</strong> avec l'URL RTSP ci-dessus.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

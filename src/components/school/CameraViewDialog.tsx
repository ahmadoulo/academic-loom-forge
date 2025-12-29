import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  Play,
  Copy,
  Check,
  ExternalLink
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

  // Stop stream function
  const stopStream = useCallback(() => {
    console.log("[Camera] Stopping stream...");
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
      videoRef.current.load();
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  // Cleanup HLS on unmount
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
      setHasError(false);
      setErrorMessage("");
    }
  }, [open, stopStream]);

  const startStream = () => {
    console.log("[Camera] startStream called");
    console.log("[Camera] camera:", camera);
    console.log("[Camera] videoRef.current:", videoRef.current);
    
    if (!camera) {
      console.error("[Camera] No camera provided");
      return;
    }
    
    if (!videoRef.current) {
      console.error("[Camera] Video ref not ready, retrying in 100ms...");
      setTimeout(() => startStream(), 100);
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");

    const hlsUrl = getHlsUrl(camera.rtsp_url);
    console.log("[Camera] HLS URL:", hlsUrl);
    
    if (!hlsUrl) {
      setHasError(true);
      setErrorMessage("Format d'URL non supporté. Utilisez VLC avec l'URL RTSP.");
      setIsLoading(false);
      return;
    }

    // Check if HLS is supported
    if (Hls.isSupported()) {
      console.log("[Camera] HLS.js is supported, creating instance...");
      
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("[Camera] Manifest parsed, starting playback...");
        setIsLoading(false);
        setIsPlaying(true);
        videoRef.current?.play().catch((err) => {
          console.error("[Camera] Play error:", err);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("[Camera] HLS Error:", data);
        
        if (data.fatal) {
          setIsLoading(false);
          setHasError(true);
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMessage("Le flux HLS n'est pas accessible. Votre serveur Wowza ne fournit peut-être pas de flux HLS sur ce chemin.");
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

      console.log("[Camera] Loading source:", hlsUrl);
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);
      
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      console.log("[Camera] Using Safari native HLS");
      videoRef.current.src = hlsUrl;
      
      const handleLoadedMetadata = () => {
        console.log("[Camera] Safari: metadata loaded");
        setIsLoading(false);
        setIsPlaying(true);
        videoRef.current?.play().catch(console.error);
      };
      
      const handleError = () => {
        console.error("[Camera] Safari: video error");
        setIsLoading(false);
        setHasError(true);
        setErrorMessage("Impossible de charger le flux. Utilisez VLC avec l'URL RTSP.");
      };
      
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      videoRef.current.addEventListener('error', handleError, { once: true });
    } else {
      console.error("[Camera] HLS not supported by browser");
      setIsLoading(false);
      setHasError(true);
      setErrorMessage("Votre navigateur ne supporte pas la lecture HLS.");
    }
  };

  const handleRefresh = () => {
    stopStream();
    setTimeout(() => startStream(), 100);
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
    if (!camera) return;
    try {
      await navigator.clipboard.writeText(camera.rtsp_url);
      setCopied(true);
      toast({ title: "URL copiée", description: "L'URL RTSP a été copiée dans le presse-papier." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erreur", description: "Impossible de copier l'URL.", variant: "destructive" });
    }
  };

  const openInVlc = () => {
    if (!camera) return;
    // VLC URL scheme
    window.open(`vlc://${camera.rtsp_url}`, '_blank');
  };

  if (!camera) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">{camera.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-1 mt-0.5">
                  {camera.location ? (
                    <>
                      <MapPin className="h-3 w-3" />
                      {camera.location}
                    </>
                  ) : (
                    "Flux de surveillance"
                  )}
                </DialogDescription>
              </div>
            </div>
            <Badge 
              variant={camera.is_active ? "default" : "secondary"}
              className={camera.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
            >
              {camera.is_active ? "● Active" : "Inactive"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Video Container */}
          <div 
            id="camera-video-container"
            className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden aspect-video shadow-lg"
          >
            {/* Video element - always mounted */}
            <video
              ref={videoRef}
              className={`w-full h-full object-contain ${isPlaying ? 'block' : 'hidden'}`}
              muted={isMuted}
              playsInline
              autoPlay={false}
            />

            {/* Not started state */}
            {!isPlaying && !isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative p-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                      <Video className="h-14 w-14 text-primary" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg text-white">Flux vidéo prêt</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Cliquez sur le bouton pour démarrer la lecture
                    </p>
                  </div>
                  <Button 
                    onClick={startStream} 
                    size="lg" 
                    className="gap-2 px-8 shadow-lg shadow-primary/25"
                  >
                    <Play className="h-5 w-5" />
                    Démarrer le flux
                  </Button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
                    <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary"></div>
                  </div>
                  <p className="text-sm text-slate-300 font-medium">Connexion au flux en cours...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-10">
                <div className="flex flex-col items-center gap-5 text-center p-6 max-w-md">
                  <div className="p-5 rounded-full bg-red-500/10 border border-red-500/20">
                    <VideoOff className="h-12 w-12 text-red-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-white">Flux non disponible</p>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      {errorMessage}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleRefresh} className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                      <RefreshCw className="h-4 w-4" />
                      Réessayer
                    </Button>
                    <Button variant="outline" onClick={copyRtspUrl} className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Copier l'URL
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Video Controls Overlay */}
            {isPlaying && !hasError && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-9 w-9"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Live</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-9 w-9"
                      onClick={handleRefresh}
                    >
                      <RefreshCw className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-9 w-9"
                      onClick={handleFullscreen}
                    >
                      <Maximize2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Camera Info Card */}
          <div className="p-4 bg-muted/50 rounded-xl border space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">URL du flux RTSP</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={openInVlc} className="gap-2 h-8 text-xs">
                  <ExternalLink className="h-3 w-3" />
                  Ouvrir VLC
                </Button>
                <Button variant="ghost" size="sm" onClick={copyRtspUrl} className="gap-2 h-8 text-xs">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copier
                </Button>
              </div>
            </div>
            <code className="block text-xs font-mono break-all bg-muted p-3 rounded-lg border">
              {camera.rtsp_url}
            </code>
            {camera.description && (
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
                <p className="text-sm mt-1">{camera.description}</p>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20">
                  <Video className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">À propos des flux RTSP</p>
                <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">
                  La lecture dans le navigateur nécessite que votre serveur de streaming (Wowza, etc.) expose un flux HLS. 
                  Si le flux ne s'affiche pas, utilisez <strong>VLC Media Player</strong> pour visualiser le flux RTSP directement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

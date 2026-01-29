import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Video, 
  VideoOff, 
  Maximize2,
  Minimize2,
  Volume2, 
  VolumeX,
  RefreshCw,
  Play,
  Copy,
  Check,
  Square
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
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { toast } = useToast();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Convert RTSP URL to HLS URL for Wowza/streaming servers
  const getHlsUrl = useCallback((rtspUrl: string): string | null => {
    try {
      const url = new URL(rtspUrl.replace('rtsp://', 'https://'));
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      if (pathParts.length >= 2) {
        const application = pathParts[0];
        const streamName = pathParts.slice(1).join('/');
        return `https://${url.hostname}/${application}/${streamName}/playlist.m3u8`;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Stop stream function - properly cleanup HLS and video
  const stopStream = useCallback(() => {
    // Destroy HLS instance
    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch (e) {
        // Silent error handling
      }
      hlsRef.current = null;
    }
    
    // Clean up video element
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      } catch (e) {
        // Silent error handling
      }
    }
    
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Cleanup when dialog closes or component unmounts
  useEffect(() => {
    if (!open) {
      stopStream();
      setHasError(false);
      setErrorMessage("");
      
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
    
    // Cleanup on unmount
    return () => {
      stopStream();
    };
  }, [open, stopStream]);

  const startStream = useCallback(() => {
    if (!camera || !videoRef.current) {
      return;
    }
    
    // Ensure previous stream is stopped
    stopStream();
    
    // Small delay to ensure cleanup is complete
    setTimeout(() => {
      if (!videoRef.current) return;
      
      setIsLoading(true);
      setHasError(false);
      setErrorMessage("");

      const hlsUrl = getHlsUrl(camera.rtsp_url);
      
      if (!hlsUrl) {
        setHasError(true);
        setErrorMessage("Format d'URL non supporté");
        setIsLoading(false);
        return;
      }

      console.log("HLS URL:", hlsUrl);

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          // Add retry settings for better reliability
          manifestLoadingMaxRetry: 3,
          manifestLoadingRetryDelay: 1000,
          levelLoadingMaxRetry: 3,
          fragLoadingMaxRetry: 3,
        });
        
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log("HLS manifest parsed, starting playback");
          setIsLoading(false);
          setIsPlaying(true);
          if (videoRef.current) {
            videoRef.current.play().catch((e) => {
              console.error("Play error:", e);
            });
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error("HLS Error:", data.type, data.details);
          
          if (data.fatal) {
            setIsLoading(false);
            setHasError(true);
            setIsPlaying(false);
            
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setErrorMessage("Flux inaccessible - Vérifiez la connexion");
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setErrorMessage("Erreur de lecture média");
                hls.recoverMediaError();
                break;
              default:
                setErrorMessage("Flux indisponible");
            }
          }
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(videoRef.current);
        
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        videoRef.current.src = hlsUrl;
        
        const handleLoaded = () => {
          setIsLoading(false);
          setIsPlaying(true);
          videoRef.current?.play().catch(() => {});
        };
        
        const handleError = () => {
          setIsLoading(false);
          setHasError(true);
          setIsPlaying(false);
          setErrorMessage("Impossible de charger le flux");
        };
        
        videoRef.current.addEventListener('loadedmetadata', handleLoaded, { once: true });
        videoRef.current.addEventListener('error', handleError, { once: true });
      } else {
        setIsLoading(false);
        setHasError(true);
        setErrorMessage("Navigateur non compatible HLS");
      }
    }, 100);
  }, [camera, stopStream, getHlsUrl]);

  const handleRefresh = useCallback(() => {
    stopStream();
    setTimeout(() => startStream(), 200);
  }, [stopStream, startStream]);

  const handleStop = useCallback(() => {
    stopStream();
  }, [stopStream]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Try video element first for better mobile experience
        if (videoRef.current?.requestFullscreen) {
          await videoRef.current.requestFullscreen();
        } else if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
      toast({ title: "Plein écran non disponible", variant: "destructive" });
    }
  };

  const copyRtspUrl = async () => {
    if (!camera) return;
    try {
      await navigator.clipboard.writeText(camera.rtsp_url);
      setCopied(true);
      toast({ title: "URL copiée" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erreur de copie", variant: "destructive" });
    }
  };

  if (!camera) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] p-0 gap-0 bg-black border-0 overflow-hidden [&>button]:hidden" aria-describedby={undefined}>
        <DialogHeader className="sr-only">
          <DialogTitle>{camera.name}</DialogTitle>
        </DialogHeader>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Video className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">{camera.name}</h2>
              {camera.location && (
                <p className="text-xs text-zinc-500">{camera.location}</p>
              )}
            </div>
            
            {/* Status Badge - Dynamic based on actual stream state */}
            {isPlaying ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 rounded-full ml-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Live</span>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/20 rounded-full ml-2">
                <span className="animate-spin h-2 w-2 border border-yellow-400 border-t-transparent rounded-full"></span>
                <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Connexion</span>
              </div>
            ) : hasError ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 rounded-full ml-2">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Erreur</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-700/50 rounded-full ml-2">
                <span className="h-2 w-2 rounded-full bg-zinc-500"></span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Arrêté</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isPlaying && (
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-2 h-8"
                onClick={handleStop}
              >
                <Square className="h-3.5 w-3.5" />
                Arrêter
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </div>
        </div>

        {/* Video Container */}
        <div 
          ref={containerRef}
          className="relative bg-black w-full flex items-center justify-center"
          style={{ height: 'calc(90vh - 56px)', minHeight: '500px' }}
        >
          {/* Video element - always rendered */}
          <video
            ref={videoRef}
            className={`w-full h-full object-contain bg-black ${isPlaying ? 'block' : 'hidden'}`}
            muted={isMuted}
            playsInline
            autoPlay={false}
          />

          {/* Not started state */}
          {!isPlaying && !isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black">
              <div className="flex flex-col items-center gap-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse scale-150" />
                  <div className="relative p-8 rounded-full bg-zinc-800/80 border border-zinc-700">
                    <Video className="h-12 w-12 text-zinc-400" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg text-white">Flux vidéo prêt</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Démarrez pour voir le flux en direct
                  </p>
                </div>
                <Button 
                  onClick={startStream} 
                  size="lg" 
                  className="gap-3 px-8 py-6 text-base font-semibold shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105"
                >
                  <Play className="h-5 w-5" />
                  Démarrer le flux
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
                  <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-white font-medium">Connexion au flux...</p>
                  <p className="text-xs text-zinc-500 mt-1">Veuillez patienter</p>
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black">
              <div className="flex flex-col items-center gap-6 text-center p-8 max-w-md">
                <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20">
                  <VideoOff className="h-10 w-10 text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-white">{errorMessage}</p>
                  <p className="text-sm text-zinc-500 mt-2">
                    Vérifiez que la caméra est en ligne ou utilisez VLC avec l'URL RTSP
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleRefresh} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Réessayer
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={copyRtspUrl} 
                    className="gap-2 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Copier URL
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Video Controls Overlay */}
          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-10 w-10"
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Activer le son" : "Couper le son"}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-10 w-10"
                    onClick={handleRefresh}
                    title="Rafraîchir le flux"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-10 w-10"
                    onClick={handleStop}
                    title="Arrêter le flux"
                  >
                    <Square className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 gap-2 h-10 px-3"
                    onClick={copyRtspUrl}
                    title="Copier l'URL RTSP"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="text-xs hidden sm:inline">RTSP</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-10 w-10"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                  >
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

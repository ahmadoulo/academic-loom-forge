import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  X
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

  // Convert RTSP URL to HLS URL for Wowza streams
  const getHlsUrl = (rtspUrl: string): string | null => {
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
  };

  // Stop stream function
  const stopStream = useCallback(() => {
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

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  }, [open, stopStream]);

  const startStream = () => {
    if (!camera || !videoRef.current) return;
    
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

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setIsPlaying(true);
        videoRef.current?.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setIsLoading(false);
          setHasError(true);
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMessage("Flux HLS inaccessible");
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setErrorMessage("Erreur de lecture");
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
      videoRef.current.src = hlsUrl;
      
      videoRef.current.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        setIsPlaying(true);
        videoRef.current?.play().catch(() => {});
      }, { once: true });
      
      videoRef.current.addEventListener('error', () => {
        setIsLoading(false);
        setHasError(true);
        setErrorMessage("Impossible de charger le flux");
      }, { once: true });
    } else {
      setIsLoading(false);
      setHasError(true);
      setErrorMessage("Navigateur non compatible HLS");
    }
  };

  const handleRefresh = () => {
    stopStream();
    setTimeout(() => startStream(), 100);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
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
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  if (!camera) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] p-0 gap-0 bg-black/95 border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Video className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{camera.name}</h2>
              {camera.location && (
                <p className="text-xs text-white/50">{camera.location}</p>
              )}
            </div>
            {isPlaying && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 rounded-full ml-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Live</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Video Container */}
        <div 
          ref={containerRef}
          className="relative bg-black w-full"
          style={{ height: isFullscreen ? '100vh' : 'calc(90vh - 120px)', minHeight: '500px' }}
        >
          {/* Video element */}
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
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse scale-150" />
                  <div className="relative p-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 backdrop-blur-sm">
                    <Video className="h-16 w-16 text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-xl text-white">Prêt à diffuser</p>
                  <p className="text-sm text-white/40 mt-1">
                    Cliquez pour démarrer le flux en direct
                  </p>
                </div>
                <Button 
                  onClick={startStream} 
                  size="lg" 
                  className="gap-3 px-10 py-6 text-base font-semibold shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all hover:scale-105"
                >
                  <Play className="h-5 w-5" />
                  Démarrer le flux
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/40 rounded-full blur-2xl animate-pulse" />
                  <div className="relative animate-spin rounded-full h-14 w-14 border-4 border-primary/30 border-t-primary"></div>
                </div>
                <p className="text-sm text-white/60 font-medium">Connexion au flux...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-5 text-center p-8 max-w-md">
                <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20">
                  <VideoOff className="h-12 w-12 text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-white">{errorMessage}</p>
                  <p className="text-sm text-white/40 mt-2">
                    Utilisez VLC avec l'URL RTSP pour un accès direct
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handleRefresh} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Réessayer
                  </Button>
                  <Button variant="outline" onClick={copyRtspUrl} className="gap-2 bg-white/5 border-white/20 text-white hover:bg-white/10">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Copier URL
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Video Controls */}
          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 hover:opacity-100 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-10 w-10"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-10 w-10"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 gap-2 h-10 px-4"
                    onClick={copyRtspUrl}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="text-xs">RTSP</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-10 w-10"
                    onClick={toggleFullscreen}
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
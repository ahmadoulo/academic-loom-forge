import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, QrCode, Clock, Users, Copy, CheckCircle, ChevronDown, Link, Share, Trash2, CalendarDays, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import QRCode from 'qrcode';
import { useEventAttendance } from "@/hooks/useEventAttendance";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EventQRCodeGeneratorProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    start_at: string;
    end_at: string;
    location: string | null;
    school_id: string;
  };
  session: {
    id: string;
    session_code: string;
    expires_at: string;
  };
  onBack: () => void;
}

export const EventQRCodeGenerator = ({ event, session, onBack }: EventQRCodeGeneratorProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();
  const { 
    attendance, 
    deactivateSession,
    deleteAttendance
  } = useEventAttendance(event.id, event.school_id);

  const scanUrl = `${window.location.origin}/event-attendance/${session.session_code}`;

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(scanUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQR();
  }, [scanUrl]);

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const expires = new Date(session.expires_at);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expiré');
        deactivateSession(session.id);
        setTimeout(() => {
          onBack();
        }, 2000);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [session.expires_at, deactivateSession, session.id, onBack]);

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(session.session_code);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = session.session_code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Code copié",
        description: "Le code de session a été copié dans le presse-papiers",
      });
    } catch (err) {
      alert(`Code de session: ${session.session_code}`);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(scanUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = scanUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast({
        title: "Lien copié !",
        description: "Le lien de la session a été copié dans le presse-papiers.",
      });
    } catch (err) {
      alert(`Lien de session: ${scanUrl}`);
    }
  };

  const handleCloseSession = async () => {
    await deactivateSession(session.id);
    onBack();
  };

  const handleDeleteAttendance = async () => {
    if (deleteConfirmId) {
      await deleteAttendance(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <QrCode className="h-5 w-5 text-primary" />
                  Présence - {event.title}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {format(new Date(event.start_at), "d MMMM yyyy à HH:mm", { locale: fr })}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="destructive" onClick={handleCloseSession}>
              Fermer la session
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5">
              <Clock className="h-3 w-3" />
              Expire dans: <span className="font-mono font-semibold">{timeRemaining}</span>
            </Badge>
            <Badge variant="default" className="flex items-center gap-1 px-3 py-1.5">
              <Users className="h-3 w-3" />
              {attendance.length} participant{attendance.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Code QR de présence</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {qrCodeUrl && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl shadow-lg border">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code de présence" 
                    className="w-64 h-64"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Code de session:</p>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="text-2xl font-mono px-6 py-3 tracking-widest">
                  {session.session_code}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share className="h-4 w-4" />
                    Partager la session
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  <DropdownMenuItem onClick={handleCopyCode}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copier le code de session
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Link className="mr-2 h-4 w-4" />
                    {linkCopied ? "Lien copié !" : "Copier le lien"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Instructions pour les participants:</p>
              <div className="bg-muted/50 p-4 rounded-lg text-left">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Scannez le QR code avec votre téléphone</li>
                  <li>Remplissez le formulaire avec vos informations</li>
                  <li>Votre présence sera automatiquement enregistrée</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Attendance Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Présences en temps réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Aucune présence enregistrée</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Les participants apparaîtront ici après avoir scanné le QR code
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {attendance.map((record, index) => (
                  <div 
                    key={record.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <span className="font-medium block">
                          {record.participant_name}
                        </span>
                        {record.participant_email && (
                          <span className="text-xs text-muted-foreground">
                            {record.participant_email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <QrCode className="h-3 w-3 mr-1" />
                        {format(new Date(record.marked_at), "HH:mm")}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteConfirmId(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette présence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La présence du participant sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAttendance} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
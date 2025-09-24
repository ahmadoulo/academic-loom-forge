import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, QrCode, Clock, Users, Copy, CheckCircle, ChevronDown, Link, Share } from "lucide-react";
import QRCode from 'qrcode';
import { useAttendance } from "@/hooks/useAttendance";
import { useToast } from "@/hooks/use-toast";

interface QRCodeGeneratorProps {
  session: {
    id: string;
    session_code: string;
    expires_at: string;
    class_id: string;
    teacher_id: string;
  };
  classData: {
    id: string;
    name: string;
  };
  onBack: () => void;
}

export const QRCodeGenerator = ({ session, classData, onBack }: QRCodeGeneratorProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { toast } = useToast();
  const { 
    attendance, 
    deactivateAttendanceSession,
    refetch
  } = useAttendance(classData.id, session.teacher_id, new Date().toISOString().split('T')[0]);

  // URL pour le scan QR (pourrait être une page dédiée dans votre app)
  const scanUrl = `${window.location.origin}/attendance/${session.session_code}`;

  useEffect(() => {
    // Générer le QR code
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
    
    // Rafraîchir les données toutes les 10 secondes pour voir les nouveaux étudiants
    const interval = setInterval(() => {
      refetch();
    }, 10000);

    return () => clearInterval(interval);
  }, [scanUrl, refetch]);

  useEffect(() => {
    // Mettre à jour le temps restant
    const updateTimeRemaining = () => {
      const now = new Date();
      const expires = new Date(session.expires_at);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expiré');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [session.expires_at]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(session.session_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Code copié",
        description: "Le code de session a été copié dans le presse-papiers",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le code",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(scanUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast({
        title: "Lien copié !",
        description: "Le lien de la session a été copié dans le presse-papiers.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive",
      });
    }
  };

  const handleCloseSession = async () => {
    await deactivateAttendanceSession(session.id);
    onBack();
  };

  const presentStudents = attendance.filter(a => a.status === 'present');
  const qrScannedStudents = attendance.filter(a => a.method === 'qr_scan' && a.status === 'present');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Présence par QR Code - {classData.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Les étudiants peuvent scanner ce code pour marquer leur présence
                </p>
              </div>
            </div>
            <Button variant="destructive" onClick={handleCloseSession}>
              Fermer la session
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Expire dans: {timeRemaining}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {presentStudents.length} présents
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <QrCode className="h-3 w-3" />
              {qrScannedStudents.length} via QR
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Display */}
        <Card>
          <CardHeader>
            <CardTitle>Code QR de présence</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {qrCodeUrl && (
              <div className="flex justify-center">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code de présence" 
                  className="border rounded-lg shadow-sm"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Code de session:</p>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="text-lg font-mono px-4 py-2">
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
                  {copied ? 'Copié' : 'Copier'}
                </Button>
              </div>
            </div>

            {/* Actions dropdown */}
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
                    {linkCopied ? "Lien copié !" : "Copier le lien de la session"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Instructions pour les étudiants:</p>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="mb-2"><strong>Option 1 - QR Code:</strong></p>
                <ol className="text-left list-decimal list-inside space-y-1 ml-2">
                  <li>Scannez le QR code avec votre téléphone</li>
                  <li>Authentifiez-vous avec votre email</li>
                  <li>Votre présence sera automatiquement marquée</li>
                </ol>
                
                <p className="mb-2 mt-3"><strong>Option 2 - Lien direct:</strong></p>
                <ol className="text-left list-decimal list-inside space-y-1 ml-2">
                  <li>Utilisez le lien partagé par le professeur</li>
                  <li>Saisissez le code de session: <span className="font-mono bg-background px-1 rounded">{session.session_code}</span></li>
                  <li>Authentifiez-vous avec votre email</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Attendance Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Présences en temps réel</CardTitle>
          </CardHeader>
          <CardContent>
            {presentStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Aucune présence marquée pour le moment</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {presentStudents.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">
                        {record.students?.firstname} {record.students?.lastname}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={record.method === 'qr_scan' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {record.method === 'qr_scan' ? (
                          <>
                            <QrCode className="h-3 w-3 mr-1" />
                            QR Scan
                          </>
                        ) : (
                          'Manuel'
                        )}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(record.marked_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
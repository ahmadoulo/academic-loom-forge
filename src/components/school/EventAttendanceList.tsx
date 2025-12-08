import { useState, useEffect } from "react";
import { useEventAttendance } from "@/hooks/useEventAttendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  Search, 
  Trash2, 
  Download,
  CalendarDays,
  User,
  Mail,
  MapPin,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { exportEventAttendanceToPdf } from "@/utils/eventAttendancePdfExport";
import { imageUrlToBase64 } from "@/utils/imageToBase64";
import { useToast } from "@/hooks/use-toast";

interface EventAttendanceListProps {
  event: {
    id: string;
    title: string;
    start_at: string;
    end_at: string;
    location?: string | null;
  };
  schoolId: string;
  onBack: () => void;
}

export function EventAttendanceList({ event, schoolId, onBack }: EventAttendanceListProps) {
  const { attendance, loading, deleteAttendance } = useEventAttendance(event.id, schoolId);
  const [searchTerm, setSearchTerm] = useState("");
  const [schoolInfo, setSchoolInfo] = useState<{ name: string; logo_url: string | null } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadSchoolInfo = async () => {
      const { data } = await supabase.from('schools').select('name, logo_url').eq('id', schoolId).single();
      if (data) setSchoolInfo(data);
    };
    loadSchoolInfo();
  }, [schoolId]);

  const filteredAttendance = attendance.filter(record => 
    record.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.participant_email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExportPDF = async () => {
    if (!schoolInfo) return;
    
    setIsExporting(true);
    try {
      let logoBase64: string | undefined;
      if (schoolInfo.logo_url) {
        try {
          logoBase64 = await imageUrlToBase64(schoolInfo.logo_url);
        } catch (error) {
          console.error('Error loading logo:', error);
        }
      }

      await exportEventAttendanceToPdf({
        schoolName: schoolInfo.name,
        schoolLogoBase64: logoBase64,
        eventTitle: event.title,
        eventDate: event.start_at,
        eventEndDate: event.end_at,
        eventLocation: event.location,
        attendance: attendance.map(record => ({
          id: record.id,
          participant_name: record.participant_name,
          participant_email: record.participant_email,
          participant_phone: record.participant_phone,
          marked_at: record.marked_at
        }))
      });

      toast({
        title: "Export réussi",
        description: "Le PDF a été téléchargé avec succès.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{event.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <CalendarDays className="h-4 w-4" />
              <span>{format(new Date(event.start_at), "d MMMM yyyy à HH:mm", { locale: fr })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-base px-4 py-2">
            <Users className="h-4 w-4 mr-2" />
            {attendance.length} présent{attendance.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Liste des présences
              </CardTitle>
              <CardDescription className="mt-1">
                Étudiants ayant marqué leur présence via QR code
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {attendance.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportPDF}
                  disabled={isExporting || !schoolInfo}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isExporting ? "Export..." : "Exporter PDF"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">
                {searchTerm ? "Aucun résultat trouvé" : "Aucune présence enregistrée"}
              </p>
              <p className="text-sm mt-1">
                {searchTerm 
                  ? "Essayez avec d'autres termes de recherche" 
                  : "Les étudiants peuvent scanner le QR code pour marquer leur présence"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Nom</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Marqué à</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record, index) => (
                    <TableRow 
                      key={record.id}
                      className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{record.participant_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.participant_email ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{record.participant_email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(record.marked_at), "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cette présence ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer la présence de {record.participant_name} ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteAttendance(record.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Download,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  FileText
} from "lucide-react";
import { useAttendance } from "@/hooks/useAttendance";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from 'jspdf';

interface AttendanceHistoryProps {
  classData: {
    id: string;
    name: string;
  };
  students: Array<{
    id: string;
    firstname: string;
    lastname: string;
  }>;
  teacherId: string;
  onBack: () => void;
}

export const AttendanceHistory = ({ 
  classData, 
  students, 
  teacherId, 
  onBack 
}: AttendanceHistoryProps) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const { attendance, loading } = useAttendance(classData.id, teacherId);

  // Filtrer les présences par mois sélectionné
  const filteredAttendance = attendance.filter(record => {
    const recordMonth = record.date.slice(0, 7);
    return recordMonth === selectedMonth;
  });

  // Grouper par date
  const attendanceByDate = filteredAttendance.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, typeof attendance>);

  const exportToPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    let y = margin;
    
    // Titre
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('Rapport de Présence', pageWidth / 2, y, { align: 'center' });
    y += 20;
    
    // Informations générales
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Classe: ${classData.name}`, margin, y);
    y += 10;
    pdf.text(`Période: ${format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: fr })}`, margin, y);
    y += 10;
    pdf.text(`Total étudiants: ${students.length}`, margin, y);
    y += 20;
    
    // Statistiques par date
    Object.entries(attendanceByDate).sort().forEach(([date, records]) => {
      if (y > 250) {
        pdf.addPage();
        y = margin;
      }
      
      const presentCount = records.filter(r => r.status === 'present').length;
      const absentCount = students.length - presentCount;
      const attendanceRate = ((presentCount / students.length) * 100).toFixed(1);
      
      pdf.setFont(undefined, 'bold');
      pdf.text(`${format(new Date(date), 'dd/MM/yyyy', { locale: fr })}`, margin, y);
      y += 8;
      
      pdf.setFont(undefined, 'normal');
      pdf.text(`Présents: ${presentCount} | Absents: ${absentCount} | Taux: ${attendanceRate}%`, margin + 10, y);
      y += 15;
      
      // Liste des étudiants pour cette date
      students.forEach(student => {
        if (y > 270) {
          pdf.addPage();
          y = margin;
        }
        
        const studentRecord = records.find(r => r.student_id === student.id);
        const status = studentRecord?.status || 'absent';
        const method = studentRecord?.method ? ` (${studentRecord.method === 'qr_scan' ? 'QR' : 'Manuel'})` : '';
        
        pdf.text(`  • ${student.firstname} ${student.lastname}: ${status === 'present' ? 'Présent' : 'Absent'}${method}`, margin + 20, y);
        y += 6;
      });
      
      y += 10;
    });
    
    // Résumé global
    if (y > 200) {
      pdf.addPage();
      y = margin;
    }
    
    pdf.setFont(undefined, 'bold');
    pdf.text('Résumé Global', margin, y);
    y += 15;
    
    const totalSessions = Object.keys(attendanceByDate).length;
    const totalPresentRecords = filteredAttendance.filter(r => r.status === 'present').length;
    const totalPossibleRecords = totalSessions * students.length;
    const globalRate = totalPossibleRecords > 0 ? ((totalPresentRecords / totalPossibleRecords) * 100).toFixed(1) : '0';
    
    pdf.setFont(undefined, 'normal');
    pdf.text(`Nombre de sessions: ${totalSessions}`, margin, y);
    y += 8;
    pdf.text(`Taux de présence global: ${globalRate}%`, margin, y);
    y += 8;
    pdf.text(`Total présences enregistrées: ${totalPresentRecords}`, margin, y);
    
    // Sauvegarder
    const fileName = `presence_${classData.name}_${selectedMonth}.pdf`;
    pdf.save(fileName);
  };

  const dates = Object.keys(attendanceByDate).sort().reverse();

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
                  <FileText className="h-5 w-5 text-primary" />
                  Historique des Présences - {classData.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Consultez et exportez l'historique des présences
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="month">Mois:</Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-auto"
                />
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {dates.length} sessions
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {students.length} étudiants
              </Badge>
            </div>
            <Button onClick={exportToPDF} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique par Date</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : dates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune présence enregistrée pour cette période</p>
            </div>
          ) : (
            <div className="space-y-6">
              {dates.map((date, index) => {
                const dayAttendance = attendanceByDate[date];
                const presentCount = dayAttendance.filter(r => r.status === 'present').length;
                const absentCount = students.length - presentCount;
                const attendanceRate = ((presentCount / students.length) * 100).toFixed(1);
                
                return (
                  <div key={date}>
                    <div className="space-y-4">
                      {/* Date Header */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="font-semibold">
                              {format(new Date(date), 'EEEE dd MMMM yyyy', { locale: fr })}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Taux de présence: {attendanceRate}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {presentCount} présents
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-600" />
                            {absentCount} absents
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Students List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-8">
                        {students.map(student => {
                          const studentRecord = dayAttendance.find(r => r.student_id === student.id);
                          const isPresent = studentRecord?.status === 'present';
                          const method = studentRecord?.method;
                          
                          return (
                            <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <span className="font-medium">
                                {student.firstname} {student.lastname}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={isPresent ? "default" : "secondary"}
                                  className={isPresent ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                >
                                  {isPresent ? 'Présent' : 'Absent'}
                                </Badge>
                                {method === 'qr_scan' && (
                                  <Badge variant="outline" className="text-xs">
                                    QR
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {index < dates.length - 1 && <Separator className="my-6" />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
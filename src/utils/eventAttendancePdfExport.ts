import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface AttendanceRecord {
  id: string;
  participant_name: string;
  participant_email?: string | null;
  participant_phone?: string | null;
  marked_at: string;
}

export interface EventAttendanceExportData {
  schoolName: string;
  schoolLogoBase64?: string;
  eventTitle: string;
  eventDate: string;
  eventEndDate: string;
  eventLocation?: string | null;
  attendance: AttendanceRecord[];
}

export const exportEventAttendanceToPdf = async (data: EventAttendanceExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  let yPosition = 20;

  // Colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
  const headerBgColor: [number, number, number] = [241, 245, 249]; // Light gray
  const accentColor: [number, number, number] = [124, 58, 237]; // Purple

  // ========== HEADER SECTION ==========
  // School logo (centered)
  if (data.schoolLogoBase64) {
    try {
      const logoWidth = 40;
      const logoHeight = 40;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(data.schoolLogoBase64, 'PNG', logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 10;
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }

  // School name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(data.schoolName.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('FEUILLE DE PRÉSENCE', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Decorative line
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(2);
  doc.line(pageWidth / 2 - 40, yPosition, pageWidth / 2 + 40, yPosition);
  yPosition += 15;

  // ========== EVENT INFO CARD ==========
  const cardStartY = yPosition;
  const cardHeight = 50;
  
  // Card background
  doc.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
  doc.roundedRect(margin, cardStartY, pageWidth - margin * 2, cardHeight, 3, 3, 'F');
  
  // Card accent border
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(3);
  doc.line(margin, cardStartY, margin, cardStartY + cardHeight);

  yPosition = cardStartY + 12;
  
  // Event title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(data.eventTitle, margin + 10, yPosition);
  yPosition += 10;

  // Event date
  const startDate = new Date(data.eventDate);
  const endDate = new Date(data.eventEndDate);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  const dateText = `📅 ${format(startDate, "EEEE d MMMM yyyy", { locale: fr })} de ${format(startDate, "HH:mm")} à ${format(endDate, "HH:mm")}`;
  doc.text(dateText, margin + 10, yPosition);
  yPosition += 8;

  // Location if available
  if (data.eventLocation) {
    doc.text(`📍 ${data.eventLocation}`, margin + 10, yPosition);
    yPosition += 8;
  }

  // Total attendance count
  const countBadgeX = pageWidth - margin - 50;
  const countBadgeY = cardStartY + 20;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(countBadgeX, countBadgeY, 40, 18, 3, 3, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`${data.attendance.length} présent${data.attendance.length > 1 ? 's' : ''}`, countBadgeX + 20, countBadgeY + 12, { align: 'center' });

  yPosition = cardStartY + cardHeight + 15;

  // ========== ATTENDANCE TABLE ==========
  if (data.attendance.length === 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Aucune présence enregistrée pour cet événement.', pageWidth / 2, yPosition + 20, { align: 'center' });
  } else {
    // Sort by marked time
    const sortedAttendance = [...data.attendance].sort(
      (a, b) => new Date(a.marked_at).getTime() - new Date(b.marked_at).getTime()
    );

    const tableData = sortedAttendance.map((record, index) => [
      (index + 1).toString(),
      record.participant_name,
      record.participant_email || '-',
      format(new Date(record.marked_at), "HH:mm", { locale: fr })
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['N°', 'Nom & Prénom', 'Email', 'Heure']],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 11,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { fontStyle: 'bold' },
        2: { textColor: [100, 100, 100] },
        3: { halign: 'center', cellWidth: 25 },
      },
    });
  }

  // ========== FOOTER ==========
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    
    // Generation date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Généré le ${format(new Date(), "d MMMM yyyy à HH:mm", { locale: fr })}`,
      margin,
      pageHeight - 12
    );
    
    // Page number
    doc.text(
      `Page ${i}/${totalPages}`,
      pageWidth - margin,
      pageHeight - 12,
      { align: 'right' }
    );
  }

  // Save the PDF
  const fileName = `Presences_${data.eventTitle.replace(/\s+/g, '_')}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
};

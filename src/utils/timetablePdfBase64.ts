import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TimetableEntry } from "@/hooks/useTimetable";

export const generateTimetablePDFBase64 = (
  entries: TimetableEntry[],
  className: string,
  schoolName: string,
  weekStart: Date,
  schoolLogoBase64?: string,
  academicYear?: string
): string => {
  const doc = new jsPDF({ orientation: "landscape" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  let yPosition = 15;
  
  if (schoolLogoBase64) {
    try {
      const logoWidth = 30;
      const logoHeight = 30;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(schoolLogoBase64, 'PNG', logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 5;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du logo:', error);
    }
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolName, centerX, yPosition, { align: 'center' });
  yPosition += 10;
  
  doc.setFontSize(18);
  doc.text("Emploi du Temps", centerX, yPosition, { align: "center" });

  doc.setFontSize(11);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekPeriod = `Du ${format(weekStart, "dd/MM/yyyy", { locale: fr })} au ${format(weekEnd, "dd/MM/yyyy", { locale: fr })}`;
  doc.text(weekPeriod, centerX, yPosition + 8, { align: "center" });

  doc.setFontSize(13);
  doc.text(`Classe: ${className}`, centerX, yPosition + 16, { align: "center" });

  if (!schoolLogoBase64) {
    doc.setFontSize(10);
    doc.text(`École: ${schoolName}`, centerX, yPosition + 23, { align: "center" });
  }
  
  if (academicYear) {
    doc.setFontSize(10);
    doc.text(`Année universitaire: ${academicYear}`, centerX, yPosition + (schoolLogoBase64 ? 23 : 30), { align: "center" });
  }

  const sortedEntries = [...entries].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  const groupedByDay: Record<string, TimetableEntry[]> = {};
  sortedEntries.forEach((entry) => {
    const key = `${entry.day} ${entry.date}`;
    if (!groupedByDay[key]) {
      groupedByDay[key] = [];
    }
    groupedByDay[key].push(entry);
  });

  const tableData: any[] = [];
  Object.entries(groupedByDay).forEach(([dayDate, dayEntries]) => {
    dayEntries.forEach((entry, index) => {
      if (index === 0) {
        tableData.push([
          {
            content: dayDate,
            rowSpan: dayEntries.length,
            styles: {
              fillColor: [219, 234, 254],
              fontStyle: "bold",
              valign: "middle",
              halign: "center",
            },
          },
          entry.subject,
          entry.classroom,
          `${entry.startTime} - ${entry.endTime}`,
          entry.teacher,
        ]);
      } else {
        tableData.push([
          entry.subject,
          entry.classroom,
          `${entry.startTime} - ${entry.endTime}`,
          entry.teacher,
        ]);
      }
    });
  });

  const tableStartY = yPosition + (academicYear ? 33 : 28) + (schoolLogoBase64 ? 5 : 0);
  autoTable(doc, {
    head: [["Jour", "Matière", "Salle", "Horaire", "Enseignant"]],
    body: tableData,
    startY: tableStartY,
    styles: {
      fontSize: 9,
      cellPadding: 5,
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
      textColor: [50, 50, 50],
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 55, fillColor: [219, 234, 254], fontStyle: "bold", valign: "middle", halign: "center" },
      1: { cellWidth: 60 },
      2: { cellWidth: 45, halign: "center" },
      3: { cellWidth: 50, halign: "center", fillColor: [254, 249, 195], fontStyle: "bold" },
      4: { cellWidth: 55 },
    },
    margin: { top: tableStartY, left: 15, right: 15 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 60;
  doc.setFontSize(8);
  doc.text(
    `Généré le ${format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}`,
    15,
    finalY + 10
  );

  // Return base64 string
  return doc.output('datauristring').split(',')[1];
};

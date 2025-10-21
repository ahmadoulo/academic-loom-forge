import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TimetableEntry } from "@/hooks/useTimetable";

export const exportTimetableToPDF = (
  entries: TimetableEntry[],
  className: string,
  schoolName: string,
  weekStart: Date
) => {
  const doc = new jsPDF({ orientation: "landscape" });

  // En-tête
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  
  doc.setFontSize(18);
  doc.text("Emploi du Temps", centerX, 15, { align: "center" });

  doc.setFontSize(11);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekPeriod = `Du ${format(weekStart, "dd/MM/yyyy", { locale: fr })} au ${format(weekEnd, "dd/MM/yyyy", { locale: fr })}`;
  doc.text(weekPeriod, centerX, 23, { align: "center" });

  doc.setFontSize(13);
  doc.text(`Classe: ${className}`, centerX, 31, { align: "center" });

  doc.setFontSize(10);
  doc.text(`École: ${schoolName}`, centerX, 38, { align: "center" });

  // Trier les entrées par jour et heure
  const sortedEntries = [...entries].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  // Grouper les entrées par jour
  const groupedByDay: Record<string, TimetableEntry[]> = {};
  sortedEntries.forEach((entry) => {
    const key = `${entry.day} ${entry.date}`;
    if (!groupedByDay[key]) {
      groupedByDay[key] = [];
    }
    groupedByDay[key].push(entry);
  });

  // Préparer les données pour la table avec rowSpan
  const tableData: any[] = [];
  Object.entries(groupedByDay).forEach(([dayDate, dayEntries]) => {
    dayEntries.forEach((entry, index) => {
      if (index === 0) {
        tableData.push([
          { content: dayDate, rowSpan: dayEntries.length, styles: { valign: 'middle', halign: 'center' } },
          entry.subject,
          entry.classroom,
          `${entry.startTime} - ${entry.endTime}`,
          entry.teacher,
        ]);
      } else {
        tableData.push([
          "", // Cellule vide pour le jour (fusionnée via rowSpan)
          entry.subject,
          entry.classroom,
          `${entry.startTime} - ${entry.endTime}`,
          entry.teacher,
        ]);
      }
    });
  });

  // Créer la table
  autoTable(doc, {
    head: [["Jour", "Matière", "Salle", "Horaire", "Enseignant"]],
    body: tableData,
    startY: 45,
    styles: {
      fontSize: 9,
      cellPadding: 5,
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
      textColor: [50, 50, 50],
    },
    headStyles: {
      fillColor: [59, 130, 246], // Bleu moderne (blue-500)
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 55, fillColor: [219, 234, 254], fontStyle: "bold", valign: "middle", halign: "center" }, // Jour - bleu-100
      1: { cellWidth: 60 }, // Matière
      2: { cellWidth: 45, halign: "center" }, // Salle
      3: { cellWidth: 50, halign: "center", fillColor: [254, 249, 195], fontStyle: "bold" }, // Horaire - yellow-100
      4: { cellWidth: 55 }, // Enseignant
    },
    margin: { top: 45, left: 15, right: 15 },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || 60;
  doc.setFontSize(8);
  doc.text(
    `Généré le ${format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}`,
    15,
    finalY + 10
  );

  // Sauvegarder
  const filename = `emploi_du_temps_${className.replace(/\s+/g, "_")}_semaine_${format(
    weekStart,
    "yyyy_MM_dd"
  )}.pdf`;
  doc.save(filename);
};

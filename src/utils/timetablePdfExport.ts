import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TimetableEntry } from "@/hooks/useTimetable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportTimetableToPDF = (
  entries: TimetableEntry[],
  className: string,
  schoolName: string,
  weekStart: Date
) => {
  const doc = new jsPDF();

  // En-tête
  doc.setFontSize(18);
  doc.text("Emploi du Temps", 105, 20, { align: "center" });

  doc.setFontSize(12);
  const weekNumber = format(weekStart, "wo", { locale: fr });
  doc.text(`Semaine ${weekNumber}`, 105, 30, { align: "center" });

  doc.setFontSize(14);
  doc.text(`Classe: ${className}`, 105, 40, { align: "center" });

  doc.setFontSize(10);
  doc.text(`École: ${schoolName}`, 105, 50, { align: "center" });

  // Grouper les entrées par jour
  const groupedByDay: Record<string, TimetableEntry[]> = {};
  entries.forEach((entry) => {
    const key = `${entry.day} ${entry.date}`;
    if (!groupedByDay[key]) {
      groupedByDay[key] = [];
    }
    groupedByDay[key].push(entry);
  });

  // Préparer les données pour la table
  const tableData: any[] = [];
  Object.entries(groupedByDay).forEach(([dayDate, dayEntries]) => {
    dayEntries.forEach((entry, index) => {
      tableData.push([
        index === 0 ? dayDate : "", // Afficher le jour/date seulement sur la première ligne
        entry.subject,
        entry.classroom,
        `${entry.startTime}-${entry.endTime}`,
        entry.teacher,
      ]);
    });
  });

  // Créer la table
  doc.autoTable({
    head: [["Jour", "Matière", "Salle", "Horaire", "Enseignant"]],
    body: tableData,
    startY: 60,
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [135, 206, 250], // Bleu clair comme dans l'image
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 35, fillColor: [173, 216, 230] }, // Jour - bleu clair
      1: { cellWidth: 50 }, // Matière
      2: { cellWidth: 25, halign: "center" }, // Salle
      3: { cellWidth: 35, halign: "center", fillColor: [255, 255, 153] }, // Horaire - jaune
      4: { cellWidth: 45 }, // Enseignant
    },
    didParseCell: function (data) {
      // Appliquer le fond bleu pour la colonne du jour
      if (data.column.index === 0 && data.cell.raw !== "") {
        data.cell.styles.fillColor = [173, 216, 230];
        data.cell.styles.fontStyle = "bold";
      }
      // Appliquer le fond jaune pour la colonne horaire
      if (data.column.index === 3) {
        data.cell.styles.fillColor = [255, 255, 153];
      }
    },
    margin: { top: 60, left: 15, right: 15 },
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

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface TextbookEntryData {
  id: string;
  session_date: string;
  start_time?: string | null;
  end_time?: string | null;
  chapter_title?: string | null;
  lesson_content: string;
  objectives_covered?: string | null;
  homework_given?: string | null;
  homework_due_date?: string | null;
  next_session_plan?: string | null;
  resources_links?: string | null;
  observations?: string | null;
  subjects?: { name: string } | null;
  teachers?: { firstname: string; lastname: string } | null;
}

export interface TextbookExportData {
  schoolName: string;
  schoolLogoBase64?: string;
  className: string;
  textbookName: string;
  academicYear: string;
  entries: TextbookEntryData[];
  isTeacherExport?: boolean;
  teacherName?: string;
}

export const exportTextbookToPdf = async (data: TextbookExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  let yPosition = 20;

  // Colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
  const secondaryColor: [number, number, number] = [100, 116, 139]; // Slate
  const accentColor: [number, number, number] = [234, 179, 8]; // Amber

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // ========== HEADER SECTION ==========
  // School logo (centered)
  if (data.schoolLogoBase64) {
    try {
      const logoWidth = 35;
      const logoHeight = 35;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(data.schoolLogoBase64, 'PNG', logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 8;
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }

  // School name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(data.schoolName.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  // Title with decorative line
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CAHIER DE TEXTE', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;

  // Decorative underline
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  const lineWidth = 70;
  doc.line((pageWidth - lineWidth) / 2, yPosition, (pageWidth + lineWidth) / 2, yPosition);
  yPosition += 12;

  // Info box
  const boxY = yPosition;
  const boxHeight = data.isTeacherExport ? 30 : 25;
  doc.setFillColor(248, 250, 252); // Very light gray
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, boxY, pageWidth - 2 * margin, boxHeight, 3, 3, 'FD');

  yPosition = boxY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...secondaryColor);
  
  // Row 1: Class and Academic Year
  doc.text('Classe:', margin + 5, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(data.className, margin + 25, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...secondaryColor);
  doc.text('Année scolaire:', pageWidth / 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(data.academicYear, pageWidth / 2 + 40, yPosition);

  // Row 2: Teacher (if teacher export)
  if (data.isTeacherExport && data.teacherName) {
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Professeur:', margin + 5, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(data.teacherName, margin + 35, yPosition);
  }

  yPosition = boxY + boxHeight + 15;

  // ========== ENTRIES SECTION ==========
  if (data.entries.length === 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...secondaryColor);
    doc.text('Aucune entrée dans ce cahier de texte.', pageWidth / 2, yPosition, { align: 'center' });
  } else {
    // Group entries by teacher if school export, otherwise just list
    const entriesByTeacher: Record<string, TextbookEntryData[]> = {};
    
    if (data.isTeacherExport) {
      entriesByTeacher[data.teacherName || 'Professeur'] = data.entries;
    } else {
      data.entries.forEach(entry => {
        const teacherName = entry.teachers 
          ? `${entry.teachers.firstname} ${entry.teachers.lastname}` 
          : 'Non assigné';
        if (!entriesByTeacher[teacherName]) {
          entriesByTeacher[teacherName] = [];
        }
        entriesByTeacher[teacherName].push(entry);
      });
    }

    // Sort entries by date (most recent first)
    Object.values(entriesByTeacher).forEach(entries => {
      entries.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
    });

    Object.entries(entriesByTeacher).forEach(([teacherName, teacherEntries], teacherIndex) => {
      // Teacher header (only for school export with multiple teachers)
      if (!data.isTeacherExport && Object.keys(entriesByTeacher).length > 1) {
        checkPageBreak(20);
        doc.setFillColor(...primaryColor);
        doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 10, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`${teacherName} (${teacherEntries.length} entrées)`, margin + 5, yPosition + 7);
        yPosition += 15;
      }

      // Entries for this teacher
      teacherEntries.forEach((entry, entryIndex) => {
        checkPageBreak(60);

        // Entry header with date
        const formattedDate = format(new Date(entry.session_date), 'EEEE dd MMMM yyyy', { locale: fr });
        const timeInfo = entry.start_time && entry.end_time 
          ? ` • ${entry.start_time} - ${entry.end_time}` 
          : '';

        // Date badge
        doc.setFillColor(...accentColor);
        doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 2, 2, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        const dateText = `${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}${timeInfo}`;
        doc.text(dateText, margin + 3, yPosition + 5.5);

        // Subject badge on the right
        if (entry.subjects?.name) {
          doc.setFontSize(9);
          const subjectText = entry.subjects.name;
          const subjectWidth = doc.getTextWidth(subjectText) + 8;
          doc.setFillColor(...primaryColor);
          doc.roundedRect(pageWidth - margin - subjectWidth - 5, yPosition + 0.5, subjectWidth + 4, 7, 1, 1, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text(subjectText, pageWidth - margin - subjectWidth - 3, yPosition + 5.5);
        }

        yPosition += 12;

        // Entry content using table for better formatting
        const tableData: any[][] = [];

        // Chapter title
        if (entry.chapter_title) {
          tableData.push([{ content: 'Chapitre / Thème', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, entry.chapter_title]);
        }

        // Lesson content (main)
        tableData.push([{ content: 'Contenu de la séance', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, entry.lesson_content]);

        // Objectives
        if (entry.objectives_covered) {
          tableData.push([{ content: 'Objectifs couverts', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, entry.objectives_covered]);
        }

        // Homework
        if (entry.homework_given) {
          const homeworkText = entry.homework_due_date 
            ? `${entry.homework_given}\n(À rendre le ${format(new Date(entry.homework_due_date), 'dd/MM/yyyy')})`
            : entry.homework_given;
          tableData.push([{ content: 'Devoirs donnés', styles: { fontStyle: 'bold', fillColor: [254, 249, 195] } }, homeworkText]);
        }

        // Next session plan
        if (entry.next_session_plan) {
          tableData.push([{ content: 'Prochaine séance', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, entry.next_session_plan]);
        }

        // Resources
        if (entry.resources_links) {
          tableData.push([{ content: 'Ressources', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, entry.resources_links]);
        }

        // Observations
        if (entry.observations) {
          tableData.push([{ content: 'Observations', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, entry.observations]);
        }

        autoTable(doc, {
          body: tableData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          theme: 'plain',
          styles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [226, 232, 240],
            lineWidth: 0.3,
          },
          columnStyles: {
            0: { cellWidth: 40, halign: 'left', valign: 'top' },
            1: { cellWidth: 'auto', halign: 'left', valign: 'top' },
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      });

      // Add space between teachers
      if (!data.isTeacherExport && teacherIndex < Object.keys(entriesByTeacher).length - 1) {
        yPosition += 5;
      }
    });
  }

  // ========== FOOTER ==========
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(...secondaryColor);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);
    doc.text(data.schoolName, margin, pageHeight - 14);
    doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, pageHeight - 14, { align: 'center' });
    doc.text(`Page ${i}/${totalPages}`, pageWidth - margin, pageHeight - 14, { align: 'right' });
  }

  // Save the PDF
  const fileName = data.isTeacherExport
    ? `Cahier_Texte_${data.className}_${data.teacherName?.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
    : `Cahier_Texte_${data.className}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  
  doc.save(fileName);
  return true;
};

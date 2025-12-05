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
  const successColor: [number, number, number] = [34, 197, 94]; // Green

  // Track teacher page positions for TOC links
  const teacherPositions: Record<string, { page: number; y: number }> = {};

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Group entries by teacher first to know the structure
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

  // Sort entries by date (most recent first) for each teacher
  Object.values(entriesByTeacher).forEach(entries => {
    entries.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
  });

  const teacherNames = Object.keys(entriesByTeacher).sort();
  const hasMultipleTeachers = !data.isTeacherExport && teacherNames.length > 1;

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
  doc.setFillColor(248, 250, 252);
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

  // ========== TABLE OF CONTENTS (for school export with multiple teachers) ==========
  if (hasMultipleTeachers) {
    // Section title
    doc.setFillColor(...primaryColor);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 10, 2, 2, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('SOMMAIRE - ENSEIGNANTS', pageWidth / 2, yPosition + 7, { align: 'center' });
    yPosition += 18;

    // Store TOC position for later linking
    const tocStartY = yPosition;
    const tocItems: { name: string; entries: number; y: number }[] = [];

    teacherNames.forEach((teacherName, index) => {
      const entriesCount = entriesByTeacher[teacherName].length;
      tocItems.push({ name: teacherName, entries: entriesCount, y: yPosition });
      
      // Teacher row with clickable area styling
      doc.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255);
      doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 10, 'F');
      
      // Number badge
      doc.setFillColor(...successColor);
      doc.circle(margin + 8, yPosition + 1, 4, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(String(index + 1), margin + 8, yPosition + 2.5, { align: 'center' });
      
      // Teacher name (will be clickable)
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(teacherName, margin + 18, yPosition + 2);
      
      // Entries count
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(10);
      const entriesText = `${entriesCount} entrée${entriesCount > 1 ? 's' : ''}`;
      doc.text(entriesText, pageWidth - margin - 5, yPosition + 2, { align: 'right' });
      
      // Dotted line
      doc.setDrawColor(200, 200, 200);
      doc.setLineDashPattern([1, 1], 0);
      const nameWidth = doc.getTextWidth(teacherName);
      const entriesWidth = doc.getTextWidth(entriesText);
      doc.line(margin + 18 + nameWidth + 5, yPosition + 2, pageWidth - margin - entriesWidth - 10, yPosition + 2);
      doc.setLineDashPattern([], 0);
      
      yPosition += 12;
    });

    yPosition += 10;

    // Instruction text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...secondaryColor);
    doc.text('Cliquez sur un nom pour accéder directement à la section du professeur', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
  }

  // ========== ENTRIES SECTION ==========
  if (data.entries.length === 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...secondaryColor);
    doc.text('Aucune entrée dans ce cahier de texte.', pageWidth / 2, yPosition, { align: 'center' });
  } else {
    teacherNames.forEach((teacherName, teacherIndex) => {
      const teacherEntries = entriesByTeacher[teacherName];
      
      // Teacher section header
      checkPageBreak(30);
      
      // Store position for TOC link
      teacherPositions[teacherName] = { page: doc.getNumberOfPages(), y: yPosition };
      
      // Create a named destination for this teacher
      const destinationName = `teacher_${teacherIndex}`;
      
      if (hasMultipleTeachers) {
        // Teacher header banner
        doc.setFillColor(...primaryColor);
        doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 14, 3, 3, 'F');
        
        // Teacher number badge
        doc.setFillColor(255, 255, 255);
        doc.circle(margin + 10, yPosition + 7, 5, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(String(teacherIndex + 1), margin + 10, yPosition + 8.5, { align: 'center' });
        
        // Teacher name
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(teacherName.toUpperCase(), margin + 22, yPosition + 9.5);
        
        // Entries count badge
        doc.setFillColor(...accentColor);
        const countText = `${teacherEntries.length} entrée${teacherEntries.length > 1 ? 's' : ''}`;
        const countWidth = doc.getTextWidth(countText) + 10;
        doc.roundedRect(pageWidth - margin - countWidth - 5, yPosition + 3, countWidth, 8, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(countText, pageWidth - margin - countWidth / 2 - 5, yPosition + 8.5, { align: 'center' });
        
        yPosition += 20;
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

        // Entry content using table
        const tableData: any[][] = [];

        if (entry.chapter_title) {
          tableData.push([{ content: 'Chapitre / Thème', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, entry.chapter_title]);
        }

        tableData.push([{ content: 'Contenu de la séance', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, entry.lesson_content]);

        if (entry.objectives_covered) {
          tableData.push([{ content: 'Objectifs couverts', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, entry.objectives_covered]);
        }

        if (entry.homework_given) {
          const homeworkText = entry.homework_due_date 
            ? `${entry.homework_given}\n(À rendre le ${format(new Date(entry.homework_due_date), 'dd/MM/yyyy')})`
            : entry.homework_given;
          tableData.push([{ content: 'Devoirs donnés', styles: { fontStyle: 'bold', fillColor: [254, 249, 195] } }, homeworkText]);
        }

        if (entry.next_session_plan) {
          tableData.push([{ content: 'Prochaine séance', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, entry.next_session_plan]);
        }

        if (entry.resources_links) {
          tableData.push([{ content: 'Ressources', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, entry.resources_links]);
        }

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

      // Separator between teachers
      if (hasMultipleTeachers && teacherIndex < teacherNames.length - 1) {
        checkPageBreak(20);
        doc.setDrawColor(...secondaryColor);
        doc.setLineWidth(0.5);
        doc.setLineDashPattern([3, 3], 0);
        doc.line(margin + 20, yPosition, pageWidth - margin - 20, yPosition);
        doc.setLineDashPattern([], 0);
        yPosition += 15;
      }
    });
  }

  // ========== ADD INTERNAL LINKS TO TOC ==========
  if (hasMultipleTeachers) {
    // Go back to page 1 to add links
    doc.setPage(1);
    
    // Calculate TOC start position (after header)
    let tocY = data.schoolLogoBase64 ? 35 + 8 + 12 + 22 + 5 + 12 + 25 + 15 + 18 : 20 + 12 + 22 + 5 + 12 + 25 + 15 + 18;
    
    teacherNames.forEach((teacherName, index) => {
      const targetPos = teacherPositions[teacherName];
      if (targetPos) {
        // Add link area
        doc.link(margin, tocY - 4, pageWidth - 2 * margin, 10, { pageNumber: targetPos.page });
      }
      tocY += 12;
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

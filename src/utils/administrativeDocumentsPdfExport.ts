import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface MissingDocumentExportData {
  schoolName: string;
  schoolLogoBase64?: string;
  academicYear: string;
  className: string; // "Toutes les classes" or specific class name
  students: {
    fullName: string;
    className: string;
    cycleName?: string;
    missingDocuments: string[];
  }[];
  generatedAt: Date;
}

export const exportMissingDocumentsToPdf = async (data: MissingDocumentExportData): Promise<boolean> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  let yPosition = 20;

  // Colors - matching the textbook export style
  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
  const secondaryColor: [number, number, number] = [100, 116, 139]; // Slate
  const dangerColor: [number, number, number] = [220, 38, 38]; // Red for missing docs
  const warningColor: [number, number, number] = [234, 179, 8]; // Amber

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
  yPosition += 8;

  // Academic year badge
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  doc.text(`Année scolaire ${data.academicYear}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Title with decorative line
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dangerColor);
  doc.text('DOSSIER ADMINISTRATIF MANQUANT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;

  // Decorative underline
  doc.setDrawColor(...dangerColor);
  doc.setLineWidth(1.5);
  const lineWidth = 100;
  doc.line((pageWidth - lineWidth) / 2, yPosition, (pageWidth + lineWidth) / 2, yPosition);
  yPosition += 12;

  // Class info box
  const boxHeight = 20;
  doc.setFillColor(254, 242, 242); // Light red background
  doc.setDrawColor(...dangerColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, boxHeight, 3, 3, 'FD');

  yPosition += 12;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...secondaryColor);
  doc.text('Classe:', margin + 5, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(data.className, margin + 25, yPosition);

  // Student count
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...secondaryColor);
  doc.text('Étudiants concernés:', pageWidth / 2, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...dangerColor);
  doc.text(String(data.students.length), pageWidth / 2 + 52, yPosition);

  yPosition += boxHeight - 5;

  // ========== STUDENTS TABLE ==========
  if (data.students.length === 0) {
    yPosition += 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(34, 197, 94); // Green
    doc.text('✓ Aucun document manquant - Tous les dossiers sont complets !', pageWidth / 2, yPosition, { align: 'center' });
  } else {
    // Group students by class for better organization
    const studentsByClass: Record<string, typeof data.students> = {};
    data.students.forEach(student => {
      const key = student.className;
      if (!studentsByClass[key]) {
        studentsByClass[key] = [];
      }
      studentsByClass[key].push(student);
    });

    const classNames = Object.keys(studentsByClass).sort();

    classNames.forEach((className, classIndex) => {
      const classStudents = studentsByClass[className];
      
      // Class header (only if showing all classes)
      if (classNames.length > 1) {
        yPosition += 10;
        
        // Check page break
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }

        // Class section header
        doc.setFillColor(...primaryColor);
        doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 10, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(className.toUpperCase(), pageWidth / 2, yPosition + 7, { align: 'center' });
        
        // Student count badge
        doc.setFillColor(...warningColor);
        const countText = `${classStudents.length} étudiant${classStudents.length > 1 ? 's' : ''}`;
        const countWidth = doc.getTextWidth(countText) + 10;
        doc.roundedRect(pageWidth - margin - countWidth - 5, yPosition + 1, countWidth, 8, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(countText, pageWidth - margin - countWidth / 2 - 5, yPosition + 6.5, { align: 'center' });

        yPosition += 15;
      }

      // Prepare table data
      const tableData = classStudents.map((student, index) => [
        String(index + 1),
        student.fullName,
        classNames.length === 1 ? '' : student.className,
        student.missingDocuments.join('\n• ') ? '• ' + student.missingDocuments.join('\n• ') : '-'
      ]);

      // Filter out empty class column if single class
      const tableColumns = classNames.length === 1
        ? ['#', 'Étudiant', 'Documents Manquants']
        : ['#', 'Étudiant', 'Classe', 'Documents Manquants'];

      const columnStyles = classNames.length === 1
        ? {
            0: { cellWidth: 12, halign: 'center' as const },
            1: { cellWidth: 55, halign: 'left' as const },
            2: { cellWidth: 'auto' as const, halign: 'left' as const }
          }
        : {
            0: { cellWidth: 12, halign: 'center' as const },
            1: { cellWidth: 45, halign: 'left' as const },
            2: { cellWidth: 35, halign: 'left' as const },
            3: { cellWidth: 'auto' as const, halign: 'left' as const }
          };

      const filteredData = classNames.length === 1
        ? tableData.map(row => [row[0], row[1], row[3]])
        : tableData;

      autoTable(doc, {
        head: [tableColumns],
        body: filteredData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: columnStyles,
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didDrawCell: (data) => {
          // Style missing documents column in red
          const docColIndex = classNames.length === 1 ? 2 : 3;
          if (data.section === 'body' && data.column.index === docColIndex) {
            doc.setTextColor(...dangerColor);
          }
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 5;
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
    doc.text(
      `Généré le ${format(data.generatedAt, 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
      pageWidth / 2,
      pageHeight - 14,
      { align: 'center' }
    );
    doc.text(`Page ${i}/${totalPages}`, pageWidth - margin, pageHeight - 14, { align: 'right' });
  }

  // Save the PDF
  const classSlug = data.className.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const fileName = `Dossiers_Administratifs_Manquants_${classSlug}_${format(data.generatedAt, 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);

  return true;
};

import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface StudentExportData {
  firstname: string;
  lastname: string;
  email?: string;
  cin_number?: string;
  student_phone?: string;
  parent_phone?: string;
}

export const exportStudentsToPDF = (
  students: StudentExportData[],
  className: string,
  schoolName: string
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(`Liste des Étudiants - ${className}`, 20, 30);
  
  // Add school name
  doc.setFontSize(14);
  doc.text(`École: ${schoolName}`, 20, 45);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 55);
  
  // Prepare table data
  const tableData = students.map(student => [
    `${student.firstname} ${student.lastname}`,
    student.email || 'N/A',
    student.cin_number || 'N/A',
    student.student_phone || 'N/A',
    student.parent_phone || 'N/A'
  ]);
  
  // Add table
  doc.autoTable({
    head: [['Nom Complet', 'Email', 'CIN', 'Tél. Étudiant', 'Tél. Parent']],
    body: tableData,
    startY: 70,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [63, 81, 181], // Primary color
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 70, left: 20, right: 20 }
  });
  
  // Add footer
  const finalY = (doc as any).lastAutoTable.finalY || 70;
  doc.setFontSize(8);
  doc.text(
    `Total: ${students.length} étudiant${students.length > 1 ? 's' : ''}`,
    20,
    finalY + 20
  );
  
  // Save the PDF
  const filename = `liste_etudiants_${className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
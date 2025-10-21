import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CurrentStudentData {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  cin_number?: string;
  class_id: string;
  school_id: string;
  classes?: {
    id?: string;
    name: string;
  };
  schools?: {
    name: string;
  };
}

interface SubjectGrade {
  subjectId: string;
  subjectName: string;
  grades: any[];
  average?: number;
  hasGrades: boolean;
}

export const generateStudentBulletin = (
  student: CurrentStudentData,
  subjectGrades: SubjectGrade[],
  overallAverage: number
) => {
  try {
    const doc = new jsPDF();
    
    // Configuration de base
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;
    
    // Header - Logo et informations école
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(student.schools?.name || 'ÉCOLE', pageWidth / 2, yPosition, { align: 'center' });
    
    // Titre du bulletin
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    yPosition += 10;
    doc.text('Bulletin de notes', pageWidth / 2, yPosition, { align: 'center' });
    
    // Année universitaire
    yPosition += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const currentYear = new Date().getFullYear();
    doc.text(`Année universitaire : ${currentYear}-${currentYear + 1}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    
    // Informations de l'étudiant en deux colonnes
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    // Colonne gauche
    const leftCol = 15;
    const rightCol = pageWidth / 2 + 10;
    
    doc.text('Nom et Prénom :', leftCol, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${student.firstname} ${student.lastname}`, leftCol + 35, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Cycle :', rightCol, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text('Licence - Bac+3', rightCol + 20, yPosition);
    
    yPosition += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('CIN/Passeport :', leftCol, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(student.cin_number || 'N/A', leftCol + 35, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Filière :', rightCol, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(student.classes?.name || 'N/A', rightCol + 20, yPosition);
    
    yPosition += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('CNE :', leftCol, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(student.email?.split('@')[0] || 'N/A', leftCol + 35, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Option :', rightCol, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text('-', rightCol + 20, yPosition);
    
    yPosition += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text("Date d'édition :", leftCol, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('fr-FR'), leftCol + 35, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Niveau :', rightCol, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text('Deuxième année', rightCol + 20, yPosition);
    
    yPosition += 15;
    
    // Tableau des notes
    const semester = new Date().getMonth() > 6 ? 1 : 2;
    const tableHeaders = ['Code', 'Intitulé Module', 'Note/20', 'V*', 'Rang', 'Session', 'VH'];
    const tableData: any[][] = [];
    
    subjectGrades.forEach((subject, index) => {
      const code = `MOD.S${semester}.${(index + 1).toString().padStart(2, '0')}`;
      const validation = subject.hasGrades && subject.average && subject.average >= 10 ? 'V' : 'NV';
      const note = subject.hasGrades && subject.average ? subject.average.toFixed(2) : '-';
      
      tableData.push([
        code,
        subject.subjectName,
        note,
        validation,
        '-',
        'S1',
        '50'
      ]);
    });
    
    // Génération du tableau avec jsPDF-AutoTable
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        halign: 'center',
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Code
        1: { cellWidth: 80, halign: 'left' }, // Intitulé Module
        2: { cellWidth: 20 }, // Note
        3: { cellWidth: 15 }, // Validation
        4: { cellWidth: 15 }, // Rang
        5: { cellWidth: 20 }, // Session
        6: { cellWidth: 15 }, // VH
      },
    });
    
    // Position après le tableau
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    // Moyenne du semestre
    if (overallAverage > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Moyenne du Semestre ${semester} : ${overallAverage.toFixed(2)}/20`, leftCol, yPosition);
      yPosition += 8;
    }
    
    // Légende
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('* : V-Validé, NV-Non Validé, VC-Validé par Compensation, VR-Validé après Rattrapage', leftCol, yPosition);
    
    yPosition += 15;
    
    // Signature
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Signature du directeur pédagogique :', leftCol, yPosition);
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, leftCol, yPosition);
    
    // Footer
    const footerY = doc.internal.pageSize.height - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(student.schools?.name || 'École', pageWidth / 2, footerY, { align: 'center' });
    doc.text('Système de gestion scolaire Eduvate', pageWidth / 2, footerY + 4, { align: 'center' });
    
    // Télécharger le PDF
    const fileName = `Bulletin_${student.firstname}_${student.lastname}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Erreur dans generateStudentBulletin:', error);
    throw error;
  }
};
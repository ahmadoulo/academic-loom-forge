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

// Fonction pour générer le contenu du bulletin dans un document existant
export const generateStudentBulletinInDoc = (
  doc: jsPDF,
  student: CurrentStudentData,
  subjectGrades: SubjectGrade[],
  overallAverage: number
) => {
    
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
    
    // Informations de l'étudiant
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    const leftCol = 15;
    const rightCol = pageWidth / 2 + 10;
    
    doc.text('Nom et Prénom :', leftCol, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${student.firstname} ${student.lastname}`, leftCol + 35, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Classe :', rightCol, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(student.classes?.name || 'N/A', rightCol + 20, yPosition);
    
    yPosition += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('CIN/Passeport :', leftCol, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(student.cin_number || 'N/A', leftCol + 35, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text("Date d'édition :", rightCol, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('fr-FR'), rightCol + 20, yPosition);
    
    yPosition += 15;
    
    // Tableau des notes
    const tableHeaders = ['Matière', 'Note/20', 'Validation'];
    const tableData: any[][] = [];
    
    subjectGrades.forEach((subject) => {
      const validation = subject.hasGrades && subject.average && subject.average >= 10 ? 'Validé' : 'Non Validé';
      const note = subject.hasGrades && subject.average ? subject.average.toFixed(2) : '-';
      
      tableData.push([
        subject.subjectName,
        note,
        validation
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
        0: { cellWidth: 100, halign: 'left' }, // Matière
        1: { cellWidth: 40 }, // Note
        2: { cellWidth: 40 }, // Validation
      },
    });
    
    // Position après le tableau
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    // Moyenne générale
    if (overallAverage > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Moyenne Générale : ${overallAverage.toFixed(2)}/20`, leftCol, yPosition);
      yPosition += 8;
    }
    
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
};

// Fonction principale pour générer et télécharger un bulletin individuel
export const generateStudentBulletin = (
  student: CurrentStudentData,
  subjectGrades: SubjectGrade[],
  overallAverage: number
) => {
  try {
    const doc = new jsPDF();
    generateStudentBulletinInDoc(doc, student, subjectGrades, overallAverage);
    
    const fileName = `Bulletin_${student.firstname}_${student.lastname}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Erreur dans generateStudentBulletin:', error);
    throw error;
  }
};
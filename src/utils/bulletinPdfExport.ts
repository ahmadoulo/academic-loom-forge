import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CurrentStudentData } from '@/hooks/useCurrentStudent';

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
    console.log('DEBUG: Début génération PDF');
    console.log('DEBUG: Student data:', student);
    console.log('DEBUG: Subject grades:', subjectGrades);
    console.log('DEBUG: Overall average:', overallAverage);

    const doc = new jsPDF();
    
    // Configuration de base
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;
    
    // Header - Logo et titre
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SYSTÈME DE GESTION SCOLAIRE', pageWidth / 2, yPosition, { align: 'center' });
    doc.text('EDUVATE', pageWidth / 2, yPosition + 6, { align: 'center' });
    
    // Titre du bulletin
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BULLETIN DE NOTES', pageWidth / 2, yPosition + 20, { align: 'center' });
    
    yPosition += 40;
    
    // Informations de l'étudiant
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const studentInfo = [
      `Année universitaire : ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      `Nom et Prénom : ${student.firstname} ${student.lastname}`,
      `École : ${student.schools?.name || 'N/A'}`,
      `Classe : ${student.classes?.name || 'N/A'}`,
      `CIN/Passeport : ${student.cin_number || 'N/A'}`,
      `Date d'édition : ${new Date().toLocaleDateString('fr-FR')}`
    ];
    
    studentInfo.forEach((info, index) => {
      doc.text(info, 20, yPosition + (index * 6));
    });
    
    yPosition += 45;
    
    // Tableau des notes
    const tableHeaders = ['Code', 'Intitulé Module', 'Note/20', 'Validation', 'Session', 'VH'];
    const tableData: any[][] = [];
    
    subjectGrades.forEach((subject, index) => {
      const code = `MOD.S${new Date().getMonth() > 6 ? '1' : '2'}.${(index + 1).toString().padStart(2, '0')}`;
      const validation = subject.hasGrades && subject.average && subject.average >= 10 ? 'V' : 'NV';
      const note = subject.hasGrades && subject.average ? subject.average.toFixed(2) : 'Pas encore publié';
      
      tableData.push([
        code,
        subject.subjectName,
        note,
        validation,
        'S1',
        '50'
      ]);
    });
    
    console.log('DEBUG: Table data:', tableData);
    
    // Génération du tableau avec jsPDF-AutoTable
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Code
        1: { cellWidth: 80 }, // Intitulé Module
        2: { cellWidth: 20, halign: 'center' }, // Note
        3: { cellWidth: 20, halign: 'center' }, // Validation
        4: { cellWidth: 20, halign: 'center' }, // Session
        5: { cellWidth: 15, halign: 'center' }, // VH
      },
    });
    
    // Position après le tableau
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Moyenne du semestre
    if (overallAverage > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Moyenne du Semestre : ${overallAverage.toFixed(2)}/20`, 20, yPosition);
      yPosition += 10;
    }
    
    // Légende
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('* : V-Validé, NV-Non Validé, VC-Validé par Compensation, VR-Validé après Rattrapage', 20, yPosition);
    
    yPosition += 20;
    
    // Signature
    doc.setFontSize(10);
    doc.text('Signature du directeur pédagogique', 20, yPosition);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition + 15);
    
    // Footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.text('Système de gestion scolaire Eduvate', pageWidth / 2, footerY, { align: 'center' });
    
    // Télécharger le PDF
    const fileName = `Bulletin_${student.firstname}_${student.lastname}_${new Date().toISOString().slice(0, 10)}.pdf`;
    console.log('DEBUG: Téléchargement PDF:', fileName);
    doc.save(fileName);
    
    console.log('DEBUG: PDF généré avec succès');
    return true;
  } catch (error) {
    console.error('DEBUG: Erreur dans generateStudentBulletin:', error);
    throw error;
  }
};
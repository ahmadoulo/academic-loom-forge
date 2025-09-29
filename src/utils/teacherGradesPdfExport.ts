import jsPDF from 'jspdf';

// Import jsPDF-AutoTable properly
const autoTable = require('jspdf-autotable');

interface Student {
  id: string;
  firstname: string;
  lastname: string;
}

interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  grade: number;
  grade_type: string;
  created_at: string;
  comment?: string;
}

export const generateTeacherGradesReport = (
  classData: { id: string; name: string },
  subjectData: { id: string; name: string },
  students: Student[],
  grades: Grade[]
) => {
  try {
    console.log('DEBUG: Génération PDF professeur - début');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT DES NOTES', pageWidth / 2, yPosition, { align: 'center' });
    doc.text('SYSTÈME EDUVATE', pageWidth / 2, yPosition + 6, { align: 'center' });
    
    yPosition += 30;
    
    // Informations du cours
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const courseInfo = [
      `Matière : ${subjectData.name}`,
      `Classe : ${classData.name}`,
      `Date d'édition : ${new Date().toLocaleDateString('fr-FR')}`,
      `Nombre d'étudiants : ${students.length}`
    ];
    
    courseInfo.forEach((info, index) => {
      doc.text(info, 20, yPosition + (index * 6));
    });
    
    yPosition += 35;
    
    // Préparer les données du tableau
    const tableHeaders = ['Nom', 'Prénom', 'Contrôles', 'Examens', 'Moyenne'];
    const tableData: any[][] = [];
    
    students.forEach((student) => {
      const studentGrades = grades.filter(g => g.student_id === student.id && g.subject_id === subjectData.id);
      
      const controles = studentGrades.filter(g => g.grade_type === 'controle');
      const examens = studentGrades.filter(g => g.grade_type === 'examen');
      
      const controlesText = controles.length > 0 
        ? controles.map(g => Number(g.grade).toFixed(1)).join(', ')
        : '-';
        
      const examensText = examens.length > 0 
        ? examens.map(g => Number(g.grade).toFixed(1)).join(', ')
        : '-';
      
      const moyenne = studentGrades.length > 0
        ? (studentGrades.reduce((sum, grade) => sum + Number(grade.grade), 0) / studentGrades.length).toFixed(1)
        : '-';
      
      tableData.push([
        student.lastname,
        student.firstname,
        controlesText,
        examensText,
        moyenne
      ]);
    });
    
    console.log('DEBUG: Données du tableau:', tableData);
    
    // Génération du tableau
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 10,
        cellPadding: 4,
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
        0: { cellWidth: 30 }, // Nom
        1: { cellWidth: 30 }, // Prénom
        2: { cellWidth: 40 }, // Contrôles
        3: { cellWidth: 40 }, // Examens
        4: { cellWidth: 25, halign: 'center' }, // Moyenne
      },
    });
    
    // Statistiques
    const allGrades = grades.filter(g => g.subject_id === subjectData.id);
    if (allGrades.length > 0) {
      const overallAverage = allGrades.reduce((sum, grade) => sum + Number(grade.grade), 0) / allGrades.length;
      
      yPosition = (doc as any).lastAutoTable.finalY + 20;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Moyenne générale de la classe : ${overallAverage.toFixed(2)}/20`, 20, yPosition);
      doc.text(`Nombre total de notes : ${allGrades.length}`, 20, yPosition + 8);
    }
    
    // Footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.text('Système de gestion scolaire Eduvate', pageWidth / 2, footerY, { align: 'center' });
    
    // Télécharger le PDF
    const fileName = `Notes_${subjectData.name}_${classData.name}_${new Date().toISOString().slice(0, 10)}.pdf`;
    console.log('DEBUG: Téléchargement PDF:', fileName);
    doc.save(fileName);
    
    console.log('DEBUG: PDF généré avec succès');
    return true;
  } catch (error) {
    console.error('DEBUG: Erreur génération PDF professeur:', error);
    throw error;
  }
};
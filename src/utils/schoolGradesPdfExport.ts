import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
}

interface Subject {
  id: string;
  name: string;
}

export const generateSchoolGradesReport = (
  classData: { id: string; name: string },
  students: Student[],
  grades: Grade[],
  subjects: Subject[]
) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT DES NOTES', pageWidth / 2, yPosition, { align: 'center' });
    doc.text('SYSTÈME EDUVATE', pageWidth / 2, yPosition + 6, { align: 'center' });
    
    yPosition += 30;
    
    // Informations
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const info = [
      `Classe : ${classData.name}`,
      `Date d'édition : ${new Date().toLocaleDateString('fr-FR')}`,
      `Nombre d'étudiants : ${students.length}`
    ];
    
    info.forEach((line, index) => {
      doc.text(line, 20, yPosition + (index * 6));
    });
    
    yPosition += 25;
    
    // Préparer les données du tableau
    const tableHeaders = ['Nom', 'Prénom', 'Nb Notes', 'Moyenne'];
    const tableData: any[][] = [];
    
    students.forEach((student) => {
      const studentGrades = grades.filter(g => g.student_id === student.id);
      
      const moyenne = studentGrades.length > 0
        ? (studentGrades.reduce((sum, grade) => sum + Number(grade.grade), 0) / studentGrades.length).toFixed(1)
        : '-';
      
      tableData.push([
        student.lastname,
        student.firstname,
        studentGrades.length.toString(),
        moyenne
      ]);
    });
    
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
        0: { cellWidth: 45 }, // Nom
        1: { cellWidth: 45 }, // Prénom
        2: { cellWidth: 40, halign: 'center' }, // Nb Notes
        3: { cellWidth: 40, halign: 'center' }, // Moyenne
      },
    });
    
    // Statistiques globales
    if (grades.length > 0) {
      const overallAverage = grades.reduce((sum, grade) => sum + Number(grade.grade), 0) / grades.length;
      const studentsWithGrades = students.filter(s => grades.some(g => g.student_id === s.id)).length;
      
      yPosition = (doc as any).lastAutoTable.finalY + 20;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Statistiques de la classe:`, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(`Moyenne générale : ${overallAverage.toFixed(2)}/20`, 20, yPosition + 8);
      doc.text(`Nombre total de notes : ${grades.length}`, 20, yPosition + 16);
      doc.text(`Étudiants avec notes : ${studentsWithGrades}/${students.length}`, 20, yPosition + 24);
    }
    
    // Footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.text('Système de gestion scolaire Eduvate', pageWidth / 2, footerY, { align: 'center' });
    
    // Télécharger le PDF
    const fileName = `Notes_${classData.name}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Erreur génération PDF notes école:', error);
    throw error;
  }
};
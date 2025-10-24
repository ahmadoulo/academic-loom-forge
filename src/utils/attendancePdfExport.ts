import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Student {
  id: string;
  firstname: string;
  lastname: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent';
}

export const generateSchoolAttendanceReport = (
  classData: { id: string; name: string },
  students: Student[],
  attendance: AttendanceRecord[],
  selectedDate: string,
  schoolName: string,
  schoolLogoBase64?: string,
  academicYear?: string
) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;
    
    // Add logo if available - centered
    if (schoolLogoBase64) {
      try {
        const logoWidth = 30;
        const logoHeight = 30;
        const logoX = (pageWidth - logoWidth) / 2;
        doc.addImage(schoolLogoBase64, 'PNG', logoX, yPosition, logoWidth, logoHeight);
        yPosition += logoHeight + 5;
      } catch (error) {
        console.error('Erreur lors de l\'ajout du logo:', error);
      }
    }
    
    // School name - centered
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolName, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT DE PRÉSENCE', pageWidth / 2, yPosition, { align: 'center' });
    doc.text('SYSTÈME EDUVATE', pageWidth / 2, yPosition + 6, { align: 'center' });
    
    yPosition += 30;
    
    // Informations
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const info = [
      `Classe : ${classData.name}`,
      `Date : ${new Date(selectedDate).toLocaleDateString('fr-FR')}`,
      academicYear ? `Année universitaire : ${academicYear}` : '',
      `Date d'édition : ${new Date().toLocaleDateString('fr-FR')}`,
      `Nombre d'étudiants : ${students.length}`
    ].filter(Boolean);
    
    info.forEach((line, index) => {
      doc.text(line, 20, yPosition + (index * 6));
    });
    
    yPosition += 35;
    
    // Statistiques du jour
    const presentCount = students.filter(s => {
      const record = attendance.find(a => a.student_id === s.id && a.date === selectedDate);
      return record?.status === 'present';
    }).length;
    
    const absentCount = students.filter(s => {
      const record = attendance.find(a => a.student_id === s.id && a.date === selectedDate);
      return record?.status === 'absent';
    }).length;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Résumé du jour:`, 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`Présents : ${presentCount}`, 20, yPosition + 8);
    doc.text(`Absents : ${absentCount}`, 20, yPosition + 16);
    doc.text(`Taux de présence : ${students.length > 0 ? ((presentCount / students.length) * 100).toFixed(1) : 0}%`, 20, yPosition + 24);
    
    yPosition += 35;
    
    // Préparer les données du tableau
    const tableHeaders = ['Nom', 'Prénom', 'Statut du jour', 'Total Présent', 'Total Absent', 'Taux'];
    const tableData: any[][] = [];
    
    students.forEach((student) => {
      const studentAttendance = attendance.filter(a => a.student_id === student.id);
      const todayRecord = attendance.find(a => a.student_id === student.id && a.date === selectedDate);
      
      const present = studentAttendance.filter(a => a.status === 'present').length;
      const absent = studentAttendance.filter(a => a.status === 'absent').length;
      const total = present + absent;
      const rate = total > 0 ? `${((present / total) * 100).toFixed(0)}%` : "0%";
      
      const statusText = todayRecord 
        ? (todayRecord.status === 'present' ? 'Présent' : 'Absent')
        : 'Non marqué';
      
      tableData.push([
        student.lastname,
        student.firstname,
        statusText,
        present.toString(),
        absent.toString(),
        rate
      ]);
    });
    
    // Génération du tableau
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
        0: { cellWidth: 35 }, // Nom
        1: { cellWidth: 35 }, // Prénom
        2: { cellWidth: 35, halign: 'center' }, // Statut
        3: { cellWidth: 30, halign: 'center' }, // Total Présent
        4: { cellWidth: 30, halign: 'center' }, // Total Absent
        5: { cellWidth: 25, halign: 'center' }, // Taux
      },
    });
    
    // Footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.text('Système de gestion scolaire Eduvate', pageWidth / 2, footerY, { align: 'center' });
    
    // Télécharger le PDF
    const fileName = `Presence_${classData.name}_${selectedDate}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Erreur génération PDF présence école:', error);
    throw error;
  }
};
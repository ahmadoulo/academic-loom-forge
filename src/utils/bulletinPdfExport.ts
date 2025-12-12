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

export interface SubjectGradeData {
  subjectId: string;
  subjectName: string;
  grades: any[];
  average?: number;
  hasGrades: boolean;
  credits: number;
  coefficientType: 'coefficient' | 'credit';
  isValidated: boolean;
}

export interface SemesterData {
  name: string;
  average: number;
  validatedCredits: number;
  totalCredits: number;
  subjectGrades: SubjectGradeData[];
}

export interface BulletinData {
  student: CurrentStudentData;
  semester1?: SemesterData;
  semester2?: SemesterData;
  annualAverage?: number;
  totalValidatedCredits?: number;
  totalCredits?: number;
  isAnnualBulletin?: boolean;
}

// Génère un bulletin PDF complet avec système de crédits LMD
export const generateLMDBulletinPdf = async (
  bulletinData: BulletinData,
  schoolLogoBase64?: string,
  academicYear?: string
) => {
  try {
    const doc = new jsPDF();
    await generateLMDBulletinInDoc(doc, bulletinData, schoolLogoBase64, academicYear);
    
    const fileName = `Bulletin_${bulletinData.student.firstname}_${bulletinData.student.lastname}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Erreur dans generateLMDBulletinPdf:', error);
    throw error;
  }
};

// Génère le contenu du bulletin dans un document existant
export const generateLMDBulletinInDoc = async (
  doc: jsPDF,
  bulletinData: BulletinData,
  schoolLogoBase64?: string,
  academicYear?: string
) => {
  const { student, semester1, semester2, isAnnualBulletin } = bulletinData;
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 15;
  
  // Logo centré
  if (schoolLogoBase64) {
    try {
      const logoWidth = 25;
      const logoHeight = 25;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(schoolLogoBase64, 'PNG', logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 3;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du logo:', error);
    }
  }
  
  // Nom de l'école
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(student.schools?.name || 'ÉCOLE', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;
  
  // Titre du bulletin
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const bulletinTitle = isAnnualBulletin ? 'BULLETIN ANNUEL DE NOTES' : 'BULLETIN DE NOTES';
  doc.text(bulletinTitle, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;
  
  // Année universitaire
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const displayYear = academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  doc.text(`Année universitaire : ${displayYear}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  
  // Informations étudiant
  doc.setFontSize(9);
  const leftCol = 15;
  const rightCol = pageWidth / 2 + 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nom et Prénom :', leftCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.firstname} ${student.lastname}`, leftCol + 32, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Classe :', rightCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(student.classes?.name || 'N/A', rightCol + 18, yPosition);
  yPosition += 5;
  
  doc.setFont('helvetica', 'bold');
  doc.text('CIN/Passeport :', leftCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(student.cin_number || 'N/A', leftCol + 32, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text("Date d'édition :", rightCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('fr-FR'), rightCol + 28, yPosition);
  yPosition += 10;

  // Fonction pour générer un tableau de semestre
  const generateSemesterTable = (semesterData: SemesterData, semesterLabel: string) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(semesterLabel, leftCol, yPosition);
    yPosition += 5;
    
    const tableHeaders = ['Matière', 'Crédits', 'Note/20', 'Validation'];
    const tableData: any[][] = [];
    
    semesterData.subjectGrades.forEach((subject) => {
      const validation = subject.isValidated ? '✓ Validé' : '✗ Non Validé';
      const note = subject.hasGrades && subject.average !== undefined 
        ? subject.average.toFixed(2) 
        : '-';
      
      tableData.push([
        subject.subjectName,
        subject.credits.toString(),
        note,
        validation
      ]);
    });
    
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: 'center',
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 70, halign: 'left' },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 35 },
      },
      didDrawCell: (data) => {
        if (data.column.index === 3 && data.section === 'body') {
          const cellText = data.cell.text[0];
          if (cellText.includes('✓')) {
            doc.setTextColor(0, 128, 0);
          } else if (cellText.includes('✗')) {
            doc.setTextColor(200, 0, 0);
          }
        }
      },
      willDrawCell: (data) => {
        doc.setTextColor(0, 0, 0);
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 5;
    
    // Récapitulatif du semestre
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Moyenne ${semesterLabel}: ${semesterData.average.toFixed(2)}/20`, leftCol, yPosition);
    doc.text(`Crédits validés: ${semesterData.validatedCredits}/${semesterData.totalCredits}`, rightCol, yPosition);
    yPosition += 8;
  };

  // Génération des tableaux selon le type de bulletin
  if (isAnnualBulletin && semester1 && semester2) {
    // Bulletin annuel: S1 + S2 + récapitulatif
    generateSemesterTable(semester1, 'SEMESTRE 1');
    generateSemesterTable(semester2, 'SEMESTRE 2');
    
    // Récapitulatif annuel
    doc.setDrawColor(66, 139, 202);
    doc.setLineWidth(0.5);
    doc.line(leftCol, yPosition, pageWidth - leftCol, yPosition);
    yPosition += 6;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉCAPITULATIF ANNUEL', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    
    // Tableau récapitulatif
    const summaryData = [
      ['Semestre 1', semester1.average.toFixed(2) + '/20', `${semester1.validatedCredits}/${semester1.totalCredits}`],
      ['Semestre 2', semester2.average.toFixed(2) + '/20', `${semester2.validatedCredits}/${semester2.totalCredits}`],
      ['TOTAL ANNUEL', bulletinData.annualAverage?.toFixed(2) + '/20' || '-', `${bulletinData.totalValidatedCredits}/${bulletinData.totalCredits}`]
    ];
    
    autoTable(doc, {
      head: [['Période', 'Moyenne', 'Crédits Validés']],
      body: summaryData,
      startY: yPosition,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        halign: 'center',
      },
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: {
        halign: 'center',
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left' },
      },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 8;
    
  } else if (semester2 && isAnnualBulletin) {
    // Bulletin S2 avec récap S1
    if (semester1) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(`Rappel Semestre 1: Moyenne ${semester1.average.toFixed(2)}/20 - Crédits ${semester1.validatedCredits}/${semester1.totalCredits}`, leftCol, yPosition);
      yPosition += 8;
    }
    generateSemesterTable(semester2, 'SEMESTRE 2');
    
  } else if (semester1) {
    // Bulletin S1 uniquement
    generateSemesterTable(semester1, 'SEMESTRE 1');
    
  } else if (semester2) {
    // Bulletin S2 uniquement
    generateSemesterTable(semester2, 'SEMESTRE 2');
  }
  
  // Mention selon la moyenne
  const finalAverage = bulletinData.annualAverage || semester1?.average || semester2?.average || 0;
  let mention = '';
  if (finalAverage >= 16) mention = 'Très Bien';
  else if (finalAverage >= 14) mention = 'Bien';
  else if (finalAverage >= 12) mention = 'Assez Bien';
  else if (finalAverage >= 10) mention = 'Passable';
  else mention = 'Insuffisant';
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Mention: ${mention}`, leftCol, yPosition);
  yPosition += 12;
  
  // Signature
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Signature du directeur pédagogique:', pageWidth - 70, yPosition);
  yPosition += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 70, yPosition);
  
  // Footer
  const footerY = doc.internal.pageSize.height - 12;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(student.schools?.name || 'École', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Système de gestion scolaire Eduvate', pageWidth / 2, footerY + 4, { align: 'center' });
};

// Ancienne fonction maintenue pour compatibilité
export const generateStudentBulletin = async (
  student: CurrentStudentData,
  subjectGrades: any[],
  overallAverage: number,
  schoolLogoBase64?: string,
  academicYear?: string,
  semesterName?: string
) => {
  // Convertir vers le nouveau format
  const convertedGrades: SubjectGradeData[] = subjectGrades.map(sg => ({
    ...sg,
    credits: sg.credits || 1,
    coefficientType: sg.coefficientType || 'coefficient',
    isValidated: sg.average && sg.average >= 10
  }));
  
  const totalCredits = convertedGrades.reduce((sum, s) => sum + s.credits, 0);
  const validatedCredits = convertedGrades.filter(s => s.isValidated).reduce((sum, s) => sum + s.credits, 0);
  
  const bulletinData: BulletinData = {
    student,
    semester1: {
      name: semesterName || 'Semestre',
      average: overallAverage,
      validatedCredits,
      totalCredits,
      subjectGrades: convertedGrades
    },
    isAnnualBulletin: false
  };
  
  return generateLMDBulletinPdf(bulletinData, schoolLogoBase64, academicYear);
};

export const generateStudentBulletinInDoc = async (
  doc: jsPDF,
  student: CurrentStudentData,
  subjectGrades: any[],
  overallAverage: number,
  schoolLogoBase64?: string,
  academicYear?: string,
  semesterName?: string
) => {
  const convertedGrades: SubjectGradeData[] = subjectGrades.map(sg => ({
    ...sg,
    credits: sg.credits || 1,
    coefficientType: sg.coefficientType || 'coefficient',
    isValidated: sg.average && sg.average >= 10
  }));
  
  const totalCredits = convertedGrades.reduce((sum, s) => sum + s.credits, 0);
  const validatedCredits = convertedGrades.filter(s => s.isValidated).reduce((sum, s) => sum + s.credits, 0);
  
  const bulletinData: BulletinData = {
    student,
    semester1: {
      name: semesterName || 'Semestre',
      average: overallAverage,
      validatedCredits,
      totalCredits,
      subjectGrades: convertedGrades
    },
    isAnnualBulletin: false
  };
  
  return generateLMDBulletinInDoc(doc, bulletinData, schoolLogoBase64, academicYear);
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CurrentStudentData {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  cin_number?: string;
  birth_date?: string;
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
  currentSemester?: SemesterData; // Pour bulletin semestriel unique
  semesterNumber?: 1 | 2; // Pour savoir quel semestre on affiche
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
    
    const semesterSuffix = bulletinData.isAnnualBulletin 
      ? 'Annuel' 
      : (bulletinData.currentSemester?.name || `S${bulletinData.semesterNumber || 1}`);
    const fileName = `Bulletin_${bulletinData.student.firstname}_${bulletinData.student.lastname}_${semesterSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Erreur dans generateLMDBulletinPdf:', error);
    throw error;
  }
};

// Génère le contenu du bulletin dans un document existant - Format inspiré du modèle LMD
export const generateLMDBulletinInDoc = async (
  doc: jsPDF,
  bulletinData: BulletinData,
  schoolLogoBase64?: string,
  academicYear?: string
) => {
  const { student, semester1, semester2, currentSemester, semesterNumber, isAnnualBulletin } = bulletinData;
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 12;
  
  // ===== EN-TÊTE =====
  // Logo à gauche
  if (schoolLogoBase64) {
    try {
      doc.addImage(schoolLogoBase64, 'PNG', 15, yPosition, 22, 22);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du logo:', error);
    }
  }
  
  // Nom de l'école centré
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(student.schools?.name || 'ÉTABLISSEMENT', pageWidth / 2, yPosition + 8, { align: 'center' });
  
  // Titre du bulletin
  yPosition += 18;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('BULLETIN DE NOTES', pageWidth / 2, yPosition, { align: 'center' });
  
  // Classe/Formation
  yPosition += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(student.classes?.name || '', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  
  // ===== INFORMATIONS ÉTUDIANT - Format tableau comme le modèle =====
  doc.setFontSize(9);
  const leftMargin = 15;
  const rightSection = pageWidth / 2 + 5;
  
  // Ligne 1: Nom et Année scolaire
  doc.setFont('helvetica', 'bold');
  doc.text('Nom:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.lastname} ${student.firstname}`, leftMargin + 15, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Année scolaire:', rightSection, yPosition);
  doc.setFont('helvetica', 'normal');
  const displayYear = academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  doc.text(displayYear, rightSection + 35, yPosition);
  
  yPosition += 5;
  
  // Ligne 2: Date naissance et Session
  if (student.birth_date) {
    doc.setFont('helvetica', 'bold');
    doc.text('Né(e) le:', leftMargin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(student.birth_date).toLocaleDateString('fr-FR'), leftMargin + 20, yPosition);
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Session:', rightSection, yPosition);
  doc.setFont('helvetica', 'normal');
  let sessionText = '';
  if (isAnnualBulletin) {
    sessionText = 'Annuel';
  } else if (currentSemester) {
    sessionText = currentSemester.name;
  } else if (semesterNumber === 2) {
    sessionText = 'Semestre 2';
  } else {
    sessionText = 'Semestre 1';
  }
  doc.text(sessionText, rightSection + 20, yPosition);
  
  yPosition += 5;
  
  // Ligne 3: CIN/Matricule
  doc.setFont('helvetica', 'bold');
  doc.text('Matricule:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(student.cin_number || 'N/A', leftMargin + 22, yPosition);
  
  yPosition += 10;

  // ===== FONCTION POUR GÉNÉRER UN TABLEAU DE NOTES =====
  const generateGradesTable = (semesterData: SemesterData, showSemesterHeader: boolean = false, semesterLabel?: string) => {
    if (showSemesterHeader && semesterLabel) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(52, 73, 94);
      doc.rect(leftMargin, yPosition - 4, pageWidth - 30, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(semesterLabel, pageWidth / 2, yPosition, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPosition += 5;
    }
    
    // Colonnes: Matière | Moyenne | Crédits | Validation
    const tableHeaders = ['Modules', 'Moyenne', 'Crédits', 'Rslt'];
    const tableData: any[][] = [];
    
    semesterData.subjectGrades.forEach((subject) => {
      const validation = subject.isValidated ? 'V' : 'NV';
      const note = subject.hasGrades && subject.average !== undefined 
        ? subject.average.toFixed(2) 
        : '-';
      
      tableData.push([
        subject.subjectName,
        note,
        subject.credits.toString(),
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
        lineColor: [100, 100, 100],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 90, halign: 'left' },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
      },
      didParseCell: (data) => {
        // Colorer la validation
        if (data.column.index === 3 && data.section === 'body') {
          const cellText = data.cell.raw as string;
          if (cellText === 'V') {
            data.cell.styles.textColor = [0, 128, 0];
            data.cell.styles.fontStyle = 'bold';
          } else if (cellText === 'NV') {
            data.cell.styles.textColor = [200, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 4;
    
    // Ligne récapitulative du semestre
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Moyenne semestrielle: ${semesterData.average.toFixed(2)}/20`, leftMargin, yPosition);
    doc.text(`Crédits: ${semesterData.validatedCredits}/${semesterData.totalCredits}`, rightSection, yPosition);
    yPosition += 8;
  };

  // ===== GÉNÉRATION DU CONTENU SELON LE TYPE DE BULLETIN =====
  if (isAnnualBulletin && semester1 && semester2) {
    // BULLETIN ANNUEL: Afficher les deux semestres puis récapitulatif
    generateGradesTable(semester1, true, 'SEMESTRE 1');
    generateGradesTable(semester2, true, 'SEMESTRE 2');
    
    // Récapitulatif annuel
    yPosition += 2;
    doc.setDrawColor(52, 73, 94);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPosition, pageWidth - leftMargin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('MOYENNE GÉNÉRALE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    
    // Tableau récapitulatif style modèle
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const recapData = [
      [`Moyenne Semestre 1: ${semester1.average.toFixed(2)}`, `Crédits S1: ${semester1.validatedCredits}/${semester1.totalCredits}`],
      [`Moyenne Semestre 2: ${semester2.average.toFixed(2)}`, `Crédits S2: ${semester2.validatedCredits}/${semester2.totalCredits}`],
    ];
    
    recapData.forEach(row => {
      doc.text(row[0], leftMargin, yPosition);
      doc.text(row[1], rightSection, yPosition);
      yPosition += 5;
    });
    
    yPosition += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Moyenne annuelle: ${bulletinData.annualAverage?.toFixed(2) || '0.00'}/20`, leftMargin, yPosition);
    doc.text(`Total crédits: ${bulletinData.totalValidatedCredits}/${bulletinData.totalCredits}`, rightSection, yPosition);
    yPosition += 8;
    
  } else if (currentSemester || semester1 || semester2) {
    // BULLETIN SEMESTRIEL: Un seul semestre
    const semData = currentSemester || semester1 || semester2;
    if (semData) {
      generateGradesTable(semData, false);
    }
  }
  
  // ===== MENTION ET DÉCISION =====
  const finalAverage = bulletinData.annualAverage || currentSemester?.average || semester1?.average || semester2?.average || 0;
  const totalValCredits = bulletinData.totalValidatedCredits || currentSemester?.validatedCredits || semester1?.validatedCredits || semester2?.validatedCredits || 0;
  const totalCred = bulletinData.totalCredits || currentSemester?.totalCredits || semester1?.totalCredits || semester2?.totalCredits || 0;
  
  let mention = '';
  if (finalAverage >= 16) mention = 'Très Bien';
  else if (finalAverage >= 14) mention = 'Bien';
  else if (finalAverage >= 12) mention = 'Assez Bien';
  else if (finalAverage >= 10) mention = 'Passable';
  else mention = 'Insuffisant';
  
  // Décision
  const isYearValidated = totalValCredits >= totalCred && totalCred > 0;
  const decision = isAnnualBulletin 
    ? (isYearValidated ? 'Année validée' : 'Année non validée')
    : (totalValCredits >= totalCred && totalCred > 0 ? 'Semestre validé' : 'Semestre non validé');
  
  yPosition += 2;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Mention: ${mention}`, leftMargin, yPosition);
  yPosition += 5;
  doc.text(`Décision: ${decision}`, leftMargin, yPosition);
  
  // ===== SIGNATURE ET DATE =====
  yPosition += 15;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`, leftMargin, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Le Directeur Pédagogique', pageWidth - 60, yPosition);
  
  // ===== FOOTER =====
  yPosition += 20;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('NB: Pour être officiel, le bulletin doit porter le sceau de l\'établissement', pageWidth / 2, yPosition, { align: 'center' });
  
  const footerY = doc.internal.pageSize.height - 8;
  doc.setFontSize(7);
  doc.text(`${student.schools?.name || 'École'} - Système de gestion scolaire`, pageWidth / 2, footerY, { align: 'center' });
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
    currentSemester: {
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
    currentSemester: {
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

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
    cycle_id?: string;
    option_id?: string;
    year_level?: number;
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
  coefficient: number;
  coefficientType: 'coefficient' | 'credit';
  isValidated: boolean;
}

export interface SemesterData {
  name: string;
  average: number;
  validatedCredits: number;
  totalCredits: number;
  subjectGrades: SubjectGradeData[];
  calculationSystem?: 'coefficient' | 'credit';
}

export interface BulletinSettings {
  show_weighted_average: boolean;
  show_ranking: boolean;
  show_mention: boolean;
  show_decision: boolean;
  show_observations: boolean;
  custom_footer_text?: string;
}

export interface StudentExtraData {
  cycleName?: string;
  yearLevel?: number;
  optionName?: string;
  totalAbsences?: number;
  justifiedAbsences?: number;
  rank?: number;
  totalStudents?: number;
}

export interface BulletinData {
  student: CurrentStudentData;
  semester1?: SemesterData;
  semester2?: SemesterData;
  currentSemester?: SemesterData;
  semesterNumber?: 1 | 2;
  annualAverage?: number;
  totalValidatedCredits?: number;
  totalCredits?: number;
  isAnnualBulletin?: boolean;
  calculationSystem?: 'credit' | 'coefficient';
  settings?: BulletinSettings;
  extraData?: StudentExtraData;
}

// Génère un bulletin PDF complet
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

// Génère le contenu du bulletin dans un document existant
export const generateLMDBulletinInDoc = async (
  doc: jsPDF,
  bulletinData: BulletinData,
  schoolLogoBase64?: string,
  academicYear?: string
) => {
  const { student, semester1, semester2, currentSemester, semesterNumber, isAnnualBulletin, settings, extraData } = bulletinData;
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 12;
  
  const isCredit = bulletinData.calculationSystem === 'credit';
  const showMention = settings?.show_mention !== false;
  const showDecision = settings?.show_decision !== false;
  const showRanking = settings?.show_ranking !== false;
  
  // ===== EN-TÊTE =====
  if (schoolLogoBase64) {
    try {
      doc.addImage(schoolLogoBase64, 'PNG', 15, yPosition, 20, 20);
    } catch (error) {
      console.error('Erreur logo:', error);
    }
  }
  
  // Nom de l'école centré
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(student.schools?.name || 'ÉTABLISSEMENT', pageWidth / 2, yPosition + 6, { align: 'center' });
  
  // Titre du bulletin
  yPosition += 16;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BULLETIN DE NOTES', pageWidth / 2, yPosition, { align: 'center' });
  
  // Session/Type
  yPosition += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let sessionText = isAnnualBulletin ? 'Bulletin Annuel' : (currentSemester?.name || `Semestre ${semesterNumber || 1}`);
  doc.text(sessionText, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  
  // ===== INFORMATIONS ÉTUDIANT - Format tableau compact =====
  const leftMargin = 15;
  const rightSection = pageWidth / 2 + 10;
  
  // Cadre d'information étudiant
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.rect(leftMargin, yPosition - 3, pageWidth - 30, 28, 'S');
  
  doc.setFontSize(8);
  
  // Ligne 1
  doc.setFont('helvetica', 'bold');
  doc.text('Nom & Prénom:', leftMargin + 2, yPosition + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.lastname} ${student.firstname}`, leftMargin + 28, yPosition + 2);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Année scolaire:', rightSection, yPosition + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, rightSection + 28, yPosition + 2);
  
  // Ligne 2
  yPosition += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Matricule:', leftMargin + 2, yPosition + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(student.cin_number || 'N/A', leftMargin + 20, yPosition + 2);
  
  if (student.birth_date) {
    doc.setFont('helvetica', 'bold');
    doc.text('Né(e) le:', rightSection, yPosition + 2);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(student.birth_date).toLocaleDateString('fr-FR'), rightSection + 18, yPosition + 2);
  }
  
  // Ligne 3 - Classe et Formation
  yPosition += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Classe:', leftMargin + 2, yPosition + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(student.classes?.name || '', leftMargin + 16, yPosition + 2);
  
  if (extraData?.cycleName) {
    doc.setFont('helvetica', 'bold');
    doc.text('Formation:', rightSection, yPosition + 2);
    doc.setFont('helvetica', 'normal');
    const formationText = extraData.optionName 
      ? `${extraData.cycleName} - ${extraData.optionName}` 
      : extraData.cycleName;
    doc.text(formationText.substring(0, 35), rightSection + 22, yPosition + 2);
  }
  
  // Ligne 4 - Absences
  yPosition += 5;
  if (extraData?.totalAbsences !== undefined) {
    doc.setFont('helvetica', 'bold');
    doc.text('Absences:', leftMargin + 2, yPosition + 2);
    doc.setFont('helvetica', 'normal');
    const absenceText = `${extraData.totalAbsences} (${extraData.justifiedAbsences || 0} justifiées)`;
    doc.text(absenceText, leftMargin + 20, yPosition + 2);
  }
  
  if (showRanking && extraData?.rank) {
    doc.setFont('helvetica', 'bold');
    doc.text('Classement:', rightSection, yPosition + 2);
    doc.setFont('helvetica', 'normal');
    doc.text(`${extraData.rank}/${extraData.totalStudents || '-'}`, rightSection + 24, yPosition + 2);
  }
  
  yPosition += 12;
  
  // ===== FONCTION TABLEAU DE NOTES =====
  const generateGradesTable = (semesterData: SemesterData, showHeader: boolean = false, headerLabel?: string) => {
    if (showHeader && headerLabel) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(52, 73, 94);
      doc.rect(leftMargin, yPosition - 3, pageWidth - 30, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(headerLabel, pageWidth / 2, yPosition, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPosition += 4;
    }
    
    const tableHeaders = isCredit 
      ? ['Matière', 'Moyenne', 'Crédits', 'Validation']
      : ['Matière', 'Moyenne', 'Coef.', 'Note Pond.'];
    
    const tableData: any[][] = [];
    
    semesterData.subjectGrades.forEach((subject) => {
      const note = subject.hasGrades && subject.average !== undefined 
        ? subject.average.toFixed(2) 
        : '-';
      
      if (isCredit) {
        tableData.push([
          subject.subjectName,
          note,
          subject.credits.toString(),
          subject.isValidated ? 'V' : 'NV'
        ]);
      } else {
        const weightedNote = subject.hasGrades && subject.average !== undefined
          ? (subject.average * subject.coefficient).toFixed(2)
          : '-';
        tableData.push([
          subject.subjectName,
          note,
          subject.coefficient.toString(),
          weightedNote
        ]);
      }
    });
    
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        halign: 'center',
        lineColor: [150, 150, 150],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 80, halign: 'left' },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
      },
      didParseCell: (data) => {
        if (isCredit && data.column.index === 3 && data.section === 'body') {
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
    
    yPosition = (doc as any).lastAutoTable.finalY + 3;
    
    // Résumé semestre compact
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    // Petit cadre récapitulatif
    const recapY = yPosition;
    doc.setFillColor(245, 245, 245);
    doc.rect(leftMargin, recapY - 2, pageWidth - 30, 8, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.rect(leftMargin, recapY - 2, pageWidth - 30, 8, 'S');
    
    doc.text(`Moyenne: ${semesterData.average.toFixed(2)}/20`, leftMargin + 3, recapY + 3);
    if (isCredit) {
      doc.text(`Crédits validés: ${semesterData.validatedCredits}/${semesterData.totalCredits}`, rightSection - 20, recapY + 3);
    }
    
    yPosition += 10;
  };

  // ===== GÉNÉRATION CONTENU =====
  if (isAnnualBulletin && semester1 && semester2) {
    generateGradesTable(semester1, true, 'SEMESTRE 1');
    generateGradesTable(semester2, true, 'SEMESTRE 2');
    
    // Récapitulatif annuel
    yPosition += 2;
    doc.setFillColor(52, 73, 94);
    doc.rect(leftMargin, yPosition - 2, pageWidth - 30, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉCAPITULATIF ANNUEL', pageWidth / 2, yPosition + 2, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPosition += 8;
    
    // Tableau récapitulatif
    const recapHeaders = isCredit 
      ? ['', 'Moyenne', 'Crédits Validés', 'Total Crédits']
      : ['', 'Moyenne'];
    
    const recapBody = isCredit ? [
      ['Semestre 1', semester1.average.toFixed(2), semester1.validatedCredits.toString(), semester1.totalCredits.toString()],
      ['Semestre 2', semester2.average.toFixed(2), semester2.validatedCredits.toString(), semester2.totalCredits.toString()],
      ['TOTAL ANNUEL', (bulletinData.annualAverage || 0).toFixed(2), (bulletinData.totalValidatedCredits || 0).toString(), (bulletinData.totalCredits || 0).toString()]
    ] : [
      ['Semestre 1', semester1.average.toFixed(2)],
      ['Semestre 2', semester2.average.toFixed(2)],
      ['MOYENNE ANNUELLE', (bulletinData.annualAverage || 0).toFixed(2)]
    ];
    
    autoTable(doc, {
      head: [recapHeaders],
      body: recapBody,
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
      headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
      didParseCell: (data) => {
        if (data.row.index === 2) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [230, 240, 250];
        }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 5;
    
  } else if (currentSemester || semester1 || semester2) {
    const semData = currentSemester || semester1 || semester2;
    if (semData) {
      generateGradesTable(semData, false);
    }
  }
  
  // ===== MENTION ET DÉCISION =====
  const finalAverage = bulletinData.annualAverage || currentSemester?.average || semester1?.average || semester2?.average || 0;
  const totalValCredits = bulletinData.totalValidatedCredits || currentSemester?.validatedCredits || 0;
  const totalCred = bulletinData.totalCredits || currentSemester?.totalCredits || 0;
  
  if (showMention || showDecision) {
    // Cadre pour mention/décision
    doc.setFillColor(250, 250, 250);
    doc.rect(leftMargin, yPosition - 2, pageWidth - 30, showMention && showDecision ? 12 : 8, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.rect(leftMargin, yPosition - 2, pageWidth - 30, showMention && showDecision ? 12 : 8, 'S');
    
    doc.setFontSize(9);
    
    if (showMention) {
      let mention = '';
      if (finalAverage >= 16) mention = 'Très Bien';
      else if (finalAverage >= 14) mention = 'Bien';
      else if (finalAverage >= 12) mention = 'Assez Bien';
      else if (finalAverage >= 10) mention = 'Passable';
      else mention = 'Insuffisant';
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Mention: ${mention}`, leftMargin + 3, yPosition + 2);
    }
    
    if (showDecision) {
      const isValidated = isCredit ? (totalValCredits >= totalCred && totalCred > 0) : (finalAverage >= 10);
      const decision = isAnnualBulletin 
        ? (isValidated ? 'Année validée' : 'Année non validée')
        : (isValidated ? 'Semestre validé' : 'Semestre non validé');
      
      doc.setFont('helvetica', 'bold');
      const decisionY = showMention ? yPosition + 7 : yPosition + 2;
      doc.text(`Décision: ${decision}`, leftMargin + 3, decisionY);
    }
    
    yPosition += showMention && showDecision ? 16 : 12;
  }
  
  // ===== OBSERVATIONS =====
  if (settings?.show_observations) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Observations:', leftMargin, yPosition);
    doc.setDrawColor(150, 150, 150);
    doc.rect(leftMargin, yPosition + 2, pageWidth - 30, 15, 'S');
    yPosition += 20;
  }
  
  // ===== SIGNATURE =====
  yPosition += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fait le: ${new Date().toLocaleDateString('fr-FR')}`, leftMargin, yPosition);
  doc.setFont('helvetica', 'bold');
  doc.text('Le Directeur Pédagogique', pageWidth - 55, yPosition);
  
  // ===== FOOTER =====
  const footerY = doc.internal.pageSize.height - 12;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  
  if (settings?.custom_footer_text) {
    doc.text(settings.custom_footer_text, pageWidth / 2, footerY - 4, { align: 'center' });
  }
  
  doc.text('NB: Pour être officiel, le bulletin doit porter le sceau de l\'établissement', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`${student.schools?.name || 'École'} - Système de gestion scolaire`, pageWidth / 2, footerY + 4, { align: 'center' });
  doc.setTextColor(0, 0, 0);
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
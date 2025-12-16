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
  subjectCode?: string;
  grades: any[];
  devoirAverage?: number;
  examenAverage?: number;
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
  template_style?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
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

// Helper to convert hex to RGB array
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [51, 51, 51];
};

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
  const leftMargin = 15;
  const rightMargin = pageWidth - 15;
  let yPosition = 10;
  
  const isCredit = bulletinData.calculationSystem === 'credit';
  const showMention = settings?.show_mention !== false;
  const showDecision = settings?.show_decision !== false;
  const showRanking = settings?.show_ranking !== false;
  
  // Template colors
  const templateStyle = settings?.template_style || 'classic';
  const primaryColor = hexToRgb(settings?.primary_color || '#333333');
  const secondaryColor = hexToRgb(settings?.secondary_color || '#666666');
  const accentColor = hexToRgb(settings?.accent_color || '#0066cc');
  
  // ===== LOGO CENTRÉ =====
  if (schoolLogoBase64) {
    try {
      const logoSize = 25;
      doc.addImage(schoolLogoBase64, 'PNG', (pageWidth - logoSize) / 2, yPosition, logoSize, logoSize);
      yPosition += 28;
    } catch (error) {
      console.error('Erreur logo:', error);
      yPosition += 5;
    }
  } else {
    yPosition += 5;
  }
  
  // ===== TITRE ENCADRÉ (selon template) =====
  const titleBoxWidth = 120;
  const titleBoxX = (pageWidth - titleBoxWidth) / 2;
  
  if (templateStyle === 'modern') {
    // Modern: ligne colorée à gauche
    doc.setFillColor(...accentColor);
    doc.rect(leftMargin, yPosition, 4, 12, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('BULLETIN DE NOTES', leftMargin + 10, yPosition + 8);
  } else if (templateStyle === 'minimal') {
    // Minimal: simple texte centré
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('BULLETIN DE NOTES', pageWidth / 2, yPosition + 7, { align: 'center' });
    doc.setDrawColor(...secondaryColor);
    doc.setLineWidth(0.5);
    doc.line(titleBoxX, yPosition + 12, titleBoxX + titleBoxWidth, yPosition + 12);
  } else if (templateStyle === 'elegant') {
    // Elegant: bordure double
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.8);
    doc.rect(titleBoxX - 2, yPosition - 2, titleBoxWidth + 4, 14);
    doc.setLineWidth(0.3);
    doc.rect(titleBoxX, yPosition, titleBoxWidth, 10);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('BULLETIN DE NOTES', pageWidth / 2, yPosition + 7, { align: 'center' });
  } else {
    // Classic: fond coloré
    doc.setFillColor(...primaryColor);
    doc.rect(titleBoxX, yPosition, titleBoxWidth, 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('BULLETIN DE NOTES', pageWidth / 2, yPosition + 7, { align: 'center' });
  }
  
  doc.setTextColor(0, 0, 0);
  yPosition += 15;
  
  // ===== SOUS-TITRE FORMATION =====
  const formationText = extraData?.cycleName 
    ? (extraData.optionName 
      ? `${extraData.cycleName} - ${extraData.optionName}`
      : extraData.cycleName)
    : (student.classes?.name || '');
  
  if (formationText) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);
    doc.text(formationText, pageWidth / 2, yPosition, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPosition += 8;
  }
  
  // ===== INFORMATIONS ÉTUDIANT =====
  doc.setFontSize(9);
  
  // Colonne gauche
  doc.setFont('helvetica', 'bold');
  doc.text('Nom:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.lastname} ${student.firstname}`, leftMargin + 25, yPosition);
  
  // Colonne droite
  doc.setFont('helvetica', 'bold');
  doc.text('Année scolaire :', rightMargin - 60, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, rightMargin - 20, yPosition);
  
  yPosition += 5;
  
  // Ligne 2
  if (student.birth_date) {
    doc.setFont('helvetica', 'bold');
    doc.text('Né(e) le:', leftMargin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(student.birth_date).toLocaleDateString('fr-FR'), leftMargin + 25, yPosition);
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Session :', rightMargin - 60, yPosition);
  doc.setFont('helvetica', 'normal');
  const sessionText = isAnnualBulletin ? 'Annuel' : (currentSemester?.name || `Semestre ${semesterNumber || 1}`);
  doc.text(sessionText, rightMargin - 20, yPosition);
  
  yPosition += 5;
  
  // Ligne 3
  doc.setFont('helvetica', 'bold');
  doc.text('Matricule:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(student.cin_number || 'N/A', leftMargin + 25, yPosition);
  
  if (extraData?.yearLevel) {
    doc.setFont('helvetica', 'bold');
    doc.text('Niveau :', rightMargin - 60, yPosition);
    doc.setFont('helvetica', 'normal');
    const niveauText = extraData.yearLevel === 1 ? '1er Niveau' : `${extraData.yearLevel}ème Niveau`;
    doc.text(niveauText, rightMargin - 20, yPosition);
  }
  
  yPosition += 10;
  
  // ===== FONCTION GÉNÉRATION TABLEAU DE NOTES =====
  const generateGradesTable = (semesterData: SemesterData, semesterLabel?: string): number => {
    const startY = yPosition;
    
    // En-têtes du tableau
    const headers = isCredit 
      ? [['Modules', 'Devoir', 'Examen', 'Moyenne', 'Crédits', 'Rslt']]
      : [['Modules', 'Devoir', 'Examen', 'Moyenne', 'Coef.', 'Rslt']];
    
    // Préparer les données
    const tableData: any[][] = [];
    
    semesterData.subjectGrades.forEach((subject) => {
      const devoirGrades = subject.grades.filter(g => 
        g.grade_type === 'devoir' || g.grade_type === 'controle' || g.grade_type === 'test'
      );
      const examenGrades = subject.grades.filter(g => 
        g.grade_type === 'examen' || g.grade_type === 'exam'
      );
      
      const devoirAvg = devoirGrades.length > 0 
        ? devoirGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / devoirGrades.length 
        : null;
      const examenAvg = examenGrades.length > 0 
        ? examenGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / examenGrades.length 
        : null;
      
      const devoir = devoirAvg !== null ? devoirAvg.toFixed(2) : '-';
      const examen = examenAvg !== null ? examenAvg.toFixed(2) : '-';
      const moyenne = subject.hasGrades && subject.average !== undefined ? subject.average.toFixed(2) : '-';
      const creditsOrCoef = isCredit ? subject.credits.toString() : subject.coefficient.toString();
      const rslt = subject.isValidated ? 'V' : 'NV';
      
      tableData.push([subject.subjectName, devoir, examen, moyenne, creditsOrCoef, rslt]);
    });
    
    // Styles selon template
    let headFillColor: [number, number, number] = [220, 220, 220];
    let headTextColor: [number, number, number] = [0, 0, 0];
    
    if (templateStyle === 'modern' || templateStyle === 'elegant') {
      headFillColor = secondaryColor;
      headTextColor = [255, 255, 255];
    }
    
    autoTable(doc, {
      head: headers,
      body: tableData,
      startY: startY,
      theme: templateStyle === 'minimal' ? 'plain' : 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: 'center',
        valign: 'middle',
        lineColor: templateStyle === 'minimal' ? [200, 200, 200] : [0, 0, 0],
        lineWidth: templateStyle === 'minimal' ? 0.1 : 0.2,
      },
      headStyles: {
        fillColor: headFillColor,
        textColor: headTextColor,
        fontStyle: 'bold',
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 75, halign: 'left' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 16, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
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
    
    let tableEndY = (doc as any).lastAutoTable.finalY;
    
    // Ligne de moyenne semestrielle avec crédits
    const avgRowY = tableEndY;
    const fillColorArr: [number, number, number] = templateStyle === 'elegant' ? primaryColor : [180, 180, 180];
    doc.setFillColor(fillColorArr[0], fillColorArr[1], fillColorArr[2]);
    doc.rect(leftMargin, avgRowY, pageWidth - 30, 7, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(leftMargin, avgRowY, pageWidth - 30, 7, 'S');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const textColorVal = templateStyle === 'elegant' ? 255 : 0;
    doc.setTextColor(textColorVal, textColorVal, textColorVal);
    
    const labelText = semesterLabel || 'Moyenne semestrielle';
    doc.text(labelText, leftMargin + 3, avgRowY + 5);
    
    // Moyenne + crédits validés/total
    const avgText = `${semesterData.average.toFixed(2)}/20`;
    const creditsText = isCredit ? `(${semesterData.validatedCredits}/${semesterData.totalCredits} crédits)` : '';
    doc.text(`${avgText} ${creditsText}`, rightMargin - 55, avgRowY + 5);
    
    doc.setTextColor(0, 0, 0);
    return avgRowY + 10;
  };
  
  // ===== GÉNÉRATION DU CONTENU =====
  if (isAnnualBulletin && semester1 && semester2) {
    yPosition = generateGradesTable(semester1, 'Moyenne semestrielle');
    yPosition += 5;
    yPosition = generateGradesTable(semester2, 'Moyenne semestrielle');
    yPosition += 8;
    
    // RÉCAPITULATIF ANNUEL - Mini tableau propre
    const recapHeaders = isCredit 
      ? [['', 'Moyenne', 'Crédits validés']]
      : [['', 'Moyenne', '']];
    
    const recapData = [
      ['Semestre 1', semester1.average.toFixed(2), isCredit ? `${semester1.validatedCredits}/${semester1.totalCredits}` : ''],
      ['Semestre 2', semester2.average.toFixed(2), isCredit ? `${semester2.validatedCredits}/${semester2.totalCredits}` : ''],
      ['Moyenne Annuelle', (bulletinData.annualAverage || 0).toFixed(2), isCredit ? `${bulletinData.totalValidatedCredits || 0}/${bulletinData.totalCredits || 0}` : ''],
    ];
    
    autoTable(doc, {
      head: recapHeaders,
      body: recapData,
      startY: yPosition,
      theme: 'grid',
      tableWidth: 120,
      margin: { left: leftMargin },
      styles: {
        fontSize: 9,
        cellPadding: 2,
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 50, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.row.index === 2 && data.section === 'body') {
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 5;
    
    // Décision et mention
    if (showDecision || showMention) {
      const annualAvg = bulletinData.annualAverage || 0;
      const isValidated = isCredit 
        ? ((bulletinData.totalValidatedCredits || 0) >= (bulletinData.totalCredits || 0) && (bulletinData.totalCredits || 0) > 0)
        : (annualAvg >= 10);
      
      let mention = '';
      if (annualAvg >= 16) mention = 'Très Bien';
      else if (annualAvg >= 14) mention = 'Bien';
      else if (annualAvg >= 12) mention = 'Assez Bien';
      else if (annualAvg >= 10) mention = 'Passable';
      else mention = 'Insuffisant';
      
      const decisionData: any[][] = [];
      if (showMention) decisionData.push(['Mention:', mention]);
      if (showDecision) decisionData.push(['Décision:', isValidated ? 'Année validée' : 'Année non validée']);
      
      autoTable(doc, {
        body: decisionData,
        startY: yPosition,
        theme: 'plain',
        margin: { left: leftMargin },
        styles: { fontSize: 9, cellPadding: 1 },
        columnStyles: {
          0: { cellWidth: 35, fontStyle: 'bold' },
          1: { cellWidth: 60 },
        },
      });
      yPosition = (doc as any).lastAutoTable.finalY + 3;
    }
    
  } else if (currentSemester || semester1 || semester2) {
    const semData = currentSemester || semester1 || semester2;
    if (semData) {
      yPosition = generateGradesTable(semData, 'Moyenne semestrielle');
      yPosition += 5;
      
      // Mini récap pour semestriel si crédits
      if (isCredit) {
        const semRecapData = [
          ['Crédits validés', `${semData.validatedCredits} / ${semData.totalCredits}`],
        ];
        
        autoTable(doc, {
          body: semRecapData,
          startY: yPosition,
          theme: 'grid',
          tableWidth: 80,
          margin: { left: leftMargin },
          styles: { fontSize: 9, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2 },
          columnStyles: {
            0: { cellWidth: 45, fontStyle: 'bold', fillColor: [240, 240, 240] },
            1: { cellWidth: 35, halign: 'center' },
          },
        });
        yPosition = (doc as any).lastAutoTable.finalY + 3;
      }
      
      // Mention et décision
      if (showMention || showDecision) {
        const finalAvg = semData.average;
        let mention = '';
        if (finalAvg >= 16) mention = 'Très Bien';
        else if (finalAvg >= 14) mention = 'Bien';
        else if (finalAvg >= 12) mention = 'Assez Bien';
        else if (finalAvg >= 10) mention = 'Passable';
        else mention = 'Insuffisant';
        
        const isValidated = isCredit 
          ? (semData.validatedCredits >= semData.totalCredits && semData.totalCredits > 0)
          : (finalAvg >= 10);
        
        const recapRows: any[][] = [];
        if (showMention) recapRows.push(['Mention:', mention]);
        if (showDecision) recapRows.push(['Décision:', isValidated ? 'Semestre validé' : 'Semestre non validé']);
        
        if (recapRows.length > 0) {
          autoTable(doc, {
            body: recapRows,
            startY: yPosition,
            theme: 'plain',
            margin: { left: leftMargin },
            styles: { fontSize: 9, cellPadding: 1 },
            columnStyles: {
              0: { cellWidth: 35, fontStyle: 'bold' },
              1: { cellWidth: 60 },
            },
          });
          yPosition = (doc as any).lastAutoTable.finalY + 3;
        }
      }
    }
  }
  
  // ===== ABSENCES ET CLASSEMENT (mini tableau propre) =====
  yPosition += 5;
  
  const statsRows: any[][] = [];
  
  if (extraData?.totalAbsences !== undefined) {
    const unjustified = (extraData.totalAbsences || 0) - (extraData.justifiedAbsences || 0);
    statsRows.push(['Absences', `${extraData.totalAbsences}`, 'Non justifiées', `${unjustified}`]);
  }
  
  if (showRanking && extraData?.rank) {
    statsRows.push(['Classement', `${extraData.rank} / ${extraData.totalStudents || '-'}`, '', '']);
  }
  
  if (statsRows.length > 0) {
    autoTable(doc, {
      body: statsRows,
      startY: yPosition,
      theme: 'grid',
      tableWidth: 140,
      margin: { left: leftMargin },
      styles: { 
        fontSize: 9, 
        cellPadding: 2,
        lineColor: [150, 150, 150],
        lineWidth: 0.15,
      },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold', fillColor: [245, 245, 245] },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 45, fontStyle: 'bold', fillColor: [245, 245, 245] },
        3: { cellWidth: 35, halign: 'center' },
      },
    });
    yPosition = (doc as any).lastAutoTable.finalY + 8;
  }
  
  // ===== DATE ET SIGNATURE =====
  yPosition += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date   ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, leftMargin, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Le Directeur Pédagogique', rightMargin - 50, yPosition);
  
  // ===== FOOTER =====
  const footerY = doc.internal.pageSize.height - 15;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...secondaryColor);
  
  doc.text('NB: Pour être officiel, le bulletin doit porter le sceau de l\'établissement', leftMargin, footerY);
  
  if (settings?.custom_footer_text) {
    doc.text(settings.custom_footer_text, pageWidth / 2, footerY + 4, { align: 'center' });
  } else {
    doc.text(`${student.schools?.name || 'École'} - Système de gestion scolaire`, pageWidth / 2, footerY + 4, { align: 'center' });
  }
  
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
    coefficient: sg.coefficient || 1,
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
    coefficient: sg.coefficient || 1,
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

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

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [51, 51, 51];
};

// ==================== TEMPLATE: CLASSIC ====================
const generateClassicBulletin = async (
  doc: jsPDF,
  bulletinData: BulletinData,
  schoolLogoBase64?: string,
  academicYear?: string
) => {
  const { student, semester1, semester2, currentSemester, semesterNumber, isAnnualBulletin, settings, extraData } = bulletinData;
  const pageWidth = doc.internal.pageSize.width;
  const leftMargin = 12;
  const rightMargin = pageWidth - 12;
  let yPosition = 8;
  
  const isCredit = bulletinData.calculationSystem === 'credit';
  const primaryColor = hexToRgb(settings?.primary_color || '#1a365d');
  const accentColor = hexToRgb(settings?.accent_color || '#c53030');

  // Double border frame
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1.5);
  doc.rect(5, 5, pageWidth - 10, doc.internal.pageSize.height - 10);
  doc.setLineWidth(0.5);
  doc.rect(8, 8, pageWidth - 16, doc.internal.pageSize.height - 16);

  // Logo + School name header
  if (schoolLogoBase64) {
    try {
      doc.addImage(schoolLogoBase64, 'PNG', leftMargin, yPosition, 22, 22);
    } catch (e) { console.error(e); }
  }
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(student.schools?.name || 'ÉTABLISSEMENT', pageWidth / 2, yPosition + 8, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  const formationText = extraData?.cycleName ? `${extraData.cycleName}${extraData.optionName ? ` - ${extraData.optionName}` : ''}` : '';
  if (formationText) {
    doc.text(formationText, pageWidth / 2, yPosition + 14, { align: 'center' });
  }
  
  yPosition += 28;

  // Title with decorative lines
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.8);
  doc.line(leftMargin, yPosition, pageWidth / 2 - 35, yPosition);
  doc.line(pageWidth / 2 + 35, yPosition, rightMargin, yPosition);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  const titleText = isAnnualBulletin ? 'BULLETIN ANNUEL' : `BULLETIN ${currentSemester?.name || `SEMESTRE ${semesterNumber || 1}`}`.toUpperCase();
  doc.text(titleText, pageWidth / 2, yPosition + 1, { align: 'center' });
  
  doc.line(leftMargin, yPosition + 4, pageWidth / 2 - 35, yPosition + 4);
  doc.line(pageWidth / 2 + 35, yPosition + 4, rightMargin, yPosition + 4);
  
  yPosition += 12;

  // Student info box
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.3);
  doc.rect(leftMargin, yPosition, pageWidth - 24, 22, 'FD');
  
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  // Left column
  doc.setFont('helvetica', 'bold');
  doc.text('Étudiant:', leftMargin + 3, yPosition + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.lastname} ${student.firstname}`, leftMargin + 25, yPosition + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Né(e) le:', leftMargin + 3, yPosition + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(student.birth_date ? new Date(student.birth_date).toLocaleDateString('fr-FR') : 'N/A', leftMargin + 25, yPosition + 12);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Matricule:', leftMargin + 3, yPosition + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(student.cin_number || 'N/A', leftMargin + 25, yPosition + 18);
  
  // Right column
  const rightCol = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Année:', rightCol, yPosition + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, rightCol + 20, yPosition + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Classe:', rightCol, yPosition + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(student.classes?.name || 'N/A', rightCol + 20, yPosition + 12);
  
  if (extraData?.yearLevel) {
    doc.setFont('helvetica', 'bold');
    doc.text('Niveau:', rightCol, yPosition + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(`${extraData.yearLevel}${extraData.yearLevel === 1 ? 'ère' : 'ème'} année`, rightCol + 20, yPosition + 18);
  }
  
  yPosition += 28;

  // Grades table function
  const generateTable = (semesterData: SemesterData, label: string): number => {
    const headers = isCredit 
      ? [['Matière', 'Devoir', 'Examen', 'Moyenne', 'Crédits', 'Validation']]
      : [['Matière', 'Devoir', 'Examen', 'Moyenne', 'Coef.', 'Validation']];
    
    const tableData = semesterData.subjectGrades.map(subject => {
      const devoirGrades = subject.grades.filter(g => ['devoir', 'controle', 'test'].includes(g.grade_type));
      const examenGrades = subject.grades.filter(g => ['examen', 'exam'].includes(g.grade_type));
      
      const devoirAvg = devoirGrades.length > 0 
        ? devoirGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / devoirGrades.length 
        : null;
      const examenAvg = examenGrades.length > 0 
        ? examenGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / examenGrades.length 
        : null;
      
      return [
        subject.subjectName,
        devoirAvg !== null ? devoirAvg.toFixed(2) : '-',
        examenAvg !== null ? examenAvg.toFixed(2) : '-',
        subject.hasGrades && subject.average !== undefined ? subject.average.toFixed(2) : '-',
        isCredit ? subject.credits.toString() : subject.coefficient.toString(),
        subject.isValidated ? 'Validé' : 'Non validé'
      ];
    });

    autoTable(doc, {
      head: headers,
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, lineColor: [100, 100, 100], lineWidth: 0.2 },
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 60, halign: 'left' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 28, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Validé' ? [0, 128, 0] : [200, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    let endY = (doc as any).lastAutoTable.finalY;
    
    // Summary row
    doc.setFillColor(...primaryColor);
    doc.rect(leftMargin, endY, pageWidth - 24, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(label, leftMargin + 3, endY + 5.5);
    const avgText = `${semesterData.average.toFixed(2)}/20${isCredit ? ` • ${semesterData.validatedCredits}/${semesterData.totalCredits} crédits` : ''}`;
    doc.text(avgText, rightMargin - 3, endY + 5.5, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    
    return endY + 12;
  };

  // Generate content
  if (isAnnualBulletin && semester1 && semester2) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text('SEMESTRE 1', leftMargin, yPosition);
    yPosition += 4;
    yPosition = generateTable(semester1, 'Moyenne S1');
    
    doc.setTextColor(...accentColor);
    doc.text('SEMESTRE 2', leftMargin, yPosition);
    yPosition += 4;
    yPosition = generateTable(semester2, 'Moyenne S2');
    
    // Annual recap
    const recapData = [
      ['Semestre 1', semester1.average.toFixed(2), isCredit ? `${semester1.validatedCredits}/${semester1.totalCredits}` : '-'],
      ['Semestre 2', semester2.average.toFixed(2), isCredit ? `${semester2.validatedCredits}/${semester2.totalCredits}` : '-'],
      ['ANNÉE', (bulletinData.annualAverage || 0).toFixed(2), isCredit ? `${bulletinData.totalValidatedCredits || 0}/${bulletinData.totalCredits || 0}` : '-'],
    ];
    
    autoTable(doc, {
      head: [['Période', 'Moyenne', isCredit ? 'Crédits' : '']],
      body: recapData,
      startY: yPosition,
      theme: 'grid',
      tableWidth: 100,
      margin: { left: leftMargin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: accentColor, textColor: [255, 255, 255] },
      didParseCell: (data) => {
        if (data.row.index === 2 && data.section === 'body') {
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    yPosition = (doc as any).lastAutoTable.finalY + 5;
  } else {
    const semData = currentSemester || semester1 || semester2;
    if (semData) {
      yPosition = generateTable(semData, 'Moyenne du semestre');
    }
  }

  // Stats box
  yPosition += 3;
  const statsBoxWidth = 85;
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(...primaryColor);
  doc.rect(leftMargin, yPosition, statsBoxWidth, 18, 'FD');
  
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Absences totales:', leftMargin + 3, yPosition + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${extraData?.totalAbsences || 0}`, leftMargin + 40, yPosition + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Non justifiées:', leftMargin + 3, yPosition + 12);
  doc.setFont('helvetica', 'normal');
  const unjustified = (extraData?.totalAbsences || 0) - (extraData?.justifiedAbsences || 0);
  doc.text(`${unjustified}`, leftMargin + 40, yPosition + 12);
  
  if (settings?.show_ranking && extraData?.rank) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Classement: ${extraData.rank}/${extraData.totalStudents || '-'}`, leftMargin + 50, yPosition + 9);
  }

  // Mention/Decision box on the right
  if (settings?.show_mention || settings?.show_decision) {
    const finalAvg = bulletinData.annualAverage || currentSemester?.average || semester1?.average || 0;
    let mention = finalAvg >= 16 ? 'Très Bien' : finalAvg >= 14 ? 'Bien' : finalAvg >= 12 ? 'Assez Bien' : finalAvg >= 10 ? 'Passable' : 'Insuffisant';
    
    doc.rect(rightMargin - statsBoxWidth, yPosition, statsBoxWidth, 18, 'FD');
    doc.setFont('helvetica', 'bold');
    if (settings?.show_mention) {
      doc.text('Mention:', rightMargin - statsBoxWidth + 3, yPosition + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(mention, rightMargin - statsBoxWidth + 25, yPosition + 6);
    }
    if (settings?.show_decision) {
      const validated = isCredit 
        ? (bulletinData.totalValidatedCredits || 0) >= (bulletinData.totalCredits || 1)
        : finalAvg >= 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Décision:', rightMargin - statsBoxWidth + 3, yPosition + 12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(validated ? 0 : 200, validated ? 128 : 0, 0);
      doc.text(validated ? 'Admis(e)' : 'Ajourné(e)', rightMargin - statsBoxWidth + 25, yPosition + 12);
      doc.setTextColor(0, 0, 0);
    }
  }
  
  yPosition += 25;

  // Signature area
  doc.setFontSize(8);
  doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}`, leftMargin, yPosition);
  doc.setFont('helvetica', 'bold');
  doc.text('Le Directeur Pédagogique', rightMargin - 45, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature et cachet', rightMargin - 40, yPosition + 12);

  // Footer
  const footerY = doc.internal.pageSize.height - 12;
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(settings?.custom_footer_text || 'Document officiel - Ne pas modifier', pageWidth / 2, footerY, { align: 'center' });
};

// ==================== TEMPLATE: MODERN ====================
const generateModernBulletin = async (
  doc: jsPDF,
  bulletinData: BulletinData,
  schoolLogoBase64?: string,
  academicYear?: string
) => {
  const { student, semester1, semester2, currentSemester, semesterNumber, isAnnualBulletin, settings, extraData } = bulletinData;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const leftMargin = 15;
  const rightMargin = pageWidth - 15;
  let yPosition = 0;
  
  const isCredit = bulletinData.calculationSystem === 'credit';
  const primaryColor = hexToRgb(settings?.primary_color || '#6366f1');
  const accentColor = hexToRgb(settings?.accent_color || '#8b5cf6');

  // Header gradient band
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Accent stripe
  doc.setFillColor(...accentColor);
  doc.rect(0, 45, pageWidth, 3, 'F');

  // Logo in white circle
  if (schoolLogoBase64) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.circle(pageWidth / 2, 22, 16, 'F');
      doc.addImage(schoolLogoBase64, 'PNG', pageWidth / 2 - 12, 10, 24, 24);
    } catch (e) { console.error(e); }
  }

  yPosition = 55;

  // School name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(student.schools?.name || 'ÉTABLISSEMENT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  // Formation subtitle
  const formationText = extraData?.cycleName ? `${extraData.cycleName}${extraData.optionName ? ` • ${extraData.optionName}` : ''}` : '';
  if (formationText) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(formationText, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
  }

  // Bulletin title pill
  yPosition += 5;
  const titleText = isAnnualBulletin ? 'Bulletin Annuel' : `Bulletin ${currentSemester?.name || `Semestre ${semesterNumber || 1}`}`;
  const titleWidth = doc.getTextWidth(titleText) + 20;
  
  doc.setFillColor(...accentColor);
  doc.roundedRect((pageWidth - titleWidth) / 2, yPosition - 5, titleWidth, 12, 6, 6, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(titleText, pageWidth / 2, yPosition + 3, { align: 'center' });
  
  yPosition += 15;

  // Student info cards
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(leftMargin, yPosition, (pageWidth - 34) / 2, 28, 3, 3, 'F');
  doc.roundedRect(pageWidth / 2 + 2, yPosition, (pageWidth - 34) / 2, 28, 3, 3, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  
  // Left card
  doc.text('ÉTUDIANT', leftMargin + 5, yPosition + 6);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`${student.lastname} ${student.firstname}`, leftMargin + 5, yPosition + 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Matricule: ${student.cin_number || 'N/A'}`, leftMargin + 5, yPosition + 19);
  doc.text(`Né(e) le: ${student.birth_date ? new Date(student.birth_date).toLocaleDateString('fr-FR') : 'N/A'}`, leftMargin + 5, yPosition + 25);
  
  // Right card
  const rightCardX = pageWidth / 2 + 7;
  doc.setTextColor(100, 100, 100);
  doc.text('SCOLARITÉ', rightCardX, yPosition + 6);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(student.classes?.name || 'N/A', rightCardX, yPosition + 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Année: ${academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}`, rightCardX, yPosition + 19);
  if (extraData?.yearLevel) {
    doc.text(`Niveau: ${extraData.yearLevel}${extraData.yearLevel === 1 ? 'ère' : 'ème'} année`, rightCardX, yPosition + 25);
  }
  
  yPosition += 35;

  // Grades table function
  const generateTable = (semesterData: SemesterData, label: string): number => {
    const headers = isCredit 
      ? [['Matière', 'Contrôle', 'Examen', 'Moyenne', 'Crédits', 'Statut']]
      : [['Matière', 'Contrôle', 'Examen', 'Moyenne', 'Coef.', 'Statut']];
    
    const tableData = semesterData.subjectGrades.map(subject => {
      const devoirGrades = subject.grades.filter(g => ['devoir', 'controle', 'test'].includes(g.grade_type));
      const examenGrades = subject.grades.filter(g => ['examen', 'exam'].includes(g.grade_type));
      
      const devoirAvg = devoirGrades.length > 0 
        ? devoirGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / devoirGrades.length 
        : null;
      const examenAvg = examenGrades.length > 0 
        ? examenGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / examenGrades.length 
        : null;
      
      return [
        subject.subjectName,
        devoirAvg !== null ? devoirAvg.toFixed(2) : '-',
        examenAvg !== null ? examenAvg.toFixed(2) : '-',
        subject.hasGrades && subject.average !== undefined ? subject.average.toFixed(2) : '-',
        isCredit ? subject.credits.toString() : subject.coefficient.toString(),
        subject.isValidated ? '✓' : '✗'
      ];
    });

    autoTable(doc, {
      head: headers,
      body: tableData,
      startY: yPosition,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [249, 250, 251], textColor: primaryColor, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 60, halign: 'left' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === '✓' ? [34, 197, 94] : [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 12;
        }
        if (data.section === 'body' && data.row.index % 2 === 0) {
          data.cell.styles.fillColor = [249, 250, 251];
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'head') {
          doc.setDrawColor(...accentColor);
          doc.setLineWidth(0.5);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      }
    });

    let endY = (doc as any).lastAutoTable.finalY + 2;
    
    // Summary card
    doc.setFillColor(...primaryColor);
    doc.roundedRect(leftMargin, endY, pageWidth - 30, 12, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(label, leftMargin + 5, endY + 8);
    const avgText = `${semesterData.average.toFixed(2)}/20${isCredit ? `  •  ${semesterData.validatedCredits}/${semesterData.totalCredits} crédits validés` : ''}`;
    doc.text(avgText, rightMargin - 5, endY + 8, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    
    return endY + 18;
  };

  // Generate content
  if (isAnnualBulletin && semester1 && semester2) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text('▸ SEMESTRE 1', leftMargin, yPosition);
    yPosition += 4;
    yPosition = generateTable(semester1, 'Moyenne S1');
    
    doc.setTextColor(...accentColor);
    doc.text('▸ SEMESTRE 2', leftMargin, yPosition);
    yPosition += 4;
    yPosition = generateTable(semester2, 'Moyenne S2');
    
    // Annual summary
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(leftMargin, yPosition, 110, 30, 3, 3, 'F');
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('RÉCAPITULATIF ANNUEL', leftMargin + 5, yPosition + 7);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`${(bulletinData.annualAverage || 0).toFixed(2)}`, leftMargin + 5, yPosition + 18);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('/20', leftMargin + 25, yPosition + 18);
    
    if (isCredit) {
      doc.setFontSize(9);
      doc.text(`${bulletinData.totalValidatedCredits || 0}/${bulletinData.totalCredits || 0} crédits`, leftMargin + 5, yPosition + 26);
    }
    
    yPosition += 35;
  } else {
    const semData = currentSemester || semester1 || semester2;
    if (semData) {
      yPosition = generateTable(semData, 'Moyenne');
    }
  }

  // Bottom stats row
  yPosition += 3;
  const cardWidth = (pageWidth - 38) / 3;
  
  // Absences card
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(leftMargin, yPosition, cardWidth, 20, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setTextColor(153, 27, 27);
  doc.text('ABSENCES', leftMargin + 3, yPosition + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${extraData?.totalAbsences || 0}`, leftMargin + 3, yPosition + 14);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const unjustified = (extraData?.totalAbsences || 0) - (extraData?.justifiedAbsences || 0);
  doc.text(`dont ${unjustified} non justifiées`, leftMargin + 3, yPosition + 18);
  
  // Ranking card
  if (settings?.show_ranking && extraData?.rank) {
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(leftMargin + cardWidth + 4, yPosition, cardWidth, 20, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(6, 95, 70);
    doc.text('CLASSEMENT', leftMargin + cardWidth + 7, yPosition + 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${extraData.rank}`, leftMargin + cardWidth + 7, yPosition + 14);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`sur ${extraData.totalStudents || '-'} étudiants`, leftMargin + cardWidth + 7, yPosition + 18);
  }
  
  // Mention card
  if (settings?.show_mention) {
    const finalAvg = bulletinData.annualAverage || currentSemester?.average || 0;
    const mention = finalAvg >= 16 ? 'Très Bien' : finalAvg >= 14 ? 'Bien' : finalAvg >= 12 ? 'Assez Bien' : finalAvg >= 10 ? 'Passable' : 'Insuffisant';
    
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(leftMargin + (cardWidth + 4) * 2, yPosition, cardWidth, 20, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(30, 64, 175);
    doc.text('MENTION', leftMargin + (cardWidth + 4) * 2 + 3, yPosition + 6);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(mention, leftMargin + (cardWidth + 4) * 2 + 3, yPosition + 15);
  }

  yPosition += 28;

  // Signature
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, leftMargin, yPosition);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Direction Pédagogique', rightMargin - 40, yPosition);

  // Footer
  doc.setFillColor(...primaryColor);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(settings?.custom_footer_text || student.schools?.name || '', pageWidth / 2, pageHeight - 4, { align: 'center' });
};

// ==================== TEMPLATE: MINIMAL ====================
const generateMinimalBulletin = async (
  doc: jsPDF,
  bulletinData: BulletinData,
  schoolLogoBase64?: string,
  academicYear?: string
) => {
  const { student, semester1, semester2, currentSemester, semesterNumber, isAnnualBulletin, settings, extraData } = bulletinData;
  const pageWidth = doc.internal.pageSize.width;
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;
  let yPosition = 20;
  
  const isCredit = bulletinData.calculationSystem === 'credit';
  const primaryColor = hexToRgb(settings?.primary_color || '#18181b');

  // Minimal header - just logo and school name
  if (schoolLogoBase64) {
    try {
      doc.addImage(schoolLogoBase64, 'PNG', leftMargin, yPosition, 18, 18);
    } catch (e) { console.error(e); }
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(student.schools?.name || '', leftMargin + 25, yPosition + 8);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  const formationText = extraData?.cycleName || '';
  if (formationText) {
    doc.text(formationText, leftMargin + 25, yPosition + 14);
  }

  yPosition += 30;

  // Thin separator
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, yPosition, rightMargin, yPosition);
  
  yPosition += 10;

  // Title - simple and clean
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  const titleText = isAnnualBulletin ? 'Bulletin Annuel' : `Bulletin ${currentSemester?.name || `S${semesterNumber || 1}`}`;
  doc.text(titleText, leftMargin, yPosition);
  
  yPosition += 12;

  // Student info in clean lines
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.lastname} ${student.firstname}  •  ${student.classes?.name || ''}  •  ${academicYear || ''}`, leftMargin, yPosition);
  
  yPosition += 15;

  // Grades table
  const generateTable = (semesterData: SemesterData, label: string): number => {
    const headers = isCredit 
      ? [['', 'Devoir', 'Examen', 'Note', 'Cr.', '']]
      : [['', 'Devoir', 'Examen', 'Note', 'Co.', '']];
    
    const tableData = semesterData.subjectGrades.map(subject => {
      const devoirGrades = subject.grades.filter(g => ['devoir', 'controle', 'test'].includes(g.grade_type));
      const examenGrades = subject.grades.filter(g => ['examen', 'exam'].includes(g.grade_type));
      
      const devoirAvg = devoirGrades.length > 0 
        ? devoirGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / devoirGrades.length 
        : null;
      const examenAvg = examenGrades.length > 0 
        ? examenGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / examenGrades.length 
        : null;
      
      return [
        subject.subjectName,
        devoirAvg !== null ? devoirAvg.toFixed(1) : '—',
        examenAvg !== null ? examenAvg.toFixed(1) : '—',
        subject.hasGrades && subject.average !== undefined ? subject.average.toFixed(2) : '—',
        isCredit ? subject.credits.toString() : subject.coefficient.toString(),
        subject.isValidated ? '●' : '○'
      ];
    });

    autoTable(doc, {
      head: headers,
      body: tableData,
      startY: yPosition,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 4, textColor: [60, 60, 60] },
      headStyles: { textColor: [160, 160, 160], fontStyle: 'normal', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 70, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === '●' ? [34, 197, 94] : [200, 200, 200];
          data.cell.styles.fontSize = 10;
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body') {
          doc.setDrawColor(245, 245, 245);
          doc.setLineWidth(0.2);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      }
    });

    let endY = (doc as any).lastAutoTable.finalY + 8;
    
    // Minimal summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`${semesterData.average.toFixed(2)}/20`, leftMargin, endY);
    
    if (isCredit) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(`${semesterData.validatedCredits}/${semesterData.totalCredits} crédits`, leftMargin + 35, endY);
    }
    
    return endY + 12;
  };

  // Generate content
  if (isAnnualBulletin && semester1 && semester2) {
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text('SEMESTRE 1', leftMargin, yPosition);
    yPosition += 4;
    yPosition = generateTable(semester1, '');
    
    doc.setTextColor(160, 160, 160);
    doc.text('SEMESTRE 2', leftMargin, yPosition);
    yPosition += 4;
    yPosition = generateTable(semester2, '');
    
    // Annual total
    doc.setDrawColor(230, 230, 230);
    doc.line(leftMargin, yPosition, rightMargin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`Moyenne annuelle: ${(bulletinData.annualAverage || 0).toFixed(2)}/20`, leftMargin, yPosition);
    if (isCredit) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(`${bulletinData.totalValidatedCredits || 0}/${bulletinData.totalCredits || 0} crédits validés`, leftMargin + 80, yPosition);
    }
    yPosition += 12;
  } else {
    const semData = currentSemester || semester1 || semester2;
    if (semData) {
      yPosition = generateTable(semData, '');
    }
  }

  // Stats in minimal style
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  const unjustified = (extraData?.totalAbsences || 0) - (extraData?.justifiedAbsences || 0);
  let statsText = `${extraData?.totalAbsences || 0} absences (${unjustified} non justifiées)`;
  if (settings?.show_ranking && extraData?.rank) {
    statsText += `  •  Classement: ${extraData.rank}/${extraData.totalStudents || '-'}`;
  }
  doc.text(statsText, leftMargin, yPosition);
  
  if (settings?.show_mention) {
    const finalAvg = bulletinData.annualAverage || currentSemester?.average || 0;
    const mention = finalAvg >= 16 ? 'Très Bien' : finalAvg >= 14 ? 'Bien' : finalAvg >= 12 ? 'Assez Bien' : finalAvg >= 10 ? 'Passable' : 'Insuffisant';
    doc.text(`Mention: ${mention}`, rightMargin - 40, yPosition);
  }
  
  yPosition += 20;

  // Signature
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(new Date().toLocaleDateString('fr-FR'), leftMargin, yPosition);
  doc.text('Direction Pédagogique', rightMargin - 40, yPosition);

  // Footer - just a line
  const footerY = doc.internal.pageSize.height - 15;
  doc.setDrawColor(230, 230, 230);
  doc.line(leftMargin, footerY, rightMargin, footerY);
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(settings?.custom_footer_text || '', pageWidth / 2, footerY + 6, { align: 'center' });
};

// ==================== TEMPLATE: ELEGANT ====================
const generateElegantBulletin = async (
  doc: jsPDF,
  bulletinData: BulletinData,
  schoolLogoBase64?: string,
  academicYear?: string
) => {
  const { student, semester1, semester2, currentSemester, semesterNumber, isAnnualBulletin, settings, extraData } = bulletinData;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const leftMargin = 15;
  const rightMargin = pageWidth - 15;
  let yPosition = 12;
  
  const isCredit = bulletinData.calculationSystem === 'credit';
  const primaryColor = hexToRgb(settings?.primary_color || '#7c3aed');
  const accentColor = hexToRgb(settings?.accent_color || '#c084fc');

  // Decorative corner elements
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(2);
  // Top left
  doc.line(8, 8, 8, 25);
  doc.line(8, 8, 25, 8);
  // Top right
  doc.line(pageWidth - 8, 8, pageWidth - 8, 25);
  doc.line(pageWidth - 8, 8, pageWidth - 25, 8);
  // Bottom left
  doc.line(8, pageHeight - 8, 8, pageHeight - 25);
  doc.line(8, pageHeight - 8, 25, pageHeight - 8);
  // Bottom right
  doc.line(pageWidth - 8, pageHeight - 8, pageWidth - 8, pageHeight - 25);
  doc.line(pageWidth - 8, pageHeight - 8, pageWidth - 25, pageHeight - 8);

  // Logo centered with decorative ring
  if (schoolLogoBase64) {
    try {
      doc.setDrawColor(...accentColor);
      doc.setLineWidth(1);
      doc.circle(pageWidth / 2, yPosition + 15, 18, 'S');
      doc.addImage(schoolLogoBase64, 'PNG', pageWidth / 2 - 13, yPosition + 2, 26, 26);
    } catch (e) { console.error(e); }
  }
  
  yPosition += 35;

  // School name with elegant typography
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(student.schools?.name || 'ÉTABLISSEMENT', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 6;
  
  // Decorative line under school name
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  const lineWidth = 60;
  doc.line((pageWidth - lineWidth) / 2, yPosition, (pageWidth + lineWidth) / 2, yPosition);
  doc.circle((pageWidth - lineWidth) / 2 - 2, yPosition, 1, 'F');
  doc.circle((pageWidth + lineWidth) / 2 + 2, yPosition, 1, 'F');
  
  yPosition += 8;

  // Formation
  const formationText = extraData?.cycleName ? `${extraData.cycleName}${extraData.optionName ? ` — ${extraData.optionName}` : ''}` : '';
  if (formationText) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(formationText, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  }

  // Title with elegant border
  yPosition += 3;
  const titleText = isAnnualBulletin ? 'RELEVÉ DE NOTES ANNUEL' : `RELEVÉ DE NOTES — ${(currentSemester?.name || `SEMESTRE ${semesterNumber || 1}`).toUpperCase()}`;
  const titleWidth = 130;
  
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.rect((pageWidth - titleWidth) / 2, yPosition - 4, titleWidth, 12);
  doc.setLineWidth(0.3);
  doc.rect((pageWidth - titleWidth) / 2 + 2, yPosition - 2, titleWidth - 4, 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(titleText, pageWidth / 2, yPosition + 4, { align: 'center' });
  
  yPosition += 16;

  // Student info with elegant layout
  doc.setFillColor(252, 251, 255);
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.3);
  doc.rect(leftMargin, yPosition, pageWidth - 30, 20, 'FD');
  
  // Left side
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Étudiant(e)', leftMargin + 5, yPosition + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`${student.lastname} ${student.firstname}`, leftMargin + 5, yPosition + 12);
  doc.setFontSize(8);
  doc.text(`N° ${student.cin_number || 'N/A'}`, leftMargin + 5, yPosition + 17);
  
  // Middle
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Classe', pageWidth / 2 - 20, yPosition + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(student.classes?.name || 'N/A', pageWidth / 2 - 20, yPosition + 12);
  if (extraData?.yearLevel) {
    doc.setFontSize(8);
    doc.text(`${extraData.yearLevel}${extraData.yearLevel === 1 ? 'ère' : 'ème'} année`, pageWidth / 2 - 20, yPosition + 17);
  }
  
  // Right side
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Année scolaire', rightMargin - 45, yPosition + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, rightMargin - 45, yPosition + 12);
  
  yPosition += 28;

  // Grades table
  const generateTable = (semesterData: SemesterData, label: string): number => {
    const headers = isCredit 
      ? [['Matière', 'Contrôle continu', 'Examen', 'Moyenne', 'Crédits', 'Validation']]
      : [['Matière', 'Contrôle continu', 'Examen', 'Moyenne', 'Coef.', 'Validation']];
    
    const tableData = semesterData.subjectGrades.map(subject => {
      const devoirGrades = subject.grades.filter(g => ['devoir', 'controle', 'test'].includes(g.grade_type));
      const examenGrades = subject.grades.filter(g => ['examen', 'exam'].includes(g.grade_type));
      
      const devoirAvg = devoirGrades.length > 0 
        ? devoirGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / devoirGrades.length 
        : null;
      const examenAvg = examenGrades.length > 0 
        ? examenGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / examenGrades.length 
        : null;
      
      return [
        subject.subjectName,
        devoirAvg !== null ? devoirAvg.toFixed(2) : '—',
        examenAvg !== null ? examenAvg.toFixed(2) : '—',
        subject.hasGrades && subject.average !== undefined ? subject.average.toFixed(2) : '—',
        isCredit ? subject.credits.toString() : subject.coefficient.toString(),
        subject.isValidated ? 'Acquis' : 'Non acquis'
      ];
    });

    autoTable(doc, {
      head: headers,
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, lineColor: accentColor, lineWidth: 0.2 },
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 55, halign: 'left' },
        1: { cellWidth: 28, halign: 'center' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 28, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Acquis' ? [22, 163, 74] : [220, 38, 38];
          data.cell.styles.fontStyle = 'italic';
        }
        if (data.section === 'body' && data.row.index % 2 === 1) {
          data.cell.styles.fillColor = [252, 251, 255];
        }
      }
    });

    let endY = (doc as any).lastAutoTable.finalY;
    
    // Elegant summary row
    doc.setFillColor(...primaryColor);
    doc.rect(leftMargin, endY, pageWidth - 30, 10, 'F');
    
    // Decorative triangles
    doc.setFillColor(...accentColor);
    doc.triangle(leftMargin, endY, leftMargin + 10, endY, leftMargin, endY + 10);
    doc.triangle(rightMargin, endY, rightMargin - 10, endY, rightMargin, endY + 10);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(label, leftMargin + 15, endY + 7);
    
    const avgText = `${semesterData.average.toFixed(2)} / 20${isCredit ? `     ${semesterData.validatedCredits} / ${semesterData.totalCredits} crédits` : ''}`;
    doc.text(avgText, rightMargin - 15, endY + 7, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    return endY + 16;
  };

  // Generate content
  if (isAnnualBulletin && semester1 && semester2) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text('❖ Premier Semestre', leftMargin, yPosition);
    yPosition += 4;
    yPosition = generateTable(semester1, 'Moyenne S1');
    
    doc.setTextColor(...accentColor);
    doc.text('❖ Deuxième Semestre', leftMargin, yPosition);
    yPosition += 4;
    yPosition = generateTable(semester2, 'Moyenne S2');
    
    // Annual recap box
    doc.setFillColor(252, 251, 255);
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.rect(leftMargin, yPosition, 100, 25, 'FD');
    
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('SYNTHÈSE ANNUELLE', leftMargin + 5, yPosition + 6);
    
    doc.setFontSize(14);
    doc.text(`${(bulletinData.annualAverage || 0).toFixed(2)}`, leftMargin + 5, yPosition + 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('/ 20', leftMargin + 25, yPosition + 16);
    
    if (isCredit) {
      doc.setFontSize(8);
      doc.text(`${bulletinData.totalValidatedCredits || 0} / ${bulletinData.totalCredits || 0} crédits validés`, leftMargin + 5, yPosition + 22);
    }
    
    yPosition += 30;
  } else {
    const semData = currentSemester || semester1 || semester2;
    if (semData) {
      yPosition = generateTable(semData, 'Moyenne');
    }
  }

  // Stats and mention side by side
  yPosition += 3;
  
  // Left: Stats
  doc.setFillColor(252, 251, 255);
  doc.setDrawColor(...accentColor);
  doc.rect(leftMargin, yPosition, 60, 18, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Absences', leftMargin + 3, yPosition + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const unjustified = (extraData?.totalAbsences || 0) - (extraData?.justifiedAbsences || 0);
  doc.text(`Total: ${extraData?.totalAbsences || 0}`, leftMargin + 3, yPosition + 10);
  doc.text(`Non justifiées: ${unjustified}`, leftMargin + 3, yPosition + 15);
  
  // Middle: Ranking
  if (settings?.show_ranking && extraData?.rank) {
    doc.rect(leftMargin + 65, yPosition, 45, 18, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Classement', leftMargin + 68, yPosition + 5);
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(`${extraData.rank}`, leftMargin + 68, yPosition + 13);
    doc.setFontSize(8);
    doc.text(`/ ${extraData.totalStudents || '-'}`, leftMargin + 80, yPosition + 13);
  }
  
  // Right: Mention
  if (settings?.show_mention) {
    const finalAvg = bulletinData.annualAverage || currentSemester?.average || 0;
    const mention = finalAvg >= 16 ? 'Très Bien' : finalAvg >= 14 ? 'Bien' : finalAvg >= 12 ? 'Assez Bien' : finalAvg >= 10 ? 'Passable' : 'Insuffisant';
    
    doc.rect(rightMargin - 55, yPosition, 55, 18, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Mention obtenue', rightMargin - 52, yPosition + 5);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(mention, rightMargin - 52, yPosition + 13);
  }

  yPosition += 26;

  // Signature area with elegant style
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}`, leftMargin, yPosition);
  
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...primaryColor);
  doc.text('Le Directeur Pédagogique', rightMargin - 45, yPosition);
  doc.setDrawColor(...accentColor);
  doc.line(rightMargin - 55, yPosition + 3, rightMargin - 5, yPosition + 3);

  // Footer
  const footerY = pageHeight - 12;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(settings?.custom_footer_text || 'Document à valeur officielle uniquement avec cachet et signature', pageWidth / 2, footerY, { align: 'center' });
};

// ==================== MAIN EXPORT FUNCTIONS ====================
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

export const generateLMDBulletinInDoc = async (
  doc: jsPDF,
  bulletinData: BulletinData,
  schoolLogoBase64?: string,
  academicYear?: string
) => {
  const templateStyle = bulletinData.settings?.template_style || 'classic';
  
  switch (templateStyle) {
    case 'modern':
      return generateModernBulletin(doc, bulletinData, schoolLogoBase64, academicYear);
    case 'minimal':
      return generateMinimalBulletin(doc, bulletinData, schoolLogoBase64, academicYear);
    case 'elegant':
      return generateElegantBulletin(doc, bulletinData, schoolLogoBase64, academicYear);
    case 'classic':
    default:
      return generateClassicBulletin(doc, bulletinData, schoolLogoBase64, academicYear);
  }
};

// Legacy functions for compatibility
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

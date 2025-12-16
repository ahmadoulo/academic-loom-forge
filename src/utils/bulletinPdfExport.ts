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
  const marginX = 12;
  const left = marginX;
  const right = pageWidth - marginX;
  let y = 10;

  const isCredit = bulletinData.calculationSystem === 'credit';
  const primary = hexToRgb(settings?.primary_color || '#1a365d');
  const accent = hexToRgb(settings?.accent_color || '#c53030');

  // Page border (simple)
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.3);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // Header band (simple, official)
  doc.setFillColor(245, 245, 245);
  doc.rect(8, 8, pageWidth - 16, 26, 'F');
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.8);
  doc.line(8, 34, pageWidth - 8, 34);

  // Logo (left)
  if (schoolLogoBase64) {
    try {
      doc.addImage(schoolLogoBase64, 'PNG', left, 12, 18, 18);
    } catch (e) {
      console.error(e);
    }
  }

  // School name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primary);
  doc.text(student.schools?.name || 'ÉTABLISSEMENT', pageWidth / 2, 18, { align: 'center' });

  // Academic year (top-right)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `Année scolaire : ${academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}`,
    right,
    16,
    { align: 'right' }
  );

  // Formation (subtitle)
  const formationText = extraData?.cycleName
    ? `${extraData.cycleName}${extraData.optionName ? ` - ${extraData.optionName}` : ''}`
    : '';
  if (formationText) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(formationText, pageWidth / 2, 26, { align: 'center' });
  }

  y = 44;

  // Title
  const titleText = isAnnualBulletin
    ? 'BULLETIN ANNUEL'
    : `BULLETIN ${currentSemester?.name || `SEMESTRE ${semesterNumber || 1}`}`.toUpperCase();

  doc.setDrawColor(...accent);
  doc.setLineWidth(0.6);
  doc.rect(left, y - 8, right - left, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(titleText, pageWidth / 2, y - 1, { align: 'center' });

  y += 8;

  // Student info as a small official table
  const studentInfoRows: [string, string][] = [
    ['Étudiant', `${student.lastname} ${student.firstname}`],
    ['Classe', student.classes?.name || '—'],
    ['Matricule', student.cin_number || '—'],
  ];
  if (student.birth_date) {
    studentInfoRows.push(['Date de naissance', new Date(student.birth_date).toLocaleDateString('fr-FR')]);
  }
  if (extraData?.yearLevel) {
    studentInfoRows.push([
      'Niveau',
      `${extraData.yearLevel}${extraData.yearLevel === 1 ? 'ère' : 'ème'} année`,
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Informations', '']],
    body: studentInfoRows,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: [120, 120, 120], lineWidth: 0.2 },
    headStyles: { fillColor: [245, 245, 245], textColor: primary, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: right - left - 45 },
    },
    margin: { left, right: left },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  const renderSemesterTable = (semesterData: SemesterData, label: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primary);
    doc.text(label, left, y);
    y += 4;

    const headers = isCredit
      ? [['Matière', 'Devoir', 'Examen', 'Moyenne', 'Crédits', 'Validation']]
      : [['Matière', 'Devoir', 'Examen', 'Moyenne', 'Coef.', 'Validation']];

    const body = semesterData.subjectGrades.map((subject) => {
      const devoirGrades = subject.grades.filter((g) => ['devoir', 'controle', 'test'].includes(g.grade_type));
      const examenGrades = subject.grades.filter((g) => ['examen', 'exam'].includes(g.grade_type));

      const devoirAvg =
        devoirGrades.length > 0
          ? devoirGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / devoirGrades.length
          : null;
      const examenAvg =
        examenGrades.length > 0
          ? examenGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / examenGrades.length
          : null;

      return [
        subject.subjectName,
        devoirAvg !== null ? devoirAvg.toFixed(2) : '—',
        examenAvg !== null ? examenAvg.toFixed(2) : '—',
        subject.hasGrades && subject.average !== undefined ? subject.average.toFixed(2) : '—',
        isCredit ? String(subject.credits) : String(subject.coefficient),
        subject.isValidated ? 'Validé' : 'Non validé',
      ];
    });

    autoTable(doc, {
      startY: y,
      head: headers,
      body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, lineColor: [120, 120, 120], lineWidth: 0.2 },
      headStyles: { fillColor: [235, 235, 235], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 58 },
        1: { cellWidth: 21, halign: 'center' },
        2: { cellWidth: 21, halign: 'center' },
        3: { cellWidth: 21, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 26, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'head') return;
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Validé' ? [0, 128, 0] : [200, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left, right: left },
    });

    y = (doc as any).lastAutoTable.finalY + 2;

    // Semester summary mini-table (official)
    const summaryRows: [string, string][] = [
      ['Moyenne', `${semesterData.average.toFixed(2)}/20`],
    ];
    if (isCredit) {
      summaryRows.push(['Crédits validés / Total', `${semesterData.validatedCredits}/${semesterData.totalCredits}`]);
    }

    autoTable(doc, {
      startY: y,
      head: [['Synthèse', '']],
      body: summaryRows,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.3, lineColor: [120, 120, 120], lineWidth: 0.2 },
      headStyles: { fillColor: accent, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
      },
      margin: { left, right: left },
      tableWidth: 90,
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  };

  if (isAnnualBulletin && semester1 && semester2) {
    renderSemesterTable(semester1, 'Semestre 1');
    renderSemesterTable(semester2, 'Semestre 2');

    // Annual recap mini-table
    const recapRows: [string, string][] = [
      ['Moyenne annuelle', `${(bulletinData.annualAverage || 0).toFixed(2)}/20`],
    ];
    if (isCredit) {
      recapRows.push([
        'Crédits validés / Total',
        `${bulletinData.totalValidatedCredits || 0}/${bulletinData.totalCredits || 0}`,
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [['Récapitulatif', '']],
      body: recapRows,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.3, lineColor: [120, 120, 120], lineWidth: 0.2 },
      headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
      },
      margin: { left, right: left },
      tableWidth: 90,
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  } else {
    const semData = currentSemester || semester1 || semester2;
    if (semData) {
      renderSemesterTable(semData, 'Notes du semestre');
    }
  }

  // Stats + mention/decision as a simple mini-table (no cards)
  const unjustified = (extraData?.totalAbsences || 0) - (extraData?.justifiedAbsences || 0);
  const finalAvg = bulletinData.annualAverage || currentSemester?.average || semester1?.average || 0;
  const mention =
    finalAvg >= 16
      ? 'Très Bien'
      : finalAvg >= 14
        ? 'Bien'
        : finalAvg >= 12
          ? 'Assez Bien'
          : finalAvg >= 10
            ? 'Passable'
            : 'Insuffisant';

  const validated = isCredit
    ? (bulletinData.totalValidatedCredits || 0) >= (bulletinData.totalCredits || 1)
    : finalAvg >= 10;

  const statsRows: [string, string][] = [
    ['Absences (total)', String(extraData?.totalAbsences || 0)],
    ['Absences non justifiées', String(unjustified)],
  ];
  if (settings?.show_ranking && extraData?.rank) {
    statsRows.push(['Classement', `${extraData.rank}/${extraData.totalStudents || '-'}`]);
  }
  if (settings?.show_mention) {
    statsRows.push(['Mention', mention]);
  }
  if (settings?.show_decision) {
    statsRows.push(['Décision', validated ? 'Admis(e)' : 'Ajourné(e)']);
  }

  autoTable(doc, {
    startY: Math.min(y, pageHeight - 55),
    head: [['Informations complémentaires', '']],
    body: statsRows,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.3, lineColor: [120, 120, 120], lineWidth: 0.2 },
    headStyles: { fillColor: [245, 245, 245], textColor: primary, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 60 },
    },
    margin: { left, right: left },
    tableWidth: 120,
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Signature
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}`, left, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Le Directeur Pédagogique', right, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('Signature et cachet', right, y + 12, { align: 'right' });

  // Footer (simple)
  const footerY = pageHeight - 10;
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(settings?.custom_footer_text || 'Document officiel', pageWidth / 2, footerY, { align: 'center' });
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
  const left = 12;
  const right = pageWidth - 12;
  let y = 12;

  const isCredit = bulletinData.calculationSystem === 'credit';
  const primary = hexToRgb(settings?.primary_color || '#1a365d');
  const accent = hexToRgb(settings?.accent_color || '#c53030');

  // Thin double frame (traditional, not flashy)
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.8);
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
  doc.setLineWidth(0.3);
  doc.rect(9, 9, pageWidth - 18, pageHeight - 18);

  // Header (logo + school name)
  if (schoolLogoBase64) {
    try {
      doc.addImage(schoolLogoBase64, 'PNG', left, y, 18, 18);
    } catch (e) {
      console.error(e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...primary);
  doc.text(student.schools?.name || 'ÉTABLISSEMENT', pageWidth / 2, y + 7, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `Année scolaire : ${academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}`,
    right,
    y + 6,
    { align: 'right' }
  );

  // Formation
  const formationText = extraData?.cycleName
    ? `${extraData.cycleName}${extraData.optionName ? ` - ${extraData.optionName}` : ''}`
    : '';
  if (formationText) {
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(formationText, pageWidth / 2, y + 15, { align: 'center' });
  }

  y += 28;

  // Title (traditional box)
  const titleText = isAnnualBulletin
    ? 'RELEVÉ DE NOTES - ANNUEL'
    : `RELEVÉ DE NOTES - ${(currentSemester?.name || `SEMESTRE ${semesterNumber || 1}`).toUpperCase()}`;

  doc.setDrawColor(...accent);
  doc.setLineWidth(0.6);
  doc.rect(left, y, right - left, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(titleText, pageWidth / 2, y + 6.5, { align: 'center' });

  y += 14;

  // Student info mini-table
  const studentInfoRows: [string, string][] = [
    ['Nom et prénom', `${student.lastname} ${student.firstname}`],
    ['Classe', student.classes?.name || '—'],
    ['Matricule', student.cin_number || '—'],
  ];
  if (extraData?.yearLevel) {
    studentInfoRows.push([
      'Niveau',
      `${extraData.yearLevel}${extraData.yearLevel === 1 ? 'ère' : 'ème'} année`,
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Élève', '']],
    body: studentInfoRows,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: [120, 120, 120], lineWidth: 0.2 },
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: right - left - 45 },
    },
    margin: { left, right: left },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  const renderSemester = (semesterData: SemesterData, label: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primary);
    doc.text(label, left, y);
    y += 4;

    const headers = isCredit
      ? [['Matière', 'Devoir', 'Examen', 'Moyenne', 'Crédits', 'Validation']]
      : [['Matière', 'Devoir', 'Examen', 'Moyenne', 'Coef.', 'Validation']];

    const body = semesterData.subjectGrades.map((subject) => {
      const devoirGrades = subject.grades.filter((g) => ['devoir', 'controle', 'test'].includes(g.grade_type));
      const examenGrades = subject.grades.filter((g) => ['examen', 'exam'].includes(g.grade_type));

      const devoirAvg =
        devoirGrades.length > 0
          ? devoirGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / devoirGrades.length
          : null;
      const examenAvg =
        examenGrades.length > 0
          ? examenGrades.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / examenGrades.length
          : null;

      return [
        subject.subjectName,
        devoirAvg !== null ? devoirAvg.toFixed(2) : '—',
        examenAvg !== null ? examenAvg.toFixed(2) : '—',
        subject.hasGrades && subject.average !== undefined ? subject.average.toFixed(2) : '—',
        isCredit ? String(subject.credits) : String(subject.coefficient),
        subject.isValidated ? 'Validé' : 'Non validé',
      ];
    });

    autoTable(doc, {
      startY: y,
      head: headers,
      body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.2, lineColor: [120, 120, 120], lineWidth: 0.2 },
      headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 58 },
        1: { cellWidth: 21, halign: 'center' },
        2: { cellWidth: 21, halign: 'center' },
        3: { cellWidth: 21, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 26, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index % 2 === 1) {
          data.cell.styles.fillColor = [250, 250, 250];
        }
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Validé' ? [0, 128, 0] : [200, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left, right: left },
    });

    y = (doc as any).lastAutoTable.finalY + 2;

    // Summary mini-table
    const summaryRows: [string, string][] = [['Moyenne', `${semesterData.average.toFixed(2)}/20`]];
    if (isCredit) {
      summaryRows.push(['Crédits validés / Total', `${semesterData.validatedCredits}/${semesterData.totalCredits}`]);
    }

    autoTable(doc, {
      startY: y,
      head: [['Synthèse', '']],
      body: summaryRows,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.3, lineColor: [120, 120, 120], lineWidth: 0.2 },
      headStyles: { fillColor: accent, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
      },
      margin: { left, right: left },
      tableWidth: 90,
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  };

  if (isAnnualBulletin && semester1 && semester2) {
    renderSemester(semester1, 'Semestre 1');
    renderSemester(semester2, 'Semestre 2');

    const recapRows: [string, string][] = [['Moyenne annuelle', `${(bulletinData.annualAverage || 0).toFixed(2)}/20`]];
    if (isCredit) {
      recapRows.push([
        'Crédits validés / Total',
        `${bulletinData.totalValidatedCredits || 0}/${bulletinData.totalCredits || 0}`,
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [['Récapitulatif annuel', '']],
      body: recapRows,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.3, lineColor: [120, 120, 120], lineWidth: 0.2 },
      headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
      },
      margin: { left, right: left },
      tableWidth: 90,
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  } else {
    const semData = currentSemester || semester1 || semester2;
    if (semData) {
      renderSemester(semData, 'Notes du semestre');
    }
  }

  // Complementary info table
  const unjustified = (extraData?.totalAbsences || 0) - (extraData?.justifiedAbsences || 0);
  const finalAvg = bulletinData.annualAverage || currentSemester?.average || semester1?.average || 0;
  const mention =
    finalAvg >= 16
      ? 'Très Bien'
      : finalAvg >= 14
        ? 'Bien'
        : finalAvg >= 12
          ? 'Assez Bien'
          : finalAvg >= 10
            ? 'Passable'
            : 'Insuffisant';

  const validated = isCredit
    ? (bulletinData.totalValidatedCredits || 0) >= (bulletinData.totalCredits || 1)
    : finalAvg >= 10;

  const infoRows: [string, string][] = [
    ['Absences (total)', String(extraData?.totalAbsences || 0)],
    ['Absences non justifiées', String(unjustified)],
  ];
  if (settings?.show_ranking && extraData?.rank) {
    infoRows.push(['Classement', `${extraData.rank}/${extraData.totalStudents || '-'}`]);
  }
  if (settings?.show_mention) {
    infoRows.push(['Mention', mention]);
  }
  if (settings?.show_decision) {
    infoRows.push(['Décision', validated ? 'Admis(e)' : 'Ajourné(e)']);
  }

  autoTable(doc, {
    startY: Math.min(y, pageHeight - 55),
    head: [['Informations', '']],
    body: infoRows,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.3, lineColor: [120, 120, 120], lineWidth: 0.2 },
    headStyles: { fillColor: [245, 245, 245], textColor: primary, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 60 },
    },
    margin: { left, right: left },
    tableWidth: 120,
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Signature
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}`, left, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Le Directeur Pédagogique', right, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('Signature et cachet', right, y + 12, { align: 'right' });

  // Footer
  const footerY = pageHeight - 10;
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(settings?.custom_footer_text || 'Document officiel', pageWidth / 2, footerY, { align: 'center' });
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

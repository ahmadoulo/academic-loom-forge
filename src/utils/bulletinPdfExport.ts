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
  const leftMargin = 15;
  const rightMargin = pageWidth - 15;
  let yPosition = 10;
  
  const isCredit = bulletinData.calculationSystem === 'credit';
  const showMention = settings?.show_mention !== false;
  const showDecision = settings?.show_decision !== false;
  const showRanking = settings?.show_ranking !== false;
  
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
  
  // ===== TITRE ENCADRÉ =====
  doc.setFillColor(51, 51, 51);
  const titleBoxWidth = 120;
  const titleBoxX = (pageWidth - titleBoxWidth) / 2;
  doc.rect(titleBoxX, yPosition, titleBoxWidth, 10, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('BULLETIN DE NOTES', pageWidth / 2, yPosition + 7, { align: 'center' });
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
    doc.text(formationText, pageWidth / 2, yPosition, { align: 'center' });
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
    
    // En-têtes du tableau - SANS la colonne Code
    const headers = isCredit 
      ? [['Modules', 'Devoir', 'Examen', 'Moyenne', 'Crédits', 'Rslt']]
      : [['Modules', 'Devoir', 'Examen', 'Moyenne', 'Coef.', 'Rslt']];
    
    // Préparer les données
    const tableData: any[][] = [];
    
    semesterData.subjectGrades.forEach((subject) => {
      // Calculer moyenne des devoirs et examens depuis les notes
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
    
    autoTable(doc, {
      head: headers,
      body: tableData,
      startY: startY,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 75, halign: 'left' }, // Modules (plus large sans Code)
        1: { cellWidth: 22, halign: 'center' }, // Devoir
        2: { cellWidth: 22, halign: 'center' }, // Examen
        3: { cellWidth: 22, halign: 'center' }, // Moyenne
        4: { cellWidth: 20, halign: 'center' }, // Credits/Coef
        5: { cellWidth: 16, halign: 'center' }, // Rslt
      },
      didParseCell: (data) => {
        // Colorer la colonne Rslt
        if (data.column.index === 5 && data.section === 'body') {
          const cellText = data.cell.raw as string;
          if (cellText === 'V') {
            data.cell.styles.textColor = [0, 100, 0];
            data.cell.styles.fontStyle = 'bold';
          } else if (cellText === 'NV') {
            data.cell.styles.textColor = [180, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    let tableEndY = (doc as any).lastAutoTable.finalY;
    
    // Ligne de moyenne semestrielle
    const avgRowY = tableEndY;
    doc.setFillColor(180, 180, 180);
    doc.rect(leftMargin, avgRowY, pageWidth - 30, 7, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(leftMargin, avgRowY, pageWidth - 30, 7, 'S');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    const labelText = semesterLabel || 'Moyenne semestrielle';
    doc.text(labelText, leftMargin + 3, avgRowY + 5);
    
    // Moyenne + crédits à droite
    const avgText = `${semesterData.average.toFixed(2)}/20`;
    doc.text(avgText, rightMargin - 30, avgRowY + 5);
    
    return avgRowY + 10;
  };
  
  // ===== GÉNÉRATION DU CONTENU =====
  if (isAnnualBulletin && semester1 && semester2) {
    // BULLETIN ANNUEL - Afficher les deux semestres
    yPosition = generateGradesTable(semester1, 'Moyenne semestrielle');
    yPosition += 5;
    yPosition = generateGradesTable(semester2, 'Moyenne semestrielle');
    yPosition += 8;
    
    // RÉCAPITULATIF ANNUEL
    const recapData = [
      ['Moyenne générale', isCredit ? 'Moyenne' : 'Moyenne', isCredit ? 'Crédits' : ''],
      ['Moyenne Semestre 1', semester1.average.toFixed(2), isCredit ? `${semester1.validatedCredits}/${semester1.totalCredits}` : ''],
      ['Moyenne Semestre 2', semester2.average.toFixed(2), isCredit ? `${semester2.validatedCredits}/${semester2.totalCredits}` : ''],
      ['Moyenne annuelle', (bulletinData.annualAverage || 0).toFixed(2), isCredit ? `${bulletinData.totalValidatedCredits || 0}/${bulletinData.totalCredits || 0}` : ''],
    ];
    
    if (showDecision) {
      const isValidated = isCredit 
        ? ((bulletinData.totalValidatedCredits || 0) >= (bulletinData.totalCredits || 0) && (bulletinData.totalCredits || 0) > 0)
        : ((bulletinData.annualAverage || 0) >= 10);
      const decision = isValidated ? 'Année validée' : 'Année non validée';
      recapData.push(['Décision:', decision, '']);
    }
    
    autoTable(doc, {
      body: recapData,
      startY: yPosition,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        halign: 'left',
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.row.index === 0) {
          data.cell.styles.fillColor = [200, 200, 200];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.row.index === 3) {
          data.cell.styles.fillColor = [230, 230, 230];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 5;
    
  } else if (currentSemester || semester1 || semester2) {
    // BULLETIN SEMESTRIEL
    const semData = currentSemester || semester1 || semester2;
    if (semData) {
      yPosition = generateGradesTable(semData, 'Moyenne semestrielle');
      yPosition += 5;
      
      // Récapitulatif simple pour bulletin semestriel
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
        
        if (showMention) {
          recapRows.push(['Mention:', mention]);
        }
        if (showDecision) {
          recapRows.push(['Décision:', isValidated ? 'Semestre validé' : 'Semestre non validé']);
        }
        
        if (recapRows.length > 0) {
          autoTable(doc, {
            body: recapRows,
            startY: yPosition,
            theme: 'plain',
            styles: {
              fontSize: 9,
              cellPadding: 2,
            },
            columnStyles: {
              0: { cellWidth: 40, fontStyle: 'bold' },
              1: { cellWidth: 60 },
            },
          });
          yPosition = (doc as any).lastAutoTable.finalY + 5;
        }
      }
    }
  }
  
  // ===== ABSENCES ET CLASSEMENT =====
  yPosition += 5;
  
  // Créer un petit tableau pour absences et classement
  const statsData: any[][] = [];
  
  if (extraData?.totalAbsences !== undefined) {
    const unjustified = (extraData.totalAbsences || 0) - (extraData.justifiedAbsences || 0);
    statsData.push(['Nombre d\'absences:', `${extraData.totalAbsences}`, 'Non justifiées:', `${unjustified}`]);
  }
  
  if (showRanking && extraData?.rank) {
    statsData.push(['Classement:', `${extraData.rank} / ${extraData.totalStudents || '-'}`, '', '']);
  }
  
  if (statsData.length > 0) {
    autoTable(doc, {
      body: statsData,
      startY: yPosition,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 25 },
        2: { cellWidth: 40, fontStyle: 'bold' },
        3: { cellWidth: 25 },
      },
    });
    yPosition = (doc as any).lastAutoTable.finalY + 8;
  }
  
  // ===== DATE ET SIGNATURE =====
  yPosition += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date   ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, leftMargin, yPosition);
  
  // Signature à droite
  doc.setFont('helvetica', 'bold');
  doc.text('Le Directeur Pédagogique', rightMargin - 50, yPosition);
  
  // ===== FOOTER =====
  const footerY = doc.internal.pageSize.height - 15;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);
  
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

import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface MissingDocumentExcelData {
  schoolName: string;
  academicYear: string;
  className: string;
  students: {
    fullName: string;
    className: string;
    cycleName?: string;
    yearLevel?: number;
    missingDocuments: string[];
    missingCount: number;
    totalRequired: number;
    totalAcquired: number;
  }[];
  generatedAt: Date;
}

export const exportMissingDocumentsToExcel = (data: MissingDocumentExcelData): boolean => {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Prepare data for main sheet
  const rows: any[][] = [];

  // Header info
  rows.push([data.schoolName]);
  rows.push([`Année scolaire: ${data.academicYear}`]);
  rows.push([`Classe: ${data.className}`]);
  rows.push([`Date d'export: ${format(data.generatedAt, 'dd/MM/yyyy HH:mm')}`]);
  rows.push([]); // Empty row

  // Column headers
  rows.push([
    'N°',
    'Nom complet',
    'Classe',
    'Cycle',
    'Année d\'étude',
    'Documents acquis',
    'Documents requis',
    'Documents manquants',
    'Taux complétion (%)',
    'Liste documents manquants'
  ]);

  // Data rows
  data.students.forEach((student, index) => {
    const completionRate = student.totalRequired > 0
      ? Math.round((student.totalAcquired / student.totalRequired) * 100)
      : 100;

    rows.push([
      index + 1,
      student.fullName,
      student.className,
      student.cycleName || '-',
      student.yearLevel ? `Année ${student.yearLevel}` : '-',
      student.totalAcquired,
      student.totalRequired,
      student.missingCount,
      completionRate,
      student.missingDocuments.join(', ') || 'Aucun'
    ]);
  });

  // Add summary row
  rows.push([]); // Empty row
  const totalStudents = data.students.length;
  const totalMissing = data.students.reduce((sum, s) => sum + s.missingCount, 0);
  const avgCompletion = data.students.length > 0
    ? Math.round(
        data.students.reduce((sum, s) => {
          const rate = s.totalRequired > 0 ? (s.totalAcquired / s.totalRequired) * 100 : 100;
          return sum + rate;
        }, 0) / data.students.length
      )
    : 100;

  rows.push(['RÉSUMÉ']);
  rows.push(['Total étudiants:', totalStudents]);
  rows.push(['Total documents manquants:', totalMissing]);
  rows.push(['Taux de complétion moyen:', `${avgCompletion}%`]);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // N°
    { wch: 30 },  // Nom
    { wch: 20 },  // Classe
    { wch: 20 },  // Cycle
    { wch: 15 },  // Année
    { wch: 15 },  // Acquis
    { wch: 15 },  // Requis
    { wch: 15 },  // Manquants
    { wch: 15 },  // Taux
    { wch: 50 },  // Liste
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Documents Manquants');

  // Create a summary by class sheet if showing all classes
  const uniqueClasses = [...new Set(data.students.map(s => s.className))];
  if (uniqueClasses.length > 1) {
    const summaryRows: any[][] = [];
    summaryRows.push(['Résumé par Classe']);
    summaryRows.push([]);
    summaryRows.push(['Classe', 'Étudiants', 'Docs Manquants', 'Taux Complétion (%)']);

    uniqueClasses.sort().forEach(className => {
      const classStudents = data.students.filter(s => s.className === className);
      const classMissing = classStudents.reduce((sum, s) => sum + s.missingCount, 0);
      const classCompletion = classStudents.length > 0
        ? Math.round(
            classStudents.reduce((sum, s) => {
              const rate = s.totalRequired > 0 ? (s.totalAcquired / s.totalRequired) * 100 : 100;
              return sum + rate;
            }, 0) / classStudents.length
          )
        : 100;

      summaryRows.push([className, classStudents.length, classMissing, classCompletion]);
    });

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
    summaryWs['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Résumé par Classe');
  }

  // Generate filename and save
  const classSlug = data.className.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const fileName = `Dossiers_Administratifs_${classSlug}_${format(data.generatedAt, 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);

  return true;
};

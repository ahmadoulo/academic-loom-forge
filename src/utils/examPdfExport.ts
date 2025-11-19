import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { imageUrlToBase64 } from './imageToBase64';

interface ExamExportData {
  examType: string;
  subject: string;
  className: string;
  teacherName: string;
  semester: string;
  schoolYear: string;
  documentsAllowed: boolean;
  duration: number;
  questions: Array<{
    question_number: number;
    question_text: string;
    points: number;
    has_choices: boolean;
    is_multiple_choice: boolean;
    answers?: Array<{
      answer_text: string;
      is_correct: boolean;
    }>;
  }>;
  schoolLogoUrl?: string;
  schoolName: string;
}

const getExamTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'devoir_surveille': 'Devoir Surveillé',
    'controle': 'Contrôle',
    'examen': 'Examen'
  };
  return labels[type] || type;
};

export const exportExamToPDF = async (data: ExamExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPosition = 20;

  // Logo centré en haut
  if (data.schoolLogoUrl) {
    try {
      const logoBase64 = await imageUrlToBase64(data.schoolLogoUrl);
      const logoWidth = 30;
      const logoHeight = 30;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoBase64, 'PNG', logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 10;
    } catch (error) {
      console.error('Erreur lors du chargement du logo:', error);
      yPosition += 10;
    }
  }

  // Nom de l'école
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.schoolName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Type d'examen + Semestre + Année scolaire
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const examTitle = `${getExamTypeLabel(data.examType)} - ${data.semester}`;
  doc.text(examTitle, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  doc.setFontSize(12);
  doc.text(`Année scolaire: ${data.schoolYear}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Informations sur l'examen
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const infoLines = [
    `Matière: ${data.subject}`,
    `Classe: ${data.className}`,
    `Enseignant: ${data.teacherName}`,
    `Durée: ${data.duration} minutes`,
    `Documents: ${data.documentsAllowed ? 'Autorisés' : 'Non autorisés'}`
  ];

  infoLines.forEach(line => {
    doc.text(line, margin, yPosition);
    yPosition += 7;
  });

  yPosition += 5;
  
  // Ligne de séparation
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Questions
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');

  const totalPoints = data.questions.reduce((sum, q) => sum + q.points, 0);
  doc.text(`Questions (Total: ${totalPoints} points)`, margin, yPosition);
  yPosition += 10;

  doc.setFont('helvetica', 'normal');

  data.questions.forEach((question, index) => {
    // Vérifier s'il faut ajouter une nouvelle page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    // Numéro et points de la question
    doc.setFont('helvetica', 'bold');
    doc.text(`Question ${question.question_number} (${question.points} point${question.points > 1 ? 's' : ''})`, margin, yPosition);
    yPosition += 7;

    // Énoncé de la question
    doc.setFont('helvetica', 'normal');
    const questionLines = doc.splitTextToSize(question.question_text, pageWidth - 2 * margin);
    questionLines.forEach((line: string) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });

    yPosition += 3;

    // Réponses si présentes
    if (question.has_choices && question.answers && question.answers.length > 0) {
      question.answers.forEach((answer, aIndex) => {
        if (yPosition > pageHeight - 25) {
          doc.addPage();
          yPosition = 20;
        }
        const letter = String.fromCharCode(97 + aIndex); // a, b, c, d...
        const answerText = `${letter}) ${answer.answer_text}`;
        const answerLines = doc.splitTextToSize(answerText, pageWidth - 2 * margin - 5);
        answerLines.forEach((line: string) => {
          doc.text(line, margin + 5, yPosition);
          yPosition += 6;
        });
      });
      yPosition += 3;
    } else {
      // Espace pour la réponse
      yPosition += 20;
    }

    yPosition += 5;
  });

  // Footer avec date
  const today = new Date().toLocaleDateString('fr-FR');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Document généré le ${today}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Sauvegarder le PDF
  const fileName = `${getExamTypeLabel(data.examType)}_${data.subject}_${data.className}_${today}.pdf`;
  doc.save(fileName);
};

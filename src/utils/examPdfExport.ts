import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';

interface ExamDocument {
  id: string;
  exam_type: string;
  duration_minutes: number;
  documents_allowed: boolean;
  subjects?: { name: string };
  classes?: { name: string };
  teachers?: { firstname: string; lastname: string };
  school_semester_id: string | null;
  school_year_id: string;
}

interface ExamQuestion {
  id: string;
  question_number: number;
  question_text: string;
  points: number;
  has_choices: boolean;
  is_multiple_choice: boolean;
  answers?: Array<{
    answer_text: string;
    is_correct: boolean;
  }>;
}

export const exportExamPDF = async (
  document: ExamDocument,
  questions: ExamQuestion[],
  schoolId: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 20;

  // Fetch school info
  const { data: school } = await supabase
    .from('schools')
    .select('name, logo_url, address, phone')
    .eq('id', schoolId)
    .single();

  // Fetch semester and year info
  let semesterName = '';
  let yearName = '';
  
  if (document.school_semester_id) {
    const { data: semester } = await supabase
      .from('school_semester')
      .select('name')
      .eq('id', document.school_semester_id)
      .single();
    semesterName = semester?.name || '';
  }

  if (document.school_year_id) {
    const { data: year } = await supabase
      .from('school_years')
      .select('name')
      .eq('id', document.school_year_id)
      .single();
    yearName = year?.name || '';
  }

  // Add logo if available
  if (school?.logo_url) {
    try {
      const response = await fetch(school.logo_url);
      const blob = await response.blob();
      const reader = new FileReader();
      
      await new Promise((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          doc.addImage(base64, 'PNG', pageWidth / 2 - 15, yPos, 30, 30);
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
      
      yPos += 35;
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }

  // School name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(school?.name || '', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Exam type and semester
  doc.setFontSize(14);
  const examTypeLabel = document.exam_type === 'devoir_surveille' ? 'Devoir surveillé' :
                        document.exam_type === 'controle' ? 'Contrôle' : 'Examen';
  doc.text(`${examTypeLabel}${semesterName ? ' - ' + semesterName : ''}${yearName ? ' - ' + yearName : ''}`, 
           pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Subject and class
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Matière: ${document.subjects?.name || ''}`, margin, yPos);
  yPos += 7;
  doc.text(`Classe: ${document.classes?.name || ''}`, margin, yPos);
  yPos += 7;

  // Teacher name
  if (document.teachers) {
    doc.text(`Enseignant: ${document.teachers.firstname} ${document.teachers.lastname}`, margin, yPos);
    yPos += 7;
  }

  // Duration and documents
  doc.text(`Durée: ${document.duration_minutes} minutes`, margin, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(`Documents ${document.documents_allowed ? 'autorisés' : 'non autorisés'}`, margin, yPos);
  yPos += 15;

  // Draw line
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Questions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);

  for (const question of questions) {
    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    // Question header
    const questionHeader = `Question ${question.question_number} (${question.points} point${question.points > 1 ? 's' : ''})`;
    doc.text(questionHeader, margin, yPos);
    yPos += 7;

    // Question text
    doc.setFont('helvetica', 'normal');
    const splitText = doc.splitTextToSize(question.question_text, pageWidth - 2 * margin);
    doc.text(splitText, margin, yPos);
    yPos += splitText.length * 5 + 5;

    // Answers if QCM
    if (question.has_choices && question.answers && question.answers.length > 0) {
      yPos += 3;
      question.answers.forEach((answer, index) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }
        
        const letter = String.fromCharCode(65 + index);
        const answerText = `${letter}) ${answer.answer_text}`;
        const splitAnswer = doc.splitTextToSize(answerText, pageWidth - 2 * margin - 10);
        doc.text(splitAnswer, margin + 5, yPos);
        yPos += splitAnswer.length * 5 + 2;
      });
      yPos += 5;
    } else {
      // Add answer space for direct response
      yPos += 20;
      doc.setLineWidth(0.3);
      for (let i = 0; i < 3; i++) {
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 7;
      }
    }

    yPos += 5;
  }

  // Total points at the end
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  if (yPos > pageHeight - 20) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${totalPoints} points`, pageWidth - margin - 40, yPos);

  // Save PDF
  const filename = `${examTypeLabel}_${document.subjects?.name}_${document.classes?.name}.pdf`.replace(/\s+/g, '_');
  doc.save(filename);
};

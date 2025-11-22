import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { imageUrlToBase64 } from "./imageToBase64";

interface ExamData {
  exam: {
    exam_type: string;
    duration_minutes: number;
    documents_allowed: boolean;
    answer_on_document?: boolean;
    subjects: { name: string } | null;
    classes: { name: string } | null;
    teachers: { firstname: string; lastname: string } | null;
    school_semester: { name: string } | null;
    school_years: { name: string } | null;
  };
  questions: Array<{
    question_number: number;
    question_text: string;
    points: number;
    has_choices: boolean;
    is_multiple_choice: boolean;
    exam_answers: Array<{
      answer_text: string;
      is_correct: boolean;
    }>;
  }>;
  schoolName: string;
  schoolLogoUrl?: string | null;
}

export const generateExamPdf = async (data: ExamData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Add school logo if available
  if (data.schoolLogoUrl) {
    try {
      const logoBase64 = await imageUrlToBase64(data.schoolLogoUrl);
      const logoWidth = 40;
      const logoHeight = 20;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoBase64, "PNG", logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 10;
    } catch (error) {
      console.error("Error loading logo:", error);
    }
  } else {
    // School name centered if no logo
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(data.schoolName, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;
  }

  // Exam type and period
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const examTitle = `${data.exam.exam_type.toUpperCase()} ${data.exam.school_semester?.name || ""} ${data.exam.school_years?.name || ""}`;
  doc.text(examTitle, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Exam details - ligne par ligne centrées
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Matière: ${data.exam.subjects?.name || ""}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 7;
  
  doc.text(`Niveau: ${data.exam.classes?.name || ""}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 7;
  
  doc.text(`Enseignant: ${data.exam.teachers?.firstname || ""} ${data.exam.teachers?.lastname || ""}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 7;
  
  doc.text(`Durée: ${data.exam.duration_minutes} minutes`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 7;

  // Documents authorization
  doc.setFont("helvetica", "bold");
  const docStatus = data.exam.documents_allowed
    ? "Documents autorisés"
    : "Documents non autorisés";
  doc.text(docStatus, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Questions
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  
  data.questions.forEach((question) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Question text
    doc.setFont("helvetica", "bold");
    const questionText = `Q${question.question_number}. ${question.question_text} (${question.points} point${question.points > 1 ? "s" : ""})`;
    const splitQuestion = doc.splitTextToSize(questionText, pageWidth - 30);
    doc.text(splitQuestion, 15, yPosition);
    yPosition += splitQuestion.length * 7 + 5;

    // Answers if any
    if (question.has_choices && question.exam_answers.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      question.exam_answers.forEach((answer, idx) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        const prefix = question.is_multiple_choice ? "☐" : "○";
        const answerText = `${prefix} ${answer.answer_text}`;
        const splitAnswer = doc.splitTextToSize(answerText, pageWidth - 40);
        doc.text(splitAnswer, 25, yPosition);
        yPosition += splitAnswer.length * 5 + 3;
      });
      
      yPosition += 5;
    } else if (data.exam.answer_on_document) {
      // Add space for answer only if answer_on_document is true
      yPosition += 20;
      doc.setDrawColor(200, 200, 200);
      doc.line(25, yPosition - 15, pageWidth - 15, yPosition - 15);
      doc.line(25, yPosition - 10, pageWidth - 15, yPosition - 10);
      doc.line(25, yPosition - 5, pageWidth - 15, yPosition - 5);
    } else {
      // No lines, just small spacing between questions
      yPosition += 5;
    }

    yPosition += 10;
  });

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(
    `${data.schoolName} - Page ${pageCount}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  return doc;
};

export const downloadExamPdf = async (data: ExamData, filename: string) => {
  const doc = await generateExamPdf(data);
  doc.save(filename);
};

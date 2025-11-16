import jsPDF from "jspdf";
import { ExamDocument, ExamQuestion } from "@/hooks/useExamDocuments";
import { loadImageAsBase64 } from "./imageToBase64";

interface ExamPdfData {
  exam: ExamDocument;
  questions: ExamQuestion[];
  school: {
    name: string;
    logo_url?: string;
  };
  subject: {
    name: string;
  };
  class: {
    name: string;
  };
  teacher: {
    firstname: string;
    lastname: string;
  };
  semester: {
    name: string;
  };
  schoolYear: {
    name: string;
  };
}

const getExamTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    devoir_surveille: "Devoir Surveillé",
    controle: "Contrôle",
    examen: "Examen",
  };
  return labels[type] || type;
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h${mins.toString().padStart(2, "0")}`;
  } else if (hours > 0) {
    return `${hours}h00`;
  } else {
    return `${mins}min`;
  }
};

export const generateExamPDF = async (data: ExamPdfData): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Add school logo centered
  if (data.school.logo_url) {
    try {
      const logoBase64 = await loadImageAsBase64(data.school.logo_url);
      const logoWidth = 30;
      const logoHeight = 30;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoBase64, "PNG", logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 10;
    } catch (error) {
      console.error("Error loading logo:", error);
      yPosition += 5;
    }
  }

  // Add exam type, semester and year
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const examTitle = `${getExamTypeLabel(data.exam.exam_type)} ${data.semester.name} ${data.schoolYear.name}`;
  doc.text(examTitle, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Add exam details table
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const detailsStartY = yPosition;
  const labelWidth = 30;
  const valueX = margin + labelWidth;

  // Draw details with background
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, detailsStartY, pageWidth - 2 * margin, 25, "F");

  doc.setFont("helvetica", "bold");
  doc.text("Matière", margin + 2, detailsStartY + 5);
  doc.text("Durée", margin + 2, detailsStartY + 10);
  doc.text("Niveau", margin + 2, detailsStartY + 15);
  doc.text("Enseignant", margin + 2, detailsStartY + 20);

  doc.setFont("helvetica", "normal");
  doc.text(data.subject.name, valueX, detailsStartY + 5);
  doc.text(formatDuration(data.exam.duration_minutes), valueX, detailsStartY + 10);
  doc.text(data.class.name, valueX, detailsStartY + 15);
  doc.text(`${data.teacher.firstname} ${data.teacher.lastname}`, valueX, detailsStartY + 20);

  yPosition = detailsStartY + 30;

  // Add documents allowed/not allowed
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const documentsText = data.exam.documents_allowed
    ? "Documents autorisés"
    : "Documents autorisés - Ordinateurs et Smartphones non Autorisés";
  doc.text(documentsText, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Add questions
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  for (const question of data.questions) {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    // Question text
    doc.setFont("helvetica", "bold");
    const questionHeader = `Q${question.question_number}. ${question.question_text} (${question.points} point${question.points > 1 ? "s" : ""})`;
    
    const lines = doc.splitTextToSize(questionHeader, pageWidth - 2 * margin);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * 5 + 3;

    // Add answers if present
    if (question.answers && question.answers.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      
      for (const answer of question.answers) {
        const answerPrefix = question.is_multiple_choice ? "☐" : "○";
        const answerText = `${answerPrefix} ${answer.answer_text}`;
        const answerLines = doc.splitTextToSize(answerText, pageWidth - 2 * margin - 5);
        doc.text(answerLines, margin + 5, yPosition);
        yPosition += answerLines.length * 4 + 2;
      }
      
      doc.setFontSize(10);
    }

    yPosition += 8;
  }

  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${data.school.name}`,
      margin,
      pageHeight - 10
    );
    doc.text(
      `Page ${i}/${pageCount}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: "right" }
    );
  }

  return doc;
};

export const downloadExamPDF = async (
  data: ExamPdfData,
  filename: string
): Promise<void> => {
  const doc = await generateExamPDF(data);
  doc.save(filename);
};

export const previewExamPDF = async (data: ExamPdfData): Promise<void> => {
  const doc = await generateExamPDF(data);
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};

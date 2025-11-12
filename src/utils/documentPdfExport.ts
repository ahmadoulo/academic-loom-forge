import jsPDF from "jspdf";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface StudentData {
  id: string;
  firstname: string;
  lastname: string;
  cin_number?: string;
  birth_date?: string | null;
  class_name?: string;
  school_name?: string;
  school_address?: string;
  school_phone?: string;
}

interface TemplateData {
  content: string;
  name: string;
}

const replacePlaceholders = (content: string, student: StudentData, schoolYear: string): string => {
  const today = format(new Date(), "dd MMMM yyyy", { locale: fr });
  
  return content
    .replace(/\{\{student_name\}\}/g, `${student.firstname} ${student.lastname}`)
    .replace(/\{\{student_firstname\}\}/g, student.firstname)
    .replace(/\{\{student_lastname\}\}/g, student.lastname)
    .replace(/\{\{cin_number\}\}/g, student.cin_number || "N/A")
    .replace(/\{\{birth_date\}\}/g, student.birth_date ? format(new Date(student.birth_date), "dd/MM/yyyy") : "N/A")
    .replace(/\{\{class_name\}\}/g, student.class_name || "N/A")
    .replace(/\{\{school_name\}\}/g, student.school_name || "")
    .replace(/\{\{school_address\}\}/g, student.school_address || "")
    .replace(/\{\{school_phone\}\}/g, student.school_phone || "")
    .replace(/\{\{school_year\}\}/g, schoolYear)
    .replace(/\{\{date\}\}/g, today);
};

export const generateDocumentPDF = (
  template: TemplateData,
  students: StudentData[],
  schoolYear: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  students.forEach((student, index) => {
    if (index > 0) {
      doc.addPage();
    }

    // Header with school info
    if (student.school_name) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(student.school_name, pageWidth / 2, 20, { align: "center" });
      
      if (student.school_address) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(student.school_address, pageWidth / 2, 28, { align: "center" });
      }
      
      if (student.school_phone) {
        doc.text(student.school_phone, pageWidth / 2, 34, { align: "center" });
      }
    }

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(template.name, pageWidth / 2, 55, { align: "center" });

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(margin, 62, pageWidth - margin, 62);

    // Content
    const processedContent = replacePlaceholders(template.content, student, schoolYear);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    const lines = doc.splitTextToSize(processedContent, contentWidth);
    let y = 75;
    
    lines.forEach((line: string) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 7;
    });

    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const today = format(new Date(), "dd MMMM yyyy", { locale: fr });
    doc.text(`Délivré le ${today}`, pageWidth / 2, pageHeight - 30, { align: "center" });
    
    // Signature area
    doc.setFont("helvetica", "normal");
    doc.text("Signature et cachet de l'établissement", pageWidth - margin - 60, pageHeight - 20);
  });

  return doc;
};

export const downloadDocumentPDF = (
  template: TemplateData,
  students: StudentData[],
  schoolYear: string
) => {
  const doc = generateDocumentPDF(template, students, schoolYear);
  const fileName = `${template.name.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
};

export const previewDocumentPDF = (
  template: TemplateData,
  students: StudentData[],
  schoolYear: string
) => {
  const doc = generateDocumentPDF(template, students, schoolYear);
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};

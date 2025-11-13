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
  school_website?: string;
  school_city?: string;
  school_country?: string;
}

interface TemplateData {
  content: string;
  name: string;
  footer_color?: string;
  footer_content?: string;
}

// Convert hex color to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 30, g: 64, b: 175 }; // Default blue
};

// Load image as base64
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading image:", error);
    return null;
  }
};

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
    .replace(/\{\{school_website\}\}/g, student.school_website || "")
    .replace(/\{\{school_year\}\}/g, schoolYear)
    .replace(/\{\{date\}\}/g, today);
};

export const generateDocumentPDF = async (
  template: TemplateData,
  students: StudentData[],
  schoolYear: string,
  schoolLogoUrl?: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  const footerColor = template.footer_color || "#1e40af";
  const rgb = hexToRgb(footerColor);

  // Load school logo if available
  let logoBase64: string | null = null;
  if (schoolLogoUrl) {
    logoBase64 = await loadImageAsBase64(schoolLogoUrl);
  }

  for (let index = 0; index < students.length; index++) {
    const student = students[index];
    
    if (index > 0) {
      doc.addPage();
    }

    let currentY = 15;

    // Header with logo and school info
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, currentY, 50, 25);
        currentY += 30;
      } catch (error) {
        console.error("Error adding logo:", error);
        currentY += 5;
      }
    }

    if (student.school_name) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(student.school_name.toUpperCase(), pageWidth / 2, currentY, { align: "center" });
      currentY += 8;

      if (student.school_address) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(student.school_address, pageWidth / 2, currentY, { align: "center" });
        currentY += 5;
      }

      if (student.school_phone || student.school_website) {
        const contactInfo: string[] = [];
        if (student.school_phone) contactInfo.push(`Tél: ${student.school_phone}`);
        if (student.school_website) contactInfo.push(student.school_website);
        doc.text(contactInfo.join(" | "), pageWidth / 2, currentY, { align: "center" });
        currentY += 10;
      } else {
        currentY += 5;
      }
    }

    // Decorative line
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    doc.setLineWidth(0.8);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 15;

    // Document title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(template.name.toUpperCase(), pageWidth / 2, currentY, { align: "center" });
    currentY += 15;

    // Content
    const processedContent = replacePlaceholders(template.content, student, schoolYear);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    
    const lines = doc.splitTextToSize(processedContent, contentWidth);
    
    lines.forEach((line: string) => {
      if (currentY > pageHeight - 80) {
        doc.addPage();
        currentY = margin;
      }
      doc.text(line, margin, currentY);
      currentY += 6;
    });

    // Signature area - positioned right after content
    currentY += 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    const today = format(new Date(), "dd MMMM yyyy", { locale: fr });
    doc.text(`Fait le ${today}`, margin, currentY);
    
    currentY += 10;
    doc.setFont("helvetica", "italic");
    doc.text("Signature et cachet de l'établissement", pageWidth - margin - 65, currentY);
    currentY += 15;

    // Footer with colored background
    const footerHeight = 25;
    const footerY = pageHeight - footerHeight;
    
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(0, footerY, pageWidth, footerHeight, "F");
    
    // Footer text - use custom footer content if available
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    if (template.footer_content) {
      const processedFooterContent = replacePlaceholders(template.footer_content, student, schoolYear);
      const footerLines = doc.splitTextToSize(processedFooterContent, contentWidth);
      let footerY1 = footerY + 8;
      
      footerLines.forEach((line: string, index: number) => {
        if (index < 3) { // Limit to 3 lines to fit in footer
          doc.text(line, pageWidth / 2, footerY1, { align: "center" });
          footerY1 += 4;
        }
      });
    } else {
      // Default footer if no custom content
      let footerY1 = footerY + 8;
      if (student.school_name) {
        doc.text(student.school_name, pageWidth / 2, footerY1, { align: "center" });
        footerY1 += 4;
      }
      
      const addressLine: string[] = [];
      if (student.school_address) addressLine.push(student.school_address);
      if (student.school_city) addressLine.push(student.school_city);
      if (student.school_country) addressLine.push(student.school_country);
      
      if (addressLine.length > 0) {
        doc.text(addressLine.join(", "), pageWidth / 2, footerY1, { align: "center" });
        footerY1 += 4;
      }
      
      const contactLine: string[] = [];
      if (student.school_phone) contactLine.push(`Tél: ${student.school_phone}`);
      if (student.school_website) contactLine.push(`Web: ${student.school_website}`);
      
      if (contactLine.length > 0) {
        doc.text(contactLine.join(" | "), pageWidth / 2, footerY1, { align: "center" });
      }
    }
  }

  return doc;
};

export const downloadDocumentPDF = async (
  template: TemplateData,
  students: StudentData[],
  schoolYear: string,
  schoolLogoUrl?: string
) => {
  const doc = await generateDocumentPDF(template, students, schoolYear, schoolLogoUrl);
  const fileName = `${template.name.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
};

export const previewDocumentPDF = async (
  template: TemplateData,
  students: StudentData[],
  schoolYear: string,
  schoolLogoUrl?: string
) => {
  const doc = await generateDocumentPDF(template, students, schoolYear, schoolLogoUrl);
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};

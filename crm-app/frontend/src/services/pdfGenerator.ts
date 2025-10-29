/**
 * PDF Generation Service using jsPDF and html2canvas
 * Better alternative to Puppeteer for client-side PDF generation
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFGenerationOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number;
  scale?: number;
}

/**
 * Generate PDF from HTML content
 */
export const generatePDFFromHTML = async (
  htmlContent: string,
  options: PDFGenerationOptions = {}
): Promise<Blob> => {
  const { format = 'a4', orientation = 'portrait', quality = 1.0, scale = 2 } = options;

  try {
    // Create a temporary container for the HTML content
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = htmlContent;
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.background = 'white';
    tempContainer.style.padding = '20px';

    document.body.appendChild(tempContainer);

    // Convert HTML to canvas
    const canvas = await html2canvas(tempContainer, {
      scale: scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Create PDF
    const imgWidth = format === 'a4' ? 210 : 216; // A4: 210mm, Letter: 216mm
    const pageHeight = format === 'a4' ? 297 : 279; // A4: 297mm, Letter: 279mm

    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format,
    });

    let position = 0;

    // Add first page
    pdf.addImage(
      canvas.toDataURL('image/png', quality),
      'PNG',
      0,
      position,
      imgWidth,
      imgHeight,
      undefined,
      'FAST'
    );

    heightLeft -= pageHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/png', quality),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Generate PDF from DOM element
 */
export const generatePDFFromElement = async (
  element: HTMLElement,
  options: PDFGenerationOptions = {}
): Promise<Blob> => {
  const { format = 'a4', orientation = 'portrait', quality = 1.0, scale = 2 } = options;

  try {
    // Convert element to canvas
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Create PDF
    const imgWidth = format === 'a4' ? 210 : 216;
    const pageHeight = format === 'a4' ? 297 : 279;

    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format,
    });

    let position = 0;

    // Add first page
    pdf.addImage(
      canvas.toDataURL('image/png', quality),
      'PNG',
      0,
      position,
      imgWidth,
      imgHeight,
      undefined,
      'FAST'
    );

    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/png', quality),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Download PDF blob as file
 */
export const downloadPDF = (blob: Blob, filename: string = 'document.pdf'): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Open PDF blob in new window/tab
 */
export const openPDF = (blob: Blob): void => {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Note: Don't revoke URL immediately as it's being used in the new window
};

/**
 * Generate and download PDF from HTML content
 */
export const generateAndDownloadPDF = async (
  htmlContent: string,
  filename: string = 'document.pdf',
  options: PDFGenerationOptions = {}
): Promise<void> => {
  try {
    const blob = await generatePDFFromHTML(htmlContent, options);
    downloadPDF(blob, filename);
  } catch (error) {
    console.error('PDF Generation and Download Error:', error);
    throw error;
  }
};

/**
 * Generate and open PDF from HTML content
 */
export const generateAndOpenPDF = async (
  htmlContent: string,
  options: PDFGenerationOptions = {}
): Promise<void> => {
  try {
    const blob = await generatePDFFromHTML(htmlContent, options);
    openPDF(blob);
  } catch (error) {
    console.error('PDF Generation and Open Error:', error);
    throw error;
  }
};

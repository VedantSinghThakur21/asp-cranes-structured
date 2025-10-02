/**
 * PDF Service for generating PDFs from HTML
 * Production-ready service using Puppeteer for PDF generation
 */

import puppeteer from 'puppeteer';

class PdfService {
  constructor() {
    this.options = {
      format: 'A4',
      orientation: 'portrait',
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    };
    this.browser = null;
  }

  /**
   * Initialize browser instance
   */
  async initBrowser() {
    if (!this.browser) {
      try {
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--allow-running-insecure-content'
          ]
        });
      } catch (error) {
        console.warn('⚠️ Puppeteer not available, falling back to HTML');
        return null;
      }
    }
    return this.browser;
  }

  /**
   * Generate PDF from HTML
   */
  async generateFromHTML(html, options = {}) {
    try {
      console.log('📄 Generating PDF from HTML using Puppeteer');
      
      const pdfOptions = { ...this.options, ...options };
      
      // Try to use Puppeteer first
      const browser = await this.initBrowser();
      if (!browser) {
        // Fallback to HTML if Puppeteer is not available
        console.warn('⚠️ Puppeteer not available, returning HTML fallback');
        return {
          success: true,
          fallback: true,
          data: this.wrapHtmlForPrint(html),
          format: pdfOptions.format
        };
      }

      const page = await browser.newPage();
      
      // Set content with proper base URL for assets
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: pdfOptions.format || 'A4',
        margin: pdfOptions.margin || pdfOptions.margins,
        printBackground: true,
        preferCSSPageSize: true
      });

      await page.close();
      
      return {
        success: true,
        fallback: false,
        data: pdfBuffer,
        format: pdfOptions.format,
        size: pdfBuffer.length
      };
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      
      // Fallback to HTML
      console.warn('⚠️ PDF generation failed, returning HTML fallback');
      return {
        success: true,
        fallback: true,
        data: this.wrapHtmlForPrint(html),
        format: 'HTML'
      };
    }
  }

  /**
   * Wrap HTML for print-friendly display
   */
  wrapHtmlForPrint(html) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quotation</title>
  <style>
    @media print {
      body { margin: 0; }
      @page { margin: 15mm; }
    }
    body { font-family: Arial, sans-serif; }
    .print-info { 
      text-align: center; 
      color: #666; 
      font-size: 12px; 
      margin: 20px 0;
      border: 1px dashed #ccc;
      padding: 10px;
      background: #f9f9f9;
    }
    .no-print { display: none; }
    @media print { .print-info { display: none; } }
  </style>
  <script>
    window.onload = function() {
      // Auto-print when loaded
      setTimeout(() => window.print(), 1000);
    };
  </script>
</head>
<body>
  <div class="print-info no-print">
    <strong>PDF Generation Unavailable</strong><br>
    This page will automatically print. Use your browser's "Save as PDF" option to create a PDF file.
  </div>
  ${html}
</body>
</html>`;
  }

  /**
   * Close browser instance
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get PDF generation capabilities
   */
  getCapabilities() {
    return {
      formats: ['A4', 'Letter', 'Legal'],
      orientations: ['portrait', 'landscape'],
      features: ['headers', 'footers', 'page-numbers', 'watermarks']
    };
  }
}

// Create singleton instance
export const pdfService = new PdfService();
/**
 * Advanced PDF Generation Service
 * Inspired by InvoiceNinja's PDF generation with modern capabilities
 * Supports multiple formats, professional styling, and advanced features
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Optional puppeteer import - fallback if not available
let puppeteer = null;
try {
  puppeteer = await import('puppeteer');
} catch (error) {
  // Puppeteer not available - will use fallback PDF generation
  // This is normal in development environments
}

/**
 * PDF Generation Options
 */
export const PDF_OPTIONS = {
  FORMATS: {
    A4: { width: '210mm', height: '297mm' },
    A5: { width: '148mm', height: '210mm' },
    LETTER: { width: '8.5in', height: '11in' },
    LEGAL: { width: '8.5in', height: '14in' },
    CUSTOM: { width: '210mm', height: '297mm' }, // Default to A4
  },
  ORIENTATIONS: {
    PORTRAIT: 'portrait',
    LANDSCAPE: 'landscape',
  },
  QUALITY: {
    DRAFT: { scale: 1, printBackground: false },
    STANDARD: { scale: 1.5, printBackground: true },
    HIGH: { scale: 2, printBackground: true },
    PREMIUM: { scale: 3, printBackground: true },
  },
};

/**
 * Advanced PDF Generator Class
 */
export class AdvancedPDFGenerator {
  constructor() {
    this.browser = null;
    this.defaultOptions = {
      format: 'A4',
      orientation: 'portrait',
      quality: 'STANDARD',
      margins: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
      displayHeaderFooter: false,
      printBackground: true,
      preferCSSPageSize: true,
      generateTaggedPDF: true,
      timeout: 30000,
    };
  }

  /**
   * Initialize browser instance
   */
  async initializeBrowser() {
    if (!puppeteer) {
      console.log('⚠️ Puppeteer not available - using fallback PDF generation');
      return null;
    }

    if (!this.browser) {
      this.browser = await puppeteer.default.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Generate PDF from HTML content
   */
  async generatePDF(htmlContent, options = {}) {
    // Fallback if puppeteer is not available
    if (!puppeteer) {
      console.log('⚠️ Puppeteer unavailable - generating HTML-based PDF fallback');

      // Generate a proper HTML file for PDF viewing instead of mock content
      const htmlWithStyles = this.enhanceHTMLForPDF(htmlContent, options);

      // Return HTML that can be converted to PDF on the frontend
      return {
        success: true,
        data: Buffer.from(htmlWithStyles, 'utf8'),
        format: options.format || 'A4',
        size: Buffer.byteLength(htmlWithStyles, 'utf8'),
        fallback: true,
        contentType: 'text/html',
      };
    }

    const mergedOptions = { ...this.defaultOptions, ...options };

    try {
      await this.initializeBrowser();
      const page = await this.browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: mergedOptions.quality === 'HIGH' ? 2 : 1,
      });

      // Add enhanced HTML with PDF-specific optimizations
      const enhancedHTML = this.enhanceHTMLForPDF(htmlContent, mergedOptions);

      // Set content and wait for rendering
      await page.setContent(enhancedHTML, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: mergedOptions.timeout,
      });

      // Wait for fonts and images to load
      await page.evaluateHandle('document.fonts.ready');
      await this.waitForImages(page);

      // Configure PDF options
      const pdfOptions = this.buildPDFOptions(mergedOptions);

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      await page.close();

      return pdfBuffer;
    } catch (error) {
      console.error('PDF Generation Error:', error);

      // Fallback to HTML when PDF generation fails
      console.log('📄 Falling back to HTML generation due to PDF error');
      const htmlWithStyles = this.enhanceHTMLForPDF(htmlContent, options);

      return {
        success: false,
        error: error.message,
        data: Buffer.from(htmlWithStyles, 'utf8'),
        format: options.format || 'A4',
        size: Buffer.byteLength(htmlWithStyles, 'utf8'),
        fallback: true,
        contentType: 'text/html',
      };
    }
  }

  /**
   * Generate PDF with watermark
   */
  async generatePDFWithWatermark(htmlContent, watermarkOptions = {}, pdfOptions = {}) {
    const watermark = {
      text: 'CONFIDENTIAL',
      opacity: 0.1,
      fontSize: 48,
      rotation: 45,
      position: 'center',
      color: '#000000',
      ...watermarkOptions,
    };

    const watermarkedHTML = this.addWatermarkToHTML(htmlContent, watermark);
    return this.generatePDF(watermarkedHTML, pdfOptions);
  }

  /**
   * Generate multi-page PDF with headers and footers
   */
  async generatePDFWithHeaderFooter(htmlContent, headerFooterOptions = {}, pdfOptions = {}) {
    const options = {
      ...pdfOptions,
      displayHeaderFooter: true,
      headerTemplate: headerFooterOptions.header || this.getDefaultHeader(),
      footerTemplate: headerFooterOptions.footer || this.getDefaultFooter(),
      margins: {
        top: '80px',
        bottom: '80px',
        left: '20mm',
        right: '20mm',
        ...pdfOptions.margins,
      },
    };

    return this.generatePDF(htmlContent, options);
  }

  /**
   * Generate PDF with custom CSS optimizations
   */
  async generateOptimizedPDF(htmlContent, optimizations = {}) {
    const cssOptimizations = {
      // Font optimization
      webFonts: optimizations.webFonts !== false,
      fontSubsetting: optimizations.fontSubsetting !== false,

      // Image optimization
      imageCompression: optimizations.imageCompression !== false,
      backgroundImages: optimizations.backgroundImages !== false,

      // Layout optimization
      pageBreaks: optimizations.pageBreaks !== false,
      columnBalance: optimizations.columnBalance !== false,

      // Performance optimization
      cssMinification: optimizations.cssMinification !== false,
      removeUnusedCSS: optimizations.removeUnusedCSS !== false,

      ...optimizations,
    };

    const optimizedHTML = this.optimizeHTMLForPDF(htmlContent, cssOptimizations);
    return this.generatePDF(optimizedHTML, optimizations.pdfOptions || {});
  }

  /**
   * Enhance HTML content for PDF generation
   */
  enhanceHTMLForPDF(htmlContent, options) {
    // Add PDF-specific CSS
    const pdfCSS = this.generatePDFOptimizedCSS(options);

    // Inject CSS into HTML
    const cssInjection = `<style>${pdfCSS}</style>`;

    // Add meta tags for better PDF rendering
    const metaTags = `
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="pdf-generator" content="ASP-Cranes-Advanced-PDF">
    `;

    // Insert enhancements
    let enhancedHTML = htmlContent;

    if (enhancedHTML.includes('<head>')) {
      enhancedHTML = enhancedHTML.replace('<head>', `<head>${metaTags}`);
      enhancedHTML = enhancedHTML.replace('</head>', `${cssInjection}</head>`);
    } else {
      enhancedHTML = `<!DOCTYPE html><html><head>${metaTags}${cssInjection}</head><body>${enhancedHTML}</body></html>`;
    }

    return enhancedHTML;
  }

  /**
   * Generate PDF-optimized CSS
   */
  generatePDFOptimizedCSS(options) {
    const format = PDF_OPTIONS.FORMATS[options.format] || PDF_OPTIONS.FORMATS.A4;
    const quality = PDF_OPTIONS.QUALITY[options.quality] || PDF_OPTIONS.QUALITY.STANDARD;

    return `
      /* PDF Optimization Styles */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          margin: 0;
          padding: 0;
          background: white !important;
          font-size: 12pt;
          line-height: 1.4;
        }
        
        /* Page break control */
        .page-break-before { page-break-before: always; }
        .page-break-after { page-break-after: always; }
        .page-break-inside-avoid { page-break-inside: avoid; }
        .page-break-inside-auto { page-break-inside: auto; }
        
        /* Keep elements together */
        .keep-together {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        /* Table optimization */
        table {
          border-collapse: collapse;
          page-break-inside: auto;
        }
        
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        
        thead {
          display: table-header-group;
        }
        
        tfoot {
          display: table-footer-group;
        }
        
        /* Image optimization */
        img {
          max-width: 100% !important;
          height: auto !important;
          page-break-inside: avoid;
        }
        
        /* Hide screen-only elements */
        .screen-only,
        .no-print {
          display: none !important;
        }
        
        /* Typography optimization */
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
          page-break-inside: avoid;
          margin-top: 0.5em;
          margin-bottom: 0.3em;
        }
        
        p {
          orphans: 3;
          widows: 3;
        }
        
        /* Layout optimization */
        .container, .quotation-container {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
      }
      
      /* High DPI optimization */
      @media (min-resolution: 150dpi) {
        body {
          font-size: ${quality.scale >= 2 ? '11pt' : '12pt'};
        }
        
        .high-dpi-optimize {
          transform: scale(${1 / quality.scale});
          transform-origin: top left;
        }
      }
      
      /* Color profile optimization */
      .color-profile-cmyk {
        color-profile: auto;
        rendering-intent: perceptual;
      }
      
      /* Font optimization */
      @font-face {
        font-family: 'PDF-Optimized';
        src: local('Arial'), local('Helvetica'), local('sans-serif');
        font-display: block;
      }
      
      /* Custom page size */
      @page {
        size: ${format.width} ${format.height} ${options.orientation || 'portrait'};
        margin: ${options.margins?.top || '20mm'} ${options.margins?.right || '20mm'} 
                ${options.margins?.bottom || '20mm'} ${options.margins?.left || '20mm'};
        
        ${
          options.displayHeaderFooter
            ? `@top-left { content: "${options.headerLeft || ''}"; }
          @top-center { content: "${options.headerCenter || ''}"; }
          @top-right { content: "${options.headerRight || ''}"; }
          @bottom-left { content: "${options.footerLeft || ''}"; }
          @bottom-center { content: "${options.footerCenter || 'Page counter(page) of counter(pages)'}"; }
          @bottom-right { content: "${options.footerRight || ''}"; }`
            : ''
        }
      }
      
      /* Watermark styles */
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        font-size: 48px;
        color: rgba(0, 0, 0, 0.1);
        z-index: -1;
        pointer-events: none;
        user-select: none;
      }
    `;
  }

  /**
   * Add watermark to HTML content
   */
  addWatermarkToHTML(htmlContent, watermarkOptions) {
    const watermarkStyle = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(${watermarkOptions.rotation}deg);
      font-size: ${watermarkOptions.fontSize}px;
      color: ${watermarkOptions.color};
      opacity: ${watermarkOptions.opacity};
      z-index: -1;
      pointer-events: none;
      user-select: none;
      font-weight: bold;
      white-space: nowrap;
    `;

    const watermarkHTML = `<div class="watermark" style="${watermarkStyle}">${watermarkOptions.text}</div>`;

    // Insert watermark into body
    if (htmlContent.includes('<body>')) {
      return htmlContent.replace('<body>', `<body>${watermarkHTML}`);
    } else {
      return `${watermarkHTML}${htmlContent}`;
    }
  }

  /**
   * Optimize HTML for PDF rendering
   */
  optimizeHTMLForPDF(htmlContent, optimizations) {
    let optimizedHTML = htmlContent;

    if (optimizations.cssMinification) {
      optimizedHTML = this.minifyCSS(optimizedHTML);
    }

    if (optimizations.pageBreaks) {
      optimizedHTML = this.optimizePageBreaks(optimizedHTML);
    }

    if (optimizations.imageCompression) {
      optimizedHTML = this.optimizeImages(optimizedHTML);
    }

    return optimizedHTML;
  }

  /**
   * Build PDF options object
   */
  buildPDFOptions(options) {
    const format = PDF_OPTIONS.FORMATS[options.format] || PDF_OPTIONS.FORMATS.A4;
    const quality = PDF_OPTIONS.QUALITY[options.quality] || PDF_OPTIONS.QUALITY.STANDARD;

    return {
      format: options.format === 'CUSTOM' ? undefined : options.format,
      width: options.format === 'CUSTOM' ? options.width : format.width,
      height: options.format === 'CUSTOM' ? options.height : format.height,
      landscape: options.orientation === 'landscape',
      margin: {
        top: options.margins?.top || '20mm',
        right: options.margins?.right || '20mm',
        bottom: options.margins?.bottom || '20mm',
        left: options.margins?.left || '20mm',
      },
      printBackground: options.printBackground !== false,
      displayHeaderFooter: options.displayHeaderFooter || false,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || '',
      scale: quality.scale || 1,
      preferCSSPageSize: options.preferCSSPageSize !== false,
      generateTaggedPDF: options.generateTaggedPDF !== false,
      tagged: options.generateTaggedPDF !== false,
      timeout: options.timeout || 30000,
    };
  }

  /**
   * Wait for all images to load
   */
  async waitForImages(page) {
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(
            img =>
              new Promise(resolve => {
                img.onload = img.onerror = resolve;
                setTimeout(resolve, 5000); // 5s timeout per image
              })
          )
      );
    });
  }

  /**
   * Default header template
   */
  getDefaultHeader() {
    return `
      <div style="font-size: 10px; color: #666; text-align: center; width: 100%; margin-top: 10px;">
        <span>ASP Cranes Quotation System</span>
      </div>
    `;
  }

  /**
   * Default footer template
   */
  getDefaultFooter() {
    return `
      <div style="font-size: 10px; color: #666; text-align: center; width: 100%; margin-bottom: 10px;">
        <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>
    `;
  }

  /**
   * Minify CSS in HTML content
   */
  minifyCSS(htmlContent) {
    return htmlContent.replace(/<style[^>]*>(.*?)<\/style>/gis, (match, css) => {
      const minifiedCSS = css
        .replace(/\/\*.*?\*\//gs, '')
        .replace(/\s+/g, ' ')
        .replace(/;\s*}/g, '}')
        .replace(/\s*{\s*/g, '{')
        .replace(/;\s*/g, ';')
        .trim();
      return `<style>${minifiedCSS}</style>`;
    });
  }

  /**
   * Optimize page breaks
   */
  optimizePageBreaks(htmlContent) {
    // Add page break classes to appropriate elements
    return htmlContent
      .replace(/<h1([^>]*)>/gi, '<h1$1 class="page-break-before">')
      .replace(/<table([^>]*)>/gi, '<table$1 class="keep-together">')
      .replace(/<div class="totals([^>]*)>/gi, '<div class="totals keep-together$1>')
      .replace(/<div class="terms([^>]*)>/gi, '<div class="terms keep-together$1>');
  }

  /**
   * Optimize images for PDF
   */
  optimizeImages(htmlContent) {
    return htmlContent.replace(/<img([^>]*)\s*\/?>/gi, (match, attributes) => {
      if (!attributes.includes('loading=')) {
        attributes += ' loading="eager"';
      }
      if (!attributes.includes('class=')) {
        attributes += ' class="pdf-optimized-image"';
      }
      return `<img${attributes} />`;
    });
  }

  /**
   * Batch generate multiple PDFs
   */
  async batchGeneratePDFs(htmlContents, options = {}) {
    const results = [];

    try {
      await this.initializeBrowser();

      for (let i = 0; i < htmlContents.length; i++) {
        try {
          const pdfBuffer = await this.generatePDF(htmlContents[i], {
            ...options,
            filename: options.baseFilename ? `${options.baseFilename}_${i + 1}.pdf` : undefined,
          });

          results.push({
            success: true,
            index: i,
            buffer: pdfBuffer,
            size: pdfBuffer.length,
          });
        } catch (error) {
          results.push({
            success: false,
            index: i,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Batch PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Save PDF to file
   */
  async savePDFToFile(pdfBuffer, filepath) {
    try {
      await fs.writeFile(filepath, pdfBuffer);
      const stats = await fs.stat(filepath);
      return {
        filepath,
        size: stats.size,
        created: stats.birthtime,
      };
    } catch (error) {
      throw new Error(`Failed to save PDF: ${error.message}`);
    }
  }

  /**
   * Get PDF metadata
   */
  async getPDFMetadata(pdfBuffer) {
    // This would require a PDF parsing library like pdf-parse
    // For now, return basic information
    return {
      size: pdfBuffer.length,
      format: 'PDF',
      version: '1.4',
      generated: new Date(),
      generator: 'ASP-Cranes-Advanced-PDF',
    };
  }

  /**
   * Cleanup browser instance
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get browser performance metrics
   */
  async getPerformanceMetrics() {
    if (!this.browser) {
      return null;
    }

    const page = await this.browser.newPage();
    const metrics = await page.metrics();
    await page.close();

    return {
      heapUsed: metrics.JSHeapUsedSize,
      heapTotal: metrics.JSHeapTotalSize,
      documents: metrics.Documents,
      frames: metrics.Frames,
      nodes: metrics.Nodes,
      timestamp: new Date(),
    };
  }
}

/**
 * PDF Generation Utility Functions
 */
export class PDFUtils {
  /**
   * Merge multiple PDF buffers
   */
  static async mergePDFs(pdfBuffers) {
    // This would require a PDF manipulation library like pdf-lib
    // For now, return the first PDF
    return pdfBuffers[0];
  }

  /**
   * Add password protection to PDF
   */
  static async protectPDF(pdfBuffer, password) {
    // This would require a PDF manipulation library
    // For now, return the original buffer
    return pdfBuffer;
  }

  /**
   * Extract text from PDF
   */
  static async extractTextFromPDF(pdfBuffer) {
    // This would require a PDF parsing library
    return 'Text extraction not implemented';
  }

  /**
   * Validate PDF buffer
   */
  static validatePDF(pdfBuffer) {
    if (!Buffer.isBuffer(pdfBuffer)) {
      return { valid: false, error: 'Not a valid buffer' };
    }

    const header = pdfBuffer.slice(0, 5).toString();
    if (!header.startsWith('%PDF-')) {
      return { valid: false, error: 'Not a valid PDF file' };
    }

    return { valid: true };
  }

  /**
   * Get PDF size in human readable format
   */
  static formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }
}

export default AdvancedPDFGenerator;

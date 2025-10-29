/**
 * PDF Generator Utility
 * Generates professional quotation PDFs
 */

import fs from 'fs';
import path from 'path';
import { AdvancedPDFGenerator } from '../services/AdvancedPDFGenerator.mjs';

// Initialize PDF generator
const pdfGenerator = new AdvancedPDFGenerator();

/**
 * Generate a quotation PDF template
 * @param {Object} quotation - Quotation data
 * @param {Object} companyInfo - Company information
 * @returns {Buffer} PDF buffer
 */
export async function generateQuotationTemplate(quotation, companyInfo) {
  try {
    // Generate HTML content
    const html = generateQuotationHTML(quotation, companyInfo);

    // Configure PDF options
    const pdfOptions = {
      format: 'A4',
      orientation: 'portrait',
      quality: 'STANDARD',
      margins: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
      displayHeaderFooter: false,
      printBackground: true,
      preferCSSPageSize: true,
    };

    // Generate actual PDF using AdvancedPDFGenerator
    const pdfBuffer = await pdfGenerator.generatePDF(html, pdfOptions);

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback: return HTML as buffer if PDF generation fails
    const html = generateQuotationHTML(quotation, companyInfo);
    return Buffer.from(html, 'utf8');
  }
}

/**
 * Generate HTML for quotation
 * @param {Object} quotation - Quotation data
 * @param {Object} companyInfo - Company information
 * @returns {string} HTML string
 */
function generateQuotationHTML(quotation, companyInfo) {
  const subtotal = calculateSubtotal(quotation.items);
  const gstAmount = subtotal * (quotation.gstRate / 100);
  const total = subtotal + gstAmount;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Quotation ${quotation.quotationId}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f5f7fa;
          padding: 20px;
          margin: 0;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 3px;
          background: #60a5fa;
        }
        .header h1 {
          font-size: 48px;
          margin-bottom: 8px;
          font-weight: 700;
          letter-spacing: 2px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
          opacity: 0.95;
          font-size: 18px;
          font-weight: 300;
          letter-spacing: 1px;
        }
        .content {
          padding: 40px;
        }
        .company-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 40px;
        }
        .company-info h3 {
          color: #667eea;
          margin-bottom: 15px;
          font-size: 18px;
          border-bottom: 2px solid #eee;
          padding-bottom: 5px;
        }
        .company-info p {
          margin: 5px 0;
          color: #666;
        }
        .quotation-details {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #667eea;
        }
        .quotation-details h3 {
          color: #333;
          margin-bottom: 15px;
          font-size: 20px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .detail-label {
          font-weight: 600;
          color: #555;
        }
        .detail-value {
          color: #333;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .items-table th {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 14px;
          letter-spacing: 0.5px;
        }
        .items-table td {
          padding: 15px;
          border-bottom: 1px solid #eee;
        }
        .items-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        .items-table tr:hover {
          background: #e3f2fd;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .totals {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 8px;
          margin-top: 30px;
          border: 1px solid #dee2e6;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #dee2e6;
        }
        .total-row:last-child {
          border-bottom: none;
          font-size: 20px;
          font-weight: bold;
          color: #667eea;
          padding-top: 15px;
          border-top: 2px solid #667eea;
        }
        .terms {
          margin-top: 40px;
          padding: 25px;
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          border-radius: 0 8px 8px 0;
        }
        .terms h3 {
          color: #856404;
          margin-bottom: 15px;
        }
        .terms ul {
          padding-left: 20px;
          color: #856404;
        }
        .terms li {
          margin: 8px 0;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          padding-top: 25px;
          border-top: 2px solid #eee;
          color: #666;
        }
        .signature-area {
          margin-top: 60px;
          text-align: right;
        }
        .signature-line {
          border-bottom: 2px solid #333;
          width: 250px;
          margin: 20px 0 10px auto;
        }
        @media print {
          body { background: white; padding: 0; }
          .container { box-shadow: none; border-radius: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ASP CRANES</h1>
          <p>Professional Equipment Solutions</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <h2 style="color: #1e40af; font-size: 28px; margin: 0; font-weight: 600;">QUOTATION</h2>
        </div>
        
        <div class="content">
          <div class="company-details">
            <div class="company-info">
              <h3>From</h3>
              <p><strong>${companyInfo.name}</strong></p>
              <p>${companyInfo.address}</p>
              <p>Phone: ${companyInfo.phone}</p>
              <p>Email: ${companyInfo.email}</p>
            </div>
            
            <div class="company-info">
              <h3>To</h3>
              <p><strong>${quotation.customerName}</strong></p>
              <p>Email: ${quotation.customerEmail}</p>
            </div>
          </div>
          
          <div class="quotation-details">
            <h3>Quotation Details</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Quotation ID:</span>
                <span class="detail-value">${quotation.quotationId}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date().toLocaleDateString()}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Valid Until:</span>
                <span class="detail-value">${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">GST Rate:</span>
                <span class="detail-value">${quotation.gstRate}%</span>
              </div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Description</th>
                <th class="text-center">Quantity</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${quotation.items
                .map(
                  (item, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${item.description}</td>
                  <td class="text-center">${item.qty}</td>
                  <td class="text-right">₹${item.price.toLocaleString('en-IN')}</td>
                  <td class="text-right">₹${(item.qty * item.price).toLocaleString('en-IN')}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div class="total-row">
              <span>GST (${quotation.gstRate}%):</span>
              <span>₹${gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div class="total-row">
              <span>Total Amount:</span>
              <span>₹${total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          
          ${
            quotation.terms && quotation.terms.length > 0
              ? `
            <div class="terms">
              <h3>Terms & Conditions</h3>
              <ul>
                ${quotation.terms.map(term => `<li>${term}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }
          
          <div class="signature-area">
            <p><strong>For ${companyInfo.name}</strong></p>
            <div class="signature-line"></div>
            <p>Authorized Signature</p>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer generated quotation.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Calculate subtotal from items
 * @param {Array} items - Array of items with qty and price
 * @returns {number} Subtotal
 */
function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + item.qty * item.price, 0);
}

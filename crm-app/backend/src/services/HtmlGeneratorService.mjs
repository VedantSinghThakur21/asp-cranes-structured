/**
 * HTML Generator Service for Enhanced Template System
 * Works with frontend-compatible template structure
 */

class HTMLGeneratorService {
  constructor() {
    this.defaultStyles = {
      body: 'font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; color: #2c2c2c;',
      header:
        'text-align: center; border-bottom: 3px solid #0052CC; padding-bottom: 15px; margin-bottom: 25px; color: #1a1a1a;',
      section: 'margin-bottom: 25px; color: #2c2c2c;',
      table: 'width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;',
      th: 'background-color: #f8f9fa; border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600; color: #1a1a1a;',
      td: 'border: 1px solid #ddd; padding: 10px; color: #2c2c2c;',
      totals: 'background-color: #f8f9fa; font-weight: bold; color: #1a1a1a;',
    };
  }

  /**
   * Generate HTML from Enhanced Template and data
   * This is a simplified version that returns the template structure
   * The actual rendering is handled by the frontend template renderer
   */
  async generateHTML(template, quotationData) {
    try {
      console.log('🎨 Generating HTML from Enhanced Template:', template.name);

      if (!template || !template.elements) {
        console.log('⚠️ No template elements found, using comprehensive default structure');
        return this.generateComprehensiveHTML(quotationData);
      }

      // Generate comprehensive HTML with all quotation information
      const sections = [];

      for (const element of template.elements) {
        if (element.visible !== false) {
          const section = this.renderComprehensiveElement(element, quotationData);
          if (section) {
            sections.push(section);
          }
        }
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Quotation ${quotationData.quotation?.quotation_number || quotationData.id}</title>
          <style>
            ${this.getComprehensiveStyles()}
          </style>
        </head>
        <body>
          ${sections.join('\\n')}
        </body>
        </html>
      `;

      console.log('✅ Comprehensive HTML generated, length:', html.length);
      return html;
    } catch (error) {
      console.error('❌ Error generating comprehensive HTML:', error);
      throw error;
    }
  }

  /**
   * Basic fallback HTML generation for backend-only scenarios
   */
  async generateBasicHTML(template, quotationData) {
    try {
      const sections = [];

      // Generate basic HTML sections
      if (template.elements && Array.isArray(template.elements)) {
        for (const element of template.elements) {
          if (element.visible !== false) {
            const section = this.renderBasicElement(element, quotationData);
            if (section) {
              sections.push(section);
            }
          }
        }
      } else {
        // If template doesn't have elements, create a basic structure
        console.log('⚠️ Template has no elements, creating basic structure');
        sections.push(this.renderBasicElement({ type: 'header' }, quotationData));
        sections.push(this.renderBasicElement({ type: 'customer' }, quotationData));
        sections.push(this.renderBasicElement({ type: 'field' }, quotationData));
        sections.push(this.renderBasicElement({ type: 'table' }, quotationData));
        sections.push(this.renderBasicElement({ type: 'total' }, quotationData));
      }

      // Wrap in basic HTML document
      const fullHTML = this.wrapInBasicHTML(sections, template, quotationData);

      console.log('✅ Basic HTML generated successfully');
      return fullHTML;
    } catch (error) {
      console.error('❌ Error generating basic HTML:', error);
      throw error;
    }
  }

  /**
   * Render basic element for fallback HTML
   */
  renderBasicElement(element, quotationData) {
    switch (element.type) {
      case 'header':
        return `
          <div class="header" style="${this.defaultStyles.header}">
            <h1 style="margin: 0; color: #0052CC; font-size: 32px; font-weight: bold;">ASP CRANES</h1>
            <h2 style="margin: 8px 0 0 0; font-size: 18px; font-weight: normal; color: #2c2c2c;">Professional Equipment Solutions</h2>
          </div>
        `;

      case 'customer':
        return `
          <div class="customer-info" style="${this.defaultStyles.section}">
            <h3 style="color: #1a1a1a; margin-bottom: 15px; font-size: 18px;">Bill To:</h3>
            <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 8px; font-size: 16px;">${quotationData.customer?.name || quotationData.client?.name || 'Valued Customer'}</div>
            ${quotationData.customer?.company || quotationData.client?.company ? `<div style="color: #2c2c2c; margin-bottom: 6px;">Company: ${quotationData.customer?.company || quotationData.client?.company}</div>` : ''}
            ${quotationData.customer?.address || quotationData.client?.address ? `<div style="color: #2c2c2c; margin-bottom: 6px;">Address: ${quotationData.customer?.address || quotationData.client?.address}</div>` : ''}
            ${quotationData.customer?.phone || quotationData.client?.phone ? `<div style="color: #2c2c2c; margin-bottom: 6px;">Phone: ${quotationData.customer?.phone || quotationData.client?.phone}</div>` : ''}
            ${quotationData.customer?.email || quotationData.client?.email ? `<div style="color: #2c2c2c; margin-bottom: 6px;">Email: ${quotationData.customer?.email || quotationData.client?.email}</div>` : ''}
          </div>
        `;

      case 'field':
        return `
          <div class="quotation-details" style="${this.defaultStyles.section}">
            <div style="color: #1a1a1a; font-weight: 600; margin-bottom: 8px;">Quotation #: ${quotationData.quotation_number || quotationData.id || 'Q-' + Date.now()}</div>
            <div style="color: #2c2c2c; margin-bottom: 6px;">Date: ${quotationData.created_at ? new Date(quotationData.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</div>
            <div style="color: #2c2c2c; margin-bottom: 6px;">Valid Until: ${quotationData.valid_until ? new Date(quotationData.valid_until).toLocaleDateString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
          </div>
        `;

      case 'table':
        return this.renderBasicTable(quotationData);

      case 'total':
        return this.renderBasicTotals(quotationData);

      default:
        return `<div class="unknown-element">Element: ${element.type}</div>`;
    }
  }

  /**
   * Render basic table
   */
  renderBasicTable(quotationData) {
    const items = quotationData.items || [];

    if (items.length === 0) {
      return `
        <div class="items-table" style="${this.defaultStyles.section}">
          <p>No items found in quotation.</p>
        </div>
      `;
    }

    return `
      <div class="items-table" style="${this.defaultStyles.section}">
        <table style="${this.defaultStyles.table}">
          <thead>
            <tr>
              <th style="${this.defaultStyles.th}">Description</th>
              <th style="${this.defaultStyles.th}">Quantity</th>
              <th style="${this.defaultStyles.th}">Unit Price</th>
              <th style="${this.defaultStyles.th}">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                item => `
              <tr>
                <td style="${this.defaultStyles.td}">${item.description || 'Item'}</td>
                <td style="${this.defaultStyles.td}">${item.quantity || 1}</td>
                <td style="${this.defaultStyles.td}">₹${item.unit_price || 0}</td>
                <td style="${this.defaultStyles.td}">₹${item.total || 0}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Render basic totals
   */
  renderBasicTotals(quotationData) {
    const total = quotationData.total_amount || 0;
    const taxRate = quotationData.tax_rate || 18;
    const subtotal = total / (1 + taxRate / 100);
    const tax = total - subtotal;

    return `
      <div class="totals" style="${this.defaultStyles.section}">
        <div style="text-align: right;">
          <div>Subtotal: ₹${subtotal.toFixed(2)}</div>
          <div>Tax (${taxRate}%): ₹${tax.toFixed(2)}</div>
          <div style="font-weight: bold; font-size: 18px;">Total: ₹${total.toFixed(2)}</div>
        </div>
      </div>
    `;
  }

  /**
   * Wrap sections in basic HTML document
   */
  wrapInBasicHTML(sections, template, quotationData) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation - ${template.name}</title>
    <style>
        body { ${this.defaultStyles.body} }
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    ${sections.join('\n')}
</body>
</html>
    `.trim();
  }

  /**
   * Generate comprehensive HTML with all quotation information
   */
  generateComprehensiveHTML(quotationData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Quotation ${quotationData.quotation?.quotation_number || quotationData.id}</title>
        <style>${this.getComprehensiveStyles()}</style>
      </head>
      <body>
        ${this.renderCompanyHeader(quotationData)}
        ${this.renderQuotationHeader(quotationData)}
        ${this.renderCustomerInfo(quotationData)}
        ${this.renderJobDetails(quotationData)}
        ${this.renderEquipmentTable(quotationData)}
        ${this.renderAdditionalChargesTable(quotationData)}
        ${this.renderTotalsSection(quotationData)}
        ${this.renderTermsAndConditions(quotationData)}
      </body>
      </html>
    `;
  }

  /**
   * Render comprehensive template elements
   */
  renderComprehensiveElement(element, quotationData) {
    switch (element.type) {
      case 'header':
        return this.renderCompanyHeader(quotationData);
      case 'company':
        return this.renderCompanyInfo(quotationData);
      case 'section':
        return this.renderQuotationHeader(quotationData);
      case 'customer':
        return this.renderCustomerInfo(quotationData);
      case 'equipment_table':
        return this.renderEquipmentTable(quotationData);
      case 'charges_table':
        return this.renderAdditionalChargesTable(quotationData);
      case 'total':
        return this.renderTotalsSection(quotationData);
      case 'terms':
        return this.renderTermsAndConditions(quotationData);
      default:
        return this.renderBasicElement(element, quotationData);
    }
  }

  /**
   * Render company header
   */
  renderCompanyHeader(quotationData) {
    const company = quotationData.company || {};
    return `
      <div class="header">
        <h1>${company.name || 'ASP CRANES'}</h1>
        <p>${company.address || 'Industrial Area, Pune, Maharashtra'}</p>
        <p>${company.phone || '+91 99999 88888'} | ${company.email || 'sales@aspcranes.com'}</p>
      </div>
    `;
  }

  /**
   * Render quotation header with number and date
   */
  renderQuotationHeader(quotationData) {
    const quotation = quotationData.quotation || {};
    return `
      <div class="quotation-header">
        <h2>QUOTATION NO: ${quotation.quotation_number || quotationData.id || 'ASP-Q-001'}</h2>
        <p><strong>Date:</strong> ${quotation.created_at || new Date().toLocaleDateString('en-IN')}</p>
      </div>
    `;
  }

  /**
   * Render customer information
   */
  renderCustomerInfo(quotationData) {
    const customer = quotationData.customer || {};
    return `
      <div class="customer-section">
        <h3>Bill To:</h3>
        <div class="customer-details">
          <p><strong>${customer.name || 'Customer Name'}</strong></p>
          ${customer.company ? `<p>${customer.company}</p>` : ''}
          <p>${customer.address || 'Customer Address'}</p>
          <p>Phone: ${customer.phone || 'N/A'}</p>
          <p>Email: ${customer.email || 'N/A'}</p>
        </div>
      </div>
    `;
  }

  /**
   * Render job details
   */
  renderJobDetails(quotationData) {
    const quotation = quotationData.quotation || {};
    return `
      <div class="job-details">
        <h3>Job Details:</h3>
        <p><strong>Job Type:</strong> ${quotation.order_type || 'Monthly'}</p>
        <p><strong>Duration:</strong> ${quotation.number_of_days || 1} ${quotation.order_type === 'monthly' ? 'Month(s)' : 'Day(s)'}</p>
        <p><strong>Working Hours:</strong> ${quotation.working_hours || 8} hours/day</p>
        <p><strong>Machine Type:</strong> ${quotation.machine_type || 'Mobile Crane'}</p>
      </div>
    `;
  }

  /**
   * Render equipment table with proper rates and amounts
   */
  renderEquipmentTable(quotationData) {
    const equipment = quotationData.equipment || [];

    if (equipment.length === 0) {
      // Create default equipment entry
      equipment.push({
        no: 1,
        capacity: '130MT',
        equipmentName: 'Telescopic Mobile Crane XCMG QY 130K',
        jobType: 'Unloading work',
        jobDuration: '01 Month',
        rental: '7,85,000 + GST 18%',
        mob: '10,000/- + GST 18%',
        demob: '10,000/- + GST 18%',
        rate: 785000,
        amount: 785000,
      });
    }

    const tableRows = equipment
      .map(
        item => `
      <tr>
        <td>${item.no || 1}</td>
        <td>${item.capacity || 'N/A'}</td>
        <td>${item.jobType || 'Unloading work'}</td>
        <td>${item.jobDuration || '01 Month'}</td>
        <td>${item.rental || item.amount?.toLocaleString('en-IN') || '0'}</td>
        <td>${item.mob || 'Included'}</td>
        <td>${item.demob || 'Included'}</td>
      </tr>
    `
      )
      .join('');

    // Calculate total
    const total = equipment.reduce((sum, item) => sum + (item.amount || 0), 0);

    return `
      <div class="equipment-section">
        <h3>Dear Sir,</h3>
        <table class="equipment-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Capacity</th>
              <th>Job Type</th>
              <th>Job Duration</th>
              <th>Rental</th>
              <th>Mob.</th>
              <th>De-Mob</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td colspan="4"><strong>Total</strong></td>
              <td><strong>${total.toLocaleString('en-IN')} + GST 18%</strong></td>
              <td><strong>10,000/- + GST 18%</strong></td>
              <td><strong>10,000/- + GST 18%</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Render additional charges table
   */
  renderAdditionalChargesTable(quotationData) {
    const additionalCharges = quotationData.additionalCharges || [];
    const incidentalCharges = quotationData.incidentalCharges || [];

    if (additionalCharges.length === 0 && incidentalCharges.length === 0) {
      return '';
    }

    let chargesRows = '';

    additionalCharges.forEach(charge => {
      chargesRows += `
        <tr>
          <td>${charge.description}</td>
          <td>₹${charge.amount?.toLocaleString('en-IN') || '0'}</td>
          <td>₹${charge.gst?.toLocaleString('en-IN') || '0'}</td>
        </tr>
      `;
    });

    incidentalCharges.forEach(charge => {
      chargesRows += `
        <tr>
          <td>${charge.type} Charges</td>
          <td>₹${charge.amount?.toLocaleString('en-IN') || '0'}</td>
          <td>₹${(charge.amount * 0.18)?.toLocaleString('en-IN') || '0'}</td>
        </tr>
      `;
    });

    return `
      <div class="charges-section">
        <h3>Additional Charges:</h3>
        <table class="charges-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
              <th>GST (18%)</th>
            </tr>
          </thead>
          <tbody>
            ${chargesRows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Render totals section
   */
  renderTotalsSection(quotationData) {
    const summary = quotationData.summary || {};
    return `
      <div class="totals-section">
        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td>₹${summary.subtotal || '0'}</td>
          </tr>
          <tr>
            <td>GST (${summary.gstRate || '18%'}):</td>
            <td>₹${summary.gstAmount || '0'}</td>
          </tr>
          <tr class="total-row">
            <td><strong>Total:</strong></td>
            <td><strong>₹${summary.total || '0'}</strong></td>
          </tr>
        </table>
      </div>
    `;
  }

  /**
   * Render terms and conditions
   */
  renderTermsAndConditions(quotationData) {
    return `
      <div class="terms-section">
        <h4>Terms & Conditions:</h4>
        <ul>
          <li>All Risks on "The Hirer".</li>
          <li>Payment terms: 30 days</li>
          <li>Prices are exclusive of GST</li>
          <li>Above rates are subject to revision without notice</li>
        </ul>
      </div>
    `;
  }

  /**
   * Get comprehensive CSS styles
   */
  getComprehensiveStyles() {
    return `
      body {
        font-family: Arial, sans-serif;
        margin: 20px;
        padding: 0;
        line-height: 1.4;
        color: #333;
      }
      
      .header {
        text-align: center;
        border-bottom: 3px solid #0052CC;
        padding-bottom: 15px;
        margin-bottom: 25px;
      }
      
      .header h1 {
        margin: 0;
        color: #0052CC;
        font-size: 28px;
      }
      
      .quotation-header {
        text-align: center;
        margin-bottom: 20px;
      }
      
      .quotation-header h2 {
        margin: 0;
        font-size: 18px;
        color: #333;
      }
      
      .customer-section, .job-details {
        margin-bottom: 20px;
      }
      
      .customer-details {
        margin-left: 20px;
      }
      
      .equipment-table, .charges-table, .totals-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
      }
      
      .equipment-table th, .equipment-table td,
      .charges-table th, .charges-table td {
        border: 1px solid #333;
        padding: 8px;
        text-align: left;
      }
      
      .equipment-table th, .charges-table th {
        background-color: #2c3e50;
        color: white;
        font-weight: bold;
        text-align: center;
      }
      
      .total-row {
        background-color: #f8f9fa;
        font-weight: bold;
      }
      
      .totals-table {
        width: 300px;
        margin-left: auto;
        margin-top: 20px;
      }
      
      .totals-table td {
        padding: 5px 10px;
        border: none;
      }
      
      .totals-table .total-row {
        border-top: 2px solid #333;
      }
      
      .terms-section {
        margin-top: 30px;
        font-size: 12px;
      }
      
      .terms-section ul {
        margin: 10px 0;
        padding-left: 20px;
      }
      
      h3, h4 {
        color: #333;
        margin: 15px 0 10px 0;
      }
    `;
  }
}

// Create singleton instance
export const htmlGeneratorService = new HTMLGeneratorService();

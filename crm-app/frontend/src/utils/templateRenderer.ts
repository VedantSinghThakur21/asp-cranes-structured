/**
 * Complete Template Renderer - A fresh implementation
 * Handles both modern and legacy templates with proper ASP Cranes styling
 */

export interface QuotationData {
  id: string;
  customerName?: string;
  customerContact?: {
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
  };
  selectedEquipment?: {
    name: string;
  };
  selectedMachines?: Array<{
    name: string;
    baseRate: number;
    quantity: number;
  }>;
  numberOfDays: number;
  totalRent: number;
  includeGst?: boolean;
  mobDemob?: number;
  foodResources?: number;
  accomResources?: number;
}

export interface TemplateData {
  id: string;
  name: string;
  content?: string;
  elements?: Array<{
    type: string;
    content?: string;
    config?: any;
  }>;
}

export function renderTemplate(quotation: QuotationData, template: TemplateData): string {
  console.log('🎨 Template Renderer: Starting render process');
  console.log('📋 Quotation data:', quotation);
  console.log('📄 Template data:', template);

  // If template has modern elements, use modern renderer
  if (template.elements && template.elements.length > 0) {
    return renderModernTemplate(quotation, template);
  }

  // If template has legacy content, use legacy renderer
  if (template.content) {
    return renderLegacyTemplate(quotation, template);
  }

  // Fallback: Generate a professional template
  return renderDefaultTemplate(quotation);
}

function renderModernTemplate(quotation: QuotationData, template: TemplateData): string {
  console.log('🆕 Using modern template renderer');

  let html = `
    <style>
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        margin: 0; 
        padding: 20px; 
        background: white;
        color: #333;
        line-height: 1.6;
      }
      .header { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-bottom: 30px; 
        padding-bottom: 20px; 
        border-bottom: 3px solid #2563eb;
      }
      .company-section { 
        display: flex; 
        align-items: center; 
        gap: 20px;
      }
      .logo { 
        width: 80px; 
        height: 80px; 
        background: linear-gradient(135deg, #2563eb, #1d4ed8); 
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 24px;
        box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
      }
      .company-details h1 { 
        margin: 0; 
        color: #2563eb; 
        font-size: 32px; 
        font-weight: 700;
      }
      .company-details p { 
        margin: 3px 0; 
        color: #666; 
        font-size: 14px;
      }
      .quotation-info { 
        text-align: right; 
        color: #333;
      }
      .quotation-info h2 { 
        margin: 0; 
        color: #2563eb; 
        font-size: 28px;
        font-weight: 600;
      }
      .quotation-info p { 
        margin: 8px 0; 
        font-size: 14px;
      }
      .customer-section {
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        border-left: 4px solid #2563eb;
      }
      .customer-section h3 {
        color: #2563eb;
        margin: 0 0 10px 0;
        font-size: 18px;
      }
      .equipment-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 20px 0; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      .equipment-table th { 
        background: linear-gradient(135deg, #2563eb, #1d4ed8); 
        color: white; 
        padding: 15px 12px; 
        text-align: left; 
        font-weight: 600;
        font-size: 14px;
      }
      .equipment-table td { 
        padding: 12px; 
        border: 1px solid #e5e7eb; 
        color: #374151;
      }
      .equipment-table tr:nth-child(even) { 
        background: #f9fafb;
      }
      .equipment-table tr:hover { 
        background: #f1f5f9;
      }
      .total-section {
        background: #f0f9ff;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        border: 1px solid #bae6fd;
      }
      .total-amount {
        font-size: 24px;
        font-weight: bold;
        color: #2563eb;
        text-align: right;
      }
      .terms-section { 
        margin: 30px 0; 
        padding: 20px; 
        background: #fefefe; 
        border: 1px solid #e5e7eb; 
        border-radius: 8px;
        border-left: 4px solid #f59e0b;
      }
      .terms-section h3 {
        color: #f59e0b;
        margin: 0 0 15px 0;
      }
      .terms-section p {
        margin: 8px 0;
        font-size: 13px;
        line-height: 1.5;
      }
      @media print {
        body { margin: 0; padding: 15px; }
        .equipment-table { box-shadow: none; }
      }
    </style>`;

  // Process each element in the template
  template.elements?.forEach(element => {
    switch (element.type) {
      case 'header':
        html += generateHeader(quotation);
        break;
      case 'customer':
      case 'customer_details':
        html += generateCustomerSection(quotation);
        break;
      case 'table':
      case 'equipment_table':
        html += generateEquipmentTable(quotation);
        break;
      case 'total':
      case 'totals':
        html += generateTotalSection(quotation);
        break;
      case 'terms':
      case 'terms_conditions':
        html += generateTermsSection(element.content);
        break;
      case 'text':
      default:
        if (element.content) {
          html += `<div class="content-section" style="margin: 15px 0;">${element.content}</div>`;
        }
    }
  });

  return html;
}

function renderLegacyTemplate(quotation: QuotationData, template: TemplateData): string {
  console.log('📰 Using legacy template renderer');

  let content = template.content || '';

  // Replace common placeholders
  content = content.replace(
    /\{\{customer_name\}\}/g,
    quotation.customerContact?.name || quotation.customerName || 'Valued Customer'
  );
  content = content.replace(
    /\{\{customer_company\}\}/g,
    quotation.customerContact?.company || 'Customer Company'
  );
  content = content.replace(/\{\{customer_phone\}\}/g, quotation.customerContact?.phone || '');
  content = content.replace(/\{\{customer_email\}\}/g, quotation.customerContact?.email || '');
  content = content.replace(
    /\{\{equipment_name\}\}/g,
    quotation.selectedEquipment?.name || 'Equipment'
  );
  content = content.replace(
    /\{\{total_amount\}\}/g,
    `₹${quotation.totalRent?.toLocaleString('en-IN') || '0'}`
  );
  content = content.replace(
    /\{\{project_duration\}\}/g,
    `${quotation.numberOfDays} ${quotation.numberOfDays === 1 ? 'Day' : 'Days'}`
  );
  content = content.replace(/\{\{quote_date\}\}/g, new Date().toLocaleDateString('en-IN'));

  return content;
}

function renderDefaultTemplate(quotation: QuotationData): string {
  console.log('🎯 Using default template renderer');

  return `
    <style>
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        margin: 0; 
        padding: 20px; 
        background: white;
        color: #333;
        line-height: 1.6;
      }
      .header { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-bottom: 30px; 
        padding-bottom: 20px; 
        border-bottom: 3px solid #2563eb;
      }
      .company-section { 
        display: flex; 
        align-items: center; 
        gap: 20px;
      }
      .logo { 
        width: 80px; 
        height: 80px; 
        background: linear-gradient(135deg, #2563eb, #1d4ed8); 
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 24px;
        box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
      }
      .company-details h1 { 
        margin: 0; 
        color: #2563eb; 
        font-size: 32px; 
        font-weight: 700;
      }
      .company-details p { 
        margin: 3px 0; 
        color: #666; 
        font-size: 14px;
      }
      .quotation-info { 
        text-align: right; 
        color: #333;
      }
      .quotation-info h2 { 
        margin: 0; 
        color: #2563eb; 
        font-size: 28px;
        font-weight: 600;
      }
      .customer-section {
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        border-left: 4px solid #2563eb;
      }
      .equipment-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 20px 0; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      .equipment-table th { 
        background: linear-gradient(135deg, #2563eb, #1d4ed8); 
        color: white; 
        padding: 15px 12px; 
        text-align: left; 
        font-weight: 600;
      }
      .equipment-table td { 
        padding: 12px; 
        border: 1px solid #e5e7eb; 
        color: #374151;
      }
      .equipment-table tr:nth-child(even) { 
        background: #f9fafb;
      }
      .total-section {
        background: #f0f9ff;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        border: 1px solid #bae6fd;
        text-align: right;
      }
      .total-amount {
        font-size: 24px;
        font-weight: bold;
        color: #2563eb;
      }
    </style>
    ${generateHeader(quotation)}
    ${generateCustomerSection(quotation)}
    ${generateEquipmentTable(quotation)}
    ${generateTotalSection(quotation)}
    ${generateTermsSection()}
  `;
}

function generateHeader(quotation: QuotationData): string {
  return `
    <div class="header">
      <div class="company-section">
        <div class="logo">ASP</div>
        <div class="company-details">
          <h1>ASP CRANES</h1>
          <p>Professional Crane Rental & Equipment Solutions</p>
          <p>📧 contact@aspcranes.com | 📞 +91-7898168580</p>
          <p>🌐 www.aspcranes.com</p>
        </div>
      </div>
      <div class="quotation-info">
        <h2>QUOTATION</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
        <p><strong>Quote ID:</strong> ${quotation.id}</p>
        <p><strong>Valid Until:</strong> ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}</p>
      </div>
    </div>
  `;
}

function generateCustomerSection(quotation: QuotationData): string {
  return `
    <div class="customer-section">
      <h3>Bill To:</h3>
      <p><strong>${quotation.customerContact?.name || quotation.customerName || 'Valued Customer'}</strong></p>
      <p>${quotation.customerContact?.company || 'Customer Company'}</p>
      <p>${quotation.customerContact?.address || 'Customer Address'}</p>
      <p>📞 ${quotation.customerContact?.phone || 'Phone Number'}</p>
      <p>📧 ${quotation.customerContact?.email || 'Email Address'}</p>
    </div>
  `;
}

function generateEquipmentTable(quotation: QuotationData): string {
  const machines = quotation.selectedMachines || [];
  const singleEquipment = quotation.selectedEquipment;

  // If no machines but single equipment, create a machine entry
  if (machines.length === 0 && singleEquipment) {
    machines.push({
      name: singleEquipment.name,
      baseRate: quotation.totalRent / quotation.numberOfDays,
      quantity: 1,
    });
  }

  let tableRows = '';
  machines.forEach((machine, index) => {
    const rate = machine.baseRate || 0;
    const amount = rate * quotation.numberOfDays * machine.quantity;

    tableRows += `
      <tr>
        <td>${index + 1}</td>
        <td>${machine.name}</td>
        <td>Hydraulic Mobile Crane</td>
        <td>${quotation.numberOfDays} ${quotation.numberOfDays === 1 ? 'Day' : 'Days'}</td>
        <td>${machine.quantity}</td>
        <td>₹${rate.toLocaleString('en-IN')}</td>
        <td>₹${amount.toLocaleString('en-IN')}</td>
      </tr>
    `;
  });

  return `
    <table class="equipment-table">
      <thead>
        <tr>
          <th>S.No</th>
          <th>Equipment Description</th>
          <th>Specifications</th>
          <th>Duration</th>
          <th>Qty</th>
          <th>Rate/Day</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
}

function generateTotalSection(quotation: QuotationData): string {
  const subtotal = quotation.totalRent || 0;
  const gst = quotation.includeGst ? Math.round(subtotal * 0.18) : 0;
  const grandTotal = subtotal + gst;

  return `
    <div class="total-section">
      <div style="margin-bottom: 10px;">
        <span style="font-weight: 600;">Subtotal:</span>
        <span style="float: right;">₹${subtotal.toLocaleString('en-IN')}</span>
      </div>
      ${
        quotation.mobDemob
          ? `
      <div style="margin-bottom: 10px;">
        <span style="font-weight: 600;">Mobilization/Demobilization:</span>
        <span style="float: right;">₹${quotation.mobDemob.toLocaleString('en-IN')}</span>
      </div>
      `
          : ''
      }
      ${
        gst > 0
          ? `
      <div style="margin-bottom: 10px;">
        <span style="font-weight: 600;">GST (18%):</span>
        <span style="float: right;">₹${gst.toLocaleString('en-IN')}</span>
      </div>
      `
          : ''
      }
      <hr style="margin: 15px 0; border: 1px solid #2563eb;">
      <div class="total-amount">
        <span>Total Amount: ₹${grandTotal.toLocaleString('en-IN')}</span>
      </div>
    </div>
  `;
}

function generateTermsSection(customTerms?: string): string {
  const defaultTerms = `
1. Payment Terms: 30 days from invoice date
2. All rates are inclusive of operator charges
3. Fuel, maintenance, and insurance included
4. Site access and working conditions to be provided by client
5. Any additional work beyond scope will be charged separately
6. Cancellation charges may apply as per terms
7. Equipment to be used strictly as per manufacturer guidelines
8. Client responsible for site safety and security
9. Force majeure conditions will be considered for delays
10. All disputes subject to local jurisdiction
  `;

  return `
    <div class="terms-section">
      <h3>Terms & Conditions:</h3>
      <div style="white-space: pre-line; font-size: 13px; line-height: 1.5;">
        ${customTerms || defaultTerms}
      </div>
    </div>
  `;
}

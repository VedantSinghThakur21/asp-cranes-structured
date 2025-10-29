/**
 * Professional Template Renderer for ASP Cranes
 * Handles Template Builder elements and legacy templates
 */

import { Quotation } from '../types/quotation';
import { Template } from '../types/template';

export interface QuotationCalculations {
  workingCost: number;
  foodAccomCost: number;
  transportCost: number;
  mobDemobCost: number;
  riskAdjustment: number;
  usageLoadFactor: number;
  extraCharges: number;
  incidentalCost: number;
  otherFactorsCost: number;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
}

export function calculateQuotationTotals(quotation: Quotation): QuotationCalculations {
  console.log('� CALCULATION FUNCTION CALLED for quotation:', quotation.id);
  console.log('�💰 Calculating quotation totals for ID:', quotation.id);
  console.log('📊 Full quotation object:', quotation);
  console.log('📊 Input quotation data:', {
    foodResources: quotation.foodResources,
    accomResources: quotation.accomResources,
    numberOfDays: quotation.numberOfDays,
    mobDemob: quotation.mobDemob,
    workingCost: quotation.workingCost,
    totalRent: quotation.totalRent,
    riskFactor: quotation.riskFactor,
    usage: quotation.usage,
    extraCharge: quotation.extraCharge,
    // Database calculated values
    mobDemobCost: quotation.mobDemobCost,
    foodAccomCost: quotation.foodAccomCost,
    usageLoadFactor: quotation.usageLoadFactor,
    riskAdjustment: quotation.riskAdjustment,
    gstAmount: quotation.gstAmount,
  });

  // Prioritize database values over calculations
  const workingCost = quotation.workingCost || quotation.totalRent || 0;

  // Food & accommodation cost - use database value only
  const foodAccomCost = quotation.foodAccomCost || 0;

  console.log('🍽️ Food & Accom calculation:', {
    fromDatabase: quotation.foodAccomCost,
    finalValue: foodAccomCost,
    foodResources: quotation.foodResources || 0,
    accomResources: quotation.accomResources || 0,
    numberOfDays: quotation.numberOfDays || 1,
    usingDatabaseValue: quotation.foodAccomCost !== undefined && quotation.foodAccomCost !== null,
  });

  const transportCost = (quotation.siteDistance || 0) * (quotation.runningCostPerKm || 100);

  // Use database mob/demob cost first
  const mobDemobCost = quotation.mobDemobCost ?? (quotation.mobDemob || 0);

  console.log('🚚 Transport & Mob/Demob:', {
    siteDistance: quotation.siteDistance || 0,
    runningCostPerKm: quotation.runningCostPerKm || 100,
    transportCost,
    mobDemobFromDB: quotation.mobDemobCost,
    mobDemobFinal: mobDemobCost,
    usingDatabaseValue: quotation.mobDemobCost !== undefined && quotation.mobDemobCost !== null,
  });

  // Use database risk adjustment first
  const riskAdjustment =
    quotation.riskAdjustment ??
    (() => {
      // Calculate risk as percentage of working cost
      if (quotation.riskFactor === 'high') return Math.round(workingCost * 0.2); // 20%
      if (quotation.riskFactor === 'medium') return Math.round(workingCost * 0.1); // 10%
      return 0;
    })();

  // Use database usage load factor first
  const usageLoadFactor =
    quotation.usageLoadFactor ??
    (() => {
      if (quotation.usage === 'heavy') return Math.round(workingCost * 0.5); // 50%
      return 0;
    })();

  console.log('⚠️ Risk & Usage factors:', {
    riskFromDB: quotation.riskAdjustment,
    riskFinal: riskAdjustment,
    usageFromDB: quotation.usageLoadFactor,
    usageFinal: usageLoadFactor,
    riskFactor: quotation.riskFactor,
    usage: quotation.usage,
    usingDatabaseRisk: quotation.riskAdjustment !== undefined && quotation.riskAdjustment !== null,
    usingDatabaseUsage:
      quotation.usageLoadFactor !== undefined && quotation.usageLoadFactor !== null,
  });

  const extraCharges = quotation.extraCharge || 0;

  const incidentalRates = { incident1: 5000, incident2: 10000, incident3: 15000 };
  const incidentalCost = (quotation.incidentalCharges || []).reduce(
    (sum, inc) => sum + (incidentalRates[inc as keyof typeof incidentalRates] || 0),
    0
  );

  let otherFactorsCost = 0;
  if (quotation.otherFactors?.includes('rigger')) otherFactorsCost += 40000;
  if (quotation.otherFactors?.includes('helper')) otherFactorsCost += 12000;

  const subtotal =
    workingCost +
    foodAccomCost +
    transportCost +
    mobDemobCost +
    riskAdjustment +
    usageLoadFactor +
    extraCharges +
    incidentalCost +
    otherFactorsCost;

  // Use database GST amount first, then calculate if needed
  const gstAmount = quotation.gstAmount ?? (quotation.includeGst ? Math.round(subtotal * 0.18) : 0);
  const totalAmount = subtotal + gstAmount;

  console.log('💰 Final calculations:', {
    workingCost,
    foodAccomCost,
    transportCost,
    mobDemobCost,
    riskAdjustment,
    usageLoadFactor,
    extraCharges,
    incidentalCost,
    otherFactorsCost,
    subtotal,
    gstAmount,
    totalAmount,
    usingDatabaseValues: {
      foodAccom: quotation.foodAccomCost !== undefined && quotation.foodAccomCost !== null,
      mobDemob: quotation.mobDemobCost !== undefined && quotation.mobDemobCost !== null,
      risk: quotation.riskAdjustment !== undefined && quotation.riskAdjustment !== null,
      usage: quotation.usageLoadFactor !== undefined && quotation.usageLoadFactor !== null,
      gst: quotation.gstAmount !== undefined && quotation.gstAmount !== null,
    },
    databaseValues: {
      foodAccomCost: quotation.foodAccomCost,
      mobDemobCost: quotation.mobDemobCost,
      riskAdjustment: quotation.riskAdjustment,
      usageLoadFactor: quotation.usageLoadFactor,
      gstAmount: quotation.gstAmount,
    },
  });

  return {
    workingCost,
    foodAccomCost,
    transportCost,
    mobDemobCost,
    riskAdjustment,
    usageLoadFactor,
    extraCharges,
    incidentalCost,
    otherFactorsCost,
    subtotal,
    gstAmount,
    totalAmount,
  };
}

export function renderProfessionalTemplate(quotation: Quotation, template?: Template): string {
  console.log('🎨 Rendering professional template for quotation:', quotation.id);
  console.log('📄 Template info:', {
    id: template?.id,
    name: template?.name,
    hasContent: !!template?.content,
    hasElements: !!template?.elements,
    elementsCount: template?.elements?.length || 0,
    elements: template?.elements,
  });

  const calculations = calculateQuotationTotals(quotation);
  const quoteNumber = `ASP-${new Date().getFullYear()}-${quotation.id.slice(-6).toUpperCase()}`;
  const quoteDate = new Date().toLocaleDateString('en-IN');
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');

  // Check if we have Template Builder elements
  if (template?.elements && template.elements.length > 0) {
    console.log('🏗️ Using Template Builder elements:', template.elements.length);
    return renderTemplateBuilderTemplate(
      quotation,
      template,
      calculations,
      quoteNumber,
      quoteDate,
      validUntil
    );
  }

  // Check if we have legacy template content
  if (template?.content && template.content.trim().length > 0) {
    console.log('📰 Using legacy template content');
    return renderLegacyTemplate(quotation, template, calculations);
  }

  // If template exists but has no elements or content, still use default professional template
  console.log('🎯 Using default professional template (template empty or no content)');
  return renderDefaultTemplate(quotation, calculations, quoteNumber, quoteDate, validUntil);
}

function renderTemplateBuilderTemplate(
  quotation: Quotation,
  template: Template,
  calculations: QuotationCalculations,
  quoteNumber: string,
  quoteDate: string,
  validUntil: string
): string {
  console.log(
    '🏗️ Processing Template Builder template with',
    template.elements?.length,
    'elements'
  );

  let html = getBaseStyles() + '<div class="quotation-container">';

  // Process each element from Template Builder
  if (template.elements && template.elements.length > 0) {
    template.elements.forEach((element, index) => {
      console.log(`📦 Processing element ${index + 1}:`, element.type, element);
      try {
        const elementHtml = processTemplateElement(
          element,
          quotation,
          calculations,
          quoteNumber,
          quoteDate,
          validUntil
        );
        html += elementHtml;
        console.log(
          `✅ Element ${index + 1} processed successfully, HTML length:`,
          elementHtml.length
        );
      } catch (error) {
        console.error(`❌ Error processing element ${index + 1}:`, error);
        html += `<div style="padding: 10px; background: #ffebee; border: 1px solid #f44336; margin: 10px 0;">
          <strong>Error processing template element:</strong> ${element.type}<br>
          <small>${error instanceof Error ? error.message : 'Unknown error'}</small>
        </div>`;
      }
    });
  } else {
    console.warn('⚠️ No elements found in Template Builder template');
    html +=
      '<div style="padding: 20px; text-align: center; color: #666;">No template elements found</div>';
  }

  // Add cost summary if not included
  if (!template.elements?.some(e => e.type === 'total' || e.type === 'cost_summary')) {
    console.log('➕ Adding default cost summary');
    html += `<div class="cost-summary">
      <h3>💰 Cost Summary</h3>
      ${generateCostBreakdown(calculations, quotation)}
    </div>`;
  }

  html += '</div>';
  console.log('🎉 Template Builder rendering complete, total HTML length:', html.length);
  return html;
}

function processTemplateElement(
  element: any,
  quotation: Quotation,
  calculations: QuotationCalculations,
  quoteNumber: string,
  quoteDate: string,
  validUntil: string
): string {
  console.log(`🧩 Processing element: ${element.type}`, element);

  // Apply element styles
  const styleString = element.style
    ? Object.entries(element.style)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ')
    : '';

  const wrapperStyle = styleString ? `style="${styleString}"` : '';

  switch (element.type) {
    case 'header':
      return `<div class="template-header" ${wrapperStyle}>
        <div class="company-section">
          <div class="company-logo">ASP</div>
          <div class="company-details">
            <h1>${element.content || 'ASP CRANES'}</h1>
            <div class="tagline">Professional Crane Rental & Equipment Solutions</div>
            <div class="contact-info">📧 contact@aspcranes.com<br>📞 +91-7898168580</div>
          </div>
        </div>
        <div class="quote-info">
          <h2>QUOTATION</h2>
          <div><strong>Quote No:</strong> ${quoteNumber}</div>
          <div><strong>Date:</strong> ${quoteDate}</div>
          <div><strong>Valid Until:</strong> ${validUntil}</div>
        </div>
      </div>`;

    case 'text':
      const processedText = replaceTemplatePlaceholders(
        element.content || '',
        quotation,
        quoteNumber,
        quoteDate
      );
      return `<div class="text-section" ${wrapperStyle}>${processedText}</div>`;

    case 'field':
      const fieldValue = replaceTemplatePlaceholders(
        element.content || '',
        quotation,
        quoteNumber,
        quoteDate
      );
      return `<div class="field-section" ${wrapperStyle}>${fieldValue}</div>`;

    case 'customer':
    case 'customer_details':
    case 'client_info':
      const customerName =
        quotation.customerContact?.name || quotation.customerName || 'ABC Construction';
      const customerCompany =
        quotation.customerContact?.company || quotation.customerName || 'ABC Construction';
      const customerEmail = quotation.customerContact?.email || 'info@abcconstruction.com';
      const customerPhone = quotation.customerContact?.phone || '+91 98765 43210';
      const customerAddress = quotation.customerContact?.address || 'Mumbai, Maharashtra';

      return `<div class="customer-section" ${wrapperStyle}>
        <h3>📋 Bill To</h3>
        <div><strong>${customerCompany}</strong></div>
        <div>Contact: ${customerName}</div>
        <div>Address: ${customerAddress}</div>
        <div>Phone: ${customerPhone}</div>
        <div>Email: ${customerEmail}</div>
      </div>`;

    case 'table':
      return renderTemplateBuilderTable(element, quotation, calculations, wrapperStyle);

    case 'terms':
    case 'terms_conditions':
      const termsContent = element.content || getDefaultTerms();
      return `<div class="terms-section" ${wrapperStyle}>
        <h3>⚖️ Terms & Conditions</h3>
        <div class="terms-content">${termsContent}</div>
      </div>`;

    case 'image':
      const imageSrc = element.config?.src || '/placeholder-image.png';
      const imageAlt = element.config?.alt || 'Template Image';
      return `<div class="image-section" ${wrapperStyle}>
        <img src="${imageSrc}" alt="${imageAlt}" style="max-width: 100%; height: auto;" />
      </div>`;

    case 'job_details':
      return `<div class="job-details-section" ${wrapperStyle}>
        <h3>🏗️ Job Details</h3>
        <div class="job-info">
          <div><strong>Job Type:</strong> ${quotation.orderType || 'Monthly'}</div>
          <div><strong>Duration:</strong> ${quotation.numberOfDays || 1} ${quotation.orderType === 'monthly' ? 'Month(s)' : 'Day(s)'}</div>
          <div><strong>Working Hours:</strong> ${quotation.workingHours || 8} hours/day</div>
          <div><strong>Machine Type:</strong> ${quotation.machineType || 'Mobile Crane'}</div>
        </div>
      </div>`;

    case 'equipment_table':
      return renderEquipmentTable(quotation, calculations, wrapperStyle);

    case 'charges_table':
      return renderChargesTable(quotation, calculations, wrapperStyle);

    case 'total':
    case 'cost_summary':
      return `<div class="cost-summary" ${wrapperStyle}>
        <h3>💰 Cost Summary</h3>
        ${generateCostBreakdown(calculations, quotation)}
      </div>`;

    default:
      console.warn(`⚠️ Unknown element type: ${element.type}`);
      return `<div class="unknown-element" ${wrapperStyle}>
        <p>Unknown element: ${element.type}</p>
        <p>Content: ${element.content || 'No content'}</p>
      </div>`;
  }
}

function renderTemplateBuilderTable(
  element: any,
  quotation: Quotation,
  _calculations: QuotationCalculations,
  wrapperStyle: string
): string {
  // If the element has table configuration, use it
  if (element.config?.columns && element.config?.rows) {
    const { columns, rows } = element.config;

    let tableHtml = `<div class="equipment-section" ${wrapperStyle}>
      <h3>🏗️ ${element.content || 'Equipment & Services'}</h3>
      <table class="equipment-table">
        <thead>
          <tr>`;

    // Render headers
    columns.forEach((column: string) => {
      tableHtml += `<th>${column}</th>`;
    });

    tableHtml += `</tr></thead><tbody>`;

    // Render rows with placeholder replacement
    rows.forEach((row: string[]) => {
      tableHtml += '<tr>';
      row.forEach((cell: string, index: number) => {
        const processedCell = replaceTemplatePlaceholders(cell, quotation, '', '');
        const columnLabel = columns[index] || `Column ${index + 1}`;
        tableHtml += `<td data-label="${columnLabel}">${processedCell}</td>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += `</tbody></table></div>`;
    return tableHtml;
  }

  // Fallback to default equipment table
  return `<div class="equipment-section" ${wrapperStyle}>
    <h3>🏗️ Equipment & Services</h3>
    ${generateEquipmentTable(quotation)}
  </div>`;
}

function renderLegacyTemplate(
  quotation: Quotation,
  template: Template,
  _calculations: QuotationCalculations
): string {
  let content = template.content || '';
  const quoteNumber = `ASP-${new Date().getFullYear()}-${quotation.id.slice(-6)}`;
  const quoteDate = new Date().toLocaleDateString('en-IN');

  content = replaceTemplatePlaceholders(content, quotation, quoteNumber, quoteDate);

  return `<style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .legacy-template { background: white; padding: 20px; }
  </style>
  <div class="legacy-template">${content}</div>`;
}

function renderDefaultTemplate(
  quotation: Quotation,
  calculations: QuotationCalculations,
  quoteNumber: string,
  quoteDate: string,
  validUntil: string
): string {
  return (
    getBaseStyles() +
    `
    <div class="quotation-container">
      <div class="template-header">
        <div class="company-section">
          <div class="company-logo">ASP</div>
          <div class="company-details">
            <h1>ASP CRANES</h1>
            <div class="tagline">Professional Crane Rental & Equipment Solutions</div>
            <div class="contact-info">📧 contact@aspcranes.com<br>📞 +91-7898168580</div>
          </div>
        </div>
        <div class="quote-info">
          <h2>QUOTATION</h2>
          <div><strong>Quote No:</strong> ${quoteNumber}</div>
          <div><strong>Date:</strong> ${quoteDate}</div>
          <div><strong>Valid Until:</strong> ${validUntil}</div>
        </div>
      </div>
      
      <div class="customer-section">
        <h3>📋 Bill To</h3>
        <div><strong>${quotation.customerContact?.company || quotation.customerName || 'Valued Customer'}</strong></div>
        <div>Contact: ${quotation.customerContact?.name || 'N/A'}</div>
        <div>Address: ${quotation.customerContact?.address || 'Address not provided'}</div>
        <div>Phone: ${quotation.customerContact?.phone || 'N/A'}</div>
        <div>Email: ${quotation.customerContact?.email || 'N/A'}</div>
      </div>
      
      <div class="equipment-section">
        <h3>🏗️ Equipment & Services</h3>
        ${generateEquipmentTable(quotation)}
      </div>
      
      <div class="cost-summary">
        <h3>💰 Cost Summary</h3>
        ${generateCostBreakdown(calculations, quotation)}
      </div>
      
      <div class="terms-section">
        <h3>⚖️ Terms & Conditions</h3>
        <div class="terms-content">${getDefaultTerms()}</div>
      </div>
    </div>
  `
  );
}

function getBaseStyles(): string {
  return `<style>
    * { box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0; 
      padding: 0; 
      background: white;
      color: #1f2937;
      line-height: 1.5;
      font-size: 14px;
    }
    
    .quotation-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
      min-height: 297mm;
    }
    
    .template-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    
    .company-section {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    .company-logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }
    
    .company-details h1 {
      margin: 0 0 5px 0;
      color: #2563eb;
      font-size: 32px;
      font-weight: 700;
    }
    
    .company-details .tagline {
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .company-details .contact-info {
      font-size: 12px;
      color: #4b5563;
      line-height: 1.4;
    }
    
    .quote-info {
      text-align: right;
      color: #374151;
      font-size: 13px;
    }
    
    .quote-info h2 {
      margin: 0 0 10px 0;
      color: #2563eb;
      font-size: 28px;
      font-weight: 600;
    }
    
    .customer-section, .equipment-section, .cost-summary, .terms-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #2563eb;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    
    .customer-section h3, .equipment-section h3, .cost-summary h3, .terms-section h3 {
      color: #2563eb;
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .equipment-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .equipment-table th {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
    }
    
    .equipment-table td {
      padding: 12px 10px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
      font-size: 13px;
    }
    
    .equipment-table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .amount-cell {
      text-align: right;
      font-weight: 600;
      color: #1f2937;
    }
    
    .cost-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    
    .cost-row.total {
      background: #eff6ff;
      padding: 12px;
      margin: 15px -20px -20px -20px;
      font-size: 16px;
      font-weight: 700;
      color: #2563eb;
      border-top: 3px solid #2563eb;
    }
    
    .terms-section {
      background: #fffbeb;
      border: 1px solid #fed7aa;
      border-left: 4px solid #f59e0b;
    }
    
    .terms-section h3 {
      color: #92400e;
    }
    
    .terms-content {
      font-size: 12px;
      line-height: 1.6;
      color: #78350f;
      white-space: pre-line;
    }
    
    .text-content {
      margin: 15px 0;
      line-height: 1.6;
    }
    
    /* Responsive Styles */
    @media (max-width: 768px) {
      .quotation-container {
        padding: 10px;
        margin: 10px;
      }
      
      .template-header {
        flex-direction: column;
        text-align: center;
        gap: 15px;
      }
      
      .company-section {
        flex-direction: column;
        text-align: center;
      }
      
      .equipment-table, .equipment-table th, .equipment-table td {
        font-size: 12px;
        padding: 6px 4px;
      }
      
      .quote-details {
        font-size: 12px;
      }
      
      .company-info, .customer-info {
        font-size: 12px;
      }
    }
    
    @media (max-width: 480px) {
      .equipment-table, .equipment-table thead, .equipment-table tbody, 
      .equipment-table th, .equipment-table td, .equipment-table tr {
        display: block;
        width: 100%;
      }
      
      .equipment-table thead tr {
        display: none;
      }
      
      .equipment-table td {
        display: flex;
        justify-content: space-between;
        border: none;
        border-bottom: 1px solid #ccc;
        padding: 8px 5px;
        position: relative;
      }
      
      .equipment-table td:before {
        content: attr(data-label);
        font-weight: bold;
        flex-basis: 50%;
        text-align: left;
      }
      
      .cost-row {
        flex-direction: column;
        gap: 5px;
        text-align: center;
      }
      
      .quotation-container {
        margin: 5px;
        padding: 8px;
      }
    }
    
    @media print {
      body { 
        margin: 0; 
        padding: 0; 
        font-size: 12px;
      }
      
      .quotation-container {
        padding: 15mm;
      }
      
      .equipment-table {
        box-shadow: none;
      }
    }
  </style>`;
}

function generateEquipmentTable(quotation: Quotation): string {
  const machines = quotation.selectedMachines || [];

  if (machines.length === 0 && quotation.selectedEquipment) {
    machines.push({
      id: quotation.selectedEquipment.id,
      machineType: quotation.machineType || 'mobile_crane',
      equipmentId: quotation.selectedEquipment.equipmentId,
      name: quotation.selectedEquipment.name,
      baseRates: quotation.selectedEquipment.baseRates,
      baseRate: quotation.workingCost || quotation.totalRent || 0,
      runningCostPerKm: quotation.runningCostPerKm || 100,
      quantity: 1,
    });
  }

  let tableRows = '';
  machines.forEach((machine, index) => {
    const dailyRate = machine.baseRate || 0;
    const totalDays = quotation.numberOfDays || 1;
    const quantity = machine.quantity || 1;
    const lineTotal = dailyRate * totalDays * quantity;

    tableRows += `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${machine.name}</strong></td>
        <td>Professional Hydraulic Mobile Crane</td>
        <td>${totalDays} ${totalDays === 1 ? 'Day' : 'Days'}</td>
        <td style="text-align: center;">${quantity}</td>
        <td class="amount-cell">₹${dailyRate.toLocaleString('en-IN')}</td>
        <td class="amount-cell">₹${lineTotal.toLocaleString('en-IN')}</td>
      </tr>
    `;
  });

  return `
    <table class="equipment-table">
      <thead>
        <tr>
          <th>S.No</th>
          <th>Equipment</th>
          <th>Description</th>
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

function generateCostBreakdown(calculations: QuotationCalculations, quotation: Quotation): string {
  let html = `
    <div class="cost-row">
      <span>Equipment Rental (${quotation.numberOfDays} days)</span>
      <span>₹${calculations.workingCost.toLocaleString('en-IN')}</span>
    </div>
  `;

  if (calculations.foodAccomCost > 0) {
    html += `<div class="cost-row">
      <span>Food & Accommodation</span>
      <span>₹${calculations.foodAccomCost.toLocaleString('en-IN')}</span>
    </div>`;
  }

  if (calculations.transportCost > 0) {
    html += `<div class="cost-row">
      <span>Transportation</span>
      <span>₹${calculations.transportCost.toLocaleString('en-IN')}</span>
    </div>`;
  }

  if (calculations.mobDemobCost > 0) {
    html += `<div class="cost-row">
      <span>Mobilization & Demobilization</span>
      <span>₹${calculations.mobDemobCost.toLocaleString('en-IN')}</span>
    </div>`;
  }

  if (calculations.extraCharges > 0) {
    html += `<div class="cost-row">
      <span>Additional Charges</span>
      <span>₹${calculations.extraCharges.toLocaleString('en-IN')}</span>
    </div>`;
  }

  html += `
    <div class="cost-row" style="font-weight: 600; border-top: 2px solid #2563eb; padding-top: 12px; margin-top: 8px;">
      <span>Subtotal</span>
      <span>₹${calculations.subtotal.toLocaleString('en-IN')}</span>
    </div>
  `;

  if (calculations.gstAmount > 0) {
    html += `<div class="cost-row">
      <span>GST @ 18%</span>
      <span>₹${calculations.gstAmount.toLocaleString('en-IN')}</span>
    </div>`;
  }

  html += `
    <div class="cost-row total">
      <span>Total Amount</span>
      <span>₹${calculations.totalAmount.toLocaleString('en-IN')}</span>
    </div>
  `;

  return html;
}

function replaceTemplatePlaceholders(
  content: string,
  quotation: Quotation,
  quoteNumber: string,
  quoteDate: string
): string {
  console.log('🔄 [TemplateRenderer] Replacing placeholders for quotation:', quotation.id);
  console.log('🔄 [TemplateRenderer] Customer data available:', {
    customerName: quotation.customerName,
    customerContact: quotation.customerContact,
    hasName: !!(quotation.customerContact?.name || quotation.customerName),
    hasCompany: !!quotation.customerContact?.company,
    hasEmail: !!quotation.customerContact?.email,
    hasPhone: !!quotation.customerContact?.phone,
  });

  // Extract customer information with better fallbacks
  const customerName =
    quotation.customerContact?.name || quotation.customerName || 'ABC Construction';
  const customerCompany =
    quotation.customerContact?.company || quotation.customerName || 'ABC Construction';
  const customerEmail = quotation.customerContact?.email || 'info@abcconstruction.com';
  const customerPhone = quotation.customerContact?.phone || '+91 98765 43210';
  const customerAddress = quotation.customerContact?.address || 'Mumbai, Maharashtra';

  return (
    content
      // Legacy customer placeholders
      .replace(/\{\{customer_name\}\}/g, customerName)
      .replace(/\{\{customer_company\}\}/g, customerCompany)
      .replace(/\{\{customer_phone\}\}/g, customerPhone)
      .replace(/\{\{customer_email\}\}/g, customerEmail)
      .replace(/\{\{customer_address\}\}/g, customerAddress)

      // Enhanced template client placeholders
      .replace(/\{\{client\.name\}\}/g, customerName)
      .replace(/\{\{client\.company\}\}/g, customerCompany)
      .replace(/\{\{client\.phone\}\}/g, customerPhone)
      .replace(/\{\{client\.email\}\}/g, customerEmail)
      .replace(/\{\{client\.address\}\}/g, customerAddress)

      // Company placeholders
      .replace(/\{\{company\.name\}\}/g, 'ASP CRANES')
      .replace(/\{\{company\.address\}\}/g, 'Industrial Area, Pune, Maharashtra 411019')
      .replace(/\{\{company\.phone\}\}/g, '+91 99999 88888')
      .replace(/\{\{company\.email\}\}/g, 'sales@aspcranes.com')
      .replace(/\{\{company\.website\}\}/g, 'www.aspcranes.com')

      // Quotation placeholders
      .replace(/\{\{quotation\.number\}\}/g, quoteNumber)
      .replace(/\{\{quotation\.date\}\}/g, quoteDate)
      .replace(
        /\{\{quotation\.validUntil\}\}/g,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')
      )

      // Equipment and project placeholders
      .replace(
        /\{\{equipment_name\}\}/g,
        quotation.selectedEquipment?.name || quotation.selectedMachines?.[0]?.name || 'Equipment'
      )
      .replace(
        /\{\{total_amount\}\}/g,
        `₹${quotation.totalRent?.toLocaleString('en-IN') || '50,000'}`
      )
      .replace(
        /\{\{project_duration\}\}/g,
        `${quotation.numberOfDays || 7} ${(quotation.numberOfDays || 7) === 1 ? 'Day' : 'Days'}`
      )

      // Legacy placeholders
      .replace(/\{\{quote_date\}\}/g, quoteDate)
      .replace(/\{\{quote_number\}\}/g, quoteNumber)
  );
}

function renderEquipmentTable(
  quotation: Quotation,
  calculations: QuotationCalculations,
  wrapperStyle: string
): string {
  return `<div class="comprehensive-equipment-section" ${wrapperStyle}>
    <h3>🏗️ Equipment & Services Details</h3>
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
        <tr>
          <td>1</td>
          <td>130MT</td>
          <td>${quotation.orderType || 'Unloading work'}</td>
          <td>${quotation.numberOfDays || 1} ${quotation.orderType === 'monthly' ? 'Month' : 'Days'}</td>
          <td>₹${calculations.workingCost?.toLocaleString('en-IN') || '0'} + GST 18%</td>
          <td>₹${calculations.mobDemobCost ? (calculations.mobDemobCost / 2).toLocaleString('en-IN') : '10,000'}/- + GST 18%</td>
          <td>₹${calculations.mobDemobCost ? (calculations.mobDemobCost / 2).toLocaleString('en-IN') : '10,000'}/- + GST 18%</td>
        </tr>
        <tr class="total-row">
          <td colspan="4"><strong>Total</strong></td>
          <td><strong>₹${calculations.workingCost?.toLocaleString('en-IN') || '0'} + GST 18%</strong></td>
          <td><strong>₹${calculations.mobDemobCost ? (calculations.mobDemobCost / 2).toLocaleString('en-IN') : '10,000'}/- + GST 18%</strong></td>
          <td><strong>₹${calculations.mobDemobCost ? (calculations.mobDemobCost / 2).toLocaleString('en-IN') : '10,000'}/- + GST 18%</strong></td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

function renderChargesTable(
  _quotation: Quotation,
  calculations: QuotationCalculations,
  wrapperStyle: string
): string {
  const hasCharges = calculations.incidentalCost > 0 || calculations.extraCharges > 0;

  if (!hasCharges) {
    return '';
  }

  return `<div class="charges-section" ${wrapperStyle}>
    <h3>💳 Additional Charges</h3>
    <table class="charges-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount</th>
          <th>GST (18%)</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${
          calculations.incidentalCost > 0
            ? `
          <tr>
            <td>Incidental Charges</td>
            <td>₹${calculations.incidentalCost.toLocaleString('en-IN')}</td>
            <td>₹${(calculations.incidentalCost * 0.18).toLocaleString('en-IN')}</td>
            <td>₹${(calculations.incidentalCost * 1.18).toLocaleString('en-IN')}</td>
          </tr>
        `
            : ''
        }
        ${
          calculations.extraCharges > 0
            ? `
          <tr>
            <td>Extra Charges</td>
            <td>₹${calculations.extraCharges.toLocaleString('en-IN')}</td>
            <td>₹${(calculations.extraCharges * 0.18).toLocaleString('en-IN')}</td>
            <td>₹${(calculations.extraCharges * 1.18).toLocaleString('en-IN')}</td>
          </tr>
        `
            : ''
        }
      </tbody>
    </table>
  </div>`;
}

function getDefaultTerms(): string {
  return `1. Payment Terms: 30 days from invoice date
2. All rates are inclusive of operator charges  
3. Fuel, maintenance, and insurance included
4. Site access and working conditions to be provided by client
5. Any additional work beyond scope will be charged separately
6. Cancellation charges may apply as per terms
7. Equipment to be used strictly as per manufacturer guidelines
8. Client responsible for site safety and security
9. Force majeure conditions will be considered for delays
10. All disputes subject to local jurisdiction`;
}

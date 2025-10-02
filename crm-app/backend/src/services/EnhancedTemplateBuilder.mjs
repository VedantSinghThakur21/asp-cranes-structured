/**
 * Enhanced Template Builder Service
 * Inspired by InvoiceNinja's template system, adapted for ASP Cranes
 * Provides visual template building, advanced PDF generation, and template management
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database configuration
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'asp_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'crmdb@21',
  ssl: (process.env.DB_SSL === 'true') ? true : false
});

/**
 * Template Element Types - Similar to InvoiceNinja's approach
 */
export const TEMPLATE_ELEMENT_TYPES = {
  HEADER: 'header',
  COMPANY_INFO: 'company_info',
  CLIENT_INFO: 'client_info',
  QUOTATION_INFO: 'quotation_info',
  ITEMS_TABLE: 'items_table',
  TOTALS: 'totals',
  TERMS: 'terms',
  FOOTER: 'footer',
  CUSTOM_TEXT: 'custom_text',
  IMAGE: 'image',
  DIVIDER: 'divider',
  SPACER: 'spacer',
  SIGNATURE: 'signature'
};

/**
 * Template Themes - Professional styling options
 */
export const TEMPLATE_THEMES = {
  MODERN: {
    name: 'Modern',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    fontFamily: 'Inter, sans-serif',
    headerStyle: 'minimal',
    tableStyle: 'bordered'
  },
  CLASSIC: {
    name: 'Classic',
    primaryColor: '#1f2937',
    secondaryColor: '#6b7280',
    accentColor: '#dc2626',
    fontFamily: 'Georgia, serif',
    headerStyle: 'traditional',
    tableStyle: 'striped'
  },
  PROFESSIONAL: {
    name: 'Professional',
    primaryColor: '#0f172a',
    secondaryColor: '#475569',
    accentColor: '#059669',
    fontFamily: 'system-ui, sans-serif',
    headerStyle: 'corporate',
    tableStyle: 'minimal'
  },
  CREATIVE: {
    name: 'Creative',
    primaryColor: '#7c3aed',
    secondaryColor: '#a78bfa',
    accentColor: '#f97316',
    fontFamily: 'Poppins, sans-serif',
    headerStyle: 'artistic',
    tableStyle: 'gradient'
  }
};

/**
 * Enhanced Template Builder Class
 */
export class EnhancedTemplateBuilder {
  constructor() {
    this.template = {
      id: null,
      name: '',
      description: '',
      theme: 'MODERN',
      layout: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        header: { height: 80, enabled: true },
        footer: { height: 60, enabled: true }
      },
      elements: [],
      settings: {
        showLogo: true,
        showBackground: false,
        enableWatermark: false,
        includeAttachments: false,
        multiLanguage: false,
        currency: 'INR',
        taxDisplay: 'inclusive'
      },
      branding: {
        logo: null,
        logoPosition: 'top-left',
        logoSize: { width: 150, height: 60 },
        companyColors: true,
        customCSS: ''
      },
      version: 1,
      isActive: true,
      isDefault: false,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Create a new template from scratch
   */
  createTemplate(templateData) {
    // Normalize elements to ensure they have required properties
    let normalizedElements = [];
    if (templateData.elements && Array.isArray(templateData.elements)) {
      normalizedElements = templateData.elements.map(element => ({
        ...element,
        visible: element.visible !== undefined ? element.visible : true,
        id: element.id || this.generateElementId(),
        style: element.style || {},
        content: element.content || {}
      }));
    }

    this.template = {
      ...this.template,
      ...templateData,
      elements: normalizedElements,
      id: this.generateTemplateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return this;
  }

  /**
   * Load existing template
   */
  async loadTemplate(templateId) {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT * FROM enhanced_templates WHERE id = $1',
          [templateId]
        );

        if (result.rows.length === 0) {
          throw new Error('Template not found');
        }

        const templateData = result.rows[0];

        // Safe parsing helper – prevents a single bad column from breaking load
        const degradedColumns = [];
        const safeParse = (raw, fallback, column) => {
          try {
            if (raw == null) return fallback;
            // If already an object/array just return it
            if (typeof raw === 'object') return raw;
            if (typeof raw === 'string') {
              const trimmed = raw.trim();
              if (!trimmed) return fallback;
              // Guard against common corruption pattern "[object Object]"
              if (trimmed === '[object Object]') throw new Error('Corrupted value: [object Object]');
              const firstChar = trimmed[0];
              if (firstChar === '{' || firstChar === '[') {
                return JSON.parse(trimmed);
              } else {
                // Attempt lenient fix: sometimes double-stringified JSON (quoted JSON string)
                if ((trimmed.startsWith('"{') && trimmed.endsWith('}"')) || (trimmed.startsWith('"[') && trimmed.endsWith(']"'))) {
                  const unwrapped = trimmed.slice(1, -1).replace(/\\"/g, '"');
                  return JSON.parse(unwrapped);
                }
                throw new Error('Unexpected non-JSON string');
              }
            }
            return fallback;
          } catch (e) {
            degradedColumns.push({ column, reason: e.message, sample: (typeof raw === 'string') ? raw.substring(0, 80) : typeof raw });
            return fallback;
          }
        };

        const parsedElements = safeParse(templateData.elements, [], 'elements');
        const parsedLayout = safeParse(templateData.layout, {}, 'layout');
        const parsedSettings = safeParse(templateData.settings, {}, 'settings');
        const parsedBranding = safeParse(templateData.branding, {}, 'branding');

        // Ensure layout has proper default structure
        const defaultLayout = {
          margins: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          },
          spacing: {
            elementGap: 15,
            sectionGap: 30
          }
        };
        
        const finalLayout = (parsedLayout && typeof parsedLayout === 'object' && !Array.isArray(parsedLayout)) ? {
          ...defaultLayout,
          ...parsedLayout,
          margins: {
            ...defaultLayout.margins,
            ...(parsedLayout.margins || {})
          },
          spacing: {
            ...defaultLayout.spacing,
            ...(parsedLayout.spacing || {})
          }
        } : defaultLayout;

        this.template = {
          ...this.template,
            ...templateData,
            elements: Array.isArray(parsedElements) ? parsedElements : [],
            layout: finalLayout,
            settings: (parsedSettings && typeof parsedSettings === 'object' && !Array.isArray(parsedSettings)) ? parsedSettings : {},
            branding: (parsedBranding && typeof parsedBranding === 'object' && !Array.isArray(parsedBranding)) ? parsedBranding : {},
            __meta: {
              degraded: degradedColumns.length > 0,
              degradedColumns,
              loadedAt: new Date().toISOString()
            }
        };

        if (degradedColumns.length) {
          console.warn(`⚠️ Template ${templateId} loaded in DEGRADED mode – problematic columns:`, degradedColumns);
        }

        return this;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error loading template:', error);
      throw error;
    }
  }

  /**
   * Add element to template
   */
  addElement(elementType, elementData = {}) {
    const element = this.createTemplateElement(elementType, elementData);
    this.template.elements.push(element);
    this.template.updatedAt = new Date();
    return this;
  }

  /**
   * Create template element based on type
   */
  createTemplateElement(type, data = {}) {
    const baseElement = {
      id: this.generateElementId(),
      type,
      position: { x: 0, y: 0, width: '100%', height: 'auto' },
      style: this.getDefaultElementStyle(type),
      visible: true,
      conditional: null,
      ...data
    };

    switch (type) {
      case TEMPLATE_ELEMENT_TYPES.HEADER:
        return {
          ...baseElement,
          content: {
            title: '{{company.name}}',
            subtitle: 'QUOTATION',
            showDate: true,
            showQuotationNumber: true,
            alignment: 'center'
          }
        };

      case TEMPLATE_ELEMENT_TYPES.COMPANY_INFO:
        return {
          ...baseElement,
          content: {
            fields: [
              '{{company.name}}',
              '{{company.address}}',
              '{{company.phone}}',
              '{{company.email}}',
              '{{company.website}}'
            ],
            layout: 'vertical',
            alignment: 'left'
          }
        };

      case TEMPLATE_ELEMENT_TYPES.CLIENT_INFO:
        return {
          ...baseElement,
          content: {
            title: 'Bill To:',
            fields: [
              '{{client.name}}',
              '{{client.company}}',
              '{{client.address}}',
              '{{client.phone}}',
              '{{client.email}}'
            ],
            layout: 'vertical',
            alignment: 'left'
          }
        };

      case TEMPLATE_ELEMENT_TYPES.QUOTATION_INFO:
        return {
          ...baseElement,
          content: {
            fields: [
              { label: 'Quotation #', value: '{{quotation.number}}' },
              { label: 'Date', value: '{{quotation.date}}' },
              { label: 'Valid Until', value: '{{quotation.validUntil}}' },
              { label: 'Terms', value: '{{quotation.paymentTerms}}' }
            ],
            layout: 'table',
            alignment: 'right'
          }
        };

      case TEMPLATE_ELEMENT_TYPES.ITEMS_TABLE:
      case 'table': // Support legacy 'table' type from database
        return {
          ...baseElement,
          content: {
            columns: [
              { key: 'description', label: 'Description', width: '40%', alignment: 'left' },
              { key: 'quantity', label: 'Qty', width: '15%', alignment: 'center' },
              { key: 'rate', label: 'Rate', width: '20%', alignment: 'right' },
              { key: 'amount', label: 'Amount', width: '25%', alignment: 'right' }
            ],
            showHeader: true,
            showFooter: false,
            alternateRows: true,
            showBorders: true
          }
        };

      case TEMPLATE_ELEMENT_TYPES.TOTALS:
        return {
          ...baseElement,
          content: {
            fields: [
              { label: 'Subtotal', value: '{{totals.subtotal}}', showIf: 'always' },
              { label: 'Discount', value: '{{totals.discount}}', showIf: 'hasDiscount' },
              { label: 'Tax ({{tax.rate}}%)', value: '{{totals.tax}}', showIf: 'hasTax' },
              { label: 'Total', value: '{{totals.total}}', showIf: 'always', emphasized: true }
            ],
            alignment: 'right',
            width: '50%'
          }
        };

      case TEMPLATE_ELEMENT_TYPES.TERMS:
        return {
          ...baseElement,
          content: {
            title: 'Terms & Conditions',
            text: '{{quotation.terms}}',
            defaultText: 'Please review the terms and conditions before accepting this quotation.',
            showTitle: true
          }
        };

      case TEMPLATE_ELEMENT_TYPES.FOOTER:
        return {
          ...baseElement,
          content: {
            text: 'Thank you for your business!',
            showPageNumbers: true,
            showGeneratedDate: true,
            alignment: 'center'
          }
        };

      case TEMPLATE_ELEMENT_TYPES.CUSTOM_TEXT:
        return {
          ...baseElement,
          content: {
            text: data.text || 'Custom text content',
            markdown: false,
            variables: true
          }
        };

      case TEMPLATE_ELEMENT_TYPES.SIGNATURE:
        return {
          ...baseElement,
          content: {
            title: 'Authorized Signature',
            showDate: true,
            showName: true,
            signatureLine: true,
            alignment: 'right'
          }
        };

      default:
        return baseElement;
    }
  }

  /**
   * Get default styling for element type
   */
  getDefaultElementStyle(type) {
    const theme = TEMPLATE_THEMES[this.template.theme] || TEMPLATE_THEMES.MODERN;

    const baseStyle = {
      fontFamily: theme.fontFamily,
      fontSize: '14px',
      color: '#000000',
      backgroundColor: 'transparent',
      padding: '10px',
      margin: '5px 0',
      border: 'none'
    };

    switch (type) {
      case TEMPLATE_ELEMENT_TYPES.HEADER:
        return {
          ...baseStyle,
          fontSize: '24px',
          fontWeight: 'bold',
          color: theme.primaryColor,
          textAlign: 'center',
          padding: '20px',
          borderBottom: `2px solid ${theme.primaryColor}`
        };

      case TEMPLATE_ELEMENT_TYPES.ITEMS_TABLE:
      case 'table': // Support legacy 'table' type from database
        return {
          ...baseStyle,
          border: '1px solid #e5e7eb',
          borderRadius: '4px'
        };

      case TEMPLATE_ELEMENT_TYPES.TOTALS:
        return {
          ...baseStyle,
          fontWeight: '500',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '4px'
        };

      default:
        return baseStyle;
    }
  }

  /**
   * Update element in template
   */
  updateElement(elementId, updates) {
    const elementIndex = this.template.elements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) {
      throw new Error('Element not found');
    }

    this.template.elements[elementIndex] = {
      ...this.template.elements[elementIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.template.updatedAt = new Date();
    return this;
  }

  /**
   * Remove element from template
   */
  removeElement(elementId) {
    this.template.elements = this.template.elements.filter(el => el.id !== elementId);
    this.template.updatedAt = new Date();
    return this;
  }

  /**
   * Reorder elements
   */
  reorderElements(elementIds) {
    const reorderedElements = [];
    elementIds.forEach(id => {
      const element = this.template.elements.find(el => el.id === id);
      if (element) {
        reorderedElements.push(element);
      }
    });
    this.template.elements = reorderedElements;
    this.template.updatedAt = new Date();
    return this;
  }

  /**
   * Apply theme to template
   */
  applyTheme(themeName) {
    if (!TEMPLATE_THEMES[themeName]) {
      throw new Error('Invalid theme');
    }

    this.template.theme = themeName;
    const theme = TEMPLATE_THEMES[themeName];

    // Update element styles based on theme
    this.template.elements = this.template.elements.map(element => ({
      ...element,
      style: {
        ...element.style,
        fontFamily: theme.fontFamily,
        color: element.type === TEMPLATE_ELEMENT_TYPES.HEADER ? theme.primaryColor : element.style.color
      }
    }));

    this.template.updatedAt = new Date();
    return this;
  }

  /**
   * Save template to database
   */
  async saveTemplate() {
    try {
      const client = await pool.connect();
      try {
        const query = this.template.id ? 
          `UPDATE enhanced_templates SET 
           name = $1, description = $2, theme = $3, layout = $4, 
           elements = $5, settings = $6, branding = $7, 
           is_active = $8, is_default = $9, updated_at = $10, version = version + 1
           WHERE id = $11 RETURNING *` :
          `INSERT INTO enhanced_templates 
           (name, description, theme, layout, elements, settings, branding, 
            is_active, is_default, created_by, created_at, updated_at, version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`;

        const values = this.template.id ? [
          this.template.name,
          this.template.description,
          this.template.theme,
          JSON.stringify(this.template.layout),
          JSON.stringify(this.template.elements),
          JSON.stringify(this.template.settings),
          JSON.stringify(this.template.branding),
          this.template.isActive,
          this.template.isDefault,
          this.template.updatedAt,
          this.template.id
        ] : [
          this.template.name,
          this.template.description,
          this.template.theme,
          JSON.stringify(this.template.layout),
          JSON.stringify(this.template.elements),
          JSON.stringify(this.template.settings),
          JSON.stringify(this.template.branding),
          this.template.isActive,
          this.template.isDefault,
          this.template.createdBy,
          this.template.createdAt,
          this.template.updatedAt,
          this.template.version
        ];

        const result = await client.query(query, values);
        this.template = {
          ...this.template,
          ...result.rows[0],
          elements: JSON.parse(result.rows[0].elements),
          layout: JSON.parse(result.rows[0].layout),
          settings: JSON.parse(result.rows[0].settings),
          branding: JSON.parse(result.rows[0].branding)
        };

        return this;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }

  /**
   * Generate template preview HTML
   */
  generatePreviewHTML(sampleData = null) {
    const data = sampleData || this.getSampleQuotationData();
    return this.renderTemplate(data, { preview: true });
  }

  /**
   * Generate final HTML for quotation
   */
  generateQuotationHTML(quotationData) {
    return this.renderTemplate(quotationData, { preview: false });
  }

  /**
   * Render template with data
   */
  renderTemplate(data, options = {}) {
    const theme = TEMPLATE_THEMES[this.template.theme] || TEMPLATE_THEMES.MODERN;
    
    console.log('🎨 [TemplateBuilder] Rendering template:', this.template.name);
    console.log('🎨 [TemplateBuilder] Template has', this.template.elements?.length, 'elements');
    console.log('🎨 [TemplateBuilder] Element types:', this.template.elements?.map(e => `${e.type}(${e.visible !== false ? 'visible' : 'hidden'})`));
    
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation ${data.quotation?.number || 'Preview'}</title>
    <style>
        ${this.generateCSS(theme, options)}
    </style>
</head>
<body>
    <div class="quotation-container">
        ${this.template.elements.map(element => this.renderElement(element, data)).join('')}
    </div>
</body>
</html>`;

    return this.replaceVariables(html, data);
  }

  /**
   * Render individual template element
   */
  renderElement(element, data) {
    // Check if element should be visible (default to true if not specified)
    if (element.visible === false) {
      console.log('🔍 [RenderElement] Skipping hidden element:', element.type, element.id);
      return '';
    }

    const elementClass = `element-${element.type}`;
    const elementStyle = this.generateElementStyle(element.style || {});

    // Debug logging to trace element types
    console.log('🔍 [RenderElement] Rendering element:', element.type, element.id);
    console.log('🔍 [RenderElement] Element content:', JSON.stringify(element.content, null, 2));
    console.log('🔍 [RenderElement] Type match found:', Object.values(TEMPLATE_ELEMENT_TYPES).includes(element.type));

    switch (element.type) {
      case TEMPLATE_ELEMENT_TYPES.HEADER:
      case 'header':
        return `
          <div class="${elementClass}" style="${elementStyle}">
            <h1>${this.replacePlaceholders(element.content?.title || 'Header Title', data)}</h1>
            ${element.content?.subtitle ? `<h2>${this.replacePlaceholders(element.content.subtitle, data)}</h2>` : ''}
          </div>`;

      case TEMPLATE_ELEMENT_TYPES.COMPANY_INFO:
      case 'company_info':
        const companyFields = element.content?.fields || ['Company Information'];
        return `
          <div class="${elementClass}" style="${elementStyle}">
            ${companyFields.map(field => `<div>${this.replacePlaceholders(field, data)}</div>`).join('')}
          </div>`;

      case TEMPLATE_ELEMENT_TYPES.CLIENT_INFO:
      case 'client_info':
        const clientFields = element.content?.fields || ['Client Information'];
        return `
          <div class="${elementClass}" style="${elementStyle}">
            <h3>${element.content?.title || 'Bill To:'}</h3>
            ${clientFields.map(field => `<div>${field}</div>`).join('')}
          </div>`;

      case TEMPLATE_ELEMENT_TYPES.QUOTATION_INFO:
      case 'quotation_info':
        const quotationFields = element.content?.fields || [
          { label: 'Quotation #', value: 'QUOTE-001' },
          { label: 'Date', value: new Date().toLocaleDateString() }
        ];
        return `
          <div class="${elementClass}" style="${elementStyle}">
            <table class="info-table">
              ${quotationFields.map(field => 
                `<tr><td class="label">${field.label}:</td><td class="value">${field.value}</td></tr>`
              ).join('')}
            </table>
          </div>`;

      case TEMPLATE_ELEMENT_TYPES.ITEMS_TABLE:
      case 'items_table':
      case 'table': // Support legacy 'table' type from database
        return this.renderItemsTable(element, data);

      case 'section': // Legacy section -> custom text
        return this.renderCustomText({ ...element, type: 'custom_text' }, data);

      case 'field': // Legacy field -> quotation info
        return this.renderQuotationInfo({ ...element, type: 'quotation_info' }, data);

      case 'customer': // Legacy customer -> client info
        return this.renderClientInfo({ ...element, type: 'client_info' }, data);

      case 'total': // Legacy total -> totals
        return this.renderTotals({ ...element, type: 'totals' }, data);

      case TEMPLATE_ELEMENT_TYPES.TOTALS:
      case 'totals':
        return this.renderTotals(element, data);

      case TEMPLATE_ELEMENT_TYPES.TERMS:
      case 'terms':
        const termsTitle = element.content?.title || 'Terms & Conditions';
        const termsText = element.content?.text || element.content?.defaultText || 'Terms and conditions apply.';
        return `
          <div class="${elementClass}" style="${elementStyle}">
            ${element.content?.showTitle ? `<h3>${this.replacePlaceholders(termsTitle, data)}</h3>` : '<h3>Terms & Conditions</h3>'}
            <div class="terms-content">${this.replacePlaceholders(termsText, data)}</div>
          </div>`;

      case TEMPLATE_ELEMENT_TYPES.CUSTOM_TEXT:
      case 'custom_text':
        return `
          <div class="${elementClass}" style="${elementStyle}">
            ${this.replacePlaceholders(element.content?.text || 'Custom text content', data)}
          </div>`;

      case TEMPLATE_ELEMENT_TYPES.SIGNATURE:
      case 'signature':
        return `
          <div class="${elementClass}" style="${elementStyle}">
            <div class="signature-area">
              <h4>${element.content?.title || 'Authorized Signature'}</h4>
              ${element.content?.signatureLine ? '<div class="signature-line" style="border-bottom: 1px solid #000; width: 200px; height: 50px; margin: 20px 0;"></div>' : ''}
              ${element.content?.showDate ? '<div class="signature-date">Date: _______________</div>' : ''}
            </div>
          </div>`;

      // Handle additional common element types
      case 'text':
      case 'content':
        return `
          <div class="${elementClass}" style="${elementStyle}">
            <p>${element.content?.text || element.content || 'Text content'}</p>
          </div>`;

      case 'image':
        return `
          <div class="${elementClass}" style="${elementStyle}">
            <img src="${element.content?.src || '/placeholder-image.png'}" 
                 alt="${element.content?.alt || 'Image'}" 
                 style="max-width: 100%; height: auto;" />
          </div>`;

      case 'spacer':
      case 'divider':
        return `
          <div class="${elementClass}" style="${elementStyle}">
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
          </div>`;

      default:
        console.warn(`⚠️ Unknown element type: ${element.type}`);
        // Instead of showing "Unknown element type", render the element with available content
        const fallbackContent = element.content?.text || 
                               element.content?.title || 
                               (element.content && typeof element.content === 'string' ? element.content : '') ||
                               `Element type: ${element.type}`;
        return `
          <div class="${elementClass}" style="${elementStyle}">
            <div style="padding: 10px; background: #f9f9f9; border: 1px dashed #ccc;">
              <strong>Element (${element.type}):</strong><br>
              ${fallbackContent}
              ${element.content ? `<br><small>Content: ${JSON.stringify(element.content)}</small>` : ''}
            </div>
          </div>`;
    }
  }

  /**
   * Render items table
   */
  renderItemsTable(element, data) {
    const items = data?.items || data?.selectedMachines || [];
    
    // Enhanced column configuration based on frontend Items Table
    const defaultColumns = [
      { key: 'no', label: 'S.No.', width: '6%', alignment: 'center' },
      { key: 'description', label: 'Description/Equipment Name', width: '25%', alignment: 'left' },
      { key: 'jobType', label: 'Job Type', width: '10%', alignment: 'center' },
      { key: 'quantity', label: 'Quantity', width: '8%', alignment: 'center' },
      { key: 'duration', label: 'Duration/Days', width: '10%', alignment: 'center' },
      { key: 'rate', label: 'Rate', width: '10%', alignment: 'right' },
      { key: 'rental', label: 'Total Rental', width: '12%', alignment: 'right' },
      { key: 'mobDemob', label: 'Mob/Demob', width: '10%', alignment: 'right' },
      { key: 'riskUsage', label: 'Risk & Usage', width: '12%', alignment: 'right' }
    ];
    
    // Filter columns based on element configuration
    const columnConfig = element.content?.columns || {};
    const columns = defaultColumns.filter(col => 
      columnConfig[col.key] !== false // Show column if not explicitly disabled
    );

    return `
      <div class="element-items-table" style="${this.generateElementStyle(element.style || {})}">
        <table class="items-table" style="width: 100%; border-collapse: collapse;">
          ${element.content?.showHeader !== false ? `
            <thead>
              <tr style="background: #f9f9f9;">
                ${columns.map(col => 
                  `<th style="width: ${col.width}; text-align: ${col.alignment}; padding: 8px; border: 1px solid #ddd;">${col.label}</th>`
                ).join('')}
              </tr>
            </thead>
          ` : ''}
          <tbody>
            ${items.length > 0 ? items.map((item, index) => `
              <tr class="${element.content?.alternateRows && index % 2 === 1 ? 'alternate-row' : ''}" style="${index % 2 === 1 ? 'background: #f9f9f9;' : ''}">
                ${columns.map(col => `
                  <td style="text-align: ${col.alignment}; padding: 8px; border: 1px solid #ddd;">${item[col.key] || '-'}</td>
                `).join('')}
              </tr>
            `).join('') : `
              <tr>
                <td colspan="${columns.length}" style="text-align: center; padding: 20px; color: #666;">No items found</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>`;
  }

  /**
   * Render totals section
   */
  renderTotals(element, data) {
    const totals = data?.totals || {};
    console.log('🔍 [DEBUG] Totals data received:', totals);
    
    // Comprehensive list of all financial fields that should be displayed
    const fields = element.content?.fields || [
      { label: 'Working Cost', value: '{{totals.workingCost}}', showIf: 'always' },
      { label: 'Mob/Demob Cost', value: '{{totals.mobDemobCost}}', showIf: 'always' },
      { label: 'Food & Accommodation Cost', value: '{{totals.foodAccomCost}}', showIf: 'hasFoodAccom' },
      { label: 'Usage Load Factor', value: '{{totals.usageLoadFactor}}', showIf: 'hasUsageLoad' },
      { label: 'Risk Adjustment', value: '{{totals.riskAdjustment}}', showIf: 'hasRiskAdjustment' },
      { label: 'Risk & Usage Total', value: '{{totals.riskUsageTotal}}', showIf: 'hasRiskUsage' },
      { label: 'Subtotal', value: '{{totals.subtotal}}', showIf: 'always' },
      { label: 'Tax (GST)', value: '{{totals.tax}}', showIf: 'always' },
      { label: 'Total', value: '{{totals.total}}', showIf: 'always', emphasized: true }
    ];
    
    // Process placeholders in field labels and values so dynamic labels like Tax ({{tax.rate}}%) render properly
    const processedFields = fields.map(field => ({
      ...field,
      label: this.replacePlaceholders(field.label || '', data),
      value: this.replacePlaceholders(field.value, data)
    }));
    
    console.log('🔍 [DEBUG] Processed field values:', processedFields.map(f => f.value));
    
    return `
      <div class="element-totals" style="${this.generateElementStyle(element.style || {})}">
        <table class="totals-table" style="width: 100%; max-width: 300px; margin-left: auto;">
          ${processedFields.map(field => {
            const showField = this.shouldShowTotalField(field, data);
            if (!showField) return '';
            
            return `
              <tr class="${field.emphasized ? 'emphasized' : ''}" style="${field.emphasized ? 'font-weight: bold; border-top: 2px solid #000;' : ''}">
                <td class="label" style="text-align: right; padding: 5px 10px;">${field.label}:</td>
                <td class="value" style="text-align: right; padding: 5px 10px;">${field.value}</td>
              </tr>`;
          }).filter(row => row).join('')}
        </table>
      </div>`;
  }

  /**
   * Render custom text section
   */
  renderCustomText(element, data) {
    const content = element.content?.text || element.content?.title || 'Custom Text';
    const title = element.content?.title;
    
    // Process placeholders in content and title
    const processedContent = this.replacePlaceholders(content, data);
    const processedTitle = title ? this.replacePlaceholders(title, data) : null;
    
    return `
      <div class="element-custom-text" style="${this.generateElementStyle(element.style || {})}">
        ${processedTitle ? `<h3 style="margin: 0 0 10px 0; font-weight: bold;">${processedTitle}</h3>` : ''}
        <div style="line-height: 1.5;">${processedContent}</div>
      </div>`;
  }

  /**
   * Render quotation info section
   */
  renderQuotationInfo(element, data) {
    const quotation = data?.quotation || {};
    console.log('🔍 [DEBUG] Quotation data received:', quotation);
    
    const fields = element.content?.fields || [
      'Quotation No: {{quotation.number}}',
      'Date: {{quotation.date}}',
      'Valid Until: {{quotation.validUntil}}'
    ];
    
    return `
      <div class="element-quotation-info" style="${this.generateElementStyle(element.style || {})}">
        ${fields.map(field => `
          <div style="margin: 5px 0;">${this.replacePlaceholders(field, data)}</div>
        `).join('')}
      </div>`;
  }

  /**
   * Render client info section
   */
  renderClientInfo(element, data) {
    const client = data?.client || {};
    const title = element.content?.title || 'Bill To:';
    
    // Process placeholders in title and content
    const processedTitle = this.replacePlaceholders(title, data);
    
    return `
      <div class="element-client-info" style="${this.generateElementStyle(element.style || {})}">
        <h4 style="margin: 0 0 10px 0; font-weight: bold;">${processedTitle}</h4>
        <div style="line-height: 1.5;">
          <div>${client.name || 'Client Name'}</div>
          <div>${client.company || ''}</div>
          <div>${client.address || 'Client Address'}</div>
          <div>${client.phone || ''}</div>
          <div>${client.email || ''}</div>
        </div>
      </div>`;
  }

  /**
   * Replace placeholders in text with actual data
   */
  replacePlaceholders(text, data) {
    console.log('🔍 [DEBUG] Replacing placeholders in text:', text);
    console.log('🔍 [DEBUG] Data for replacement:', JSON.stringify(data, null, 2));
    
    let result = text
      // Quotation placeholders
      .replace(/\{\{quotation\.number\}\}/g, data?.quotation?.number || 'Q-001')
      .replace(/\{\{quotation\.date\}\}/g, data?.quotation?.date || new Date().toLocaleDateString())
      .replace(/\{\{quotation\.validUntil\}\}/g, data?.quotation?.validUntil || 'N/A')
      .replace(/\{\{quotation\.terms\}\}/g, data?.quotation?.terms || 'Standard terms apply')
      
      // Client placeholders
      .replace(/\{\{client\.name\}\}/g, data?.client?.name || 'Client Name')
      .replace(/\{\{client\.company\}\}/g, data?.client?.company || 'Client Company')
      .replace(/\{\{client\.address\}\}/g, data?.client?.address || 'Client Address')
      .replace(/\{\{client\.phone\}\}/g, data?.client?.phone || 'Client Phone')
      .replace(/\{\{client\.email\}\}/g, data?.client?.email || 'client@email.com')
      
      // Company placeholders
      .replace(/\{\{company\.name\}\}/g, data?.company?.name || 'Company Name')
      .replace(/\{\{company\.address\}\}/g, data?.company?.address || 'Company Address')
      .replace(/\{\{company\.phone\}\}/g, data?.company?.phone || 'Company Phone')
      .replace(/\{\{company\.email\}\}/g, data?.company?.email || 'company@email.com')
      
      // Totals placeholders - comprehensive mapping for all financial fields
      .replace(/\{\{totals\.workingCost\}\}/g, data?.totals?.workingCost || '₹0')
      .replace(/\{\{totals\.mobDemobCost\}\}/g, data?.totals?.mobDemobCost || '₹0')
      .replace(/\{\{totals\.foodAccomCost\}\}/g, data?.totals?.foodAccomCost || '₹0')
      .replace(/\{\{totals\.usageLoadFactor\}\}/g, data?.totals?.usageLoadFactor || '₹0')
      .replace(/\{\{totals\.riskAdjustment\}\}/g, data?.totals?.riskAdjustment || '₹0')
      .replace(/\{\{totals\.riskUsageTotal\}\}/g, data?.totals?.riskUsageTotal || '₹0')
      .replace(/\{\{totals\.subtotal\}\}/g, data?.totals?.subtotal || '₹0')
      .replace(/\{\{totals\.tax\}\}/g, data?.totals?.tax || '₹0')
      .replace(/\{\{totals\.total\}\}/g, data?.totals?.total || '₹0')
      .replace(/\{\{totals\.discount\}\}/g, data?.totals?.discount || '₹0')
      .replace(/\{\{tax\.rate\}\}/g, (data?.tax?.rate !== undefined ? data.tax.rate : (data?.quotation?.taxRate || 18)) + '');
      
    console.log('🔍 [DEBUG] Result after replacement:', result);
    return result;
  }

  /**
   * Generate CSS for template
   */
  generateCSS(theme, options = {}) {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: ${theme.fontFamily};
        color: #000;
        line-height: 1.6;
        background: ${options.preview ? '#f5f5f5' : 'white'};
      }
      
      .quotation-container {
        max-width: 800px;
        margin: ${options.preview ? '20px auto' : '0 auto'};
        background: white;
        padding: ${(this.template.layout?.margins?.top || 20)}px ${(this.template.layout?.margins?.right || 20)}px 
                  ${(this.template.layout?.margins?.bottom || 20)}px ${(this.template.layout?.margins?.left || 20)}px;
        ${options.preview ? 'box-shadow: 0 2px 10px rgba(0,0,0,0.1);' : ''}
      }
      
      .element-header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid ${theme.primaryColor};
      }
      
      .element-header h1 {
        font-size: 2.5em;
        color: ${theme.primaryColor};
        margin-bottom: 5px;
        font-weight: bold;
      }
      
      .element-header h2 {
        font-size: 1.2em;
        color: ${theme.secondaryColor};
        font-weight: normal;
      }
      
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      
      .items-table th,
      .items-table td {
        padding: 12px 8px;
        border: 1px solid #ddd;
      }
      
      .items-table th {
        background-color: ${theme.primaryColor};
        color: white;
        font-weight: bold;
      }
      
      .items-table .alternate-row {
        background-color: #f9f9f9;
      }
      
      .totals-table {
        width: 300px;
        margin-left: auto;
        border-collapse: collapse;
      }
      
      .totals-table td {
        padding: 8px 12px;
        border-bottom: 1px solid #eee;
      }
      
      .totals-table .label {
        text-align: left;
        font-weight: 500;
      }
      
      .totals-table .value {
        text-align: right;
        font-weight: bold;
      }
      
      .totals-table .emphasized {
        background-color: ${theme.primaryColor};
        color: white;
        font-weight: bold;
      }
      
      .info-table {
        width: 100%;
        max-width: 400px;
        margin-left: auto;
      }
      
      .info-table td {
        padding: 5px 10px;
      }
      
      .info-table .label {
        font-weight: 500;
        color: ${theme.secondaryColor};
      }
      
      .signature-area {
        margin-top: 40px;
        text-align: right;
      }
      
      .signature-line {
        border-bottom: 2px solid #333;
        width: 250px;
        margin: 20px 0 10px auto;
      }
      
      .terms-content {
        font-size: 0.9em;
        color: ${theme.secondaryColor};
        line-height: 1.5;
      }
      
      @media print {
        body { background: white; }
        .quotation-container { box-shadow: none; margin: 0; }
        ${options.preview ? '.preview-only { display: none; }' : ''}
      }
    `;
  }

  /**
   * Generate inline style string from style object
   */
  generateElementStyle(styleObj) {
    return Object.entries(styleObj)
      .map(([key, value]) => `${this.camelToKebab(key)}: ${value}`)
      .join('; ');
  }

  /**
   * Replace template variables with actual data
   */
  replaceVariables(html, data) {
    let processedHtml = html;

    // Replace company variables
    if (data.company) {
      Object.entries(data.company).forEach(([key, value]) => {
        const regex = new RegExp(`{{company\\.${key}}}`, 'g');
        processedHtml = processedHtml.replace(regex, value || '');
      });
    }

    // Replace client variables
    if (data.client) {
      Object.entries(data.client).forEach(([key, value]) => {
        const regex = new RegExp(`{{client\\.${key}}}`, 'g');
        processedHtml = processedHtml.replace(regex, value || '');
      });
    }

    // Replace quotation variables
    if (data.quotation) {
      Object.entries(data.quotation).forEach(([key, value]) => {
        const regex = new RegExp(`{{quotation\\.${key}}}`, 'g');
        processedHtml = processedHtml.replace(regex, value || '');
      });
    }

    // Replace totals variables
    if (data.totals) {
      Object.entries(data.totals).forEach(([key, value]) => {
        const regex = new RegExp(`{{totals\\.${key}}}`, 'g');
        processedHtml = processedHtml.replace(regex, value || '');
      });
    }

    return processedHtml;
  }

  /**
   * Helper methods
   */
  generateTemplateId() {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateElementId() {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  camelToKebab(str) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  shouldShowTotalField(field, data) {
    const parseAmount = (amount) => {
      if (!amount) return 0;
      return parseFloat(amount.toString().replace(/[^\d.-]/g, ''));
    };

    switch (field.showIf) {
      case 'always': return true;
      case 'hasDiscount': return parseAmount(data.totals?.discount) > 0;
      case 'hasTax': return parseAmount(data.totals?.tax) > 0;
      case 'hasFoodAccom': return parseAmount(data.totals?.foodAccomCost) > 0;
      case 'hasUsageLoad': return parseAmount(data.totals?.usageLoadFactor) > 0;
      case 'hasRiskAdjustment': return parseAmount(data.totals?.riskAdjustment) > 0;
      case 'hasRiskUsage': return parseAmount(data.totals?.riskUsageTotal) > 0;
      default: return true;
    }
  }

  getSampleQuotationData() {
    return {
      company: {
        name: 'ASP Cranes Pvt. Ltd.',
        address: 'Industrial Area, Pune, Maharashtra 411019',
        phone: '+91 99999 88888',
        email: 'sales@aspcranes.com',
        website: 'www.aspcranes.com'
      },
      client: {
        name: 'John Doe',
        company: 'Construction Corp.',
        address: 'Mumbai, Maharashtra',
        phone: '+91 98765 43210',
        email: 'john@constructioncorp.com'
      },
      quotation: {
        number: 'QUO-2025-001',
        date: new Date().toLocaleDateString('en-IN'),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
        paymentTerms: '50% advance, balance on completion',
        terms: 'This quotation is valid for 30 days. All rates are inclusive of GST.'
      },
      items: [
        {
          no: 1,
          description: 'Tower Crane Rental - Potain MC 175',
          jobType: 'monthly',
          quantity: 1,
          duration: '30 days',
          rate: '₹25,000',
          rental: '₹7,50,000',
          mobDemob: '₹1,00,000'
        },
        {
          no: 2,
          description: 'Mobile Crane - Liebherr LTM 1090',
          jobType: 'daily',
          quantity: 1,
          duration: '5 days',
          rate: '₹15,000',
          rental: '₹75,000',
          mobDemob: '₹20,000'
        }
      ],
      totals: {
        subtotal: '₹8,25,000',
        discount: '₹25,000',
        tax: '₹1,44,000',
        total: '₹9,44,000'
      }
    };
  }

  /**
   * Export template configuration
   */
  exportTemplate() {
    return {
      ...this.template,
      exportedAt: new Date(),
      version: '1.0'
    };
  }

  /**
   * Import template configuration
   */
  importTemplate(templateConfig) {
    this.template = {
      ...this.template,
      ...templateConfig,
      id: null, // Reset ID for import
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return this;
  }
}

export default EnhancedTemplateBuilder;

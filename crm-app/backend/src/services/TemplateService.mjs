/**
 * Template Service for Quotation Printing
 * Bridges quotation printing to Enhanced Template System
 */

import { Client } from 'pg';

class TemplateService {
  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'asp_crm',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'crmdb@21',
      ssl: process.env.DB_SSL === 'true' ? true : false,
    };
  }

  /**
   * Get all templates from Enhanced Template System
   */
  async getAllTemplates() {
    const client = new Client(this.dbConfig);
    await client.connect();

    try {
      const query = `
        SELECT 
          id, name, description, theme, category, elements, settings, branding,
          is_default as "isDefault", is_active as "isActive",
          created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
        FROM enhanced_templates 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `;

      const result = await client.query(query);
      return result.rows;
    } finally {
      await client.end();
    }
  }

  /**
   * Get template by ID from Enhanced Template System
   */
  async getTemplateById(templateId) {
    const client = new Client(this.dbConfig);
    await client.connect();

    try {
      const query = `
        SELECT 
          id, name, description, theme, category, elements, settings, branding,
          is_default as "isDefault", is_active as "isActive",
          created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
        FROM enhanced_templates 
        WHERE id = $1 AND is_active = true
      `;

      const result = await client.query(query, [templateId]);

      if (result.rows.length === 0) {
        throw new Error(`Template with ID ${templateId} not found`);
      }

      return result.rows[0];
    } finally {
      await client.end();
    }
  }

  /**
   * Get default template from Enhanced Template System
   */
  async getDefaultTemplate() {
    const client = new Client(this.dbConfig);
    await client.connect();

    try {
      // First try to get the template marked as default
      let query = `
        SELECT 
          id, name, description, theme, category, elements, settings, branding,
          is_default as "isDefault", is_active as "isActive",
          created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
        FROM enhanced_templates 
        WHERE is_default = true AND is_active = true
        ORDER BY updated_at DESC
        LIMIT 1
      `;

      let result = await client.query(query);

      // If no default template, create one
      if (result.rows.length === 0) {
        await this.ensureDefaultTemplate(client);
        result = await client.query(query);
      }

      // If still no template, get any active template
      if (result.rows.length === 0) {
        query = `
          SELECT 
            id, name, description, theme, category, elements, settings, branding,
            is_default as "isDefault", is_active as "isActive",
            created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
          FROM enhanced_templates 
          WHERE is_active = true
          ORDER BY updated_at DESC
          LIMIT 1
        `;

        result = await client.query(query);
      }

      if (result.rows.length === 0) {
        throw new Error('No templates available');
      }

      return result.rows[0];
    } finally {
      await client.end();
    }
  }

  /**
   * Ensure default template exists
   */
  async ensureDefaultTemplate(client) {
    try {
      const checkQuery = `SELECT id FROM enhanced_templates WHERE id = 'tpl_default_001'`;
      const checkResult = await client.query(checkQuery);

      if (checkResult.rows.length === 0) {
        console.log('🔧 Creating default template for printing...');

        const defaultElements = [
          {
            id: 'header-1',
            type: 'header',
            content: '{{company.name}} - Professional Equipment Solutions',
            visible: true,
            style: { fontSize: '24px', color: '#0052CC', textAlign: 'center' },
          },
          {
            id: 'company-info-1',
            type: 'company',
            content: '{{company.address}}\n{{company.phone}} | {{company.email}}',
            visible: true,
            style: { fontSize: '12px', textAlign: 'center' },
          },
          {
            id: 'quotation-header-1',
            type: 'section',
            content: 'QUOTATION NO: {{quotation.quotation_number}}\nDate: {{quotation.created_at}}',
            visible: true,
            style: { fontSize: '14px', fontWeight: 'bold' },
          },
          {
            id: 'customer-info-1',
            type: 'customer',
            content:
              'Bill To:\n{{customer.name}}\n{{customer.company}}\n{{customer.address}}\nPhone: {{customer.phone}}\nEmail: {{customer.email}}',
            visible: true,
            style: { fontSize: '14px' },
          },
          {
            id: 'job-details-1',
            type: 'section',
            content:
              'Job Type: {{quotation.order_type}}\nDuration: {{quotation.number_of_days}} days\nWorking Hours: {{quotation.working_hours}} hours/day',
            visible: true,
            style: { fontSize: '14px' },
          },
          {
            id: 'equipment-table-1',
            type: 'equipment_table',
            content: 'Equipment Details',
            visible: true,
            style: { fontSize: '12px' },
          },
          {
            id: 'charges-table-1',
            type: 'charges_table',
            content: 'Additional Charges',
            visible: true,
            style: { fontSize: '12px' },
          },
          {
            id: 'totals-1',
            type: 'total',
            content: 'Cost Summary',
            visible: true,
            style: { fontSize: '14px' },
          },
          {
            id: 'terms-1',
            type: 'terms',
            content: {
              title: 'Terms & Conditions',
              text: '• Any extension or modification to the rental period must be communicated and agreed upon in writing.\n• Rental rates are based on the agreed upon crane specified in the quotation. Payment for the rental fees is due in full prior to or upon delivery of the equipment. Late payments may incur late fees or result in the suspension of equipment rental.\n• All Risks on "The Hirer".\n• Payment terms: 30 days from invoice date.\n• Prices are exclusive of GST (GST will be added as per applicable rates).\n• Cancellation charges may apply as per company policy.\n• Equipment must be returned in the same condition as delivered.\n• The hirer is responsible for any damage to the equipment during rental period.',
              showTitle: true,
            },
            visible: true,
            style: { fontSize: '11px', marginTop: '20px' },
          },
        ];

        const insertQuery = `
          INSERT INTO enhanced_templates (
            id, name, description, theme, category, is_default, is_active, 
            created_by, elements, settings, branding
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        await client.query(insertQuery, [
          'tpl_default_001',
          'Default ASP Cranes Template',
          'Standard quotation template for ASP Cranes',
          'MODERN',
          'Quotation',
          true,
          true,
          'system',
          JSON.stringify(defaultElements),
          JSON.stringify({ pageSize: 'A4', margins: { top: 20, right: 20, bottom: 20, left: 20 } }),
          JSON.stringify({ primaryColor: '#0052CC', secondaryColor: '#1f2937', logoUrl: null }),
        ]);

        console.log('✅ Default template created for printing');
      }
    } catch (error) {
      console.error('⚠️ Error ensuring default template:', error);
    }
  }

  /**
   * Map quotation data for template rendering
   */
  mapQuotationData(quotationData) {
    console.log('🗺️ [TemplateService] Mapping quotation data:', {
      customerName: quotationData.customer?.name,
      hasCustomerData: !!quotationData.customer?.name,
      totalAmount: quotationData.total_amount,
      itemsCount: quotationData.items?.length || 0,
    });

    // Extract customer information from correct data structure
    const customerName = quotationData.customer?.name || 'ABC Construction';
    const companyName =
      quotationData.customer?.company || quotationData.customer?.name || 'ABC Construction';
    const customerEmail = quotationData.customer?.email || 'info@abcconstruction.com';
    const customerPhone = quotationData.customer?.phone || '+91 98765 43210';
    const customerAddress = quotationData.customer?.address || 'Mumbai, Maharashtra';

    // Process equipment items with proper rate vs working cost mapping
    const items = quotationData.items || [];
    const processedEquipment = items.map((item, index) => {
      const capacity = item.max_lifting_capacity ? `${item.max_lifting_capacity}` : 'N/A';
      const equipmentName = item.equipment_name || `Equipment ${index + 1}`;

      // Base rate from equipment table (what we charge per day/month)
      const baseRate = parseFloat(item.base_rate) || 0;

      // Calculate working cost based on order type and duration
      const days = parseInt(quotationData.number_of_days) || 1;
      const quantity = parseInt(item.quantity) || 1;
      let workingCost = 0;

      if (quotationData.order_type === 'monthly') {
        // For monthly, working cost = base rate * days * quantity
        workingCost = baseRate * days * quantity;
      } else {
        // For daily/other types, working cost = base rate * days * quantity
        workingCost = baseRate * days * quantity;
      }

      return {
        no: index + 1,
        capacity: capacity,
        equipmentName: equipmentName,
        jobType: quotationData.order_type || 'Unloading work',
        jobDuration: `${quotationData.number_of_days || 1} ${quotationData.order_type === 'monthly' ? 'Month' : 'Days'}`,
        rental: `${workingCost.toLocaleString('en-IN')} + GST 18%`,
        mob: 'Included', // Will be updated if mob/demob charges exist
        demob: 'Included', // Will be updated if mob/demob charges exist
        baseRate: baseRate, // Base rate from equipment table
        workingCost: workingCost, // Calculated working cost
        description: `${equipmentName} ${capacity}`,
        quantity: quantity,
        unit: quotationData.order_type === 'monthly' ? 'Month' : 'Days',
        rate: baseRate, // Rate column shows base rate
        amount: workingCost, // Amount column shows working cost
      };
    });

    // If no equipment items, create a default one
    if (processedEquipment.length === 0) {
      processedEquipment.push({
        no: 1,
        capacity: '130MT',
        equipmentName: 'Telescopic Mobile Crane XCMG QY 130K',
        jobType: 'Unloading work',
        jobDuration: `${quotationData.number_of_days || 1} Month`,
        rental: '7,85,000 + GST 18%',
        mob: '10,000/- + GST 18%',
        demob: '10,000/- + GST 18%',
        baseRate: 5000,
        workingCost: 785000,
        description: 'Telescopic Mobile Crane XCMG QY 130K',
        quantity: 1,
        unit: 'Month',
        rate: 5000,
        amount: 785000,
      });
    }

    // Process additional charges
    const additionalCharges = [];

    // Add mobilization/demobilization charges if they exist
    // Note: These should come from quotation data - for now using defaults
    const mobDemobCharges = {
      mobilization: 10000,
      demobilization: 10000,
    };

    if (mobDemobCharges.mobilization > 0) {
      additionalCharges.push({
        description: 'Mobilization Charges',
        amount: mobDemobCharges.mobilization,
        gst: mobDemobCharges.mobilization * 0.18,
      });
    }

    if (mobDemobCharges.demobilization > 0) {
      additionalCharges.push({
        description: 'De-Mobilization Charges',
        amount: mobDemobCharges.demobilization,
        gst: mobDemobCharges.demobilization * 0.18,
      });
    }

    // Add incidental charges if they exist
    // Note: Should come from quotation.incidental_charges - for now using defaults
    const incidentalCharges = [];
    if (quotationData.rigger_amount && quotationData.rigger_amount > 0) {
      incidentalCharges.push({
        type: 'Rigger',
        amount: quotationData.rigger_amount,
      });
    }

    if (quotationData.helper_amount && quotationData.helper_amount > 0) {
      incidentalCharges.push({
        type: 'Helper',
        amount: quotationData.helper_amount,
      });
    }

    // Calculate totals
    const equipmentSubtotal = processedEquipment.reduce((sum, item) => sum + item.workingCost, 0);
    const additionalChargesSubtotal = additionalCharges.reduce(
      (sum, charge) => sum + charge.amount,
      0
    );
    const subtotal = equipmentSubtotal + additionalChargesSubtotal;
    const gstAmount = subtotal * 0.18;
    const totalAmount = subtotal + gstAmount;

    // Format date
    const createdDate = quotationData.created_at
      ? new Date(quotationData.created_at).toLocaleDateString('en-IN')
      : new Date().toLocaleDateString('en-IN');

    return {
      company: {
        name: 'ASP CRANES',
        address: 'Industrial Area, Pune, Maharashtra 411019',
        phone: '+91 99999 88888',
        email: 'sales@aspcranes.com',
        website: 'www.aspcranes.com',
      },
      quotation: {
        quotation_number: quotationData.quotation_number || quotationData.id || 'ASP-Q-001',
        created_at: createdDate,
        order_type: quotationData.order_type || 'monthly',
        number_of_days: quotationData.number_of_days || 1,
        working_hours: quotationData.working_hours || 8,
        machine_type: quotationData.machine_type || 'Mobile Crane',
        status: quotationData.status || 'Draft',
      },
      // Support both formats for customer data
      customer: {
        name: customerName,
        company: companyName,
        address: customerAddress,
        contact: customerName,
        phone: customerPhone,
        email: customerEmail,
      },
      // Enhanced template format (client instead of customer)
      client: {
        name: customerName,
        company: companyName,
        address: customerAddress,
        phone: customerPhone,
        email: customerEmail,
      },

      // Equipment details with proper rate vs working cost
      equipment: processedEquipment,

      // Additional charges (mob/demob, etc.)
      additionalCharges: additionalCharges,

      // Incidental charges (rigger, helper, etc.)
      incidentalCharges: incidentalCharges,

      // Legacy items for backward compatibility
      items: processedEquipment.map(eq => ({
        description: eq.description,
        quantity: eq.quantity,
        unit: eq.unit,
        rate: eq.rate,
        amount: eq.amount,
      })),

      // Summary totals
      summary: {
        equipmentSubtotal: equipmentSubtotal.toFixed(2),
        additionalChargesSubtotal: additionalChargesSubtotal.toFixed(2),
        subtotal: subtotal.toFixed(2),
        gstRate: '18%',
        gstAmount: gstAmount.toFixed(2),
        total: totalAmount.toFixed(2),
        currency: 'INR',
      },

      // Totals for template rendering
      totals: {
        subtotal: subtotal,
        tax: gstAmount,
        total: totalAmount,
      },

      // Legacy support
      total_amount: totalAmount,
      quotation_number: quotationData.quotation_number || quotationData.id,
    };
  }
}

// Create singleton instance
export const templateService = new TemplateService();

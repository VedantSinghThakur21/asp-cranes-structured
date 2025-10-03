/**
 * Quotation Print Routes - Professional architecture inspired by Twenty CRM
 */
import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.mjs';
import pool from '../lib/dbConnection.js';
import { templateService } from '../services/TemplateService.mjs';
import { htmlGeneratorService } from '../services/HtmlGeneratorService.mjs';
import { pdfService } from '../services/PdfService.mjs';

const router = express.Router();

/**
 * Helper function to get default template configuration
 */
async function getDefaultTemplateConfig() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT config_value 
      FROM system_config 
      WHERE config_key = 'defaultQuotationTemplate'
    `);
    client.release();
    
    if (result.rows.length > 0) {
      return {
        defaultTemplateId: result.rows[0].config_value
      };
    }
    return null;
  } catch (error) {
    console.warn('Could not fetch default template config:', error);
    return null;
  }
}

/**
 * Health check endpoint for print services
 */
router.get('/health', (req, res) => {
  console.log('🏥 [PrintRoutes] Health check requested');
  res.json({ 
    success: true, 
    message: 'Print services are operational',
    timestamp: new Date().toISOString(),
    services: {
      templateService: 'loaded',
      htmlGeneratorService: 'loaded', 
      pdfService: 'loaded'
    }
  });
});

/**
 * Simple test endpoint to verify route is working
 */
router.get('/ping', (req, res) => {
  console.log('🏓 [PrintRoutes] Ping endpoint called');
  res.json({ 
    success: true, 
    message: 'Print routes are working!',
    architecture: 'Professional Twenty CRM inspired'
  });
});

/**
 * TEST endpoint to verify the new architecture (no auth required for testing)
 */
router.post('/test-print', async (req, res) => {
  try {
    console.log('🧪 [PrintRoutes] Test print endpoint called');
    console.log('📋 [PrintRoutes] Request body:', req.body);
    
    // Test template service
    const templates = await templateService.getAllTemplates();
    console.log('📄 [PrintRoutes] Found templates:', templates.length);
    
    // Test HTML generator with sample data
    const sampleData = {
      quotation_number: 'TEST-001',
      quotation_date: 'January 15, 2025',
      company_name: 'ASP Cranes',
      customer_name: 'Test Customer',
      customer_address: 'Test Address',
      items: [
        { description: 'Test Item', quantity: 1, unit_price: 1000, total: 1000 }
      ],
      subtotal: '₹1,000.00',
      total: '₹1,000.00'
    };
    
    // Create a simple test template
    const testTemplate = {
      id: 'test-template',
      name: 'Test Template',
      elements: [
        {
          type: 'header',
          content: '{{company_name}} - Quotation'
        },
        {
          type: 'section',
          id: 'quotation_details'
        },
        {
          type: 'table',
          id: 'quotation_items'
        }
      ]
    };
    
    const html = await htmlGeneratorService.generateHTML(testTemplate, sampleData);
    
    console.log('✅ [PrintRoutes] Test completed successfully');
    
    res.json({
      success: true,
      message: 'New architecture is working!',
      data: {
        templatesFound: templates.length,
        htmlGenerated: html.length > 0,
        sampleHtml: html.substring(0, 500) + '...'
      }
    });
    
  } catch (error) {
    console.error('❌ [PrintRoutes] Test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    });
  }
});

/**
 * POST /api/quotations/print/pdf - Generate PDF for download
 */
router.post('/pdf', optionalAuth, async (req, res) => {
  try {
    const { quotationId, templateId } = req.body;
    console.log('📄 [PDF Route] Generating PDF for quotation:', quotationId, 'with template:', templateId);
    
    if (!quotationId) {
      return res.status(400).json({ success: false, error: 'Quotation ID is required' });
    }

    // Load data
    const quotationData = await getQuotationWithDetails(quotationId);
    if (!quotationData) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    // Generate simple HTML directly from data (same as preview)
    const html = generateSimpleQuotationHTML(quotationData);
    console.log('🎨 [PDF Route] Generated simple HTML, length:', html.length);
    
    // Generate PDF with proper error handling
    const pdfResult = await pdfService.generateFromHTML(html, { 
      format: 'A4',
      quality: 'HIGH',
      margins: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
    });

    // Handle PDF result based on whether Puppeteer is available
    if (pdfResult.fallback) {
      console.log('⚠️ Using HTML fallback due to PDF generation issues');
      
      // Return HTML that can be printed or converted to PDF on frontend
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename=quotation_${quotationId}.html`);
      return res.send(pdfResult.data);
    } else {
      // Return proper PDF
      const buffer = Buffer.isBuffer(pdfResult.data) ? pdfResult.data : Buffer.from(pdfResult.data, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=quotation_${quotationId}.pdf`);
      return res.send(buffer);
    }
  } catch (error) {
    console.error('❌ [PDF Route] PDF generation failed:', error);
    console.error('❌ [PDF Route] Error stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to generate PDF',
      message: error.message 
    });
  }
});

/**
 * POST /api/quotations/print/email-pdf - Generate PDF and send via email
 * NOTE: This is a stub - integrate real mailer later
 */
router.post('/email-pdf', optionalAuth, async (req, res) => {
  try {
    const { quotationId, templateId, emailTo, subject, message } = req.body;
    if (!quotationId || !emailTo) {
      return res.status(400).json({ success: false, error: 'quotationId and emailTo are required' });
    }

    // Load data and generate PDF (same as /pdf)
    const quotationData = await getQuotationWithDetails(quotationId);
    const template = templateId 
      ? await templateService.getTemplateById(templateId)
      : await templateService.getDefaultTemplate();
    const html = await htmlGeneratorService.generateBasicHTML(template, quotationData);
    const pdf = await pdfService.generateFromHTML(html, { format: 'A4' });

    // TODO: Send email with attachment using nodemailer (stubbed)
    console.log('📧 [PrintRoutes] Email stub:', { to: emailTo, subject, attachmentSize: pdf.size });

    return res.json({ success: true, message: 'Email sent (stub)' });
  } catch (error) {
    console.error('❌ [PrintRoutes] Email PDF failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to email PDF' });
  }
});

/**
 * POST /api/quotations/print - Main print endpoint
 */
router.post('/print', optionalAuth, async (req, res) => {
  try {
    const { quotationId, templateId, format = 'html' } = req.body;
    
    console.log('🖨️ [PrintRoutes] Print request:', {
      quotationId,
      templateId,
      format,
      userId: req.user?.id
    });

    // Validate required parameters
    if (!quotationId) {
      return res.status(400).json({
        success: false,
        error: 'Quotation ID is required'
      });
    }

    // Step 1: Get quotation data
    const quotationData = await getQuotationWithDetails(quotationId);
    if (!quotationData) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }

    // Step 2: Get template
    const template = templateId 
      ? await templateService.getTemplateById(templateId)
      : await templateService.getDefaultTemplate();

    // Step 3: Map data for template
    const mappedData = templateService.mapQuotationData(quotationData);

    // Step 4: Return template data for frontend rendering
    // The frontend will handle the actual HTML generation
    console.log('✅ [PrintRoutes] Template data prepared for frontend');
    res.json({
      success: true,
      template: template,
      quotationData: quotationData,
      mappedData: mappedData,
      renderMode: 'frontend' // Signal to frontend to use its renderer
    });

  } catch (error) {
    console.error('❌ [PrintRoutes] Print generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Print generation failed',
      message: error.message
    });
  }
});

/**
 * Generate simple HTML for PDF that matches the preview output
 */
function generateSimpleQuotationHTML(quotationData) {
  // Transform quotation data to match the preview format
  const data = {
    company: quotationData.company || {
      name: 'ASP Cranes Pvt. Ltd.',
      address: 'Industrial Area, Pune, Maharashtra 411019',
      phone: '+91 99999 88888',
      email: 'sales@aspcranes.com'
    },
    client: quotationData.customer || {
      name: quotationData.customer_name || 'Client Name',
      company: quotationData.customer?.company || 'Client Company',
      address: quotationData.customer?.address || 'Client Address',
      phone: quotationData.customer?.phone || 'Client Phone',
      email: quotationData.customer?.email || 'client@email.com'
    },
    quotation: {
      number: quotationData.quotation_number || quotationData.id,
      date: new Date(quotationData.created_at).toLocaleDateString('en-IN'),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')
    },
    items: quotationData.items?.length > 0 ? quotationData.items.map((item, index) => ({
      no: index + 1,
      description: `${item.equipment_name || quotationData.machine_type} ${item.equipment_id || ''}`,
      jobType: quotationData.order_type || 'Standard',
      quantity: item.quantity || 1,
      duration: `${quotationData.number_of_days || 1} days`,
      rate: `₹${(item.base_rate || 1000).toLocaleString('en-IN')}/day`,
      rental: `₹${Math.round(quotationData.total_rent || 0).toLocaleString('en-IN')}`,
      mobDemob: `₹15,000`,
      riskUsage: `₹10,000`
    })) : [{
      no: 1,
      description: `${quotationData.machine_type || 'Telescopic Mobile Crane'} XCMG QY 130K`,
      jobType: quotationData.order_type || 'micro',
      quantity: 1,
      duration: `${quotationData.number_of_days || 1} day`,
      rate: `₹1,000/day`,
      rental: `₹${Math.round(quotationData.total_rent || 1000).toLocaleString('en-IN')}`,
      mobDemob: `₹${Math.round(quotationData.mob_demob_cost || 600).toLocaleString('en-IN')}`,
      riskUsage: `₹0`
    }],
    totals: {
      subtotal: `₹${Math.round((quotationData.total_cost || 0) - (quotationData.gst_amount || 0)).toLocaleString('en-IN')}`,
      tax: `₹${Math.round(quotationData.gst_amount || 0).toLocaleString('en-IN')}`,
      total: `₹${Math.round(quotationData.total_cost || 0).toLocaleString('en-IN')}`
    }
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation ${data.quotation.number}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #000;
            line-height: 1.6;
            background: white;
        }
        .quotation-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
        }
        .header h1 {
            font-size: 2.5em;
            color: #2563eb;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .header h2 {
            font-size: 1.2em;
            color: #64748b;
        }
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .company-info, .client-info {
            flex: 1;
        }
        .client-info {
            margin-left: 40px;
        }
        .info-section h3 {
            color: #2563eb;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
        }
        .items-table th {
            background: #2563eb;
            color: white;
            padding: 12px 8px;
            text-align: center;
            border: 1px solid #ddd;
            font-weight: bold;
        }
        .items-table td {
            padding: 10px 8px;
            border: 1px solid #ddd;
            text-align: center;
        }
        .items-table tr:nth-child(even) {
            background: #f9f9f9;
        }
        .totals-section {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }
        .totals-table {
            width: 300px;
        }
        .totals-table td {
            padding: 8px 15px;
            border: none;
        }
        .totals-table .label {
            text-align: right;
            font-weight: bold;
        }
        .totals-table .value {
            text-align: right;
        }
        .totals-table .total-row {
            border-top: 2px solid #000;
            font-weight: bold;
            font-size: 1.1em;
        }
        .terms {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        .terms h3 {
            color: #2563eb;
            margin-bottom: 10px;
        }
        @media print {
            .quotation-container { margin: 0; }
        }
    </style>
</head>
<body>
    <div class="quotation-container">
        <!-- Header -->
        <div class="header">
            <h1>ASP CRANES</h1>
            <h2>Professional Equipment Solutions</h2>
        </div>

        <!-- Company and Client Info -->
        <div class="info-section">
            <div class="company-info">
                <h3>From:</h3>
                <div>${data.company.name}</div>
                <div>${data.company.address}</div>
                <div>${data.company.phone}</div>
                <div>${data.company.email}</div>
            </div>
            <div class="client-info">
                <h3>Bill To:</h3>
                <div>${data.client.name}</div>
                <div>${data.client.company}</div>
                <div>${data.client.address}</div>
                <div>${data.client.phone}</div>
                <div>${data.client.email}</div>
            </div>
        </div>

        <!-- Quotation Info -->
        <div class="info-section">
            <div>
                <strong>Quotation #:</strong> ${data.quotation.number}<br>
                <strong>Date:</strong> ${data.quotation.date}<br>
                <strong>Valid Until:</strong> ${data.quotation.validUntil}
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 6%;">S.No.</th>
                    <th style="width: 25%;">Description/Equipment Name</th>
                    <th style="width: 10%;">Job Type</th>
                    <th style="width: 8%;">Quantity</th>
                    <th style="width: 10%;">Duration/Days</th>
                    <th style="width: 10%;">Rate</th>
                    <th style="width: 10%;">Mob/Demob</th>
                    <th style="width: 10%;">Risk & Usage</th>
                    <th style="width: 12%;">Total Rental</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map(item => `
                    <tr>
                        <td>${item.no}</td>
                        <td>${item.description}</td>
                        <td>${item.jobType}</td>
                        <td>${item.quantity}</td>
                        <td>${item.duration}</td>
                        <td>${item.rate}</td>
                        <td>${item.mobDemob}</td>
                        <td>${item.riskUsage}</td>
                        <td>${item.rental}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td class="label">Subtotal:</td>
                    <td class="value">${data.totals.subtotal}</td>
                </tr>
                <tr>
                    <td class="label">Tax (GST):</td>
                    <td class="value">${data.totals.tax}</td>
                </tr>
                <tr class="total-row">
                    <td class="label">Total:</td>
                    <td class="value">${data.totals.total}</td>
                </tr>
            </table>
        </div>

        <!-- Terms -->
        <div class="terms">
            <h3>Terms & Conditions</h3>
            <p>This quotation is valid for 30 days. All rates are inclusive of GST. Payment terms: 50% advance, balance on completion.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Helper function to get quotation with details
 */
async function getQuotationWithDetails(quotationId) {
  try {
    console.log('🔍 [Helper] Fetching quotation:', quotationId, 'Type:', typeof quotationId);
    
    const query = `
      SELECT 
        q.id,
        q.customer_name,
        q.machine_type,
        q.order_type,
        q.number_of_days,
        q.working_hours,
        q.total_rent,
        q.total_cost,
        q.status,
        q.notes,
        q.created_at,
        q.updated_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        c.company_name as customer_company
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = $1
    `;
    
    console.log('🔍 [Helper] Executing query with ID:', quotationId);
    const result = await pool.query(query, [quotationId]);
    console.log('🔍 [Helper] Query result rows count:', result.rows.length);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    
    // Get quotation machines
    const itemsQuery = `
      SELECT 
        qm.quantity,
        qm.base_rate,
        qm.running_cost_per_km,
        e.name as equipment_name,
        e.category as equipment_category,
        e.max_lifting_capacity,
        e.equipment_id
      FROM quotation_machines qm
      LEFT JOIN equipment e ON qm.equipment_id = e.id
      WHERE qm.quotation_id = $1
      ORDER BY qm.created_at ASC
    `;
    
    const itemsResult = await pool.query(itemsQuery, [quotationId]);
    
    // Structure the data
    const quotation = {
      id: row.id,
      quotation_number: row.id, // Use ID as quotation number since quotation_number doesn't exist
      description: row.notes || 'Crane Rental Service',
      status: row.status,
      valid_until: null, // No valid_until in schema
      total_amount: row.total_cost,
      tax_rate: 18, // Default GST rate
      machine_type: row.machine_type,
      order_type: row.order_type,
      number_of_days: row.number_of_days,
      working_hours: row.working_hours,
      total_rent: row.total_rent,
      created_at: row.created_at,
      updated_at: row.updated_at,
      
      customer: {
        name: row.customer_name,
        email: row.customer_email,
        phone: row.customer_phone,
        address: row.customer_address,
        company: row.customer_company
      },
      
      items: itemsResult.rows || [],
      
      company: {
        name: 'ASP Cranes',
        address: 'Industrial Area, New Delhi, India',
        phone: '+91-XXXX-XXXX',
        email: 'info@aspcranes.com'
      }
    };

    console.log('✅ [Helper] Quotation fetched successfully');
    return quotation;
    
  } catch (error) {
    console.error('❌ [Helper] Error fetching quotation:', error);
    throw new Error(`Failed to fetch quotation: ${error.message}`);
  }
}

/**
 * OLD PREVIEW ROUTES DISABLED
 * Preview functionality has been moved to quotationPreviewRoutes.mjs
 * to avoid route conflicts and use the new unified preview system.
 */

/*
router.get('/preview', async (req, res) => {
  // DISABLED - Moved to quotationPreviewRoutes.mjs
  res.status(410).json({
    success: false,
    error: 'Preview endpoint moved',
    message: 'Use /api/quotations/:id/preview instead'
  });
});
*/

/**
  try {
    const { quotationId, templateId, format = 'html' } = req.query;
    
    console.log('👁️ [PrintRoutes] Preview GET request:', {
      quotationId,
      templateId,
      format
    });

    // Validate required parameters
    if (!quotationId) {
      return res.status(400).json({
        success: false,
        error: 'Quotation ID is required'
      });
    }

  // Generate preview using template service (singleton instances)
    
    try {
      // Get template with priority selection (specific templateId > configured default > database default)
      let template;
      if (templateId) {
        template = await templateService.getTemplateById(templateId);
      } else {
        // Check for configured default template first
        const defaultConfig = await getDefaultTemplateConfig();
        if (defaultConfig?.template_id) {
          try {
            template = await templateService.getTemplateById(defaultConfig.template_id);
            console.log('📋 [PrintRoutes] Using configured default template:', defaultConfig.template_id);
          } catch (configError) {
            console.log('⚠️ [PrintRoutes] Configured template not found, falling back to database default');
            template = await templateService.getDefaultTemplate();
          }
        } else {
          template = await templateService.getDefaultTemplate();
        }
      }

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Get quotation data
      let quotationData;
      try {
        quotationData = await getQuotationWithDetails(quotationId);
      } catch (error) {
        console.error('❌ [PrintRoutes] Failed to fetch quotation:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch quotation data',
          message: error.message
        });
      }
      
      if (!quotationData) {
        return res.status(404).json({
          success: false,
          error: 'Quotation not found'
        });
      }

      // Generate HTML preview
      let html;
      try {
        const mappedData = templateService.mapQuotationData(quotationData);
        html = await htmlGeneratorService.generateBasicHTML(template, mappedData);
      } catch (error) {
        console.error('❌ [PrintRoutes] Failed to generate HTML:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate preview HTML',
          message: error.message
        });
      }

      if (format === 'json') {
        return res.json({
          success: true,
          data: {
            html,
            template,
            quotation: quotationData
          }
        });
      }

      // Return HTML content
      res.setHeader('Content-Type', 'text/html');
      res.send(html);

    } catch (templateError) {
      console.error('Template processing error:', templateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to process template',
        details: templateError.message
      });
    }

  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview',
      details: error.message
    });
  }
});

/**
 * POST /api/quotations/print/preview - Generate print preview (POST version)
 * DISABLED - Frontend now handles template generation locally
 */
router.post('/preview', async (req, res) => {
  console.log('⚠️ [Preview Route] Route disabled - frontend handles template generation locally');
  
  return res.status(200).json({ 
    success: true, 
    html: '<div style="padding: 20px; text-align: center;"><h2>Preview generated by frontend</h2><p>This route is disabled. Template generation is handled locally by the frontend.</p></div>',
    message: 'Template generation handled by frontend'
  });
  
  // Original code disabled to prevent database errors
  /*
  try {
    const { quotationId, templateId, format = 'html' } = req.body;
    
    console.log('👁️ [PrintRoutes] Preview request:', {
      quotationId,
      templateId,
      format,
      body: req.body
    });

    // Validate required parameters
    if (!quotationId) {
      return res.status(400).json({
        success: false,
        error: 'Quotation ID is required'
      });
    }

    // Step 1: Get quotation data
    let quotationData;
    try {
      quotationData = await getQuotationWithDetails(quotationId);
    } catch (error) {
      console.error('❌ [PrintRoutes] Failed to fetch quotation:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch quotation data',
        message: error.message
      });
    }

    if (!quotationData) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }

    // Step 2: Get template with priority selection
    let template;
    try {
      // Priority: specific templateId > configured default > database default
      if (templateId) {
        template = await templateService.getTemplateById(templateId);
      } else {
        // Check for configured default template first
        const defaultConfig = await getDefaultTemplateConfig();
        if (defaultConfig?.template_id) {
          try {
            template = await templateService.getTemplateById(defaultConfig.template_id);
            console.log('📋 [PrintRoutes] Using configured default template:', defaultConfig.template_id);
          } catch (configError) {
            console.log('⚠️ [PrintRoutes] Configured template not found, falling back to database default');
            template = await templateService.getDefaultTemplate();
          }
        } else {
          template = await templateService.getDefaultTemplate();
        }
      }
    } catch (error) {
      console.error('❌ [PrintRoutes] Failed to fetch template:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch template',
        message: error.message
      });
    }

    // Step 3: Generate HTML for preview
    let html;
    try {
      const mappedData = templateService.mapQuotationData(quotationData);
      html = await htmlGeneratorService.generateBasicHTML(template, mappedData);
    } catch (error) {
      console.error('❌ [PrintRoutes] Failed to generate HTML:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate preview HTML',
        message: error.message
      });
    }

    console.log('✅ [PrintRoutes] Preview generated successfully');
    res.json({
      success: true,
      html: html,
      template: {
        id: template.id,
        name: template.name
      }
    });

  } catch (error) {
    console.error('❌ [PrintRoutes] Preview generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Preview generation failed',
      message: error.message
    });
  }
  */
});

/**
 * POST /api/quotations/print/print - Generate printable version
 */
router.post('/print/print', async (req, res) => {
  try {
    const { quotationId, templateId } = req.body;
    
    console.log('🖨️ [PrintRoutes] Print request:', {
      quotationId,
      templateId
    });

    // Validate required parameters
    if (!quotationId) {
      return res.status(400).json({
        success: false,
        error: 'Quotation ID is required'
      });
    }

    // Step 1: Get quotation data
    const quotationData = await getQuotationWithDetails(quotationId);
    if (!quotationData) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }

    // Step 2: Use Enhanced Template System for proper template rendering
    const { EnhancedTemplateBuilder } = await import('../services/EnhancedTemplateBuilder.mjs');
    const templateBuilder = new EnhancedTemplateBuilder();
    
    let template;
    if (templateId) {
      console.log('🎨 [PrintRoutes] Loading specific template:', templateId);
      await templateBuilder.loadTemplate(templateId);
      template = templateBuilder.template;
    } else {
      console.log('🎨 [PrintRoutes] Loading default template');
      // Try to get configured default template first
      try {
        const defaultConfig = await getDefaultTemplateConfig();
        if (defaultConfig?.template_id) {
          await templateBuilder.loadTemplate(defaultConfig.template_id);
          template = templateBuilder.template;
          console.log('📋 [PrintRoutes] Using configured default template:', defaultConfig.template_id);
        } else {
          throw new Error('No configured default template');
        }
      } catch (configError) {
        console.log('⚠️ [PrintRoutes] No configured default, using database default');
        const defaultTemplate = await templateService.getDefaultTemplate();
        await templateBuilder.loadTemplate(defaultTemplate.id);
        template = templateBuilder.template;
      }
    }

    // Step 3: Map quotation data to template format
    const mappedData = templateService.mapQuotationData(quotationData);
    console.log('🗺️ [PrintRoutes] Mapped data for template:', {
      hasCompany: !!mappedData.company,
      hasClient: !!mappedData.client,
      hasQuotation: !!mappedData.quotation,
      itemsCount: mappedData.items?.length || 0
    });

    // Step 4: Generate HTML using EnhancedTemplateBuilder
    const html = templateBuilder.generateQuotationHTML(mappedData);

    console.log('✅ [PrintRoutes] Print HTML generated successfully with template:', template.name);
    res.json({
      success: true,
      html: html,
      template: {
        id: template.id,
        name: template.name
      }
    });

  } catch (error) {
    console.error('❌ [PrintRoutes] Print generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Print generation failed',
      message: error.message
    });
  }
});

export default router;

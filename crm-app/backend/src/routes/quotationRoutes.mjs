/**
 * Quotation Routes
 * Handles generation of quotation PDFs based on user selections
 * SuiteCRM-inspired professional quotation system
 */

import express from 'express';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/authMiddleware.mjs';
import { generateQuotationTemplate } from '../utils/pdfGenerator.js';

// Helper function to generate quotation number from ID
function generateQuotationNumber(quotationId) {
  // Extract number from quotation ID (quot_XXXXXXXX format)
  const idParts = quotationId.split('_');
  if (idParts.length >= 2) {
    // Use the UUID part to generate a consistent number
    const hashCode = idParts[1].split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const num = Math.abs(hashCode) % 9999 + 1; // Ensure it's between 1-9999
    return `ASP-Q-${num.toString().padStart(3, '0')}`;
  }
  
  // Fallback: use full ID
  return `ASP-Q-${quotationId.substring(5, 8).toUpperCase()}`;
}
import { QuotationTableBuilder } from '../utils/quotationTableBuilder.mjs';

const router = express.Router();

// Helper functions to extract incident and custom amounts from frontend data structure
function extractIncidentAmount(quotationData, incidentKey) {
  // First check if there's a custom amount specified
  if (quotationData.customIncidentAmounts && quotationData.customIncidentAmounts[incidentKey]) {
    return quotationData.customIncidentAmounts[incidentKey];
  }
  
  // Check if this incident is selected in the incidentalCharges array
  if (quotationData.incidentalCharges && quotationData.incidentalCharges.includes(incidentKey)) {
    // Return default amounts based on incident type
    const defaultAmounts = {
      'incident1': 5000,
      'incident2': 10000,  
      'incident3': 15000
    };
    return defaultAmounts[incidentKey] || 0;
  }
  
  return null; // Not selected
}

function extractCustomAmount(quotationData, amountKey) {
  return quotationData[amountKey] || null;
}

function extractOtherFactorsAmount(quotationData, factorKey) {
  // Check if this factor is selected in the otherFactors array
  if (quotationData.otherFactors && quotationData.otherFactors.includes(factorKey)) {
    // Check for custom amount first
    if (quotationData.customRiggerAmount && factorKey === 'rigger') {
      return quotationData.customRiggerAmount;
    }
    if (quotationData.customHelperAmount && factorKey === 'helper') {
      return quotationData.customHelperAmount;
    }
    
    // Return default amounts
    const defaultAmounts = {
      'rigger': 40000,
      'helper': 12000
    };
    return defaultAmounts[factorKey] || 0;
  }
  
  return 0;
}

// Optional auth for selected endpoints: allows bypass header regardless of NODE_ENV
const optionalAuth = (req, res, next) => {
  const bypassHeader = req.headers['x-bypass-auth'];
  if (bypassHeader === 'development-only-123' || bypassHeader === 'true') {
    console.log('⚠️ OptionalAuth: bypassing auth based on header');
    req.user = { uid: 'bypass-user', email: 'bypass@example.com', role: 'admin' };
    return next();
  }
  return authenticateToken(req, res, next);
};

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
 * POST /api/quotations/generate
 * Generate a quotation PDF
 * Expects request body with:
 *  - quotationId (string)
 *  - customerName (string)
 *  - customerEmail (string)
 *  - items (array of { description, qty, price })
 *  - gstRate (number, e.g., 18)
 *  - terms (array of strings)
 */
router.post('/generate', optionalAuth, async (req, res) => {
  try {
    console.log('📋 [Generate] Received request:', req.method, req.originalUrl);
    console.log('📋 [Generate] Headers:', req.headers);
    console.log('📋 [Generate] Body:', req.body);
    
    const quotation = req.body;

    if (!quotation || !quotation.items || quotation.items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Quotation must include at least one item' 
      });
    }

    // Company info - ideally fetched from DB or config
    const companyInfo = {
      name: 'ASP Cranes Pvt. Ltd.',
      email: 'sales@aspcranes.com',
      phone: '+91 99999 88888',
      address: 'Pune, Maharashtra',
    };

    // Generate PDF
    const pdfBuffer = await generateQuotationTemplate(quotation, companyInfo);

    // Send PDF as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quotation_${quotation.quotationId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating quotation:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate quotation PDF' 
    });
  }
});

/**
 * POST /api/quotations/generate-test - Test endpoint without authentication
 */
router.post('/generate-test', async (req, res) => {
  try {
    console.log('🧪 [Generate-Test] Received request:', req.method, req.originalUrl);
    console.log('🧪 [Generate-Test] Headers:', req.headers);
    console.log('🧪 [Generate-Test] Body:', req.body);
    
    const quotation = req.body;

    if (!quotation || !quotation.items || quotation.items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Quotation must include at least one item' 
      });
    }

    // Return success response for testing
    res.json({
      success: true,
      message: 'Test endpoint working - authentication bypassed',
      receivedData: {
        hasCustomer: !!quotation.customer,
        itemCount: quotation.items?.length || 0,
        hasTerms: !!quotation.terms
      }
    });

  } catch (error) {
    console.error('Generate test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process test request',
      error: error.message
    });
  }
});

/**
 * GET /api/quotations
 * Get all quotations with basic info for SuiteCRM-style listing
 */
router.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          q.id,
          q.customer_name,
          q.customer_contact->>'email' as customer_email,
          q.customer_contact->>'phone' as customer_phone,
          q.customer_contact->>'address' as customer_address,
          q.machine_type,
          q.order_type,
          q.number_of_days,
          q.working_hours,
          q.total_cost,
          q.status,
          q.created_at,
          q.updated_at,
          q.site_distance,
          q.usage,
          q.shift,
          q.day_night,
          q.food_resources,
          q.accom_resources,
          q.risk_factor,
          q.mob_demob_cost,
          q.working_cost,
          q.food_accom_cost,
          q.gst_amount,
          q.total_rent
        FROM quotations q
        ORDER BY q.created_at DESC;
      `);
      
      const quotations = result.rows.map(q => ({
        id: q.id,
        quotationId: q.id,
        quotation_number: generateQuotationNumber(q.id), // Generate quotation number from ID
        customer_name: q.customer_name,
        customer_email: q.customer_email,
        customer_phone: q.customer_phone,
        customer_address: q.customer_address,
        machine_type: q.machine_type,
        order_type: q.order_type,
        number_of_days: q.number_of_days,
        working_hours: q.working_hours,
        total_cost: parseFloat(q.total_cost || 0),
        status: q.status,
        created_at: q.created_at,
        updated_at: q.updated_at,
        site_distance: parseFloat(q.site_distance || 0),
        usage: q.usage,
        shift: q.shift === 'single' ? 'Day Shift' : 'Double Shift',
        food_resources: q.food_resources > 0 ? 'ASP Provided' : 'Client Provided',
        accom_resources: q.accom_resources > 0 ? 'ASP Provided' : 'Client Provided',
        risk_factor: q.risk_factor?.charAt(0).toUpperCase() + q.risk_factor?.slice(1) || 'Medium',
        mob_demob_cost: parseFloat(q.mob_demob_cost || 0),
        working_cost: parseFloat(q.working_cost || 0),
        food_accom_cost: parseFloat(q.food_accom_cost || 0),
        gst_amount: parseFloat(q.gst_amount || 0),
        total_rent: parseFloat(q.total_rent || 0)
      }));
      
      return res.status(200).json({
        success: true,
        data: quotations
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/quotations/print-test - Simple test endpoint to verify routing
 */
router.get('/print-test', (req, res) => {
  console.log('🧪 [QuotationRoutes] Print test endpoint called');
  res.json({
    success: true,
    message: 'Print route is working!',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/quotations/:id
 * Get quotation by ID for SuiteCRM-style detailed view
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      const quotationResult = await client.query(`
        SELECT q.id, q.quotation_number, q.deal_id, q.lead_id, q.customer_id, q.customer_name,
               q.machine_type, q.order_type, q.number_of_days, q.working_hours, q.food_resources, 
               q.accom_resources, q.site_distance, q.usage, q.risk_factor, q.shift, q.day_night, 
               q.mob_demob, q.mob_relaxation, q.extra_charge, q.other_factors_charge, q.billing, 
               q.include_gst, q.sunday_working, q.customer_contact, q.incidental_charges, 
               q.other_factors, q.total_rent, q.total_cost, q.working_cost, q.mob_demob_cost, 
               q.food_accom_cost, q.usage_load_factor, q.risk_adjustment, q.risk_usage_total, 
               q.gst_amount, q.version, q.created_by, q.status, q.template_id, q.notes, 
               q.created_at, q.updated_at, q.address, q.valid_until, q.incident1, q.incident2, 
               q.incident3, q.rigger_amount, q.helper_amount, q.primary_equipment_id, 
               q.equipment_snapshot,
               c.name as c_name, c.contact_name, c.email as customer_email,
               c.phone as customer_phone, c.company_name as customer_company,
               c.address as customer_address, c.designation as customer_designation,
               d.title as deal_title
        FROM quotations q
        LEFT JOIN customers c ON q.customer_id = c.id
        LEFT JOIN deals d ON q.deal_id = d.id
        WHERE q.id = $1
      `, [id]);
      
      if (quotationResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Quotation not found' 
        });
      }
      
      const quotation = quotationResult.rows[0];
      
      // Get associated machines with enhanced fields for Items Table
      const machinesResult = await client.query(`
        SELECT qm.id, qm.quotation_id, qm.equipment_id, qm.quantity, qm.base_rate, qm.running_cost_per_km,
               e.name as equipment_name, e.category, e.max_lifting_capacity
        FROM quotation_machines qm
        LEFT JOIN equipment e ON qm.equipment_id = e.id
        WHERE qm.quotation_id = $1;
      `, [id]);
      
      const transformedQuotation = {
        id: quotation.id,
        quotationId: quotation.id,
        quotationNumber: quotation.quotation_number || generateQuotationNumber(quotation.id),
        dealId: quotation.deal_id,
        leadId: quotation.lead_id,
        customerId: quotation.customer_id,
        customerName: quotation.customer_name,
        customerContact: {
          name: quotation.customer_name || quotation.contact_name,
          email: quotation.customer_email,
          phone: quotation.customer_phone,
          company: quotation.customer_company || quotation.company_name,
          address: quotation.customer_address,
          designation: quotation.customer_designation
        },
        dealTitle: quotation.deal_title,
        machineType: quotation.machine_type,
        orderType: quotation.order_type,
        numberOfDays: Number(quotation.number_of_days) || 0,
        workingHours: Number(quotation.working_hours) || 8,
        foodResources: quotation.food_resources === 'ASP Provided' ? 'ASP Provided' : (Number(quotation.food_resources) || 'Client Provided'),
        accomResources: quotation.accom_resources === 'ASP Provided' ? 'ASP Provided' : (Number(quotation.accom_resources) || 'Client Provided'),
        siteDistance: Number(quotation.site_distance) || 0,
        usage: quotation.usage || 'normal',
        riskFactor: quotation.risk_factor || 'medium',
        shift: quotation.shift || 'single',
        dayNight: quotation.day_night || 'day',
        mobDemob: Number(quotation.mob_demob) || 0,
        mobRelaxation: Number(quotation.mob_relaxation) || 0,
        extraCharge: Number(quotation.extra_charge) || 0,
        otherFactorsCharge: Number(quotation.other_factors_charge) || 0,
        billing: quotation.billing || 'gst',
        includeGst: quotation.include_gst !== false,
        sundayWorking: quotation.sunday_working || 'no',
        incidentalCharges: quotation.incidental_charges || [],
        otherFactors: quotation.other_factors || [],
        totalRent: Number(quotation.total_rent) || 0,
        totalCost: Number(quotation.total_cost) || 0,
        workingCost: Number(quotation.working_cost) || 0,
        mobDemobCost: Number(quotation.mob_demob_cost) || 0,
        foodAccomCost: Number(quotation.food_accom_cost) || 0,
        usageLoadFactor: Number(quotation.usage_load_factor) || 0,
        riskAdjustment: Number(quotation.risk_adjustment) || 0,
        riskUsageTotal: Number(quotation.risk_usage_total) || 0,
        gstAmount: Number(quotation.gst_amount) || 0,
        version: quotation.version || 1,
        createdBy: quotation.created_by,
        status: quotation.status || 'draft',
        templateId: quotation.template_id,
        notes: quotation.notes || '',
        createdAt: quotation.created_at,
        updatedAt: quotation.updated_at,
        startDate: quotation.start_date || null,
        endDate: quotation.end_date || null,
        // New fields from schema migration with proper type conversion
        primaryEquipmentId: quotation.primary_equipment_id,
        equipmentSnapshot: quotation.equipment_snapshot,
        incident1: quotation.incident1,
        incident2: quotation.incident2,
        incident3: quotation.incident3,
        riggerAmount: Number(quotation.rigger_amount) || null,
        helperAmount: Number(quotation.helper_amount) || null,
        // Add parsed incidental charges and other factors arrays
        incidentalCharges: quotation.incidental_charges || [],
        otherFactors: quotation.other_factors || [],
        // Add selected machines data with enhanced mapping for Items Table
        selectedMachines: machinesResult.rows.map((machine, index) => {
          const quantity = Number(machine.quantity) || 1;
          const baseRate = Number(machine.base_rate) || 0;
          const duration = quotation.number_of_days || 1;
          const rental = baseRate * quantity * duration;
          const mobDemobTotal = Number(quotation.mob_demob_cost) || 0;
          const mobilization = mobDemobTotal / 2; // Split mob_demob_cost equally
          const demobilization = mobDemobTotal / 2;
          const totalAmount = rental + mobilization + demobilization;

          return {
            id: machine.equipment_id,
            equipmentId: machine.equipment_id,
            name: machine.equipment_name,
            category: machine.category,
            quantity: quantity,
            baseRate: baseRate,
            runningCostPerKm: Number(machine.running_cost_per_km) || 0,
            // Enhanced fields for Items Table compatibility
            no: index + 1, // Serial number
            description: machine.equipment_name,
            jobType: quotation.order_type || 'daily', // Order type from quotations table
            quantity: quantity,
            duration: `${duration} ${duration === 1 ? 'day' : 'days'}`, // From quotations.number_of_days
            rate: `₹${baseRate.toLocaleString('en-IN')}`, // Base rate
            rental: `₹${(quotation.working_cost || rental).toLocaleString('en-IN')}`, // Working cost from quotations or calculated
            mobDemob: `₹${mobDemobTotal.toLocaleString('en-IN')}` // Mob/demob cost
          };
        }),
        calculations: {
          baseRate: 0, // Will be calculated on frontend
          totalHours: quotation.working_hours * quotation.number_of_days,
          workingCost: quotation.working_cost || 0,
          mobDemobCost: quotation.mob_demob_cost || 0,
          foodAccomCost: quotation.food_accom_cost || 0,
          usageLoadFactor: quotation.usage_load_factor || 0,
          extraCharges: quotation.extra_charge || 0,
          riskAdjustment: quotation.risk_adjustment || 0,
          riskUsageTotal: quotation.risk_usage_total || 0,
          incidentalCost: 0, // Will be calculated from incidentalCharges
          otherFactorsCost: quotation.other_factors_charge || 0,
          subtotal: quotation.total_rent || 0,
          gstAmount: quotation.gst_amount || 0,
          totalAmount: quotation.total_cost || 0
        },
        selectedEquipment: machinesResult.rows.length > 0 ? {
          id: machinesResult.rows[0].equipment_id,
          equipmentId: machinesResult.rows[0].equipment_id,
          name: machinesResult.rows[0].equipment_name || 'Equipment',
          baseRates: {
            micro: machinesResult.rows[0].base_rate || 0,
            small: machinesResult.rows[0].base_rate || 0,
            monthly: machinesResult.rows[0].base_rate || 0,
            yearly: machinesResult.rows[0].base_rate || 0
          }
        } : {
          id: '',
          equipmentId: '',
          name: '',
          baseRates: {
            micro: 0,
            small: 0,
            monthly: 0,
            yearly: 0
          }
        },
        items: machinesResult.rows.map(machine => ({
          description: machine.equipment_name || 'Equipment',
          qty: machine.quantity || 1,
          price: machine.base_rate || 0
        })),
        gstRate: 18, // Default GST rate
        terms: [
          'Payment Terms: 50% advance, balance on completion',
          'Equipment delivery within 2-3 working days from advance payment',
          'Fuel charges extra as per actual consumption',
          'All rates are subject to site conditions and accessibility',
          'This quotation is valid for 15 days from date of issue'
        ]
      };
      
      return res.status(200).json({
        success: true,
        data: transformedQuotation
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

/**
 * POST /api/quotations
 * Create a new quotation in the system
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const quotationData = req.body;
    console.log('🔍 DEBUG: Received quotation data:', {
      orderType: quotationData.orderType,
      usage: quotationData.usage,
      riskFactor: quotationData.riskFactor,
      foodResources: quotationData.foodResources,
      accomResources: quotationData.accomResources,
      numberOfDays: quotationData.numberOfDays,
      leadId: quotationData.leadId,
      selectedEquipment: quotationData.selectedEquipment,
      primaryEquipmentId: quotationData.primaryEquipmentId,
      incidentalCharges: quotationData.incidentalCharges,
      customIncidentAmounts: quotationData.customIncidentAmounts,
      otherFactors: quotationData.otherFactors,
      customRiggerAmount: quotationData.customRiggerAmount,
      customHelperAmount: quotationData.customHelperAmount,
      // Cost calculations from frontend
      totalCost: quotationData.totalCost,
      totalAmount: quotationData.totalAmount,
      workingCost: quotationData.workingCost,
      mobDemobCost: quotationData.mobDemobCost,
      foodAccomCost: quotationData.foodAccomCost,
      mobDemob: quotationData.mobDemob,
      calculations: quotationData.calculations
    });
    // Validate required fields
    const requiredFields = ['customerName', 'machineType', 'orderType', 'numberOfDays'];
    const missingFields = requiredFields.filter(field => !quotationData[field]);
    // Validate dealId/leadId presence
    if (!quotationData.dealId && !quotationData.leadId) {
      return res.status(400).json({
        success: false,
        message: 'At least one of dealId or leadId must be provided.'
      });
    }
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    const client = await pool.connect();
    try {
      // Check if customer exists, if not create one
      let customerId;
      const customerResult = await client.query(
        'SELECT id FROM customers WHERE email = $1 OR name = $2',
        [quotationData.customerEmail, quotationData.customerName]
      );
      
      if (customerResult.rows.length > 0) {
        customerId = customerResult.rows[0].id;
      } else {
        // Create new customer
        const newCustomerResult = await client.query(`
          INSERT INTO customers (
            name, company_name, contact_name, email, phone, address, type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          quotationData.customerName,
          quotationData.customerName,
          quotationData.customerName,
          quotationData.customerEmail || 'noemail@example.com',
          quotationData.customerPhone || 'N/A',
          quotationData.customerAddress || 'N/A',
          'other'
        ]);
        customerId = newCustomerResult.rows[0].id;
      }
      
      const id = uuidv4();
      
      // Map frontend data to database schema - comprehensive mapping
      const orderTypeMapping = {
        'micro': 'micro',
        'hourly': 'hourly',
        'daily': 'daily',
        'weekly': 'weekly',
        'monthly': 'monthly',
        'yearly': 'yearly',
        'rental': 'monthly',
        'long_term_rental': 'yearly',
        'project_rental': 'monthly',
        'specialized_rental': 'monthly'
      };
      
      const shiftMapping = {
        'Day Shift': 'single',
        'Night Shift': 'single',
        'Double Shift': 'double',
        'Round the Clock': 'double'
      };
      
      const riskMapping = {
        'Low': 'low',
        'Low Risk': 'low',
        'Medium': 'medium',
        'Medium Risk': 'medium',
        'High': 'high',
        'High Risk': 'high',
        'Very High': 'high',
        'low': 'low',
        'medium': 'medium',
        'high': 'high'
      };
      
      // Use calculated costs from frontend (no fallbacks to avoid incorrect data)
      const totalCost = quotationData.totalCost || quotationData.calculations?.totalAmount || 0;
      const gstAmount = quotationData.gstAmount || quotationData.calculations?.gstAmount || 0;
      const finalTotal = quotationData.totalAmount || quotationData.calculations?.finalTotal || 0;
      
      const customerContact = {
        name: quotationData.customerName,
        email: quotationData.customerEmail || '',
        phone: quotationData.customerPhone || '',
        address: quotationData.customerAddress || '',
        company: quotationData.customerName
      };
      
      // Insert quotation
      const insertQuery = `
        INSERT INTO quotations (
          id, customer_id, customer_name, machine_type, order_type, 
          number_of_days, working_hours, food_resources, accom_resources,
          site_distance, usage, risk_factor, shift, day_night,
          mob_demob, mob_relaxation, extra_charge, other_factors_charge,
          billing, include_gst, sunday_working, customer_contact,
          total_rent, total_cost, working_cost, mob_demob_cost,
          food_accom_cost, risk_adjustment, usage_load_factor, risk_usage_total, gst_amount, created_by, status, notes,
          deal_id, lead_id, primary_equipment_id, equipment_snapshot,
          incident1, incident2, incident3, rigger_amount, helper_amount
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
          $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43
        )
      `;
      // Debug the mapping process - use EXACT values from frontend
      const mappedOrderType = quotationData.orderType; // Direct use, no fallback that overrides user selection
      const mappedRiskFactor = quotationData.riskFactor; // Direct use, no mapping override
      // Handle food and accommodation resources as numeric values (number of people)
      // Convert string values to numbers if needed for backward compatibility
      let mappedFoodResources = 0;
      let mappedAccomResources = 0;
      
      if (typeof quotationData.foodResources === 'number') {
        mappedFoodResources = quotationData.foodResources;
      } else if (quotationData.foodResources === 'ASP Provided') {
        mappedFoodResources = 2; // Default 2 people
      } else {
        mappedFoodResources = Number(quotationData.foodResources) || 0;
      }
      
      if (typeof quotationData.accomResources === 'number') {
        mappedAccomResources = quotationData.accomResources;
      } else if (quotationData.accomResources === 'ASP Provided') {
        mappedAccomResources = 2; // Default 2 people
      } else {
        mappedAccomResources = Number(quotationData.accomResources) || 0;
      }
      
      console.log('🔄 DEBUG: Mapping process:', {
        originalOrderType: quotationData.orderType,
        mappedOrderType,
        originalRiskFactor: quotationData.riskFactor,
        mappedRiskFactor,
        originalUsage: quotationData.usage,
        originalFoodResources: quotationData.foodResources,
        mappedFoodResources,
        originalAccomResources: quotationData.accomResources,
        mappedAccomResources,
        numberOfDays: quotationData.numberOfDays,
        orderTypeMapping: orderTypeMapping
      });
      
      // Test specific case
      if (quotationData.numberOfDays === 21) {
        console.log('🧪 BACKEND TEST: 21 days with orderType:', quotationData.orderType);
        console.log('Expected: "small", Mapped to:', mappedOrderType);
        if (mappedOrderType !== 'small' && quotationData.orderType === 'small') {
          console.error('❌ BACKEND ISSUE: Order type mapping failed for 21 days');
        }
      }

      // Extract and log incident/rigger/helper amounts for debugging
      const incident1Amount = extractIncidentAmount(quotationData, 'incident1');
      const incident2Amount = extractIncidentAmount(quotationData, 'incident2');
      const incident3Amount = extractIncidentAmount(quotationData, 'incident3');
      const riggerAmount = extractOtherFactorsAmount(quotationData, 'rigger');
      const helperAmount = extractOtherFactorsAmount(quotationData, 'helper');
      
      console.log('💰 DEBUG: Extracted amounts and costs:', {
        incident1Amount,
        incident2Amount, 
        incident3Amount,
        riggerAmount,
        helperAmount,
        incidentalCharges: quotationData.incidentalCharges,
        otherFactors: quotationData.otherFactors,
        customIncidentAmounts: quotationData.customIncidentAmounts,
        customRiggerAmount: quotationData.customRiggerAmount,
        // Cost breakdown being saved
        workingCost: quotationData.workingCost || quotationData.calculations?.workingCost,
        mobDemobCost: quotationData.mobDemobCost || quotationData.calculations?.mobDemobCost,
        foodAccomCost: quotationData.foodAccomCost || quotationData.calculations?.foodAccomCost,
        mobDemob: quotationData.mobDemob || quotationData.calculations?.mobDemob,
        extraCharge: quotationData.extraCharge,
        totalCost: totalCost,
        gstAmount: gstAmount,
        finalTotal: finalTotal
      });

      const values = [
        id,
        customerId,
        quotationData.customerName,
        quotationData.machineType,
        mappedOrderType,
        quotationData.numberOfDays,
        quotationData.workingHours,
        mappedFoodResources,
        mappedAccomResources,
        Number(quotationData.siteDistance),
        quotationData.usage,
        mappedRiskFactor,
        shiftMapping[quotationData.shift],
        'day', // day_night (will be enhanced later)
        quotationData.mobDemob || quotationData.calculations?.mobDemob, // mob_demob - use frontend value
        quotationData.mobRelaxation || quotationData.calculations?.mobRelaxation, // mob_relaxation
        quotationData.extraCharge,
        riggerAmount + helperAmount, // other_factors_charge - sum of rigger and helper
        'gst', // billing
        true, // include_gst
        'no', // sunday_working
        JSON.stringify(customerContact),
        totalCost,
        finalTotal,
        quotationData.workingCost || quotationData.calculations?.workingCost, // working_cost
        quotationData.mobDemobCost || quotationData.calculations?.mobDemobCost, // mob_demob_cost
        quotationData.foodAccomCost || quotationData.calculations?.foodAccomCost, // food_accom_cost
        quotationData.riskAdjustment || quotationData.calculations?.riskAdjustment, // risk_adjustment
        quotationData.usageLoadFactor || quotationData.calculations?.usageLoadFactor, // usage_load_factor
        quotationData.riskUsageTotal || quotationData.calculations?.riskUsageTotal, // risk_usage_total
        gstAmount,
        req.user.id, // created_by (will be replaced with actual user)
        'draft',
        quotationData.notes || '',
        quotationData.dealId || null,
        quotationData.leadId || null,
        quotationData.primaryEquipmentId || quotationData.selectedEquipment?.equipmentId || quotationData.selectedEquipment?.id || null, // primary_equipment_id
        quotationData.equipmentSnapshot ? JSON.stringify(quotationData.equipmentSnapshot) : (quotationData.selectedEquipment ? JSON.stringify(quotationData.selectedEquipment) : null), // equipment_snapshot
        incident1Amount, // incident1
        incident2Amount, // incident2  
        incident3Amount, // incident3
        riggerAmount, // rigger_amount
        helperAmount  // helper_amount
      ];
      await client.query(insertQuery, values);
      
      console.log('✅ DEBUG: Quotation inserted with ID:', id, 'Values used:', {
        orderType: mappedOrderType,
        riskFactor: mappedRiskFactor,
        foodResources: mappedFoodResources,
        accomResources: mappedAccomResources,
        numberOfDays: quotationData.numberOfDays,
        usage: quotationData.usage
      });

      // Insert selected machines if provided (support for multiple equipment)
      if (quotationData.selectedMachines && Array.isArray(quotationData.selectedMachines) && quotationData.selectedMachines.length > 0) {
        console.log('🔧 Inserting', quotationData.selectedMachines.length, 'selected machines');
        for (const machine of quotationData.selectedMachines) {
          await client.query(`
            INSERT INTO quotation_machines (
              quotation_id, equipment_id, quantity, base_rate, running_cost_per_km
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            id,
            machine.id, // Use the primary key id, not equipmentId (business identifier)
            machine.quantity || 1,
            machine.baseRate || 0,
            machine.runningCostPerKm || 0
          ]);
        }
      }
      
      return res.status(201).json({ 
        success: true,
        message: 'Quotation created successfully',
        data: { id, quotationId: id, totalCost: finalTotal }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ ERROR creating quotation:', error);
    console.error('❌ ERROR stack:', error.stack);
    console.error('❌ Request body that caused error:', JSON.stringify(req.body, null, 2));
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message,
      details: error.stack
    });
  }
});

/**
 * PUT /api/quotations/:id/status
 * Update quotation status (draft, sent, approved, rejected)
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const validStatuses = ['draft', 'sent', 'approved', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      });
    }
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE quotations 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
        RETURNING id, status
      `, [status, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Quotation not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Quotation status updated successfully',
        data: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating quotation status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/quotations/:id
 * Update a quotation
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customer_name,
      customer_contact,
      machine_type,
      order_type,
      number_of_days,
      working_hours,
      site_distance,
      usage,
      risk_factor,
      shift,
      day_night,
      food_resources,
      accom_resources,
      mob_demob,
      mob_relaxation,
      extra_charge,
      other_factors_charge,
      working_cost,
      mob_demob_cost,
      food_accom_cost,
      risk_adjustment,
      usage_load_factor,
      riskUsageTotal,
      calculations,
      gst_amount,
      total_rent,
      total_cost,
      notes,
      status,
      selectedMachines,
      incidentalCharges,
      otherFactors,
      // Fields that will be added to database schema
      primary_equipment_id,
      equipment_snapshot,
      incident1,
      incident2,
      incident3,
      riggerAmount,
      helperAmount,
      billing,
      include_gst,
      sunday_working
    } = req.body;

    // Parse incidentalCharges if it comes as a string
    let parsedIncidentalCharges = incidentalCharges;
    if (typeof incidentalCharges === 'string') {
      try {
        parsedIncidentalCharges = JSON.parse(incidentalCharges);
      } catch (e) {
        console.log('Could not parse incidentalCharges, using as array:', incidentalCharges);
        parsedIncidentalCharges = Array.isArray(incidentalCharges) ? incidentalCharges : [];
      }
    }

    // Parse otherFactors if it comes as a string  
    let parsedOtherFactors = otherFactors;
    if (typeof otherFactors === 'string') {
      try {
        parsedOtherFactors = JSON.parse(otherFactors);
      } catch (e) {
        console.log('Could not parse otherFactors, using as array:', otherFactors);
        parsedOtherFactors = Array.isArray(otherFactors) ? otherFactors : [];
      }
    }

    // Map frontend field names to backend expectations
    const rigger_amount_mapped = riggerAmount;
    const helper_amount_mapped = helperAmount;

    const client = await pool.connect();
    
    try {
      // Update the main quotation record
      const result = await client.query(`
        UPDATE quotations 
        SET 
          customer_name = $1,
          customer_contact = $2,
          machine_type = $3,
          order_type = $4,
          number_of_days = $5,
          working_hours = $6,
          site_distance = $7,
          usage = $8,
          risk_factor = $9,
          shift = $10,
          day_night = $11,
          food_resources = $12,
          accom_resources = $13,
          mob_demob = $14,
          mob_relaxation = $15,
          extra_charge = $16,
          other_factors_charge = $17,
          working_cost = $18,
          mob_demob_cost = $19,
          food_accom_cost = $20,
          risk_adjustment = $21,
          usage_load_factor = $22,
          risk_usage_total = $23,
          gst_amount = $24,
          total_rent = $25,
          total_cost = $26,
          notes = $27,
          status = $28,
          incidental_charges = $29,
          other_factors = $30,
          billing = $31,
          include_gst = $32,
          sunday_working = $33,
          primary_equipment_id = $34,
          equipment_snapshot = $35,
          incident1 = $36,
          incident2 = $37,
          incident3 = $38,
          rigger_amount = $39,
          helper_amount = $40,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $41
        RETURNING *
      `, [
        customer_name,
        JSON.stringify(customer_contact),
        machine_type,
        order_type,
        number_of_days,
        working_hours,
        site_distance,
        usage,
        risk_factor,
        shift,
        day_night,
        food_resources,
        accom_resources,
        mob_demob,
        mob_relaxation,
        extra_charge,
        other_factors_charge,
        working_cost,
        mob_demob_cost,
        food_accom_cost,
        risk_adjustment,
        usage_load_factor,
        riskUsageTotal || calculations?.riskUsageTotal,
        gst_amount,
        total_rent,
        total_cost,
        notes,
        status || 'draft',
        JSON.stringify(parsedIncidentalCharges || []),
        JSON.stringify(parsedOtherFactors || []),
        billing,
        include_gst,
        sunday_working,
        primary_equipment_id,
        JSON.stringify(equipment_snapshot),
        extractIncidentAmount(req.body, 'incident1') || incident1,
        extractIncidentAmount(req.body, 'incident2') || incident2,
        extractIncidentAmount(req.body, 'incident3') || incident3,
        extractOtherFactorsAmount(req.body, 'rigger') || rigger_amount_mapped,
        extractOtherFactorsAmount(req.body, 'helper') || helper_amount_mapped,
        id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Quotation not found'
        });
      }
      
      // Update quotation machines
      if (selectedMachines && Array.isArray(selectedMachines)) {
        // Delete existing machines
        await client.query('DELETE FROM quotation_machines WHERE quotation_id = $1', [id]);
        
        // Insert updated machines
        for (const machine of selectedMachines) {
          await client.query(`
            INSERT INTO quotation_machines (
              quotation_id, equipment_id, quantity, base_rate, running_cost_per_km
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            id,
            machine.id || machine.equipmentId,
            machine.quantity || 1,
            machine.baseRate || 0,
            machine.runningCostPerKm || 0
          ]);
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'Quotation updated successfully',
        data: result.rows[0]
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating quotation:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * DELETE /api/quotations/:id
 * Delete a quotation
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      // Delete quotation machines first
      await client.query('DELETE FROM quotation_machines WHERE quotation_id = $1', [id]);
      
      // Delete the quotation
      const result = await client.query('DELETE FROM quotations WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Quotation not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Quotation deleted successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/quotations/print - Generate printable quotation using Twenty CRM table builder pattern
 */
router.post('/print', authenticateToken, async (req, res) => {
  console.log('🖨️ [QuotationRoutes] ===== PRINT ENDPOINT CALLED =====');
  console.log('🖨️ [QuotationRoutes] Request method:', req.method);
  console.log('🖨️ [QuotationRoutes] Request path:', req.path);
  console.log('🖨️ [QuotationRoutes] Request body:', req.body);
  console.log('🖨️ [QuotationRoutes] Request headers:', req.headers);
  
  try {
    const { quotationId } = req.body;
    
    console.log('🖨️ [QuotationRoutes] Print request for quotation:', quotationId);

    if (!quotationId) {
      console.log('❌ [QuotationRoutes] No quotation ID provided');
      return res.status(400).json({
        success: false,
        error: 'Quotation ID is required'
      });
    }

    // Get quotation with full details
    console.log('🔍 [QuotationRoutes] Fetching quotation data...');
    const quotationData = await getQuotationWithFullDetails(quotationId);
    if (!quotationData) {
      console.log('❌ [QuotationRoutes] Quotation not found');
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }

    console.log('✅ [QuotationRoutes] Quotation data fetched:', {
      id: quotationData.id,
      number: generateQuotationNumber(quotationData.id),
      itemsCount: quotationData.items?.length || 0
    });

    // Use Twenty CRM inspired table builder
    console.log('🏗️ [QuotationRoutes] Building table with Twenty CRM pattern...');
    const tableBuilder = new QuotationTableBuilder();
    const html = tableBuilder
      .setData(quotationData)
      .setOptions({ printMode: true, theme: 'professional' })
      .generatePrintHTML();

    console.log('✅ [QuotationRoutes] Print HTML generated successfully');
    console.log('📏 [QuotationRoutes] HTML length:', html.length, 'characters');

    res.json({
      success: true,
      html,
      quotation: {
        id: quotationData.id,
        number: generateQuotationNumber(quotationData.id)
      },
      method: 'Twenty CRM Table Builder',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [QuotationRoutes] Print generation failed:', error);
    console.error('❌ [QuotationRoutes] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Print generation failed',
      message: error.message
    });
  }
});



/**
 * Helper function to get quotation with complete details for printing
 */
async function getQuotationWithFullDetails(quotationId) {
  const client = await pool.connect();
  
  try {
    // Get basic quotation info
    const quotationQuery = `
      SELECT 
        q.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        c.company as customer_company
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = $1 AND q.deleted_at IS NULL
    `;
    
    const quotationResult = await client.query(quotationQuery, [quotationId]);
    
    if (quotationResult.rows.length === 0) {
      return null;
    }
    
    const quotation = quotationResult.rows[0];
    
    // Get quotation items
    const itemsQuery = `
      SELECT 
        description,
        quantity,
        unit_price,
        total,
        notes
      FROM quotation_items
      WHERE quotation_id = $1
      ORDER BY created_at ASC
    `;
    
    const itemsResult = await client.query(itemsQuery, [quotationId]);
    
    // Structure the complete data
    return {
      id: quotation.id,
      quotation_number: generateQuotationNumber(quotation.id),
      description: quotation.description,
      status: quotation.status,
      valid_until: quotation.valid_until,
      total_amount: quotation.total_amount,
      tax_rate: quotation.tax_rate,
      created_at: quotation.created_at,
      updated_at: quotation.updated_at,
      
      customer: {
        name: quotation.customer_name,
        email: quotation.customer_email,
        phone: quotation.customer_phone,
        address: quotation.customer_address,
        company: quotation.customer_company
      },
      
      company: {
        name: 'ASP Cranes',
        address: 'Industrial Area, New Delhi, India',
        phone: '+91-XXXX-XXXX',
        email: 'info@aspcranes.com'
      },
      
      items: itemsResult.rows || []
    };
    
  } finally {
    client.release();
  }
}

export default router;

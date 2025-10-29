// Enhanced leadRepository using centralized db client
import { db } from '../../lib/dbClient.js';

export const getLeads = async () => {
  try {
    console.log('📋 Fetching all leads...');
    const leads = await db.any('SELECT * FROM leads ORDER BY created_at DESC');
    const formattedLeads = leads.map(row => ({
      id: row.id,
      customerName: row.customer_name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      serviceNeeded: row.service_needed,
      siteLocation: row.site_location,
      startDate: row.start_date,
      rentalDays: row.rental_days,
      status: row.status,
      source: row.source,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      files: row.files ? JSON.parse(row.files) : [],
      notes: row.notes,
    }));
    console.log(`✅ Found ${formattedLeads.length} leads`);
    return formattedLeads;
  } catch (error) {
    console.error('❌ Error fetching leads:', error);
    return [];
  }
};

export const getLeadById = async id => {
  try {
    console.log(`🔍 Fetching lead by ID: ${id}`);
    const lead = await db.oneOrNone('SELECT * FROM leads WHERE id = $1', [id]);
    if (!lead) {
      console.log('📝 Lead not found');
      return null;
    }

    const formattedLead = {
      id: lead.id,
      customerName: lead.customer_name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      serviceNeeded: lead.service_needed,
      siteLocation: lead.site_location,
      startDate: lead.start_date,
      rentalDays: lead.rental_days,
      status: lead.status,
      source: lead.source,
      assignedTo: lead.assigned_to,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      files: lead.files ? JSON.parse(lead.files) : [],
      notes: lead.notes,
    };
    console.log('✅ Lead found and formatted');
    return formattedLead;
  } catch (error) {
    console.error('❌ Error fetching lead by ID:', error);
    return null;
  }
};

export const createLead = async leadData => {
  try {
    if (!leadData.serviceNeeded) {
      throw new Error('serviceNeeded is required');
    }
    console.log('🆕 Creating new lead...');
    const result = await db.one(
      `INSERT INTO leads (customer_name, email, phone, address, service_needed, site_location, start_date, rental_days, status, source, assigned_to, files, notes, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) RETURNING *`,
      [
        leadData.customerName,
        leadData.email,
        leadData.phone,
        leadData.address,
        leadData.serviceNeeded,
        leadData.siteLocation || leadData.location || 'Not specified',
        leadData.startDate || new Date().toISOString().split('T')[0], // Default to today if not provided
        leadData.rentalDays || 1, // Default to 1 day if not provided
        'new', // Default status for new leads
        leadData.source,
        leadData.assignedTo,
        leadData.files ? JSON.stringify(leadData.files) : null,
        leadData.notes || '',
      ]
    );
    console.log(`✅ Lead created successfully: ${result.id}`);
    return {
      id: result.id,
      customerName: result.customer_name,
      email: result.email,
      phone: result.phone,
      address: result.address,
      serviceNeeded: result.service_needed,
      siteLocation: result.site_location,
      startDate: result.start_date,
      rentalDays: result.rental_days,
      status: result.status,
      source: result.source,
      assignedTo: result.assigned_to,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      files: result.files ? JSON.parse(result.files) : [],
      notes: result.notes,
    };
  } catch (error) {
    console.error('❌ Error creating lead:', error);
    throw error;
  }
};

export const updateLead = async (id, leadData) => {
  try {
    console.log(`📝 Updating lead: ${id}`);
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (leadData.customerName) {
      updates.push(`customer_name = $${paramIndex++}`);
      values.push(leadData.customerName);
    }
    if (leadData.email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(leadData.email);
    }
    if (leadData.phone) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(leadData.phone);
    }
    if (leadData.address) {
      updates.push(`address = $${paramIndex++}`);
      values.push(leadData.address);
    }
    if (leadData.serviceNeeded) {
      updates.push(`service_needed = $${paramIndex++}`);
      values.push(leadData.serviceNeeded);
    }
    if (leadData.siteLocation) {
      updates.push(`site_location = $${paramIndex++}`);
      values.push(leadData.siteLocation);
    }
    if (leadData.startDate) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(leadData.startDate);
    }
    if (leadData.rentalDays) {
      updates.push(`rental_days = $${paramIndex++}`);
      values.push(leadData.rentalDays);
    }
    if (leadData.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(leadData.status);
    }
    if (leadData.source) {
      updates.push(`source = $${paramIndex++}`);
      values.push(leadData.source);
    }
    if (leadData.assignedTo) {
      updates.push(`assigned_to = $${paramIndex++}`);
      values.push(leadData.assignedTo);
    }
    if (leadData.files) {
      updates.push(`files = $${paramIndex++}`);
      values.push(JSON.stringify(leadData.files));
    }
    if (leadData.notes) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(leadData.notes);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE leads SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.one(query, values);
    console.log(`✅ Lead updated successfully: ${result.id}`);

    return {
      id: result.id,
      customerName: result.customer_name,
      email: result.email,
      phone: result.phone,
      address: result.address,
      serviceNeeded: result.service_needed,
      siteLocation: result.site_location,
      startDate: result.start_date,
      rentalDays: result.rental_days,
      status: result.status,
      source: result.source,
      assignedTo: result.assigned_to,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      files: result.files ? JSON.parse(result.files) : [],
      notes: result.notes,
    };
  } catch (error) {
    console.error('❌ Error updating lead:', error);
    throw error;
  }
};

export const deleteLead = async id => {
  try {
    console.log(`🗑️ Deleting lead: ${id}`);
    await db.none('DELETE FROM leads WHERE id = $1', [id]);
    console.log(`✅ Lead deleted successfully: ${id}`);
  } catch (error) {
    console.error('❌ Error deleting lead:', error);
    throw error;
  }
};

export const updateLeadStatus = async (id, status) => {
  try {
    console.log(`📝 Updating lead status: ${id} to ${status}`);
    const result = await db.one(
      'UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    console.log(`✅ Lead status updated successfully: ${result.id}`);

    return {
      id: result.id,
      customerName: result.customer_name,
      email: result.email,
      phone: result.phone,
      address: result.address,
      serviceNeeded: result.service_needed,
      siteLocation: result.site_location,
      startDate: result.start_date,
      rentalDays: result.rental_days,
      status: result.status,
      source: result.source,
      assignedTo: result.assigned_to,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      files: result.files ? JSON.parse(result.files) : [],
      notes: result.notes,
    };
  } catch (error) {
    console.error('❌ Error updating lead status:', error);
    throw error;
  }
};

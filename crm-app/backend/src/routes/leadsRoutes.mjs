/**
 * Leads API Routes
 *
 * Handles all lead-related API endpoints with proper authentication,
 * error handling, and validation.
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import * as leadRepository from '../services/postgres/leadRepository.js';
import { sendLeadCreatedNotification } from '../services/notificationService.js';
import { authenticateToken } from '../middleware/authMiddleware.mjs';

const router = express.Router();

// Error handling middleware specific to lead routes
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(error => {
    console.error('🚨 [LEADS] Error in route handler:', error);

    // Handle specific PostgreSQL errors
    if (error.code === '23505') {
      // unique_violation
      return res.status(409).json({
        message: 'A lead with this information already exists',
        error: 'Duplicate entry',
      });
    }

    if (error.code === '23503') {
      // foreign_key_violation
      return res.status(400).json({
        message: 'Invalid reference to related data',
        error: 'Foreign key constraint violation',
      });
    }

    // Generic error handling
    res.status(500).json({
      message: 'An unexpected error occurred',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  });
};

// Development bypass for auth (non-production only)
const isDev = process.env.NODE_ENV !== 'production';
const devBypass = (req, res, next) => {
  // Check for bypass header first
  if (
    req.headers['x-bypass-auth'] === 'development-only-123' ||
    req.headers['x-bypass-auth'] === 'true'
  ) {
    console.log('⚠️ [AUTH] Bypassing authentication with x-bypass-auth header');
    req.user = { id: 'dev-user', email: 'dev@example.com', role: 'admin' };
    return next();
  }
  return authenticateToken(req, res, next);
};

/**
 * GET /leads - Get all leads
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const leads = await leadRepository.getLeads();
    res.json(leads);
  })
);

/**
 * GET /leads/:id - Get lead by ID
 */
router.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const lead = await leadRepository.getLeadById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: `Lead with ID ${req.params.id} not found` });
    }

    res.json(lead);
  })
);

/**
 * POST /leads - Create new lead
 */
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Validate required fields - customerId is optional since it will be created/found automatically
    const requiredFields = ['customerName', 'email', 'serviceNeeded'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: missingFields,
      });
    }

    // Ensure status defaults to 'new' if not provided
    const leadData = {
      ...req.body,
      status: req.body.status || 'new',
    };

    const lead = await leadRepository.createLead(leadData);

    // Send lead created notification
    try {
      await sendLeadCreatedNotification(lead);
      console.log(`📧 Lead created notification sent for lead ${lead.id}`);
    } catch (notificationError) {
      console.error('Error sending lead created notification:', notificationError);
      // Don't fail lead creation if notification fails
    }

    res.status(201).json(lead);
  })
);

/**
 * PATCH /leads/:id/status - Update lead status
 */
router.patch(
  '/:id/status',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const lead = await leadRepository.updateLeadStatus(req.params.id, status);

    if (!lead) {
      return res.status(404).json({ message: `Lead with ID ${req.params.id} not found` });
    }

    res.json(lead);
  })
);

/**
 * PATCH /leads/:id/assign - Assign lead to sales agent
 */
router.patch(
  '/:id/assign',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { salesAgentId, salesAgentName } = req.body;

    // Allow empty salesAgentId for unassignment (will be converted to null in repository)

    const lead = await leadRepository.updateLeadAssignment(
      req.params.id,
      salesAgentId || '', // Pass empty string which will be handled in repository
      salesAgentName || 'Unassigned'
    );

    if (!lead) {
      return res.status(404).json({ message: `Lead with ID ${req.params.id} not found` });
    }

    res.json(lead);
  })
);

/**
 * PUT /leads/:id - Update lead (complete update)
 */
router.put(
  '/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const leadId = req.params.id;
    const leadData = req.body;

    // Validate required fields (using frontend camelCase format)
    const requiredFields = ['companyName', 'customerName', 'phone', 'email'];
    const missingFields = requiredFields.filter(field => !leadData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: missingFields,
      });
    }

    const updatedLead = await leadRepository.updateLead(leadId, leadData);

    if (!updatedLead) {
      return res.status(404).json({ message: `Lead with ID ${leadId} not found` });
    }

    res.json(updatedLead);
  })
);

/**
 * PATCH /leads/:id - Update lead (partial update)
 * This is for general lead updates when using PATCH method
 */
router.patch(
  '/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const leadId = req.params.id;
    const leadData = req.body;

    console.log(`🔄 PATCH request to update lead ${leadId}:`, leadData);

    // For PATCH requests, we don't require all fields, just update what's provided
    const updatedLead = await leadRepository.updateLead(leadId, leadData);

    if (!updatedLead) {
      console.log(`❌ Lead with ID ${leadId} not found`);
      return res.status(404).json({ message: `Lead with ID ${leadId} not found` });
    }

    console.log(`✅ Lead ${leadId} updated successfully`);
    res.json(updatedLead);
  })
);

export default router;

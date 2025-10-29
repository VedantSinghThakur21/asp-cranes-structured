/**
 * Equipment API Routes with Enhanced RBAC
 * Handles CRUD operations for equipment with role-based access control
 */

import express from 'express';
import dotenv from 'dotenv';

// Import enhanced authentication middleware
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.mjs';
import * as equipmentRepository from '../services/postgres/equipmentRepository.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Define role permissions for equipment management
const EQUIPMENT_READ_ROLES = ['admin', 'sales_agent', 'operations_manager'];
const EQUIPMENT_WRITE_ROLES = ['admin', 'operations_manager'];
const EQUIPMENT_DELETE_ROLES = ['admin'];

// Initialize equipment table when server starts - commented out for production deployment
// try {
//   equipmentRepository.initializeEquipmentTable();
// } catch (error) {
//   console.error('Failed to initialize equipment table:', error);
// }

// Wrap all repository calls in try/catch with proper error handling
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(error => {
    console.error(`API Error: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  });
};

// GET all equipment (with optional category filter) - Protected Route
router.get(
  '/',
  authenticateToken,
  authorizeRoles(EQUIPMENT_READ_ROLES),
  asyncHandler(async (req, res, next) => {
    console.log(
      `🔍 [EQUIPMENT] User ${req.user.email} (${req.user.role}) accessing equipment list`
    );

    const { category } = req.query;

    let equipment;
    if (category) {
      equipment = await equipmentRepository.getEquipmentByCategory(category);
    } else {
      equipment = await equipmentRepository.getAllEquipment();
    }
    // Return a consistent object for frontend compatibility
    res.json({
      success: true,
      data: equipment,
    });
  })
);

// GET equipment by ID
router.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    // Public route: no authentication required

    const equipment = await equipmentRepository.getEquipmentById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: `Equipment with ID ${req.params.id} not found`,
      });
    }

    res.json({
      success: true,
      data: equipment,
    });
  })
);

// CREATE equipment - Admin and Operations Manager only
router.post(
  '/',
  authenticateToken,
  authorizeRoles(EQUIPMENT_WRITE_ROLES),
  asyncHandler(async (req, res, next) => {
    console.log(`🔍 [EQUIPMENT] User ${req.user.email} (${req.user.role}) creating equipment`);

    // Validate required fields according to schema
    const requiredFields = [
      'name',
      'category',
      'manufacturingDate',
      'registrationDate',
      'maxLiftingCapacity',
      'unladenWeight',
    ];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        fields: missingFields,
      });
    }

    // Validate date formats (should be YYYY-MM or YYYY-MM-DD)
    const dateFields = ['manufacturingDate', 'registrationDate'];
    const invalidDates = [];

    dateFields.forEach(field => {
      const dateValue = req.body[field];
      if (dateValue && !/^\d{4}-\d{2}(-\d{2})?$/.test(dateValue)) {
        invalidDates.push(field);
      }
    });

    if (invalidDates.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM or YYYY-MM-DD format',
        fields: invalidDates,
      });
    }

    // Validate category values
    const validCategories = [
      'mobile_crane',
      'tower_crane',
      'crawler_crane',
      'pick_and_carry_crane',
    ];
    if (!validCategories.includes(req.body.category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
        validCategories: validCategories,
      });
    }

    // Validate numeric fields
    const numericFields = ['maxLiftingCapacity', 'unladenWeight'];
    const invalidNumbers = [];

    numericFields.forEach(field => {
      const value = req.body[field];
      if (value !== undefined && (isNaN(value) || value <= 0)) {
        invalidNumbers.push(field);
      }
    });

    if (invalidNumbers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid numeric values. Must be positive numbers',
        fields: invalidNumbers,
      });
    }

    const equipment = await equipmentRepository.createEquipment(req.body);

    res.status(201).json({
      success: true,
      data: equipment,
    });
  })
);

// UPDATE equipment
router.put(
  '/:id',
  asyncHandler(async (req, res, next) => {
    // Public route: no authentication required

    const equipment = await equipmentRepository.updateEquipment(req.params.id, req.body);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: `Equipment with ID ${req.params.id} not found`,
      });
    }

    res.json({
      success: true,
      data: equipment,
    });
  })
);

// DELETE equipment
router.delete(
  '/:id',
  asyncHandler(async (req, res, next) => {
    // Public route: no authentication required

    const deleted = await equipmentRepository.deleteEquipment(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Equipment with ID ${req.params.id} not found or could not be deleted`,
      });
    }

    res.json({
      success: true,
      message: `Equipment ${req.params.id} deleted successfully`,
    });
  })
);

export default router;

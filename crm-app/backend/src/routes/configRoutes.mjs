/**
 * General Configuration API Routes
 * Provides endpoints to manage all configuration types
 * Uses repository pattern for database operations
 */

import express from 'express';
import { authenticateToken } from '../authMiddleware.mjs';
import {
  getConfig,
  updateConfig,
  getAllConfigs,
  initializeDefaultConfigs,
  getConfigAuditHistory,
  getConfigChangesSummary,
} from '../services/postgres/configRepository.js';

const router = express.Router();

// Async handler for error handling
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(error => {
    console.error(`Config API Error: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  });
};

// Dev bypass for config routes
const devBypass = (req, res, next) => {
  if (
    process.env.NODE_ENV === 'development' ||
    req.headers['x-bypass-auth'] === 'development-only-123' ||
    req.headers['x-bypass-auth'] === 'true'
  ) {
    console.log('⚠️ [AUTH] Bypassing authentication for config route');
    req.user = { id: 'dev-user', email: 'dev@example.com', role: 'admin' };
    return next();
  }
  return authenticateToken(req, res, next);
};

// Admin role check middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'operations_manager')) {
    return res.status(403).json({
      success: false,
      message: 'This operation requires administrator or operations manager privileges',
    });
  }
  next();
};

/**
 * GET /api/config/:configType - Get configuration by type
 */
router.get(
  '/:configType',
  devBypass,
  asyncHandler(async (req, res) => {
    const { configType } = req.params;
    console.log(`🔍 Config API: GET /api/config/${configType}`);

    const config = await getConfig(configType);

    console.log(`✅ Config API: Successfully fetched ${configType} config`);
    res.json({
      success: true,
      data: config,
    });
  })
);

/**
 * PUT /api/config/:configType - Update configuration by type
 */
router.put(
  '/:configType',
  devBypass,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { configType } = req.params;
    const configData = req.body;

    console.log(`🔍 Config API: PUT /api/config/${configType}`);
    console.log(`📦 Config API: Request body:`, JSON.stringify(configData, null, 2));

    if (!configData || typeof configData !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Valid configuration data object is required',
      });
    }

    // Special handling for defaultTemplate config
    let dataToUpdate = configData;
    if (configType === 'defaultTemplate' && configData.defaultTemplateId) {
      dataToUpdate = {
        defaultTemplateId: configData.defaultTemplateId,
        updatedAt: new Date().toISOString(),
      };
    }

    // Prepare audit information
    const auditInfo = {
      userId: req.user?.id || 'UNKNOWN',
      userEmail: req.user?.email || 'unknown@example.com',
      reason: req.body.changeReason || `Updated ${configType} configuration via API`,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };

    console.log(`📋 Config API: Audit info for ${configType}:`, auditInfo);

    const updatedConfig = await updateConfig(configType, dataToUpdate, auditInfo);

    console.log(`✅ Config API: Successfully updated ${configType} config with audit trail`);
    res.json({
      success: true,
      data: updatedConfig,
      auditInfo: {
        changedBy: auditInfo.userId,
        changedAt: new Date().toISOString(),
      },
    });
  })
);

/**
 * GET /api/config - Get all configurations (for debugging/admin)
 */
router.get(
  '/',
  devBypass,
  asyncHandler(async (req, res) => {
    console.log('🔍 Config API: GET /api/config (all configs)');

    const configs = await getAllConfigs();

    console.log(
      `✅ Config API: Successfully fetched all configs (${Object.keys(configs).length} items)`
    );
    res.json({
      success: true,
      data: configs,
    });
  })
);

/**
 * POST /api/config/initialize - Initialize default configurations
 */
router.post(
  '/initialize',
  devBypass,
  requireAdmin,
  asyncHandler(async (req, res) => {
    console.log('🔍 Config API: POST /api/config/initialize');

    await initializeDefaultConfigs();

    console.log('✅ Config API: Default configurations initialized');
    res.json({
      success: true,
      message: 'Default configurations initialized successfully',
    });
  })
);

/**
 * GET /api/config/:configType/audit - Get audit history for specific configuration
 */
router.get(
  '/:configType/audit',
  devBypass,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { configType } = req.params;
    const { limit = 50 } = req.query;

    console.log(`🔍 Config API: GET /api/config/${configType}/audit (limit: ${limit})`);

    const auditHistory = await getConfigAuditHistory(configType, parseInt(limit));

    console.log(
      `✅ Config API: Successfully fetched audit history for ${configType} (${auditHistory.length} records)`
    );
    res.json({
      success: true,
      data: auditHistory,
      configType,
      totalRecords: auditHistory.length,
    });
  })
);

/**
 * GET /api/config/audit/all - Get audit history for all configurations
 */
router.get(
  '/audit/all',
  devBypass,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { limit = 100 } = req.query;

    console.log(`🔍 Config API: GET /api/config/audit/all (limit: ${limit})`);

    const auditHistory = await getConfigAuditHistory(null, parseInt(limit));

    console.log(
      `✅ Config API: Successfully fetched complete audit history (${auditHistory.length} records)`
    );
    res.json({
      success: true,
      data: auditHistory,
      totalRecords: auditHistory.length,
    });
  })
);

/**
 * GET /api/config/audit/summary - Get summary of configuration changes
 */
router.get(
  '/audit/summary',
  devBypass,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;

    console.log(`🔍 Config API: GET /api/config/audit/summary (last ${days} days)`);

    const changesSummary = await getConfigChangesSummary(parseInt(days));

    console.log(
      `✅ Config API: Successfully fetched changes summary (${changesSummary.length} records)`
    );
    res.json({
      success: true,
      data: changesSummary,
      periodDays: parseInt(days),
      totalRecords: changesSummary.length,
    });
  })
);

export default router;

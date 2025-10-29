/**
 * Secure AI System Manager
 * Enhanced version with proper security controls and environment validation
 */

import { CrewAICloudService } from '../services/CrewAICloudService.js';
import {
  authenticateToken,
  authorize,
  AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import express from 'express';

/**
 * Secure AI System Manager Class
 */
export class SecureAISystemManager {
  constructor() {
    this.crewAIService = null;
    this.isInitialized = false;
    this.startTime = null;
    this.requestCount = 0;
    this.lastRequestTime = null;

    // Security configuration
    this.maxRequestsPerMinute = parseInt(process.env.AI_MAX_REQUESTS_PER_MINUTE) || 60;
    this.requestHistory = [];

    console.log('🔐 Secure AI System Manager initialized');
  }

  /**
   * Initialize with security validation
   */
  async initialize() {
    try {
      console.log('🔄 Initializing secure AI system...');
      this.startTime = Date.now();

      // Validate environment variables
      this.validateEnvironment();

      // Initialize CrewAI service securely
      this.crewAIService = new CrewAICloudService();

      if (this.crewAIService.isConfigured) {
        await this.testConnectivitySecurely();
      } else {
        throw new Error('CrewAI service not properly configured');
      }

      this.isInitialized = true;
      const initTime = Date.now() - this.startTime;

      console.log(`✅ Secure AI system initialized in ${initTime}ms`);

      return {
        success: true,
        initializationTime: initTime,
        platform: 'CrewAI Hosted Platform (Secure)',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Secure AI system initialization failed:', error.message);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Validate environment configuration
   */
  validateEnvironment() {
    const requiredEnvVars = ['CREWAI_API_ENDPOINT', 'CREWAI_API_KEY'];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate API endpoint format
    const apiEndpoint = process.env.CREWAI_API_ENDPOINT;
    if (!apiEndpoint.startsWith('https://')) {
      throw new Error('CrewAI API endpoint must use HTTPS');
    }

    // Validate API key format
    const apiKey = process.env.CREWAI_API_KEY;
    if (apiKey.length < 10) {
      throw new Error('CrewAI API key appears to be invalid');
    }

    console.log('✅ Environment validation passed');
  }

  /**
   * Test connectivity with security checks
   */
  async testConnectivitySecurely() {
    console.log('🧪 Testing secure CrewAI connectivity...');

    const testPayload = {
      query: 'Security test - respond with "OK"',
      timestamp: new Date().toISOString(),
      testId: Math.random().toString(36).substring(7),
    };

    try {
      const testResult = await this.crewAIService.processChat(testPayload.query, {
        test: true,
        id: testPayload.testId,
      });

      if (testResult.success) {
        console.log('✅ Secure CrewAI connectivity verified');
      } else {
        throw new Error('Connectivity test failed');
      }
    } catch (error) {
      console.error('❌ Secure connectivity test failed:', error.message);
      throw error;
    }
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(userRole) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old requests
    this.requestHistory = this.requestHistory.filter(time => time > oneMinuteAgo);

    // Different limits for different roles
    let limit = this.maxRequestsPerMinute;
    if (userRole === 'admin') {
      limit = limit * 2; // Admins get double the limit
    } else if (userRole === 'operator') {
      limit = Math.floor(limit / 2); // Operators get half the limit
    }

    if (this.requestHistory.length >= limit) {
      throw new Error(
        `Rate limit exceeded. Max ${limit} requests per minute for role: ${userRole}`
      );
    }

    this.requestHistory.push(now);
    return true;
  }

  /**
   * Secure customer interaction handler
   */
  async handleSecureInteraction(userId, userRole, interaction) {
    if (!this.isInitialized) {
      throw new Error('Secure AI system not initialized');
    }

    // Security checks
    this.checkRateLimit(userRole);
    this.validateInteractionInput(interaction);

    console.log(`💬 [SECURE] User ${userId} (${userRole}) requesting AI interaction`);

    try {
      // Add security context to the interaction
      const secureContext = {
        ...interaction.context,
        userId,
        userRole,
        timestamp: new Date().toISOString(),
        sessionId: this.generateSessionId(userId),
      };

      const result = await this.crewAIService.processChat(interaction.query, secureContext);

      // Log for audit trail
      this.logInteraction(userId, userRole, interaction.query, result.success);

      return {
        success: result.success,
        response: result.response,
        platform: 'CrewAI Hosted Platform (Secure)',
        processingTime: result.responseTime || 0,
        sessionId: secureContext.sessionId,
      };
    } catch (error) {
      console.error(`❌ [SECURE] Interaction failed for user ${userId}:`, error.message);

      // Log security incident
      this.logSecurityIncident(userId, userRole, error.message);

      throw error;
    }
  }

  /**
   * Validate interaction input for security
   */
  validateInteractionInput(interaction) {
    if (!interaction || typeof interaction !== 'object') {
      throw new Error('Invalid interaction object');
    }

    if (!interaction.query || typeof interaction.query !== 'string') {
      throw new Error('Invalid or missing query');
    }

    if (interaction.query.length > 5000) {
      throw new Error('Query too long (max 5000 characters)');
    }

    // Check for potential injection attempts
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(interaction.query))) {
      throw new Error('Potentially malicious content detected');
    }

    return true;
  }

  /**
   * Generate secure session ID
   */
  generateSessionId(userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${userId}_${timestamp}_${random}`;
  }

  /**
   * Log interactions for audit trail
   */
  logInteraction(userId, userRole, query, success) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      userRole,
      queryLength: query.length,
      success,
      ip: this.getCurrentIP(),
    };

    // In production, this should go to a secure audit log
    console.log('📝 [AUDIT] AI Interaction:', JSON.stringify(logEntry));
  }

  /**
   * Log security incidents
   */
  logSecurityIncident(userId, userRole, error) {
    const incident = {
      timestamp: new Date().toISOString(),
      type: 'AI_SECURITY_INCIDENT',
      userId,
      userRole,
      error,
      ip: this.getCurrentIP(),
    };

    // In production, this should trigger security alerts
    console.error('🚨 [SECURITY] AI Security Incident:', JSON.stringify(incident));
  }

  /**
   * Get current IP (placeholder - would be passed from request)
   */
  getCurrentIP() {
    return 'unknown'; // This would be passed from the actual request
  }

  /**
   * Get system status with security info
   */
  getSecureSystemStatus() {
    return {
      initialized: this.isInitialized,
      platform: 'CrewAI Hosted Platform (Secure)',
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      rateLimit: {
        maxRequestsPerMinute: this.maxRequestsPerMinute,
        currentRequests: this.requestHistory.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Secure cleanup
   */
  async secureCleanup() {
    console.log('🧹 [SECURE] Cleaning up AI system...');

    // Clear sensitive data
    this.requestHistory = [];
    this.lastRequestTime = null;

    this.isInitialized = false;
    console.log('✅ [SECURE] AI system cleanup completed');
  }
}

/**
 * Express Router for Secure AI API
 */
export const createSecureAIRouter = () => {
  const router = express.Router();
  const secureAI = new SecureAISystemManager();

  // Initialize on first use
  let initPromise = null;

  const ensureInitialized = async () => {
    if (!initPromise) {
      initPromise = secureAI.initialize();
    }
    await initPromise;
  };

  /**
   * Protected AI Chat Endpoint
   */
  router.post(
    '/chat',
    authenticateToken,
    authorize(['admin', 'sales_agent', 'operations_manager']),
    async (req, res) => {
      try {
        await ensureInitialized();

        const { query, context = {} } = req.body;

        if (!query) {
          return res.status(400).json({
            error: 'MISSING_QUERY',
            message: 'Query is required',
          });
        }

        const result = await secureAI.handleSecureInteraction(req.user.id, req.user.role, {
          query,
          context,
        });

        res.status(200).json({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error('AI Chat error:', error);
        res.status(400).json({
          error: 'AI_PROCESSING_ERROR',
          message: error.message,
        });
      }
    }
  );

  /**
   * AI System Status (Admin only)
   */
  router.get('/status', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
      const status = secureAI.getSecureSystemStatus();
      res.status(200).json(status);
    } catch (error) {
      res.status(500).json({
        error: 'STATUS_ERROR',
        message: 'Failed to get system status',
      });
    }
  });

  return router;
};

// Create singleton instance
export const secureAIManager = new SecureAISystemManager();

export default secureAIManager;

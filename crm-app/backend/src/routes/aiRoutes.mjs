/**
 * AI Routes - API endpoints for CrewAI multi-agent system
 * Provides REST API access to the AI agent network
 */
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.mjs';
import { aiSystemManager } from '../ai/AISystemManager.js';

const router = express.Router();

/**
 * Initialize AI system
 * POST /api/ai/initialize
 */
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    console.log('🚀 Initializing AI system via API...');

    const result = await aiSystemManager.initialize();

    res.json({
      success: true,
      message: 'AI system initialized successfully',
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ AI system initialization failed:', error.message);

    res.status(500).json({
      success: false,
      error: 'AI system initialization failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get system status and health
 * GET /api/ai/status
 */
router.get('/status', async (req, res) => {
  try {
    const status = aiSystemManager.getSystemStatus();
    const metrics = await aiSystemManager.getSystemMetrics();

    res.json({
      success: true,
      status,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to get AI system status:', error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system status',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Handle customer chat interaction
 * POST /api/ai/chat
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { query, context = {} } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`💬 Processing chat query: ${query.substring(0, 100)}...`);

    const result = await aiSystemManager.handleCustomerInteraction({
      query,
      context: {
        ...context,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: Date.now(),
      },
    });

    res.json({
      success: result.success,
      response: result.response || result.fallbackResponse,
      conversationId: result.conversationId,
      processingTime: result.processingTime,
      agentUsed: result.agentUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Chat processing failed:', error.message);

    res.status(500).json({
      success: false,
      error: 'Chat processing failed',
      message: error.message,
      fallbackResponse:
        "I apologize, but I'm experiencing technical difficulties. Please contact our sales team directly.",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Process lead through AI system
 * POST /api/ai/leads/process
 */
router.post('/leads/process', authenticateToken, async (req, res) => {
  try {
    const leadData = req.body;

    if (!leadData.customerName) {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🎯 Processing lead for: ${leadData.customerName}`);

    const result = await aiSystemManager.processBusinessWorkflow('lead_processing', leadData);

    res.json({
      success: true,
      message: 'Lead processed successfully',
      data: result.workflowResult,
      processingTime: result.processingTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Lead processing failed:', error.message);

    res.status(500).json({
      success: false,
      error: 'Lead processing failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Generate quotation through AI system
 * POST /api/ai/quotations/generate
 */
router.post('/quotations/generate', authenticateToken, async (req, res) => {
  try {
    const quotationData = req.body;

    if (!quotationData.equipmentType || !quotationData.rentalDuration) {
      return res.status(400).json({
        success: false,
        error: 'Equipment type and rental duration are required',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📋 Generating quotation for: ${quotationData.equipmentType}`);

    const result = await aiSystemManager.processBusinessWorkflow(
      'quotation_processing',
      quotationData
    );

    res.json({
      success: true,
      message: 'Quotation generated successfully',
      data: result.workflowResult,
      processingTime: result.processingTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Quotation generation failed:', error.message);

    res.status(500).json({
      success: false,
      error: 'Quotation generation failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Research company through AI system
 * POST /api/ai/intelligence/research-company
 */
router.post('/intelligence/research-company', authenticateToken, async (req, res) => {
  try {
    const { companyName, domain, additionalInfo } = req.body;

    if (!companyName) {
      return res.status(400).json({
        success: false,
        error: 'Company name is required',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🔍 Researching company: ${companyName}`);

    const result = await aiSystemManager.processBusinessWorkflow('company_research', {
      companyName,
      domain,
      additionalInfo,
    });

    res.json({
      success: true,
      message: 'Company research completed successfully',
      data: result.workflowResult,
      processingTime: result.processingTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Company research failed:', error.message);

    res.status(500).json({
      success: false,
      error: 'Company research failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Analyze market trends through AI system
 * POST /api/ai/intelligence/market-trends
 */
router.post('/intelligence/market-trends', authenticateToken, async (req, res) => {
  try {
    const { industry, region, timeframe } = req.body;

    if (!industry) {
      return res.status(400).json({
        success: false,
        error: 'Industry is required',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📊 Analyzing market trends for: ${industry}`);

    const result = await aiSystemManager.processBusinessWorkflow('market_analysis', {
      industry,
      region,
      timeframe,
    });

    res.json({
      success: true,
      message: 'Market analysis completed successfully',
      data: result.workflowResult,
      processingTime: result.processingTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Market analysis failed:', error.message);

    res.status(500).json({
      success: false,
      error: 'Market analysis failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Calculate pricing through AI system
 * POST /api/ai/pricing/calculate
 */
router.post('/pricing/calculate', authenticateToken, async (req, res) => {
  try {
    const { equipmentType, rentalDuration, location, requirements } = req.body;

    if (!equipmentType || !rentalDuration) {
      return res.status(400).json({
        success: false,
        error: 'Equipment type and rental duration are required',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`💰 Calculating pricing for: ${equipmentType} (${rentalDuration} days)`);

    const result = await aiSystemManager.processBusinessWorkflow('quotation_generation', {
      equipmentType,
      rentalDuration,
      location,
      requirements,
    });

    res.json({
      success: result.success,
      message: 'Pricing calculated successfully',
      data: result.workflowResult,
      processingTime: result.processingTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Pricing calculation failed:', error.message);

    res.status(500).json({
      success: false,
      error: 'Pricing calculation failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get agent-specific metrics
 * GET /api/ai/agents/:agentId/metrics
 */
router.get('/agents/:agentId/metrics', async (req, res) => {
  try {
    const { agentId } = req.params;

    console.log(`📊 Getting metrics for agent: ${agentId}`);

    const metrics = await aiSystemManager.getSystemMetrics();

    res.json({
      success: true,
      agentId,
      metrics: metrics.service || {},
      platform: 'CrewAI Cloud',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`❌ Failed to get metrics for agent ${req.params.agentId}:`, error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent metrics',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Execute specific agent action
 * POST /api/ai/agents/:agentId/execute
 */
router.post('/agents/:agentId/execute', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { action, data, context = {} } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🎯 Executing ${action} on ${agentId} via CrewAI`);

    // Route through CrewAI cloud platform
    const result = await aiSystemManager.processBusinessWorkflow(action, {
      ...data,
      agentId,
      context,
    });

    res.json({
      success: result.success,
      agentId,
      action,
      data: result.workflowResult,
      processingTime: result.processingTime,
      platform: 'CrewAI Cloud',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`❌ Agent action execution failed for ${req.params.agentId}:`, error.message);

    res.status(500).json({
      success: false,
      error: 'Agent action execution failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get conversation history
 * GET /api/ai/conversations/:conversationId
 */
router.get('/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    console.log(`📜 Getting conversation: ${conversationId}`);

    // CrewAI cloud platform handles conversation management
    res.json({
      success: true,
      conversationId,
      message: 'Conversation history is managed by CrewAI cloud platform',
      platform: 'CrewAI Cloud',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`❌ Failed to get conversation ${req.params.conversationId}:`, error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversation',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Clear conversation history
 * DELETE /api/ai/conversations/:conversationId
 */
router.delete('/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    console.log(`🗑️ Clearing conversation: ${conversationId}`);

    // CrewAI cloud platform handles conversation management
    res.json({
      success: true,
      message: 'Conversation management is handled by CrewAI cloud platform',
      conversationId,
      platform: 'CrewAI Cloud',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`❌ Failed to clear conversation ${req.params.conversationId}:`, error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to clear conversation',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Restart AI system
 * POST /api/ai/restart
 */
router.post('/restart', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Restarting AI system via API...');

    await aiSystemManager.restart();

    res.json({
      success: true,
      message: 'AI system restarted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ AI system restart failed:', error.message);

    res.status(500).json({
      success: false,
      error: 'AI system restart failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Health check endpoint
 * GET /api/ai/health
 */
router.get('/health', async (req, res) => {
  try {
    const status = aiSystemManager.getSystemStatus();
    const isHealthy = status.initialized;

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      healthy: isHealthy,
      status,
      platform: status.platform || 'CrewAI Cloud',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

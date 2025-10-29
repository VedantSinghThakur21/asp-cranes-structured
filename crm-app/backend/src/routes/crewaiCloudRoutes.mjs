/**
 * CrewAI Cloud Platform API Routes
 * Handles requests to CrewAI cloud-hosted agents
 */

import express from 'express';
import { CrewAICloudService } from '../services/CrewAICloudService.js';
import { aiSystemManager } from '../ai/AISystemManager.js';

const router = express.Router();
const crewaiCloudService = new CrewAICloudService();

/**
 * Health check for CrewAI cloud platform
 */
router.get('/health', async (req, res) => {
  try {
    const health = await crewaiCloudService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'CrewAI platform unavailable',
      details: error.message,
    });
  }
});

/**
 * Chat endpoint with CrewAI cloud integration
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    console.log('🌐 Processing chat via CrewAI Cloud:', message);

    const result = await crewaiCloudService.processChat(message, context);

    res.json({
      success: true,
      response: result.response,
      source: 'crewai-cloud',
      metadata: {
        agentId: result.agentId,
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Chat processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat',
      details: error.message,
    });
  }
});

/**
 * Process leads via CrewAI cloud
 */
router.post('/leads/process', async (req, res) => {
  try {
    const leadData = req.body;

    console.log('🎯 Processing lead via CrewAI Cloud:', leadData.customerName);

    const result = await crewaiCloudService.analyzeLead(leadData);

    res.json({
      success: true,
      leadScore: result.leadScore,
      qualification: result.qualification,
      recommendations: result.recommendations,
      nextActions: result.nextActions,
      source: 'crewai-cloud',
    });
  } catch (error) {
    console.error('❌ Lead processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process lead',
      details: error.message,
    });
  }
});

/**
 * Generate quotations via CrewAI cloud
 */
router.post('/quotations/generate', async (req, res) => {
  try {
    const quotationData = req.body;

    console.log('💰 Generating quotation via CrewAI Cloud:', quotationData.equipmentType);

    const result = await crewaiCloudService.generateQuotation(quotationData);

    res.json({
      success: true,
      quotation: result.quotation,
      pricing: result.pricing,
      terms: result.terms,
      validUntil: result.validUntil,
      source: 'crewai-cloud',
    });
  } catch (error) {
    console.error('❌ Quotation generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quotation',
      details: error.message,
    });
  }
});

/**
 * Company research via CrewAI cloud
 */
router.post('/intelligence/research-company', async (req, res) => {
  try {
    const companyData = req.body;

    console.log('🔍 Researching company via CrewAI Cloud:', companyData.companyName);

    const result = await crewaiCloudService.researchCompany(companyData);

    res.json({
      success: true,
      companyProfile: result.companyProfile,
      financialInfo: result.financialInfo,
      industryInsights: result.industryInsights,
      riskAssessment: result.riskAssessment,
      opportunities: result.opportunities,
      source: 'crewai-cloud',
    });
  } catch (error) {
    console.error('❌ Company research error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to research company',
      details: error.message,
    });
  }
});

/**
 * Get agent metrics from CrewAI cloud
 */
router.get('/agents/:agentId/metrics', async (req, res) => {
  try {
    const { agentId } = req.params;

    const result = await crewaiCloudService.getAgentMetrics(agentId);

    res.json({
      success: true,
      agentId,
      metrics: result.metrics,
      performance: result.performance,
      usage: result.usage,
      source: 'crewai-cloud',
    });
  } catch (error) {
    console.error('❌ Agent metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent metrics',
      details: error.message,
    });
  }
});

/**
 * Initialize all agents on CrewAI platform
 */
router.post('/initialize', async (req, res) => {
  try {
    console.log('🚀 Initializing CrewAI cloud platform...');

    const result = await crewaiCloudService.initializeAgents();

    res.json({
      success: result.success,
      message: `Initialized ${result.initialized}/${result.total} agents on CrewAI platform`,
      details: result.details,
      platform: 'CrewAI Cloud',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ CrewAI initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize CrewAI platform',
      details: error.message,
    });
  }
});

/**
 * CrewAI webhook endpoint for receiving platform notifications
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-crewai-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature for security
    if (!crewaiCloudService.verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature',
      });
    }

    const { event, data } = req.body;

    console.log('📨 CrewAI webhook received:', event);

    // Handle different webhook events
    switch (event) {
      case 'agent.completed':
        // Agent task completed
        await handleAgentCompletion(data);
        break;

      case 'agent.error':
        // Agent encountered error
        await handleAgentError(data);
        break;

      case 'workflow.status':
        // Workflow status update
        await handleWorkflowStatus(data);
        break;

      default:
        console.log('🤷 Unknown webhook event:', event);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      event,
    });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      details: error.message,
    });
  }
});

/**
 * Platform status endpoint
 */
router.get('/status', async (req, res) => {
  try {
    const health = await crewaiCloudService.healthCheck();
    const metrics = await crewaiCloudService.getMetrics();

    res.json({
      success: true,
      platform: 'CrewAI Cloud',
      status: health.status,
      agents: {
        total: 6,
        active: metrics.agents?.active || 0,
        healthy: metrics.agents?.healthy || 0,
      },
      performance: {
        latency: health.latency,
        uptime: metrics.uptime || 'N/A',
        requestsToday: metrics.requestsToday || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform status',
      details: error.message,
    });
  }
});

// Helper functions for webhook handling
async function handleAgentCompletion(data) {
  console.log('✅ Agent task completed:', data.agentId, data.taskId);
  // Process completed task, update CRM if needed
}

async function handleAgentError(data) {
  console.error('❌ Agent error:', data.agentId, data.error);
  // Handle agent errors, possibly trigger fallback
}

async function handleWorkflowStatus(data) {
  console.log('🔄 Workflow status:', data.workflowId, data.status);
  // Update workflow status in CRM
}

export default router;

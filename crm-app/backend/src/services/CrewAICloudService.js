/**
 * CrewAI Cloud Platform Integration Service
 * Manages communication between ASP Cranes CRM and CrewAI cloud platform
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class CrewAICloudService {
  constructor() {
    this.startTime = Date.now();
    this.config = {
      apiKey: process.env.CREWAI_API_KEY,
      orgId: process.env.CREWAI_ORG_ID,
      baseURL:
        process.env.CREWAI_WORKSPACE_URL ||
        'https://asp-cranes-ai-sales-chatbot-v1-19ac7cde-f23-cb712937.crewai.com',
      workspaceURL: process.env.CREWAI_WORKSPACE_URL,
      webhookSecret: process.env.CREWAI_WEBHOOK_SECRET,
      timeout: parseInt(process.env.AI_TIMEOUT) || 5000,
    };

    this.isConfigured = this.validateConfig();

    if (this.isConfigured) {
      // Initialize API client only if configured
      this.client = this.createClient();
      console.log('🌐 CrewAI Cloud Service initialized with workspace:', this.config.baseURL);
    } else {
      console.warn(
        '⚠️ CrewAI Cloud Service initialized with incomplete configuration - using fallback mode'
      );
      this.client = null;
    }
  }

  validateConfig() {
    const required = ['apiKey', 'orgId'];
    const missing = required.filter(key => !this.config[key]);

    if (missing.length > 0) {
      console.warn(
        `⚠️ Missing CrewAI configuration: ${missing.join(', ')} - falling back to mock responses`
      );
      return false;
    }
    return true;
  }

  createClient() {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ASP-Cranes-CRM/1.0',
      },
    });
  }

  /**
   * Process customer chat through CrewAI platform
   */
  async processChat(message, context = {}) {
    try {
      console.log('🤖 Processing chat via CrewAI Cloud:', message);

      if (!this.isConfigured) {
        return this.getFallbackChatResponse(message, context);
      }

      // CrewAI hosted platform typically uses POST /chat or similar
      const response = await this.client.post('/chat', {
        message: message,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
          source: 'asp-cranes-crm',
        },
      });

      return {
        success: true,
        response: response.data.message || response.data.response || response.data,
        agentId: 'crewai-hosted',
        confidence: 0.9,
        responseTime: response.headers['x-response-time'] || 0,
      };
    } catch (error) {
      console.error('❌ CrewAI chat processing error:', error.message);
      return this.getFallbackChatResponse(message, context);
    }
  }

  /**
   * Fallback chat response when CrewAI is not available
   */
  getFallbackChatResponse(message, context) {
    const responses = [
      'Thank you for your inquiry about crane rental services. Our team will get back to you shortly with personalized recommendations.',
      "I'd be happy to help you with your crane rental needs. Let me connect you with our sales team for detailed assistance.",
      'We have a wide range of cranes available for rental. Our experts will provide you with the best options for your project.',
      "Your crane rental inquiry is important to us. We'll review your requirements and provide competitive pricing options.",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      success: true,
      response: randomResponse,
      agentId: 'fallback-agent',
      confidence: 0.8,
      responseTime: 100,
      source: 'fallback',
    };
  }

  /**
   * Process leads through CrewAI hosted platform
   */
  async processLead(leadData) {
    try {
      console.log('🎯 Processing lead via CrewAI hosted platform:', leadData.customerName);

      if (!this.isConfigured) {
        return this.getFallbackLeadResponse(leadData);
      }

      // Send lead data as a structured message to the hosted crew
      const message = `Please analyze this lead:
Customer: ${leadData.customerName}
Company: ${leadData.companyName || 'Not specified'}
Phone: ${leadData.phone || 'Not provided'}
Email: ${leadData.email || 'Not provided'}
Equipment Needed: ${leadData.equipmentType || 'Not specified'}
Project Details: ${leadData.projectDetails || 'Not provided'}
Budget: ${leadData.budget || 'Not specified'}
Timeline: ${leadData.timeline || 'Not specified'}

Please provide lead score, qualification status, and recommendations.`;

      const response = await this.client.post('/chat', {
        message: message,
        context: {
          type: 'lead_analysis',
          data: leadData,
        },
      });

      return {
        success: true,
        leadScore: 75, // Default score, CrewAI response would be parsed
        qualification: 'Qualified',
        recommendations: [
          'Follow up within 24 hours',
          'Send equipment catalog',
          'Schedule site visit if applicable',
        ],
        nextActions: ['Contact customer', 'Prepare quote', 'Schedule consultation'],
        crewaiResponse: response.data.message || response.data.response || response.data,
        source: 'crewai-hosted',
      };
    } catch (error) {
      console.error('❌ CrewAI lead processing error:', error.message);
      return this.getFallbackLeadResponse(leadData);
    }
  }

  /**
   * Alias for processLead for consistency with routes
   */
  async analyzeLead(leadData) {
    return this.processLead(leadData);
  }

  getFallbackLeadResponse(leadData) {
    return {
      success: true,
      leadScore: 75,
      qualification: 'Qualified',
      recommendations: [
        'Schedule a follow-up call within 24 hours',
        'Send detailed crane rental catalog',
        'Provide customized quote based on project requirements',
      ],
      nextActions: [
        'Contact customer to discuss specific crane requirements',
        'Site visit scheduling if project is local',
        'Prepare preliminary quote',
      ],
      source: 'fallback',
    };
  }

  /**
   * Generate quotations through CrewAI hosted platform
   */
  async generateQuotation(quotationData) {
    try {
      console.log(
        '💰 Generating quotation via CrewAI hosted platform:',
        quotationData.equipmentType
      );

      if (!this.isConfigured) {
        return this.getFallbackQuotationResponse(quotationData);
      }

      // Send quotation request as a structured message
      const message = `Please generate a quotation for:
Equipment Type: ${quotationData.equipmentType}
Rental Duration: ${quotationData.rentalDuration} days
Location: ${quotationData.location || 'Not specified'}
Special Requirements: ${quotationData.requirements || 'Standard rental'}
Customer: ${quotationData.customerName || 'Not specified'}
Project Type: ${quotationData.projectType || 'General construction'}

Please provide detailed pricing, terms, and quote validity period.`;

      const response = await this.client.post('/chat', {
        message: message,
        context: {
          type: 'quotation_generation',
          data: quotationData,
        },
      });

      const baseRate = 500; // Default rate
      const duration = quotationData.rentalDuration || 1;
      const totalCost = baseRate * duration;

      return {
        success: true,
        quotation: {
          id: `QUO-${Date.now()}`,
          equipmentType: quotationData.equipmentType,
          duration: duration,
          totalCost: totalCost,
        },
        pricing: {
          dailyRate: baseRate,
          totalDays: duration,
          subtotal: totalCost,
          tax: totalCost * 0.1,
          total: totalCost * 1.1,
        },
        terms: 'Standard rental terms apply. Payment due upon delivery.',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        crewaiResponse: response.data.message || response.data.response || response.data,
        source: 'crewai-hosted',
      };
    } catch (error) {
      console.error('❌ CrewAI quotation generation error:', error.message);
      return this.getFallbackQuotationResponse(quotationData);
    }
  }

  getFallbackQuotationResponse(quotationData) {
    const baseRate = 500; // Base daily rate
    const duration = quotationData.rentalDuration || 1;
    const totalCost = baseRate * duration;

    return {
      success: true,
      quotation: {
        id: `QUO-${Date.now()}`,
        equipmentType: quotationData.equipmentType,
        duration: duration,
        totalCost: totalCost,
      },
      pricing: {
        dailyRate: baseRate,
        totalDays: duration,
        subtotal: totalCost,
        tax: totalCost * 0.1,
        total: totalCost * 1.1,
      },
      terms: 'Standard rental terms apply. Payment due upon delivery.',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'fallback',
    };
  }

  /**
   * Research companies through CrewAI Intelligence Agent
   */
  async researchCompany(companyData) {
    try {
      console.log('🔍 Researching company via CrewAI:', companyData.companyName);

      if (!this.isConfigured) {
        return this.getFallbackCompanyResponse(companyData);
      }

      const response = await this.client.post('/agents/asp-intelligence-agent/research', {
        companyData,
        workflow: 'company-intelligence',
        sources: ['web-search', 'business-databases', 'social-media'],
        depth: 'comprehensive',
      });

      return {
        success: true,
        companyProfile: response.data.profile,
        financialInfo: response.data.financial,
        industryInsights: response.data.industry,
        riskAssessment: response.data.risk,
        opportunities: response.data.opportunities,
      };
    } catch (error) {
      console.error('❌ CrewAI company research error:', error.message);
      return this.getFallbackCompanyResponse(companyData);
    }
  }

  getFallbackCompanyResponse(companyData) {
    return {
      success: true,
      companyProfile: {
        name: companyData.companyName,
        industry: 'Construction/Engineering',
        size: 'Medium Enterprise',
        status: 'Active',
      },
      financialInfo: {
        creditRating: 'Good',
        paymentHistory: 'No significant issues found',
      },
      industryInsights: {
        marketPosition: 'Established player in local market',
        growthPotential: 'Moderate',
      },
      riskAssessment: {
        level: 'Low',
        factors: ['Established business', 'Good payment history'],
      },
      opportunities: [
        'Potential for long-term rental contracts',
        'Growing construction projects in area',
      ],
      source: 'fallback',
    };
  }

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(agentId = null) {
    try {
      const endpoint = agentId ? `/agents/${agentId}/metrics` : '/analytics/agents';
      const response = await this.client.get(endpoint);

      return {
        success: true,
        metrics: response.data.metrics,
        performance: response.data.performance,
        usage: response.data.usage,
      };
    } catch (error) {
      console.error('❌ CrewAI metrics error:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return {
      configured: this.isConfigured,
      mode: this.isConfigured ? 'crewai-cloud' : 'fallback',
      uptime: Date.now() - (this.startTime || Date.now()),
      requestsToday: 0, // Would track actual requests
      agents: {
        total: 6,
        active: this.isConfigured ? 6 : 0,
        healthy: this.isConfigured ? 6 : 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check for CrewAI platform
   */
  async healthCheck() {
    if (!this.isConfigured) {
      return {
        success: true,
        status: 'fallback-mode',
        platform: 'CrewAI Hosted Platform (Fallback)',
        latency: '0ms',
        message: 'Operating in fallback mode - CrewAI not configured',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // For hosted CrewAI, we can try a simple ping or chat test
      const startTime = Date.now();
      const response = await this.client.post('/chat', {
        message: 'health check ping',
      });
      const latency = Date.now() - startTime;

      return {
        success: true,
        status: 'healthy',
        platform: 'CrewAI Hosted Platform',
        latency: `${latency}ms`,
        workspace: this.config.baseURL,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ CrewAI health check failed:', error.message);
      return {
        success: false,
        status: 'unhealthy',
        error: error.message,
        platform: 'CrewAI Hosted Platform',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Handle errors with appropriate fallback
   */
  handleError(error) {
    const errorInfo = {
      message: error.message,
      code: error.response?.status,
      platform: 'CrewAI Cloud',
      timestamp: new Date().toISOString(),
    };

    // Check if fallback to local AI is enabled
    if (process.env.ENABLE_FALLBACK_TO_LOCAL === 'true') {
      console.log('🔄 Attempting fallback to local AI system...');
      errorInfo.fallbackAvailable = true;
      errorInfo.fallbackEndpoint = process.env.LOCAL_AI_ENDPOINT;
    }

    return errorInfo;
  }

  /**
   * Initialize agents on CrewAI platform
   */
  async initializeAgents() {
    try {
      console.log('🚀 Initializing ASP Cranes agents on CrewAI platform...');

      const agents = [
        {
          name: 'asp-master-agent',
          role: 'Master Coordinator',
          description: 'Central coordinator for ASP Cranes CRM operations',
          model: 'gpt-4o-mini',
          tools: ['crm-api', 'data-processing', 'workflow-management'],
        },
        {
          name: 'asp-lead-agent',
          role: 'Lead Processing Specialist',
          description: 'Processes and qualifies sales leads',
          model: 'gpt-4o-mini',
          tools: ['lead-qualification', 'scoring-algorithm', 'crm-api'],
        },
        {
          name: 'asp-deal-agent',
          role: 'Deal Management Expert',
          description: 'Manages deal progression and analysis',
          model: 'gpt-4o-mini',
          tools: ['deal-analysis', 'pipeline-management', 'crm-api'],
        },
        {
          name: 'asp-quotation-agent',
          role: 'Quotation Specialist',
          description: 'Generates accurate quotations and pricing',
          model: 'gpt-4o-mini',
          tools: ['pricing-calculator', 'pdf-generator', 'crm-api'],
        },
        {
          name: 'asp-intelligence-agent',
          role: 'Business Intelligence Analyst',
          description: 'Provides company research and market insights',
          model: 'gpt-4o-mini',
          tools: ['web-search', 'data-analysis', 'business-intelligence'],
        },
        {
          name: 'asp-nlp-assistant',
          role: 'Natural Language Processing Assistant',
          description: 'Handles customer conversations and support',
          model: 'gpt-4o-mini',
          tools: ['nlp-processing', 'conversation-ai', 'sentiment-analysis'],
        },
      ];

      const initPromises = agents.map(agent =>
        this.client.post('/agents', {
          ...agent,
          organizationId: this.config.orgId,
          crmIntegration: {
            baseURL: process.env.ASP_CRM_BASE_URL,
            authHeaders: {
              [process.env.LEADS_BYPASS_HEADER]: process.env.LEADS_BYPASS_VALUE,
            },
          },
        })
      );

      const results = await Promise.allSettled(initPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      console.log(
        `✅ Successfully initialized ${successful}/${agents.length} agents on CrewAI platform`
      );

      return {
        success: successful === agents.length,
        initialized: successful,
        total: agents.length,
        details: results,
      };
    } catch (error) {
      console.error('❌ Agent initialization failed:', error.message);
      throw this.handleError(error);
    }
  }
}

// Create singleton instance
export const crewaiCloudService = new CrewAICloudService();

// Export default for easy importing
export default crewaiCloudService;

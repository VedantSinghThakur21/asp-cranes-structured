/**
 * AI System Manager - CrewAI Hosted Platform Integration
 * Simple manager for CrewAI hosted platform integration for ASP Cranes CRM
 */
import { CrewAICloudService } from '../services/CrewAICloudService.js';

export class AISystemManager {
  constructor() {
    this.crewAIService = new CrewAICloudService();
    this.isInitialized = false;
    this.startTime = null;

    console.log('🚀 AI System Manager initialized - CrewAI Hosted Platform');
  }

  /**
   * Initialize the AI system
   */
  async initialize() {
    try {
      console.log('🔄 Initializing CrewAI hosted platform integration...');
      this.startTime = Date.now();

      // Test CrewAI connectivity
      if (this.crewAIService.isConfigured) {
        await this.testCrewAIConnectivity();
      }

      this.isInitialized = true;
      const initTime = Date.now() - this.startTime;

      console.log(`✅ CrewAI hosted platform integration initialized in ${initTime}ms`);

      return {
        success: true,
        initializationTime: initTime,
        platform: 'CrewAI Hosted Platform',
        configured: this.crewAIService.isConfigured,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ CrewAI hosted platform integration failed:', error.message);
      // Don't throw error - still initialize in fallback mode
      this.isInitialized = true;
      return {
        success: false,
        error: error.message,
        platform: 'CrewAI Hosted Platform (Fallback)',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test CrewAI connectivity
   */
  async testCrewAIConnectivity() {
    console.log('🧪 Testing CrewAI hosted platform connectivity...');

    try {
      const testResult = await this.crewAIService.processChat(
        'Test connection - please respond with success'
      );
      if (testResult.success) {
        console.log('✅ CrewAI hosted platform connectivity verified');
      } else {
        console.warn('⚠️ CrewAI test returned non-success result');
      }
    } catch (error) {
      console.error('❌ CrewAI connectivity test failed:', error.message);
      throw error;
    }
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      initialized: this.isInitialized,
      platform: 'CrewAI Hosted Platform',
      configured: this.crewAIService.isConfigured,
      mode: this.crewAIService.isConfigured ? 'hosted' : 'fallback',
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle customer interaction (main entry point)
   */
  async handleCustomerInteraction(interaction) {
    if (!this.isInitialized) {
      throw new Error('AI System not initialized');
    }

    console.log('💬 Handling customer interaction via CrewAI hosted platform...');

    try {
      const result = await this.crewAIService.processChat(interaction.query, interaction.context);

      return {
        success: result.success,
        response: result.response,
        platform: 'CrewAI Hosted Platform',
        processingTime: result.responseTime || 0,
        source: result.source,
      };
    } catch (error) {
      console.error('❌ Customer interaction handling failed:', error.message);

      return {
        success: false,
        error: error.message,
        fallbackResponse:
          "I apologize, but I'm experiencing technical difficulties. Please contact our sales team directly at sales@aspcranes.com or call us.",
      };
    }
  }

  /**
   * Process business workflow - delegated to CrewAI
   */
  async processBusinessWorkflow(workflowType, data) {
    if (!this.isInitialized) {
      throw new Error('AI System not initialized');
    }

    console.log(`🔄 Processing business workflow via CrewAI hosted platform: ${workflowType}`);

    try {
      let result;

      switch (workflowType) {
        case 'lead_analysis':
        case 'lead_processing':
          result = await this.crewAIService.analyzeLead(data);
          break;
        case 'quotation_generation':
        case 'quotation_processing':
          result = await this.crewAIService.generateQuotation(data);
          break;
        case 'company_research':
          result = await this.crewAIService.researchCompany(data);
          break;
        default:
          // For any other workflow, send as chat
          result = await this.crewAIService.processChat(
            `Process ${workflowType} workflow with this data: ${JSON.stringify(data)}`,
            { workflowType }
          );
      }

      return {
        success: result.success,
        workflowResult: result,
        platform: 'CrewAI Hosted Platform',
        processingTime: result.responseTime || 0,
      };
    } catch (error) {
      console.error(`❌ Workflow processing failed for ${workflowType}:`, error.message);
      throw error;
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    if (!this.isInitialized) {
      return { error: 'System not initialized' };
    }

    return {
      system: this.getSystemStatus(),
      platform: 'CrewAI Hosted Platform',
      service: this.crewAIService.getMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Cleanup (minimal for hosted service)
   */
  async cleanup() {
    console.log('🧹 Cleaning up AI system...');
    this.isInitialized = false;
    console.log('✅ AI system cleanup completed');
  }

  /**
   * Restart the system
   */
  async restart() {
    console.log('🔄 Restarting AI system...');
    await this.cleanup();
    await this.initialize();
    console.log('✅ AI system restarted successfully');
  }
}

// Create singleton instance
export const aiSystemManager = new AISystemManager();

// Export default for easy importing
export default aiSystemManager;

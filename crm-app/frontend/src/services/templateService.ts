// Re-export all functions from template.ts for compatibility
export * from './template';

// Import and re-export the main functions
import {
  getTemplates as getTemplatesFromTemplate,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  Template,
} from './template';

// Ensure getTemplates is properly exported
export const getTemplates = getTemplatesFromTemplate;
export const getTemplate = getTemplateById;

// Export the Template type
export type { Template };

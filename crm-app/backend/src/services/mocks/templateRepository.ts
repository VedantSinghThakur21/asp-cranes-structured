/**
 * Template Mock Repository
 *
 * This file provides mock data for the TemplateRepository when running in browser mode
 * to prevent errors with database access from the frontend.
 */

import type { Template } from '../../types/template';

// Default template content
const getDefaultTemplateContent = (): string => {
  return `
    <div class="quote-template">
      <div class="header">
        <img src="/asp-logo.jpg" alt="ASP Logo" class="logo" />
        <h1>{{company_name}}</h1>
        <div class="quote-details">
          <h2>Quotation</h2>
          <p>Quote #: {{quote_number}}</p>
          <p>Date: {{quote_date}}</p>
          <p>Valid Until: {{valid_until}}</p>
        </div>
      </div>
      
      <div class="customer-info">
        <h3>Customer Information</h3>
        <p>{{customer_name}}</p>
        <p>{{customer_address}}</p>
        <p>{{customer_email}}</p>
        <p>{{customer_phone}}</p>
      </div>
      
      <div class="quote-items">
        <h3>Services & Equipment</h3>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <td>{{this.description}}</td>
              <td>{{this.quantity}}</td>
              <td>{{this.rate}}</td>
              <td>{{this.amount}}</td>
            </tr>
            {{/each}}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="text-right">Subtotal</td>
              <td>{{subtotal}}</td>
            </tr>
            <tr>
              <td colspan="3" class="text-right">Tax ({{tax_rate}}%)</td>
              <td>{{tax_amount}}</td>
            </tr>
            <tr>
              <td colspan="3" class="text-right"><strong>Total</strong></td>
              <td><strong>{{total}}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div class="terms">
        <h3>Terms & Conditions</h3>
        <p>{{terms_conditions}}</p>
      </div>
      
      <div class="signature">
        <p>Accepted By: _________________________</p>
        <p>Date: _________________________</p>
      </div>
    </div>
  `;
};

// Mock template data
export const mockTemplates: Template[] = [
  {
    id: 'template-1',
    name: 'Default Template',
    description: 'Standard quotation template with company branding',
    content: getDefaultTemplateContent(),
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-2',
    name: 'Advanced Template',
    description: 'Detailed template with additional sections and customizations',
    content: getDefaultTemplateContent(),
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-3',
    name: 'Minimal Template',
    description: 'Simple, clean template for basic quotations',
    content: getDefaultTemplateContent(),
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Template API calls
export const getTemplatesFromApi = async (): Promise<Template[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockTemplates;
};

export const getTemplateById = async (id: string): Promise<Template | null> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockTemplates.find(template => template.id === id) || null;
};

export const createTemplate = async (
  template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Template> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const now = new Date().toISOString();
  const newTemplate: Template = {
    ...template,
    id: `template-${Math.floor(Math.random() * 1000)}`,
    createdAt: now,
    updatedAt: now,
  };

  return newTemplate;
};

export const updateTemplate = async (id: string, updates: Partial<Template>): Promise<Template> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));

  const template = mockTemplates.find(t => t.id === id);
  if (!template) {
    throw new Error(`Template with ID ${id} not found`);
  }

  return {
    ...template,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
};

export const deleteTemplate = async (_id: string): Promise<boolean> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return true;
};

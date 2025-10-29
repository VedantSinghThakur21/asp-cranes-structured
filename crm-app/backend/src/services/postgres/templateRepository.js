import { db } from '../../lib/dbClient.js';

export class TemplateRepository {
  async getTemplates() {
    try {
      const templates = await db.any('SELECT * FROM quotation_templates ORDER BY is_default DESC');
      return templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        content: template.content,
        styles: template.styles,
        elements: template.elements, // Add elements field
        isDefault: template.is_default,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
        createdBy: template.created_by,
      }));
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  async getTemplateById(id) {
    try {
      const template = await db.oneOrNone('SELECT * FROM quotation_templates WHERE id = $1', [id]);
      if (!template) return null;

      return {
        id: template.id,
        name: template.name,
        description: template.description,
        content: template.content,
        styles: template.styles,
        elements: template.elements, // Add elements field
        isDefault: template.is_default,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
        createdBy: template.created_by,
      };
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      return null;
    }
  }

  async createTemplate(template) {
    try {
      const { name, description, content, styles, elements, isDefault, createdBy } = template;
      const result = await db.one(
        `INSERT INTO quotation_templates (name, description, content, styles, elements, is_default, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [name, description, content, styles, elements, isDefault || false, createdBy]
      );
      return {
        id: result.id,
        name: result.name,
        description: result.description,
        content: result.content,
        styles: result.styles,
        elements: result.elements,
        isDefault: result.is_default,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        createdBy: result.created_by,
      };
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(id, template) {
    try {
      const { name, description, content, styles, elements, isDefault } = template;
      const result = await db.one(
        `UPDATE quotation_templates SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          content = COALESCE($3, content),
          styles = COALESCE($4, styles),
          elements = COALESCE($5, elements),
          is_default = COALESCE($6, is_default),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [name, description, content, styles, elements, isDefault, id]
      );
      return {
        id: result.id,
        name: result.name,
        description: result.description,
        content: result.content,
        styles: result.styles,
        elements: result.elements,
        isDefault: result.is_default,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        createdBy: result.created_by,
      };
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(id) {
    try {
      await db.none('DELETE FROM quotation_templates WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }
}

export default new TemplateRepository();

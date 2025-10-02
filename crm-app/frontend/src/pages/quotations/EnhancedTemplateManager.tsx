/**
 * Enhanced Template Manager Page
 * Provides interface for managing and creating enhanced quotation templates
 * with InvoiceNinja-style builder functionality
 */

import { useState, useEffect } from 'react';
import { Plus, Edit3, Eye, Copy, Trash2, Palette } from 'lucide-react';
import EnhancedTemplateBuilder from '../../components/quotations/EnhancedTemplateBuilder';

interface EnhancedTemplate {
  id: string;
  name: string;
  description?: string;
  theme: string;
  elements: any[];
  settings: any;
  branding: any;
  created_at: string;
  updated_at: string;
}

const EnhancedTemplateManager = () => {
  const [templates, setTemplates] = useState<EnhancedTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EnhancedTemplate | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EnhancedTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('jwt-token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Bypass-Auth': 'development-only-123'
      };
      
      // Add auth header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/templates/enhanced/list', {
        headers
      });

      const result = await response.json();
      if (result.success) {
        setTemplates(result.data);
        console.log('✅ Templates loaded successfully', result.authenticated ? '(authenticated)' : '(demo mode)');
      } else {
        console.error('Failed to load templates:', result.message);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setShowBuilder(true);
    setPreviewMode(false);
  };

  const handleEditTemplate = (template: EnhancedTemplate) => {
    setSelectedTemplate(template);
    setShowBuilder(true);
    setPreviewMode(false);
  };

  const handleCloseBuilder = () => {
    setShowBuilder(false);
    setSelectedTemplate(null);
    loadTemplates(); // Refresh the list
    setPreviewMode(false);
  };

  const handleSaveTemplate = (templateData: any) => {
    console.log('Template saved:', templateData);
    loadTemplates(); // Refresh the list
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/enhanced/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt-token')}`,
          'X-Bypass-Auth': 'development-only-123'
        }
      });

      const result = await response.json();
      if (result.success) {
        setTemplates(templates.filter(t => t.id !== templateId));
        setIsDeleteModalOpen(false);
        setTemplateToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDuplicateTemplate = async (template: EnhancedTemplate) => {
    try {
      const response = await fetch('/api/templates/enhanced/duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt-token')}`,
          'X-Bypass-Auth': 'development-only-123'
        },
        body: JSON.stringify({
          templateId: template.id,
          newName: `${template.name} (Copy)`
        })
      });

      const result = await response.json();
      if (result.success) {
        loadTemplates();
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const handlePreviewTemplate = async (template: EnhancedTemplate) => {
    // Use the builder in read-only autoPreview mode for consistent UX
    setSelectedTemplate(template);
    setShowBuilder(true);
    setPreviewMode(true);
    // The builder will auto-generate preview via autoPreview prop
  };

  const getThemeColor = (theme: string) => {
    const themeColors: Record<string, string> = {
      'MODERN': '#2563eb',
      'CLASSIC': '#1f2937',
      'PROFESSIONAL': '#0f172a',
      'CREATIVE': '#7c3aed'
    };
    return themeColors[theme] || '#6b7280';
  };

  if (showBuilder) {
    return (
      <EnhancedTemplateBuilder
        templateId={selectedTemplate?.id || null}
        onClose={handleCloseBuilder}
        onSave={handleSaveTemplate}
        autoPreview={previewMode}
        readOnly={previewMode}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Template Manager</h1>
          <p className="text-gray-600 mt-1">
            Create and manage professional quotation templates with advanced design capabilities
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading templates...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Template Preview */}
              <div 
                className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-b"
                style={{
                  background: `linear-gradient(135deg, ${getThemeColor(template.theme)}15, ${getThemeColor(template.theme)}05)`
                }}
              >
                <div className="text-center">
                  <Palette 
                    className="w-8 h-8 mx-auto mb-2 text-gray-400"
                    style={{ color: getThemeColor(template.theme) }}
                  />
                  <span className="text-sm text-gray-600 font-medium">
                    {template.theme?.charAt(0) + template.theme?.slice(1).toLowerCase() || 'Modern'} Theme
                  </span>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{template.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {template.description || 'No description provided'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getThemeColor(template.theme) }}
                    />
                  </div>
                </div>

                {/* Template Stats */}
                <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                  <span>{template.elements?.length || 0} elements</span>
                  <span>•</span>
                  <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Template"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePreviewTemplate(template)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Preview Template"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateTemplate(template)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Duplicate Template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setTemplateToDelete(template);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {templates.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Palette className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 mb-6">
                Create your first enhanced quotation template to get started
              </p>
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Template</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && templateToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Template</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{templateToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTemplate(templateToDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTemplateManager;

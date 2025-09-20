import { useState, useEffect } from 'react';
import { Save, RefreshCw, FileText } from 'lucide-react';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { getDefaultTemplateConfig, updateDefaultTemplateConfig } from '../../services/configService';

interface DefaultTemplateConfigProps {
  onSave?: () => void;
}

interface EnhancedTemplate {
  id: string;
  name: string;
  description?: string;
  theme: string;
  category: string;
  is_default: boolean;
  is_active: boolean;
}

export function DefaultTemplateConfig({ onSave }: DefaultTemplateConfigProps) {
  const [templates, setTemplates] = useState<EnhancedTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<EnhancedTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    async function generatePreview() {
      if (selectedTemplate) {
        try {
          // Use Enhanced Template System for preview
          const apiUrl = import.meta.env.VITE_API_URL || '/api';
          const response = await fetch(`${apiUrl}/quotations/print/preview`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('jwt-token')}`,
              'X-Bypass-Auth': 'development-only-123'
            },
            body: JSON.stringify({
              quotationId: 'sample', // Use sample data
              templateId: selectedTemplate.id,
              format: 'html'
            })
          });

          const data = await response.json();
          if (data.success) {
            setPreviewHtml(data.html);
          } else {
            setPreviewHtml(`<div style="color:red; padding: 20px;">
              <h3>Preview Error</h3>
              <p>Unable to generate preview: ${data.error || 'Unknown error'}</p>
              <p><strong>Template:</strong> ${selectedTemplate.name}</p>
            </div>`);
          }
        } catch (err) {
          console.error('Preview generation error:', err);
          setPreviewHtml(`<div style="color:#f59e0b; padding: 20px; border: 1px solid #fbbf24; border-radius: 8px; background-color: #fef3c7;">
            <h3 style="margin-top: 0; color: #92400e;">⚠️ Preview Temporarily Unavailable</h3>
            <p><strong>Template:</strong> ${selectedTemplate.name}</p>
            <p><strong>Status:</strong> Backend connection issue</p>
            <p><strong>Error:</strong> ${err instanceof Error ? err.message : 'Unknown error'}</p>
            <hr style="border-color: #fbbf24; margin: 16px 0;">
            <p style="font-size: 14px; color: #92400e;">
              <strong>What this means:</strong><br>
              • The template configuration is saved and will work<br>
              • Preview generation requires backend connection<br>
              • This is likely a temporary connectivity issue<br>
              • Try refreshing the page or check your connection
            </p>
          </div>`);
        }
      } else {
        setPreviewHtml('');
      }
    }
    generatePreview();
  }, [selectedTemplate]);

  useEffect(() => {
    loadTemplatesAndConfig();
  }, []);

  useEffect(() => {
    // Update selected template when ID changes
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      setSelectedTemplate(template || null);
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedTemplateId, templates]);

  const loadTemplatesAndConfig = async () => {
    try {
      setIsLoading(true);
      console.log('Loading Enhanced Templates and config...');
      
      // Load Enhanced Templates instead of old templates
      const token = localStorage.getItem('jwt-token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Bypass-Auth': 'development-only-123'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/templates/enhanced/list', {
        headers
      });

      console.log('Enhanced Templates response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Enhanced Templates response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load Enhanced Templates');
      }

      const allTemplates = result.data || result.templates || [];
      console.log('Loaded Enhanced Templates:', allTemplates);
      setTemplates(allTemplates);
      
      // Get current default template config
      const defaultConfig = await getDefaultTemplateConfig();
      console.log('Default config:', defaultConfig);
      
      if (defaultConfig && defaultConfig.defaultTemplateId) {
        setSelectedTemplateId(defaultConfig.defaultTemplateId);
      } else if (allTemplates.length > 0) {
        // If no default is set but templates exist, select the first one
        setSelectedTemplateId(allTemplates[0].id);
      }
    } catch (error) {
      console.error('Error loading Enhanced Templates and config:', error);
      
      // Provide fallback templates if backend is unreachable
      const fallbackTemplates = [{
        id: 'fallback_template',
        name: 'Fallback Template (Backend Unreachable)',
        description: 'Basic template used when backend is not available',
        theme: 'PROFESSIONAL',
        category: 'quotation',
        is_default: true,
        is_active: true
      }];
      
      setTemplates(fallbackTemplates);
      setSelectedTemplateId(fallbackTemplates[0].id);
      
      showToast(
        `Error loading templates: ${error instanceof Error ? error.message : String(error)}. Using fallback template.`, 
        'warning'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const handleSave = async () => {
    if (!selectedTemplateId) {
      showToast('Please select a template first', 'error');
      return;
    }

    try {
      setIsSaving(true);
      
      // Update the default template configuration using the proper config service
      await updateDefaultTemplateConfig(selectedTemplateId);
      
      // Refresh templates and config
      await loadTemplatesAndConfig();
      
      showToast('Default template configuration saved successfully');
      onSave?.();
    } catch (error) {
      console.error('Error saving default template config:', error);
      showToast('Error saving configuration: ' + (error instanceof Error ? error.message : String(error)), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const templateOptions = [
    { value: '', label: 'No default template selected' },
    ...templates.map(template => ({
      value: template.id,
      label: template.name
    }))
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-500" />
            <CardTitle>Default Quotation Template</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Default Template
              </label>
              <Select
                options={templateOptions}
                value={selectedTemplateId}
                onChange={setSelectedTemplateId}
                className="w-full max-w-md"
              />
              <p className="text-sm text-gray-500 mt-2">
                This template will be used as the default when creating new quotations.
              </p>
            </div>

            {selectedTemplateId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">
                      Selected Template
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {templates.find(t => t.id === selectedTemplateId)?.name}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {templates.find(t => t.id === selectedTemplateId)?.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {templates.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900">
                      No Templates Available
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Create quotation templates first to set a default template.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={handleSave}
              disabled={isSaving || templates.length === 0}
              leftIcon={isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
              className="w-full sm:w-auto"
            >
              {isSaving ? 'Saving Configuration...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template Preview */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg p-6 shadow-sm max-h-[800px] overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </CardContent>
        </Card>
      )}

      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}
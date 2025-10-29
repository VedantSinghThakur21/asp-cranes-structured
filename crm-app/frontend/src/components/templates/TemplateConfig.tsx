import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Save, Settings } from 'lucide-react';

interface TemplateConfigProps {
  onConfigUpdate?: () => void;
}

export const TemplateConfig: React.FC<TemplateConfigProps> = ({ onConfigUpdate }) => {
  const [config, setConfig] = useState({
    defaultQuotationTemplate: '',
    defaultInvoiceTemplate: '',
    defaultReportTemplate: '',
    enableTemplateSelection: true,
  });
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTemplates();
    fetchConfig();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates/modern?isActive=true');
      const result = await response.json();
      if (result.success) {
        setAvailableTemplates(result.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('jwt-token')}`,
          'X-Bypass-Auth': 'development-only-123',
        },
      });
      const result = await response.json();
      if (result.success && result.data) {
        setConfig(result.data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/config/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('jwt-token')}`,
          'X-Bypass-Auth': 'development-only-123',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      if (result.success) {
        setMessage('Configuration saved successfully');
        onConfigUpdate?.();
      } else {
        setMessage('Error saving configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('Error saving configuration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border">
      <div className="flex items-center space-x-2">
        <Settings className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Template Configuration</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Default Quotation Template */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Default Quotation Template
          </label>
          <select
            value={config.defaultQuotationTemplate}
            onChange={e => setConfig({ ...config, defaultQuotationTemplate: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">No default template</option>
            {availableTemplates
              .filter(t => t.category === 'quotation' || t.category === 'general')
              .map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
          </select>
        </div>

        {/* Default Invoice Template */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Default Invoice Template
          </label>
          <select
            value={config.defaultInvoiceTemplate}
            onChange={e => setConfig({ ...config, defaultInvoiceTemplate: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">No default template</option>
            {availableTemplates
              .filter(t => t.category === 'invoice' || t.category === 'general')
              .map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
          </select>
        </div>

        {/* Default Report Template */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Default Report Template</label>
          <select
            value={config.defaultReportTemplate}
            onChange={e => setConfig({ ...config, defaultReportTemplate: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">No default template</option>
            {availableTemplates
              .filter(t => t.category === 'report' || t.category === 'general')
              .map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
          </select>
        </div>

        {/* Enable Template Selection */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.enableTemplateSelection}
              onChange={e => setConfig({ ...config, enableTemplateSelection: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Allow users to select templates when printing
            </span>
          </label>
          <p className="text-xs text-gray-500">
            If disabled, default templates will always be used
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-md ${
            message.includes('Error')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={isLoading} className="flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>{isLoading ? 'Saving...' : 'Save Configuration'}</span>
        </Button>
      </div>
    </div>
  );
};

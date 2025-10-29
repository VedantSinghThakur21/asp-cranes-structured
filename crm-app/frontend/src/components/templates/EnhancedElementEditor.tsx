/**
 * Enhanced Element Editor - SuiteCRM inspired element editing panel
 * Features advanced styling controls, content management, and configuration options
 */

import React, { useState } from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';

// Enhanced element interface
export interface EnhancedTemplateElement {
  id: string;
  type: string;
  content?: string;
  fieldType?: string;
  style?: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    textAlign?: 'left' | 'center' | 'right';
    border?: string;
    borderRadius?: string;
    width?: string;
    height?: string;
    maxWidth?: string;
    minHeight?: string;
  };
  config?: {
    placeholder?: string;
    required?: boolean;
    defaultValue?: string;
    options?: string[];
    columns?: string[];
    rows?: string[][];
    showHeader?: boolean;
    columnWidths?: string[];
    src?: string;
    alt?: string;
    uploadedFile?: File;
    aspectRatio?: string;
    condition?: string;
    loopSource?: string;
    cssClasses?: string;
    attributes?: string;
    visibilityRules?: string;
    customCss?: string;
  };
}

// Enhanced field options with categories
const enhancedFieldOptions = [
  // Company Information
  {
    category: 'Company',
    value: '{{company_name}}',
    label: 'Company Name',
    description: 'Your company name',
  },
  {
    category: 'Company',
    value: '{{company_address}}',
    label: 'Company Address',
    description: 'Full company address',
  },
  {
    category: 'Company',
    value: '{{company_phone}}',
    label: 'Company Phone',
    description: 'Primary contact number',
  },
  {
    category: 'Company',
    value: '{{company_email}}',
    label: 'Company Email',
    description: 'Primary email address',
  },

  // Customer Information
  {
    category: 'Customer',
    value: '{{customer_name}}',
    label: 'Customer Name',
    description: 'Customer/client name',
  },
  {
    category: 'Customer',
    value: '{{customer_address}}',
    label: 'Customer Address',
    description: 'Customer address',
  },
  {
    category: 'Customer',
    value: '{{customer_phone}}',
    label: 'Customer Phone',
    description: 'Customer contact number',
  },
  {
    category: 'Customer',
    value: '{{customer_email}}',
    label: 'Customer Email',
    description: 'Customer email address',
  },

  // Quotation Details
  {
    category: 'Quotation',
    value: '{{quotation_number}}',
    label: 'Quotation Number',
    description: 'Unique quotation ID',
  },
  {
    category: 'Quotation',
    value: '{{quotation_date}}',
    label: 'Quotation Date',
    description: 'Date of quotation',
  },
  {
    category: 'Quotation',
    value: '{{quotation_validity}}',
    label: 'Quotation Validity',
    description: 'Valid until date',
  },

  // Financial Information
  {
    category: 'Financial',
    value: '{{subtotal_amount}}',
    label: 'Subtotal Amount',
    description: 'Amount before tax',
  },
  {
    category: 'Financial',
    value: '{{gst_amount}}',
    label: 'GST Amount',
    description: 'Total GST amount',
  },
  {
    category: 'Financial',
    value: '{{total_amount}}',
    label: 'Total Amount',
    description: 'Final total amount',
  },
  {
    category: 'Financial',
    value: '{{total_amount_words}}',
    label: 'Amount in Words',
    description: 'Total amount in words',
  },

  // Calculations
  {
    category: 'Calculations',
    value: '{{working_cost}}',
    label: 'Working Cost',
    description: 'Total working cost',
  },
  {
    category: 'Calculations',
    value: '{{mob_demob_cost}}',
    label: 'Mobilization Cost',
    description: 'Mobilization/demobilization cost',
  },
  {
    category: 'Calculations',
    value: '{{food_accom_cost}}',
    label: 'Food & Accommodation',
    description: 'Food and accommodation cost',
  },
  {
    category: 'Calculations',
    value: '{{number_of_days}}',
    label: 'Number of Days',
    description: 'Total working days',
  },
];

interface EnhancedElementEditorProps {
  element: EnhancedTemplateElement;
  onUpdate: (updates: Partial<EnhancedTemplateElement>) => void;
  onClose: () => void;
}

export default function EnhancedElementEditor({
  element,
  onUpdate,
  onClose,
}: EnhancedElementEditorProps) {
  const [localElement, setLocalElement] = useState(element);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>('content');

  const handleStyleChange = (styleKey: string, value: string) => {
    setLocalElement(prev => ({
      ...prev,
      style: { ...prev.style, [styleKey]: value },
    }));
    setHasChanges(true);
  };

  const handleContentChange = (content: string) => {
    setLocalElement(prev => ({ ...prev, content }));
    setHasChanges(true);
  };

  const handleConfigChange = (configKey: string, value: any) => {
    setLocalElement(prev => ({
      ...prev,
      config: { ...prev.config, [configKey]: value },
    }));
    setHasChanges(true);
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target?.result as string;
      setLocalElement(prev => ({
        ...prev,
        config: { ...prev.config, src, uploadedFile: file },
      }));
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
  };

  const applyChanges = () => {
    onUpdate(localElement);
    setHasChanges(false);
  };

  const resetChanges = () => {
    setLocalElement(element);
    setHasChanges(false);
  };

  return (
    <div className="bg-white shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Edit Element</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Element Type Badge */}
        <div className="mt-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {localElement.type}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'content', label: 'Content' },
          { id: 'style', label: 'Style' },
          { id: 'advanced', label: 'Advanced' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              {localElement.type === 'field' ? (
                <select
                  value={localElement.content}
                  onChange={e => handleContentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select a field...</option>
                  {enhancedFieldOptions.map((field, index) => (
                    <option key={index} value={field.value}>
                      {field.label} - {field.value}
                    </option>
                  ))}
                </select>
              ) : (
                <TextArea
                  value={localElement.content || ''}
                  onChange={e => handleContentChange(e.target.value)}
                  rows={localElement.type === 'terms' ? 10 : 3}
                  className="w-full"
                  placeholder="Enter content..."
                />
              )}
            </div>

            {/* Conditional Content */}
            {localElement.type === 'conditional' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <Input
                  value={localElement.config?.condition || ''}
                  onChange={e => handleConfigChange('condition', e.target.value)}
                  placeholder="e.g., {{total_amount}} > 10000"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Show this content only when condition is true
                </p>
              </div>
            )}

            {/* Loop Configuration */}
            {localElement.type === 'loop' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loop Over</label>
                <select
                  value={localElement.config?.loopSource || ''}
                  onChange={e => handleConfigChange('loopSource', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select data source...</option>
                  <option value="equipment_items">Equipment Items</option>
                  <option value="services">Services</option>
                  <option value="additional_costs">Additional Costs</option>
                </select>
              </div>
            )}

            {/* Image Upload */}
            {localElement.type === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                {localElement.config?.src && (
                  <img
                    src={localElement.config.src}
                    alt="Preview"
                    className="mt-2 max-w-full h-20 object-contain border border-gray-200 rounded"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
            {/* Typography */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Typography</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                  <select
                    value={localElement.style?.fontSize || '14px'}
                    onChange={e => handleStyleChange('fontSize', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="10px">10px</option>
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                    <option value="28px">28px</option>
                    <option value="32px">32px</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Font Weight</label>
                  <select
                    value={localElement.style?.fontWeight || 'normal'}
                    onChange={e => handleStyleChange('fontWeight', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Light</option>
                    <option value="bolder">Extra Bold</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Alignment</h4>
              <div className="flex gap-1">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => handleStyleChange('textAlign', value)}
                    className={`p-2 border rounded ${
                      localElement.style?.textAlign === value
                        ? 'bg-blue-100 border-blue-300'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Colors</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={localElement.style?.color || '#000000'}
                      onChange={e => handleStyleChange('color', e.target.value)}
                      className="w-8 h-8 border border-gray-300 rounded"
                    />
                    <Input
                      value={localElement.style?.color || '#000000'}
                      onChange={e => handleStyleChange('color', e.target.value)}
                      className="flex-1 text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Background</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={localElement.style?.backgroundColor || '#ffffff'}
                      onChange={e => handleStyleChange('backgroundColor', e.target.value)}
                      className="w-8 h-8 border border-gray-300 rounded"
                    />
                    <Input
                      value={localElement.style?.backgroundColor || '#ffffff'}
                      onChange={e => handleStyleChange('backgroundColor', e.target.value)}
                      className="flex-1 text-xs"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Spacing */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Spacing</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Padding</label>
                  <Input
                    value={localElement.style?.padding || '8px'}
                    onChange={e => handleStyleChange('padding', e.target.value)}
                    className="w-full text-xs"
                    placeholder="8px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Margin</label>
                  <Input
                    value={localElement.style?.margin || '4px 0'}
                    onChange={e => handleStyleChange('margin', e.target.value)}
                    className="w-full text-xs"
                    placeholder="4px 0"
                  />
                </div>
              </div>
            </div>

            {/* Borders */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Borders</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Border</label>
                  <Input
                    value={localElement.style?.border || ''}
                    onChange={e => handleStyleChange('border', e.target.value)}
                    className="w-full text-xs"
                    placeholder="1px solid #ddd"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Border Radius</label>
                  <Input
                    value={localElement.style?.borderRadius || ''}
                    onChange={e => handleStyleChange('borderRadius', e.target.value)}
                    className="w-full text-xs"
                    placeholder="4px"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* CSS Classes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
              <Input
                value={localElement.config?.cssClasses || ''}
                onChange={e => handleConfigChange('cssClasses', e.target.value)}
                className="w-full"
                placeholder="custom-class another-class"
              />
              <p className="text-xs text-gray-500 mt-1">Space-separated CSS class names</p>
            </div>

            {/* Custom Attributes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Attributes
              </label>
              <TextArea
                value={localElement.config?.attributes || ''}
                onChange={e => handleConfigChange('attributes', e.target.value)}
                rows={3}
                className="w-full"
                placeholder='{"data-id": "custom-id", "title": "Custom title"}'
              />
              <p className="text-xs text-gray-500 mt-1">JSON object with custom HTML attributes</p>
            </div>

            {/* Visibility Rules */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibility Rules
              </label>
              <TextArea
                value={localElement.config?.visibilityRules || ''}
                onChange={e => handleConfigChange('visibilityRules', e.target.value)}
                rows={2}
                className="w-full"
                placeholder="Show only if: {{field_name}} === 'value'"
              />
              <p className="text-xs text-gray-500 mt-1">
                Conditional visibility based on data values
              </p>
            </div>

            {/* Custom CSS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom CSS</label>
              <TextArea
                value={localElement.config?.customCss || ''}
                onChange={e => handleConfigChange('customCss', e.target.value)}
                rows={4}
                className="w-full font-mono text-xs"
                placeholder="/* Custom CSS styles */
.custom-element {
  transform: rotate(45deg);
  transition: all 0.3s ease;
}"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <Button
            onClick={applyChanges}
            disabled={!hasChanges}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            Apply Changes
          </Button>
          <Button onClick={resetChanges} disabled={!hasChanges} variant="ghost" className="flex-1">
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

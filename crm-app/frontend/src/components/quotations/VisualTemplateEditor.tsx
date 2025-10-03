import React, { useState } from 'react';
import { Template } from '../../types/template';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { 
  Type, 
  Image, 
  Table, 
  Hash,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Move,
  Trash2
} from 'lucide-react';

interface TemplateElement {
  id: string;
  type: 'text' | 'field' | 'table' | 'image' | 'divider' | 'spacer';
  content: string;
  style: {
    fontSize?: string;
    fontWeight?: string;
    fontStyle?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    textDecoration?: string;
    padding?: string;
    margin?: string;
    border?: string;
    width?: string;
    height?: string;
  };
  config?: any;
}

interface VisualTemplateEditorProps {
  template: Template;
  onChange: (template: Template) => void;
}

const ELEMENT_TYPES = [
  { id: 'text', label: 'Text', icon: Type, description: 'Static text content' },
  { id: 'field', label: 'Dynamic Field', icon: Hash, description: 'Customer/quotation data' },
  { id: 'table', label: 'Table', icon: Table, description: 'Tabular data' },
  { id: 'image', label: 'Image', icon: Image, description: 'Logo or graphics' },
  { id: 'divider', label: 'Divider', icon: AlignCenter, description: 'Horizontal line' },
  { id: 'spacer', label: 'Spacer', icon: Move, description: 'Empty space' }
];

const DYNAMIC_FIELDS = [
  { value: '{{customer_name}}', label: 'Customer Name' },
  { value: '{{company_name}}', label: 'Company Name' },
  { value: '{{quotation_number}}', label: 'Quotation Number' },
  { value: '{{quotation_date}}', label: 'Quotation Date' },
  { value: '{{equipment_name}}', label: 'Equipment Name' },
  { value: '{{total_amount}}', label: 'Total Amount' },
  { value: '{{valid_until}}', label: 'Valid Until' },
  { value: '{{project_duration}}', label: 'Project Duration' }
];

export function VisualTemplateEditor({ template, onChange }: VisualTemplateEditorProps) {
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const addElement = (type: TemplateElement['type']) => {
    const newElement: TemplateElement = {
      id: `element-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      style: getDefaultStyle(type),
      config: getDefaultConfig(type)
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    updateTemplate(newElements);
    setSelectedElement(newElement.id);
  };

  const getDefaultContent = (type: TemplateElement['type']): string => {
    switch (type) {
      case 'text': return 'Enter your text here...';
      case 'field': return '{{customer_name}}';
      case 'table': return 'Table content will be generated automatically';
      case 'image': return 'Click to upload image';
      case 'divider': return '';
      case 'spacer': return '';
      default: return '';
    }
  };

  const getDefaultStyle = (type: TemplateElement['type']): TemplateElement['style'] => {
    const baseStyle: TemplateElement['style'] = {
      fontSize: '14px',
      fontWeight: 'normal',
      color: '#000000',
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      padding: '8px',
      margin: '4px 0'
    };

    switch (type) {
      case 'text':
        return { ...baseStyle, fontSize: '16px' };
      case 'field':
        return { ...baseStyle, fontWeight: 'bold', color: '#0066cc' };
      case 'divider':
        return { ...baseStyle, border: '1px solid #cccccc', height: '1px', padding: '0' };
      case 'spacer':
        return { ...baseStyle, height: '20px', backgroundColor: 'transparent' };
      default:
        return baseStyle;
    }
  };

  const getDefaultConfig = (type: TemplateElement['type']) => {
    switch (type) {
      case 'table':
        return {
          columns: ['Description', 'Quantity', 'Rate', 'Amount'],
          showHeader: true,
          borderStyle: 'solid'
        };
      case 'image':
        return {
          width: '200px',
          height: 'auto',
          alt: 'Image'
        };
      default:
        return {};
    }
  };

  const updateElement = (elementId: string, updates: Partial<TemplateElement>) => {
    const newElements = elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    );
    setElements(newElements);
    updateTemplate(newElements);
  };

  const updateElementStyle = (elementId: string, styleUpdates: Partial<TemplateElement['style']>) => {
    updateElement(elementId, {
      style: { ...elements.find(el => el.id === elementId)?.style, ...styleUpdates }
    });
  };

  const deleteElement = (elementId: string) => {
    const newElements = elements.filter(el => el.id !== elementId);
    setElements(newElements);
    updateTemplate(newElements);
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  };

  const moveElement = (elementId: string, direction: 'up' | 'down') => {
    const currentIndex = elements.findIndex(el => el.id === elementId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= elements.length) return;

    const newElements = [...elements];
    [newElements[currentIndex], newElements[newIndex]] = [newElements[newIndex], newElements[currentIndex]];
    
    setElements(newElements);
    updateTemplate(newElements);
  };

  const updateTemplate = (newElements: TemplateElement[]) => {
    const updatedTemplate = {
      ...template,
      elements: newElements,
      content: generateTemplateContent(newElements),
      updatedAt: new Date().toISOString()
    };
    onChange(updatedTemplate);
  };

  const generateTemplateContent = (elements: TemplateElement[]): string => {
    return elements.map(element => {
      const styles = Object.entries(element.style)
        .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
        .join('; ');

      switch (element.type) {
        case 'text':
          return `<div style="${styles}">${element.content}</div>`;
        case 'field':
          return `<div style="${styles}">${element.content}</div>`;
        case 'table':
          return `<table style="${styles}"><tr><th>Table will be generated automatically</th></tr></table>`;
        case 'image':
          return `<img style="${styles}" src="${element.config?.src || 'placeholder'}" alt="${element.config?.alt || 'Image'}" />`;
        case 'divider':
          return `<hr style="${styles}" />`;
        case 'spacer':
          return `<div style="${styles}">&nbsp;</div>`;
        default:
          return '';
      }
    }).join('\n');
  };

  const camelToKebab = (str: string): string => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  };

  const selectedElementData = selectedElement ? elements.find(el => el.id === selectedElement) : null;

  return (
    <div className="flex h-[600px] bg-gray-50 rounded-lg overflow-hidden">
      {/* Element Palette */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Add Elements</h3>
        <div className="space-y-2">
          {ELEMENT_TYPES.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => addElement(type.id as TemplateElement['type'])}
                className="w-full p-3 text-left border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} />
                  <span className="font-medium">{type.label}</span>
                </div>
                <div className="text-xs text-gray-500">{type.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white min-h-[500px] shadow-sm border border-gray-200 rounded p-6">
          {elements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Type size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Start Building Your Template</h3>
              <p>Add elements from the left panel to create your quotation template</p>
            </div>
          ) : (
            <div className="space-y-2">
              {elements.map((element, index) => (
                <div
                  key={element.id}
                  className={`relative group border-2 border-dashed p-2 rounded ${
                    selectedElement === element.id 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedElement(element.id)}
                >
                  {/* Element Content */}
                  <div 
                    style={element.style as React.CSSProperties}
                    className="min-h-[30px] cursor-pointer"
                  >
                    {element.type === 'field' ? (
                      <span className="bg-yellow-100 px-2 py-1 rounded text-sm font-mono">
                        {element.content}
                      </span>
                    ) : element.type === 'table' ? (
                      <div className="border border-gray-300 p-2 bg-gray-50 text-sm">
                        📊 Table: {element.config?.columns?.join(', ') || 'Dynamic table'}
                      </div>
                    ) : element.type === 'image' ? (
                      <div className="border border-gray-300 p-4 bg-gray-50 text-center text-sm">
                        🖼️ Image placeholder
                      </div>
                    ) : element.type === 'divider' ? (
                      <hr className="border-gray-300" />
                    ) : element.type === 'spacer' ? (
                      <div className="bg-gray-100 text-center text-xs py-2 text-gray-500">
                        Spacer ({element.style.height || '20px'})
                      </div>
                    ) : (
                      element.content
                    )}
                  </div>

                  {/* Element Controls */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveElement(element.id, 'up');
                      }}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveElement(element.id, 'down');
                      }}
                      disabled={index === elements.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteElement(element.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Properties</h3>
        
        {selectedElementData ? (
          <div className="space-y-6">
            {/* Content Settings */}
            <div>
              <h4 className="font-medium mb-2">Content</h4>
              {selectedElementData.type === 'text' && (
                <textarea
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  rows={3}
                  value={selectedElementData.content}
                  onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                  placeholder="Enter text content..."
                />
              )}
              {selectedElementData.type === 'field' && (
                <Select
                  value={selectedElementData.content}
                  onChange={(value) => updateElement(selectedElementData.id, { content: value })}
                  options={DYNAMIC_FIELDS}
                />
              )}
            </div>

            {/* Typography */}
            <div>
              <h4 className="font-medium mb-2">Typography</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Font Size"
                    value={parseInt(selectedElementData.style.fontSize || '14')}
                    onChange={(e) => updateElementStyle(selectedElementData.id, { fontSize: `${e.target.value}px` })}
                  />
                  <span className="text-xs text-gray-500 self-center">px</span>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="xs"
                    variant={selectedElementData.style.fontWeight === 'bold' ? 'default' : 'outline'}
                    onClick={() => updateElementStyle(selectedElementData.id, { 
                      fontWeight: selectedElementData.style.fontWeight === 'bold' ? 'normal' : 'bold' 
                    })}
                  >
                    <Bold size={12} />
                  </Button>
                  <Button
                    size="xs"
                    variant={selectedElementData.style.fontStyle === 'italic' ? 'default' : 'outline'}
                    onClick={() => updateElementStyle(selectedElementData.id, { 
                      fontStyle: selectedElementData.style.fontStyle === 'italic' ? 'normal' : 'italic' 
                    })}
                  >
                    <Italic size={12} />
                  </Button>
                  <Button
                    size="xs"
                    variant={selectedElementData.style.textDecoration === 'underline' ? 'default' : 'outline'}
                    onClick={() => updateElementStyle(selectedElementData.id, { 
                      textDecoration: selectedElementData.style.textDecoration === 'underline' ? 'none' : 'underline' 
                    })}
                  >
                    <Underline size={12} />
                  </Button>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="xs"
                    variant={selectedElementData.style.textAlign === 'left' ? 'default' : 'outline'}
                    onClick={() => updateElementStyle(selectedElementData.id, { textAlign: 'left' })}
                  >
                    <AlignLeft size={12} />
                  </Button>
                  <Button
                    size="xs"
                    variant={selectedElementData.style.textAlign === 'center' ? 'default' : 'outline'}
                    onClick={() => updateElementStyle(selectedElementData.id, { textAlign: 'center' })}
                  >
                    <AlignCenter size={12} />
                  </Button>
                  <Button
                    size="xs"
                    variant={selectedElementData.style.textAlign === 'right' ? 'default' : 'outline'}
                    onClick={() => updateElementStyle(selectedElementData.id, { textAlign: 'right' })}
                  >
                    <AlignRight size={12} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <h4 className="font-medium mb-2">Colors</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm w-16">Text:</label>
                  <input
                    type="color"
                    value={selectedElementData.style.color || '#000000'}
                    onChange={(e) => updateElementStyle(selectedElementData.id, { color: e.target.value })}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    value={selectedElementData.style.color || '#000000'}
                    onChange={(e) => updateElementStyle(selectedElementData.id, { color: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm w-16">Background:</label>
                  <input
                    type="color"
                    value={selectedElementData.style.backgroundColor || '#ffffff'}
                    onChange={(e) => updateElementStyle(selectedElementData.id, { backgroundColor: e.target.value })}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    value={selectedElementData.style.backgroundColor || '#ffffff'}
                    onChange={(e) => updateElementStyle(selectedElementData.id, { backgroundColor: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Spacing */}
            <div>
              <h4 className="font-medium mb-2">Spacing</h4>
              <div className="space-y-2">
                <Input
                  label="Padding"
                  value={selectedElementData.style.padding || '8px'}
                  onChange={(e) => updateElementStyle(selectedElementData.id, { padding: e.target.value })}
                  placeholder="8px"
                />
                <Input
                  label="Margin"
                  value={selectedElementData.style.margin || '4px 0'}
                  onChange={(e) => updateElementStyle(selectedElementData.id, { margin: e.target.value })}
                  placeholder="4px 0"
                />
              </div>
            </div>

            {/* Element-specific settings */}
            {selectedElementData.type === 'spacer' && (
              <div>
                <h4 className="font-medium mb-2">Spacer Settings</h4>
                <Input
                  label="Height"
                  value={selectedElementData.style.height || '20px'}
                  onChange={(e) => updateElementStyle(selectedElementData.id, { height: e.target.value })}
                  placeholder="20px"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">
            Select an element to edit its properties
          </div>
        )}
      </div>
    </div>
  );
}
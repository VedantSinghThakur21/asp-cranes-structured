/**
 * Template Preview Modal - Shows live preview of template with sample data
 */

import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import { Button } from '../common/Button';
import { EnhancedTemplateElement } from './ModernTemplateBuilder';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: EnhancedTemplateElement[];
  templateName?: string;
}

// Sample data for preview
const sampleData = {
  company_name: 'ASP Cranes & Heavy Equipment Pvt. Ltd.',
  company_address: '123 Industrial Area, Mumbai, Maharashtra 400001',
  customer_name: 'ABC Construction Pvt. Ltd.',
  customer_address: '456 Project Site, Pune, Maharashtra 411001',
  quotation_number: 'QT-2025-001',
  quotation_date: new Date().toLocaleDateString('en-IN'),
  total_amount: '₹7,85,000',
};

export default function TemplatePreviewModal({
  isOpen,
  onClose,
  elements,
  templateName = 'Template Preview',
}: TemplatePreviewModalProps) {
  console.log('🖥️ TemplatePreviewModal render:', {
    isOpen,
    elementsCount: elements?.length,
    templateName,
  });
  console.log(
    '📊 Elements to preview:',
    elements?.map(el => ({ id: el.id, type: el.type }))
  );

  if (!isOpen) return null;

  const replacePlaceholders = (text: string): string => {
    let result = text;
    Object.entries(sampleData).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  };

  const renderPreviewElement = (element: EnhancedTemplateElement, index: number) => {
    const elementStyle = {
      fontSize: element.style?.fontSize || '14px',
      fontWeight: element.style?.fontWeight || 'normal',
      color: element.style?.color || '#000000',
      backgroundColor: element.style?.backgroundColor || 'transparent',
      padding: element.style?.padding || '8px',
      margin: element.style?.margin || '0px',
      textAlign: element.style?.textAlign || 'left',
    } as React.CSSProperties;

    switch (element.type) {
      case 'header':
        return (
          <div key={index} className="text-center p-6 bg-blue-50 border-b-2 border-blue-200">
            <h1 className="text-3xl font-bold" style={elementStyle}>
              {replacePlaceholders(element.content || 'Company Header')}
            </h1>
          </div>
        );

      case 'text':
        return (
          <div key={index} style={elementStyle} className="mb-4">
            {replacePlaceholders(element.content || 'Text content')}
          </div>
        );

      case 'field':
        return (
          <div key={index} style={elementStyle} className="mb-2">
            <strong>{replacePlaceholders(element.content || '{{field_name}}')}</strong>
          </div>
        );

      case 'table':
        return (
          <div key={index} className="mb-6 overflow-hidden rounded-lg border border-gray-300">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 p-3 text-left font-semibold">Equipment</th>
                  <th className="border border-gray-300 p-3 text-left font-semibold">Capacity</th>
                  <th className="border border-gray-300 p-3 text-left font-semibold">Duration</th>
                  <th className="border border-gray-300 p-3 text-left font-semibold">Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-3">Mobile Crane</td>
                  <td className="border border-gray-300 p-3">100MT</td>
                  <td className="border border-gray-300 p-3">1 Month</td>
                  <td className="border border-gray-300 p-3">₹7,85,000</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 p-3">Operator Services</td>
                  <td className="border border-gray-300 p-3">Certified</td>
                  <td className="border border-gray-300 p-3">1 Month</td>
                  <td className="border border-gray-300 p-3">₹45,000</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-3 font-semibold" colSpan={3}>
                    Total
                  </td>
                  <td className="border border-gray-300 p-3 font-semibold">₹8,30,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'image':
        return (
          <div key={index} className="mb-4 text-center">
            <div className="border-2 border-dashed border-gray-300 rounded p-6 bg-gray-50">
              <div className="text-gray-500">📷 {element.content || 'Company Logo'}</div>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div
            key={index}
            className="mb-6 bg-gray-50 border border-gray-200 rounded p-4"
            style={elementStyle}
          >
            <h3 className="font-semibold mb-3 text-lg">Terms & Conditions</h3>
            <div className="text-sm leading-relaxed">
              {element.content ? (
                replacePlaceholders(element.content)
              ) : (
                <div className="space-y-2">
                  <p>1. Payment terms: 30% advance, 70% on delivery</p>
                  <p>2. Delivery timeline: 15-20 business days</p>
                  <p>3. Warranty: 12 months comprehensive warranty</p>
                  <p>4. Installation and commissioning included</p>
                  <p>5. All prices are exclusive of GST</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'spacer':
        const spacerHeight = element.content || '20px';
        return <div key={index} style={{ height: spacerHeight }} className="mb-2" />;

      default:
        return <div key={index}>Unknown element type</div>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // For now, we'll just show an alert. In a real implementation,
    // you might generate a PDF using libraries like jsPDF or html2pdf
    alert('Download functionality would generate a PDF here');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Template Preview</h2>
            <p className="text-sm text-gray-600">{templateName}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Download PDF
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer size={16} />
              Print
            </Button>

            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Modal Content - Preview Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Document Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg">
              <h1 className="text-2xl font-bold">QUOTATION</h1>
              <p className="text-blue-100">Professional Equipment Rental Services</p>
            </div>

            {/* Document Body */}
            <div className="p-6">
              {elements.length > 0 ? (
                elements.map((element, index) => renderPreviewElement(element, index))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No elements to preview</p>
                  <p className="text-sm">Add elements to your template to see the preview</p>
                </div>
              )}
            </div>

            {/* Document Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg">
              <div className="text-center text-sm text-gray-600">
                <p>Generated by ASP Cranes CRM System</p>
                <p>
                  Date: {new Date().toLocaleDateString('en-IN')} | Quotation:{' '}
                  {sampleData.quotation_number}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

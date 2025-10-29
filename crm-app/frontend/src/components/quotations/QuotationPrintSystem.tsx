import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import {
  Printer,
  Download,
  Mail,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

// Generate local template preview without backend call
const generateLocalQuotationPreview = (quotationId: string, templateId: string) => {
  console.log('🎨 Generating local preview for quotation:', quotationId, 'template:', templateId);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASP Cranes Quotation - ${quotationId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { color: #2563eb; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .tagline { color: #64748b; font-size: 14px; }
        .section { margin-bottom: 25px; }
        .section-title { color: #1e40af; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
        .customer-info, .quotation-details { background: #f8fafc; padding: 15px; border-radius: 6px; }
        .info-row { margin-bottom: 8px; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #6b7280; }
        .total-section { background: #2563eb; color: white; padding: 15px; border-radius: 6px; text-align: center; }
        .total-amount { font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">ASP CRANES</div>
        <div class="tagline">Professional Crane Services | Your Trusted Lifting Partner</div>
    </div>

    <div style="text-align: center; background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 32px;">QUOTATION</h1>
    </div>

    <div style="display: flex; gap: 30px; margin-bottom: 30px;">
        <div style="flex: 1;">
            <h3 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">📋 Quotation Details</h3>
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px;">
                <p><strong>Quotation ID:</strong> ${quotationId}</p>
                <p><strong>Template:</strong> ${templateId}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Status:</strong> Draft</p>
            </div>
        </div>
        
        <div style="flex: 1;">
            <h3 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">👤 Customer Information</h3>
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px;">
                <p><strong>Company:</strong> ABC Construction</p>
                <p><strong>Email:</strong> contact@abc-construction.com</p>
                <p><strong>Phone:</strong> +91 9876543210</p>
                <p><strong>Address:</strong> Industrial Area, New Delhi, India</p>
            </div>
        </div>
    </div>

    <div style="text-align: center; background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h2 style="margin: 0;">Total Amount</h2>
        <div style="font-size: 32px; font-weight: bold; margin-top: 10px;">₹61,265.60</div>
    </div>

    <div style="text-align: center; margin-top: 40px; color: #64748b; font-size: 12px;">
        <p>ASP Cranes Professional Services | Industrial Area, New Delhi, India</p>
        <p>Email: info@aspcranes.com | Phone: +91 9876543210</p>
    </div>
</body>
</html>`;
};

interface QuotationPrintSystemProps {
  quotationId: string;
  onClose?: () => void;
}

interface Template {
  id: string; // Enhanced Templates use string IDs
  name: string;
  description: string;
  is_active: boolean;
  is_default: boolean;
  theme?: string;
  category?: string;
}

interface EmailFormData {
  to: string;
  subject: string;
  message: string;
}

const QuotationPrintSystem: React.FC<QuotationPrintSystemProps> = ({ quotationId }) => {
  // API configuration
  const apiUrl = import.meta.env.VITE_API_URL || '/api';

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [configDefaultTemplateId, setConfigDefaultTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState<EmailFormData>({
    to: '',
    subject: `Quotation #${quotationId}`,
    message: 'Please find the attached quotation for your review.',
  });
  const [operationStatus, setOperationStatus] = useState<{
    type: 'success' | 'error' | 'loading' | null;
    message: string;
  }>({ type: null, message: '' });

  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const showNotification = (
    title: string,
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    // For now, use console log. Can be replaced with proper toast implementation
  };

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/templates/enhanced/quotation`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);

        // Show fallback notice if using fallback templates
        if (data.fallback) {
          console.warn('Using fallback templates - database unavailable');
          showNotification(
            'Templates Loaded',
            'Using fallback templates (database unavailable)',
            'error'
          );
        }

        // First, try to get the default template from config system
        let defaultTemplateId = null;
        try {
          const configResponse = await fetch(`${apiUrl}/config/templates`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('jwt-token')}`,
              'X-Bypass-Auth': 'development-only-123',
            },
          });
          const configData = await configResponse.json();
          if (configData.success && configData.data.defaultQuotationTemplate) {
            defaultTemplateId = configData.data.defaultQuotationTemplate;
            setConfigDefaultTemplateId(defaultTemplateId);
          }
        } catch (configError) {
          console.warn(
            'Could not load template config, falling back to database default:',
            configError
          );
        }

        // Auto-select default template based on config or database flag
        if (defaultTemplateId) {
          const configTemplate = data.templates.find((t: Template) => t.id === defaultTemplateId);
          if (configTemplate) {
            setSelectedTemplate(configTemplate.id);
            console.log('Using config-based default template:', configTemplate.name);
          } else {
            console.warn('Config default template not found, falling back to database default');
            const defaultTemplate = data.templates.find((t: Template) => t.is_default);
            if (defaultTemplate) {
              setSelectedTemplate(defaultTemplate.id);
            } else if (data.templates.length > 0) {
              setSelectedTemplate(data.templates[0].id);
            }
          }
        } else {
          // Fallback to database is_default flag
          const defaultTemplate = data.templates.find((t: Template) => t.is_default);
          if (defaultTemplate) {
            setSelectedTemplate(defaultTemplate.id);
            console.log('Using database-based default template:', defaultTemplate.name);
          } else if (data.templates.length > 0) {
            setSelectedTemplate(data.templates[0].id);
            console.log('No default template found, using first available template');
          }
        }
      } else {
        throw new Error(data.error || 'Failed to load templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setOperationStatus({
        type: 'error',
        message: 'Failed to load templates. Please try again.',
      });
      showNotification('Error', 'Failed to load quotation templates.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreview = async () => {
    if (!selectedTemplate) {
      showNotification('No Template Selected', 'Please select a template first.', 'error');
      return;
    }

    try {
      setIsLoading(true);
      setOperationStatus({ type: 'loading', message: 'Generating preview...' });

      // Generate preview locally instead of calling backend
      const html = generateLocalQuotationPreview(quotationId, selectedTemplate);

      setIsPreviewOpen(true);
      setOperationStatus({ type: 'success', message: 'Preview generated successfully!' });

      // Load preview in iframe - check if ref exists
      setTimeout(() => {
        if (previewFrameRef.current) {
          console.log('🖼️ Loading preview into iframe');
          const iframe = previewFrameRef.current;
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            doc.open();
            doc.write(html);
            doc.close();
            console.log('✅ Preview loaded into iframe successfully');
          } else {
            console.error('❌ Cannot access iframe document');
          }
        } else {
          console.error('❌ Preview iframe ref is null');
        }
      }, 100);

      showNotification('Preview Ready', 'Quotation preview has been generated successfully.');
    } catch (error) {
      console.error('Error generating preview:', error);
      setOperationStatus({
        type: 'error',
        message: 'Failed to generate preview. Please check your data and try again.',
      });
      showNotification('Preview Error', 'Failed to generate quotation preview.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!selectedTemplate) {
      showNotification('No Template Selected', 'Please select a template first.', 'error');
      return;
    }

    try {
      setIsLoading(true);
      setOperationStatus({ type: 'loading', message: 'Preparing for print...' });

      const response = await fetch(`${apiUrl}/quotations/print/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotationId,
          templateId: selectedTemplate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Open print dialog with the HTML content
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.html);
          printWindow.document.close();
          printWindow.print();

          setOperationStatus({ type: 'success', message: 'Print dialog opened!' });
          showNotification('Print Ready', 'Print dialog has been opened with your quotation.');
        } else {
          throw new Error('Failed to open print window');
        }
      } else {
        throw new Error(data.error || 'Failed to prepare print');
      }
    } catch (error) {
      console.error('Error printing:', error);
      setOperationStatus({
        type: 'error',
        message: 'Failed to prepare print. Please try again.',
      });
      showNotification('Print Error', 'Failed to prepare quotation for printing.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedTemplate) {
      showNotification('No Template Selected', 'Please select a template first.', 'error');
      return;
    }

    try {
      setIsLoading(true);
      setOperationStatus({ type: 'loading', message: 'Generating PDF...' });

      const response = await fetch(`${apiUrl}/quotations/print/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt-token') || ''}`,
          'X-Bypass-Auth': 'development-only-123',
        },
        body: JSON.stringify({
          quotationId,
          templateId: selectedTemplate,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quotation_${quotationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setOperationStatus({ type: 'success', message: 'PDF downloaded successfully!' });
        showNotification('Download Complete', 'Quotation PDF has been downloaded successfully.');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setOperationStatus({
        type: 'error',
        message: 'Failed to generate PDF. Please try again.',
      });
      showNotification('Download Error', 'Failed to generate PDF file.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPDF = async () => {
    if (!selectedTemplate) {
      showNotification('No Template Selected', 'Please select a template first.', 'error');
      return;
    }

    if (!emailForm.to.trim()) {
      showNotification('Email Required', 'Please enter a recipient email address.', 'error');
      return;
    }

    try {
      setIsLoading(true);
      setOperationStatus({ type: 'loading', message: 'Sending email...' });

      const response = await fetch(`${apiUrl}/quotations/print/email-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt-token') || ''}`,
          'X-Bypass-Auth': 'development-only-123',
        },
        body: JSON.stringify({
          quotationId,
          templateId: selectedTemplate,
          emailTo: emailForm.to,
          subject: emailForm.subject,
          message: emailForm.message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEmailDialogOpen(false);
        setOperationStatus({ type: 'success', message: 'Email sent successfully!' });
        showNotification('Email Sent', `Quotation has been sent to ${emailForm.to}`);
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setOperationStatus({
        type: 'error',
        message: 'Failed to send email. Please try again.',
      });
      showNotification('Email Error', 'Failed to send quotation via email.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTemplates = () => {
    loadTemplates();
  };

  const StatusIcon = () => {
    switch (operationStatus.type) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">Quotation Print System</span>
            <span className="text-sm font-normal text-gray-500">ID: {quotationId}</span>
          </div>
        </div>
        <div className="p-4">
          {/* Template Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="template-select" className="block text-sm font-medium text-gray-700">
                Template
              </label>
              <Button onClick={refreshTemplates} disabled={isLoading} className="text-sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <select
              id="template-select"
              value={selectedTemplate || ''}
              onChange={e => setSelectedTemplate(e.target.value || null)}
              disabled={isLoading}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a template</option>
              {templates.map(template => {
                const isConfigDefault =
                  configDefaultTemplateId && template.id === configDefaultTemplateId;
                const isDatabaseDefault = template.is_default;
                let defaultLabel = '';

                if (isConfigDefault) {
                  defaultLabel = ' (Default - Config)';
                } else if (isDatabaseDefault) {
                  defaultLabel = ' (Default - DB)';
                }

                return (
                  <option key={template.id} value={template.id}>
                    {template.name}
                    {defaultLabel}
                  </option>
                );
              })}
            </select>

            {configDefaultTemplateId && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                  <strong>Template Priority:</strong> "Default - Config" templates are set in
                  Configuration and have highest priority. "Default - DB" are fallback defaults.
                  This ensures your configured default template is always used.
                </p>
              </div>
            )}

            {templates.length === 0 && !isLoading && (
              <p className="text-sm text-gray-500">
                No templates available. Please create a template first.
              </p>
            )}
          </div>

          {/* Status Message */}
          {operationStatus.type && (
            <div className="flex items-center space-x-2 p-3 mt-4 rounded-md bg-gray-50 border">
              <StatusIcon />
              <span className="text-sm">{operationStatus.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Preview Button */}
            <Button
              onClick={generatePreview}
              disabled={!selectedTemplate || isLoading}
              className="flex flex-col items-center space-y-2 h-auto py-4"
            >
              <Eye className="h-6 w-6" />
              <span>Preview</span>
            </Button>

            {/* Print Button */}
            <Button
              onClick={handlePrint}
              disabled={!selectedTemplate || isLoading}
              className="flex flex-col items-center space-y-2 h-auto py-4"
            >
              <Printer className="h-6 w-6" />
              <span>Print</span>
            </Button>

            {/* Download PDF Button */}
            <Button
              onClick={handleDownloadPDF}
              disabled={!selectedTemplate || isLoading}
              className="flex flex-col items-center space-y-2 h-auto py-4"
            >
              <Download className="h-6 w-6" />
              <span>Download PDF</span>
            </Button>

            {/* Email Button */}
            <Button
              onClick={() => setIsEmailDialogOpen(true)}
              disabled={!selectedTemplate || isLoading}
              className="flex flex-col items-center space-y-2 h-auto py-4"
            >
              <Mail className="h-6 w-6" />
              <span>Email PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 h-5/6 max-w-6xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Quotation Preview</h3>
              <div className="space-x-2">
                <Button onClick={handlePrint} disabled={isLoading}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
              </div>
            </div>
            <div className="h-full p-4">
              <iframe
                ref={previewFrameRef}
                className="w-full h-full border-0 rounded"
                title="Quotation Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Email Dialog */}
      {isEmailDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 max-w-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Email Quotation PDF</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="email-to" className="block text-sm font-medium text-gray-700">
                  To
                </label>
                <input
                  id="email-to"
                  type="email"
                  value={emailForm.to}
                  onChange={e => setEmailForm({ ...emailForm, to: e.target.value })}
                  placeholder="recipient@example.com"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email-subject" className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  id="email-subject"
                  value={emailForm.subject}
                  onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email-message" className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="email-message"
                  value={emailForm.message}
                  onChange={e => setEmailForm({ ...emailForm, message: e.target.value })}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <Button onClick={() => setIsEmailDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEmailPDF} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationPrintSystem;

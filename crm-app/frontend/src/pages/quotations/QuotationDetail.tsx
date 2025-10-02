import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Edit, FileText, Settings, Eye, Printer, Download } from 'lucide-react';
interface Quotation {
  id: string;
  quotation_number?: string; // Add human-readable quotation number
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  machine_type: string;
  order_type: string;
  number_of_days: number;
  working_hours: number;
  status: string;
  total_cost: number;
  total_rent?: number;
  working_cost?: number;
  mob_demob_cost?: number;
  food_accom_cost?: number;
  usage_load_factor?: number;
  risk_adjustment?: number;
  risk_usage_total?: number;
  gst_amount?: number;
  created_at: string;
}

const QuotationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  
  // Ref for the preview iframe
  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (id) {
      fetchQuotation(id);
      loadAvailableTemplates();
    }
  }, [id]);

  const loadAvailableTemplates = async () => {
    try {
      const response = await fetch('/api/templates/enhanced/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Bypass-Auth': 'development-only-123'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableTemplates([
          { id: 'default', name: 'Default Template', description: 'Standard ASP Cranes template' },
          ...(data.data || []).map((template: any) => ({
            id: template.id,
            name: template.name,
            description: template.description || 'Enhanced template'
          }))
        ]);
      } else {
        // If templates endpoint fails, just use default
        setAvailableTemplates([
          { id: 'default', name: 'Default Template', description: 'Standard ASP Cranes template' }
        ]);
      }
    } catch (error) {
      console.warn('Could not load templates, using default:', error);
      setAvailableTemplates([
        { id: 'default', name: 'Default Template', description: 'Standard ASP Cranes template' }
      ]);
    }
  };

  const fetchQuotation = async (quotationId: string) => {
    try {
      console.log('📋 Fetching quotation with ID:', quotationId);
      setIsLoading(true);
      const response = await fetch(`/api/quotations/${quotationId}`, {
        headers: {
          'X-Bypass-Auth': 'development-only-123'
        }
      });
      console.log('📋 Quotation API response status:', response.status);
      const data = await response.json();
      console.log('📋 Quotation API response data:', data);

      if (data.success) {
        console.log('✅ Quotation loaded successfully:', data.data.id);
        // Map API response fields to match interface
        const mappedQuotation = {
          ...data.data,
          quotation_number: data.data.quotationNumber || data.data.quotation_number,
          customer_name: data.data.customerName || data.data.customer_name,
          customer_email: data.data.customerEmail || data.data.customer_email,
          customer_phone: data.data.customerPhone || data.data.customer_phone,
          machine_type: data.data.machineType || data.data.machine_type,
          order_type: data.data.orderType || data.data.order_type,
          number_of_days: data.data.numberOfDays || data.data.number_of_days,
          working_hours: data.data.workingHours || data.data.working_hours,
          total_cost: data.data.totalCost || data.data.total_cost,
          created_at: data.data.createdAt || data.data.created_at
        };
        console.log('📋 Mapped quotation data:', mappedQuotation);
        setQuotation(mappedQuotation);
      } else {
        console.error('❌ Quotation API error:', data.error);
        setError(data.error || 'Failed to fetch quotation');
      }
    } catch (error) {
      console.error('💥 Error fetching quotation:', error);
      setError('Failed to fetch quotation');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    console.log('🚀 Preview button clicked!');
    console.log('🚀 Current state - isPreviewOpen:', isPreviewOpen);
    console.log('🚀 Current quotation:', quotation ? quotation.id : 'null');
    console.log('🚀 Iframe ref exists:', !!previewFrameRef.current);
    
    // Toggle preview state
    const newPreviewState = !isPreviewOpen;
    console.log('🎨 Preview state changing from', isPreviewOpen, 'to', newPreviewState);
    setIsPreviewOpen(newPreviewState);
    
    // If opening preview, load it from backend after iframe is rendered
    if (newPreviewState && quotation) {
      console.log('🎨 Loading preview from backend for quotation:', quotation.id);
      console.log('🎨 Using template:', selectedTemplate);
      
      // Wait for iframe to be rendered before setting src
      setTimeout(() => {
        if (previewFrameRef.current) {
          // Clear any existing content first
          previewFrameRef.current.src = 'about:blank';
          
          // Then load the template after a brief delay
          setTimeout(() => {
            if (previewFrameRef.current) {
              // Build iframe src with correct query delimiter logic
              const base = `/api/quotations-preview/${quotation.id}/preview/iframe`;
              const params = new URLSearchParams();
              if (selectedTemplate && selectedTemplate !== 'default') {
                params.set('templateId', selectedTemplate);
              }
              params.set('t', Date.now().toString()); // cache buster
              const iframeSrc = `${base}?${params.toString()}`;
              console.log('🎨 Setting iframe src:', iframeSrc);
              previewFrameRef.current.src = iframeSrc;
            }
          }, 50);
        } else {
          console.warn('⚠️ Iframe ref still not available after timeout');
        }
      }, 100);
    } else if (newPreviewState) {
      console.warn('⚠️ Cannot load preview - quotation missing');
      console.warn('⚠️ Quotation exists:', !!quotation);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    console.log('🔄 Template changed to:', templateId);
    setSelectedTemplate(templateId);
    
    // If preview is open, refresh it with new template
    if (isPreviewOpen && quotation && previewFrameRef.current) {
      console.log('🔄 Refreshing preview with template:', templateId);
      setIsTemplateLoading(true);
      
      // Clear iframe content first to prevent overlapping
      previewFrameRef.current.src = 'about:blank';
      
      // Small delay to ensure clearing happens, then load new template
      setTimeout(() => {
        if (previewFrameRef.current) {
          const base = `/api/quotations-preview/${quotation.id}/preview/iframe`;
          const params = new URLSearchParams();
          if (templateId && templateId !== 'default') params.set('templateId', templateId);
          params.set('t', Date.now().toString());
          const newSrc = `${base}?${params.toString()}`;
          console.log('🎨 Loading new template URL:', newSrc);
          previewFrameRef.current.src = newSrc;
          
          // Reset loading state after iframe loads (approximate)
          setTimeout(() => setIsTemplateLoading(false), 2000);
        }
      }, 100);
    }
  };

  const handlePrint = () => {
    if (id) {
      // Open the iframe preview route in a new tab for printing with selected template
      const base = `/api/quotations-preview/${id}/preview/iframe`;
      const params = new URLSearchParams();
      if (selectedTemplate && selectedTemplate !== 'default') params.set('templateId', selectedTemplate);
      window.open(`${base}?${params.toString()}`, '_blank');
    }
  };

  const handleDownload = async () => {
    try {
      if (!id) return;
      
      // Use the correct endpoint for PDF generation with selected template
      const response = await fetch(`/api/quotations/print/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bypass-Auth': 'development-only-123'
        },
        body: JSON.stringify({ 
          quotationId: id,
          templateId: selectedTemplate || undefined // Use selected template if available
        })
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/pdf')) {
          // Handle PDF response
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `quotation_${id}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          // Handle HTML fallback (when PDF generation fails)
          const html = await response.text();
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.print();
          } else {
            alert('Please allow popups to download/print the quotation');
          }
        }
      } else {
        const error = await response.text();
        throw new Error(`Failed to download PDF: ${error}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to download PDF: ${errorMessage}`);
    }
  };

  const formatCurrency = (amount?: number) => {
    const safe = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(safe);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      if (!id) return;
      
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Bypass-Auth': 'development-only-123'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setQuotation(prev => prev ? { ...prev, status: newStatus } : null);
        alert(`Quotation status updated to ${newStatus}`);
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update quotation status. Please try again.');
    }
  };

  const handleCreateDeal = () => {
    if (!quotation) return;
    
    // Navigate to deal creation with quotation data
    navigate('/deals/create', {
      state: {
        quotation: quotation,
        customer: {
          name: quotation.customer_name,
          email: quotation.customer_email,
          phone: quotation.customer_phone
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-6">
        <div className="flex items-center">
          <div className="text-red-800">
            <h3 className="font-semibold">Error</h3>
            <p className="mt-2">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={() => navigate('/quotations')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotations
          </Button>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 m-6">
        <div className="text-yellow-800">
          <h3 className="font-semibold">Quotation Not Found</h3>
          <p className="mt-2">The requested quotation could not be found.</p>
        </div>
        <div className="mt-4">
          <Button onClick={() => navigate('/quotations')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => navigate('/quotations')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {quotation.quotation_number ? `Quotation ${quotation.quotation_number}` : `Quotation #${quotation.id}`}
                </h1>
                <p className="text-gray-600">
                  Created on {formatDate(quotation.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                quotation.status === 'approved' ? 'bg-green-100 text-green-800' :
                quotation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
              </span>
              <Button onClick={() => navigate(`/quotation-creation?edit=${quotation.id}`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quotation Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Quotation Summary
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <div className="mt-1">
                    <p className="text-sm text-gray-900 font-medium">{quotation.customer_name}</p>
                    {quotation.customer_email && (
                      <p className="text-sm text-gray-600">{quotation.customer_email}</p>
                    )}
                    {quotation.customer_phone && (
                      <p className="text-sm text-gray-600">{quotation.customer_phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Machine Type</label>
                    <p className="mt-1 text-sm text-gray-900">{quotation.machine_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order Type</label>
                    <p className="mt-1 text-sm text-gray-900">{quotation.order_type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <p className="mt-1 text-sm text-gray-900">{quotation.number_of_days} days</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Working Hours</label>
                    <p className="mt-1 text-sm text-gray-900">{quotation.working_hours} hours/day</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Subtotal (Rent)</span>
                      <span className="font-medium">{formatCurrency(quotation.total_rent)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Working Cost</span>
                      <span className="font-medium">{formatCurrency(quotation.working_cost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Mob/Demob Cost</span>
                      <span className="font-medium">{formatCurrency(quotation.mob_demob_cost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Food & Accom Cost</span>
                      <span className="font-medium">{formatCurrency(quotation.food_accom_cost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Risk Adj.</span>
                      <span className="font-medium">{formatCurrency(quotation.risk_adjustment)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Usage Load Factor</span>
                      <span className="font-medium">{formatCurrency(quotation.usage_load_factor)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Risk & Usage Total</span>
                      <span className="font-medium">{formatCurrency(quotation.risk_usage_total)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">GST</span>
                      <span className="font-medium">{formatCurrency(quotation.gst_amount)}</span>
                    </div>
                    <div className="flex items-center justify-between col-span-2 pt-2 mt-2 border-t">
                      <span className="text-gray-900 font-semibold">Total Cost</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(quotation.total_cost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Management Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Status Management
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    quotation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    quotation.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {quotation.status === 'draft' && (
                      <Button 
                        onClick={() => handleStatusChange('sent')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Send to Customer
                      </Button>
                    )}
                    {quotation.status === 'sent' && (
                      <>
                        <Button 
                          onClick={() => handleStatusChange('accepted')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          Mark Accepted
                        </Button>
                        <Button 
                          onClick={() => handleStatusChange('rejected')}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
                          Mark Rejected
                        </Button>
                      </>
                    )}
                    {(quotation.status === 'accepted' || quotation.status === 'rejected') && (
                      <Button 
                        onClick={() => handleStatusChange('draft')}
                        variant="outline"
                        size="sm"
                      >
                        Reset to Draft
                      </Button>
                    )}
                  </div>
                </div>
                
                {quotation.status === 'accepted' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700">
                      ✅ This quotation has been accepted. Consider creating a deal from this quotation.
                    </p>
                    <Button 
                      onClick={() => handleCreateDeal()}
                      className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      Create Deal
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Print System */}
          <div className="lg:col-span-2">
            {/* Preview Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Quotation Preview
                </h2>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handlePreview}
                    size="sm"
                    className={`$${''} ${isPreviewOpen ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isPreviewOpen ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                  <Button
                    onClick={handlePrint}
                    size="sm"
                    className="bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    onClick={handleDownload}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
              
              {/* Template Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {availableTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {availableTemplates.find(t => t.id === selectedTemplate)?.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {availableTemplates.find(t => t.id === selectedTemplate)?.description}
                  </p>
                )}
              </div>
              
              {isPreviewOpen ? (
                <div className="border rounded-lg overflow-hidden relative">
                  {isTemplateLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading template...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    ref={previewFrameRef}
                    className="w-full h-96 border-0"
                    title="Quotation Preview"
                    onLoad={() => {
                      console.log('📱 Iframe finished loading');
                      setIsTemplateLoading(false);
                    }}
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center bg-gray-50">
                  <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Not Active</h3>
                  <p className="text-gray-500">Click "Show Preview" to view the quotation preview.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              onClick={handlePreview}
              className={`flex items-center justify-center space-x-2 ${isPreviewOpen ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'}`}
            >
              <Eye className="h-4 w-4" />
              <span>{isPreviewOpen ? 'Hide Preview' : 'Show Preview'}</span>
            </Button>
            <Button
              onClick={handlePrint}
              className="flex items-center justify-center space-x-2 bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </Button>
            <Button
              onClick={handleDownload}
              className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </Button>
            <Button 
              onClick={() => navigate(`/quotation-creation?edit=${quotation.id}`)}
              className="flex items-center justify-center space-x-2"
              variant="outline"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Quotation</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationDetail;

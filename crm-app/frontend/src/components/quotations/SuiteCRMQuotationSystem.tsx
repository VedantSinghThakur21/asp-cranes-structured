import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  Mail,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  X,
} from 'lucide-react';

interface SuiteCRMQuotationSystemProps {
  quotationId: string;
  quotationData: any;
  onClose: () => void;
}

const SuiteCRMQuotationSystem: React.FC<SuiteCRMQuotationSystemProps> = ({
  quotationId,
  quotationData,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: 'success' | 'error' | 'info';
      message: string;
    }>
  >([]);

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      if (!quotationData) {
        console.error('No quotation data available');
        setNotifications(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'error',
            message: 'No quotation data available',
          },
        ]);
        return;
      }

      // Simple preview - just log the data or show in console
      console.log('Quotation data:', quotationData);

      setNotifications(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'success',
          message: 'Preview functionality ready',
        },
      ]);
    } catch (error) {
      console.error('Error generating preview:', error);
      setNotifications(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'error',
          message: 'Error generating preview',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate preview on mount
  useEffect(() => {
    if (quotationData) {
      handlePreview();
    }
  }, [quotationData]);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(0, -1));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  return (
    <div className="suite-crm-quotation-system bg-gray-50 min-h-screen">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`
              flex items-center p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300
              ${notification.type === 'success' ? 'bg-green-500 text-white' : ''}
              ${notification.type === 'error' ? 'bg-red-500 text-white' : ''}
              ${notification.type === 'info' ? 'bg-blue-500 text-white' : ''}
            `}
          >
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
            {notification.type === 'info' && <FileText className="w-5 h-5 mr-2" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Quotation #{quotationId}</h1>
              </div>
              {quotationData?.status && (
                <span
                  className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  ${quotationData.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                  ${quotationData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${quotationData.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                `}
                >
                  {quotationData.status.charAt(0).toUpperCase() + quotationData.status.slice(1)}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handlePreview}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                <span>Preview</span>
              </button>

              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>

              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </button>

              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Quotation System</h3>
              <p className="text-gray-500">Click "Preview" to view the quotation details.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuiteCRMQuotationSystem;

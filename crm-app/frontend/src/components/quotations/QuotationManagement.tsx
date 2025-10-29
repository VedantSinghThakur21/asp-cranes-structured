import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  MoreVertical,
  Calendar,
  Phone,
  Wrench,
  Clock,
  DollarSign,
  Download,
  Printer,
  Mail,
  FileText,
} from 'lucide-react';

interface QuotationListItem {
  id: string;
  quotation_number?: string; // Add human-readable quotation number
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  machine_type: string;
  order_type: string;
  number_of_days: number;
  working_hours: number;
  total_cost: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  site_distance?: number;
  usage?: string;
  shift?: string;
  food_resources?: string;
  accom_resources?: string;
  risk_factor?: string;
  mob_demob_cost?: number;
  working_cost?: number;
  food_accom_cost?: number;
  gst_amount?: number;
  total_rent?: number;
}

const QuotationManagementComplete: React.FC = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch quotations from database
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/quotations');

      if (!response.ok) {
        throw new Error(`Failed to fetch quotations: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Transform API data to match our interface
        const transformedQuotations: QuotationListItem[] = result.data.map((item: any) => ({
          id: item.id || item.quotationId,
          quotation_number: item.quotation_number || item.quotationNumber, // Handle both field names
          customer_name: item.customerName || item.customer_name || 'Unknown Customer',
          customer_email: item.customerEmail || item.customer_email,
          customer_phone: item.customerPhone || item.customer_phone,
          customer_address: item.customerAddress || item.customer_address,
          machine_type: item.machineType || item.machine_type || 'Unknown Equipment',
          order_type: item.orderType || item.order_type || 'rental',
          number_of_days: item.numberOfDays || item.number_of_days || 1,
          working_hours: item.workingHours || item.working_hours || 8,
          total_cost: item.totalCost || item.total_cost || 0,
          status: item.status || 'draft',
          created_at: item.createdAt || item.created_at || new Date().toISOString(),
          updated_at: item.updatedAt || item.updated_at || new Date().toISOString(),
          site_distance: item.siteDistance || item.site_distance || 0,
          usage: item.usage || 'General Construction',
          shift: item.shift || 'Day Shift',
          food_resources: item.foodResources || item.food_resources || 'To be discussed',
          accom_resources: item.accomResources || item.accom_resources || 'To be discussed',
          risk_factor: item.riskFactor || item.risk_factor || 'Medium',
          mob_demob_cost: item.mobDemobCost || item.mob_demob_cost || 0,
          working_cost: item.workingCost || item.working_cost || 0,
          food_accom_cost: item.foodAccomCost || item.food_accom_cost || 0,
          gst_amount: item.gstAmount || item.gst_amount || 0,
          total_rent: item.totalRent || item.total_rent || 0,
        }));

        setQuotations(transformedQuotations);
      } else {
        console.warn('Invalid response format:', result);
        setQuotations([]);
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch quotations');
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch =
      quotation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.machine_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quotation.quotation_number &&
        quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const currentQuotations = filteredQuotations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleQuickAction = (action: string, quotationId: string) => {
    switch (action) {
      case 'view':
        navigate(`/quotations/${quotationId}`);
        break;
      case 'edit':
        // Navigate to quotation creation page with edit mode
        navigate(`/quotation-creation?edit=${quotationId}`);
        break;
      case 'duplicate':
        // Create a copy of the quotation
        duplicateQuotation(quotationId);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this quotation?')) {
          deleteQuotation(quotationId);
        }
        break;
      case 'download':
        downloadQuotation(quotationId);
        break;
      case 'print':
        printQuotation(quotationId);
        break;
      case 'email':
        emailQuotation(quotationId);
        break;
    }
  };

  const deleteQuotation = async (quotationId: string) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setQuotations(prev => prev.filter(q => q.id !== quotationId));
        showNotification('Quotation deleted successfully', 'success');
      } else {
        throw new Error('Failed to delete quotation');
      }
    } catch (error) {
      console.error('Error deleting quotation:', error);
      showNotification('Failed to delete quotation', 'error');
    }
  };

  const duplicateQuotation = async (quotationId: string) => {
    try {
      const original = quotations.find(q => q.id === quotationId);
      if (!original) return;

      const duplicateData = {
        ...original,
        customer_name: `${original.customer_name} (Copy)`,
        status: 'draft',
      };

      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData),
      });

      if (response.ok) {
        fetchQuotations(); // Refresh the list
        showNotification('Quotation duplicated successfully', 'success');
      } else {
        throw new Error('Failed to duplicate quotation');
      }
    } catch (error) {
      console.error('Error duplicating quotation:', error);
      showNotification('Failed to duplicate quotation', 'error');
    }
  };

  const downloadQuotation = async (quotationId: string) => {
    try {
      const quotation = quotations.find(q => q.id === quotationId);
      if (!quotation) return;

      // Generate PDF via backend
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/quotations/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt-token')}`,
          'X-Bypass-Auth': 'development-only-123',
        },
        body: JSON.stringify({
          quotationId: quotation.id,
          customerName: quotation.customer_name,
          customerEmail: quotation.customer_email,
          items: [
            {
              description: quotation.machine_type,
              qty: quotation.number_of_days,
              price: quotation.total_cost / quotation.number_of_days,
            },
          ],
          gstRate: 18,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Quotation_${quotation.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showNotification('Quotation downloaded successfully', 'success');
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading quotation:', error);
      showNotification('Failed to download quotation', 'error');
    }
  };

  const printQuotation = async (quotationId: string) => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) return;

    try {
      // Get the print HTML from the backend using the configured template
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/quotations/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt-token')}`,
          'X-Bypass-Auth': 'development-only-123',
        },
        body: JSON.stringify({
          quotationId: quotationId,
          // templateId will be auto-selected from default config if not provided
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate print version');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate print version');
      }

      // Open quotation in new window for printing using the template
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showNotification('Please allow popups to print quotations', 'error');
        return;
      }

      printWindow.document.write(result.html);
      printWindow.document.close();
      printWindow.print();

      showNotification('Print window opened successfully', 'success');
    } catch (error) {
      console.error('Error printing quotation:', error);
      showNotification('Failed to print quotation', 'error');
    }
  };

  const emailQuotation = (quotationId: string) => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) return;

    const subject = `Quotation ${quotation.id} - ASP Cranes`;
    const body = `Dear ${quotation.customer_name},

Please find our quotation for ${quotation.machine_type} services:

Quotation ID: ${quotation.id}
Equipment: ${quotation.machine_type}
Duration: ${quotation.number_of_days} days
Total Amount: ₹${quotation.total_cost.toLocaleString('en-IN')}

Thank you for considering ASP Cranes for your project.

Best regards,
ASP Cranes Team`;

    const mailtoLink = `mailto:${quotation.customer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    showNotification('Email client opened', 'info');
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // You can implement a toast notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const handleCreateNew = () => {
    // Navigate to deal selection page first, then to quotation creation
    navigate('/select-deal');
  };

  // Loading state
  if (loading) {
    return (
      <div className="quotation-management-complete bg-gray-50 min-h-screen">
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Quotation Management</h1>
            <p className="text-gray-600 mt-1">Loading quotations...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Fetching quotations from database...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="quotation-management-complete bg-gray-50 min-h-screen">
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Quotation Management</h1>
            <p className="text-gray-600 mt-1">Error loading quotations</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">Failed to load quotations</h3>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={fetchQuotations}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quotation-management-complete bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quotation Management</h1>
              <p className="text-gray-600 mt-1">Manage and track all your quotations</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Quotation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Quotations</p>
                <p className="text-2xl font-bold text-gray-900">{quotations.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">
                  {quotations.filter(q => q.status === 'accepted').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {quotations.filter(q => q.status === 'sent').length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{quotations.reduce((sum, q) => sum + q.total_cost, 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quotations Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Quotations ({filteredQuotations.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotation Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentQuotations.map(quotation => (
                  <tr key={quotation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {quotation.quotation_number || quotation.id}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(quotation.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{quotation.customer_name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {quotation.customer_phone || 'N/A'}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{quotation.machine_type}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Wrench className="h-3 w-3 mr-1" />
                          {quotation.order_type}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {quotation.number_of_days} days
                        </div>
                        <div className="text-sm text-gray-500">{quotation.working_hours}h/day</div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900">
                        ₹{quotation.total_cost.toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quotation.status)}`}
                      >
                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuickAction('view', quotation.id)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded"
                          title="View Quotation"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleQuickAction('edit', quotation.id)}
                          className="text-gray-600 hover:text-gray-700 p-1 rounded"
                          title="Edit Quotation"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleQuickAction('download', quotation.id)}
                          className="text-green-600 hover:text-green-700 p-1 rounded"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleQuickAction('print', quotation.id)}
                          className="text-purple-600 hover:text-purple-700 p-1 rounded"
                          title="Print Quotation"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleQuickAction('email', quotation.id)}
                          className="text-orange-600 hover:text-orange-700 p-1 rounded"
                          title="Email Quotation"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        <div className="relative group">
                          <button className="text-gray-400 hover:text-gray-600 p-1 rounded">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleQuickAction('duplicate', quotation.id)}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={() => handleQuickAction('delete', quotation.id)}
                                className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredQuotations.length)} of{' '}
                {filteredQuotations.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationManagementComplete;

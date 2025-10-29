import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  FileText,
  AlertCircle,
  Users,
} from 'lucide-react';
import { getDeals, Deal } from '../services/deal';

const DealSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('eligible');

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching deals for quotation creation...');

      // Use the proper deal service to get deals in eligible stages
      const eligibleStages = ['qualification', 'proposal', 'negotiation'];
      const dealsData = await getDeals(eligibleStages);

      console.log('Fetched deals:', dealsData);

      // Ensure we have an array
      if (Array.isArray(dealsData)) {
        setDeals(dealsData);
      } else {
        console.warn('Deals service did not return an array:', dealsData);
        setDeals([]);
      }
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError('Failed to load deals. Please try again.');
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDeal = (deal: Deal) => {
    // Navigate to quotation creation page with the selected deal data
    navigate('/quotation-creation', {
      state: {
        selectedDeal: deal,
        deal: deal,
        dealId: deal.id,
        customerName: deal.customer?.name || '',
        customerEmail: deal.customer?.email || '',
        customerPhone: deal.customer?.phone || '',
        customerCompany: deal.customer?.company || '',
        customerAddress: deal.customer?.address || '',
      },
    });
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch =
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage =
      stageFilter === 'all' ||
      (stageFilter === 'eligible' &&
        ['qualification', 'proposal', 'negotiation'].includes(deal.stage?.toLowerCase())) ||
      deal.stage?.toLowerCase() === stageFilter;

    return matchesSearch && matchesStage;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStageColor = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'qualification':
        return 'bg-blue-100 text-blue-800';
      case 'proposal':
        return 'bg-yellow-100 text-yellow-800';
      case 'negotiation':
        return 'bg-orange-100 text-orange-800';
      case 'closed-won':
        return 'bg-green-100 text-green-800';
      case 'closed-lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/quotations')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Quotations</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  <span>Select Deal for Quotation</span>
                </h1>
                <p className="text-sm text-gray-500">Choose a deal to create a quotation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search deals by title or customer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="eligible">Eligible for Quotation</option>
              <option value="all">All Stages</option>
              <option value="qualification">Qualification</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error Loading Deals</p>
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={fetchDeals}
                className="mt-2 text-red-700 hover:text-red-900 text-sm font-medium underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Deals Grid */}
        {filteredDeals.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Deals Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? 'Try adjusting your search criteria.'
                : 'No deals are currently eligible for quotations.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.map(deal => (
              <div
                key={deal.id}
                onClick={() => handleSelectDeal(deal)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                      {deal.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Deal #{deal.id}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(deal.stage)}`}
                  >
                    {deal.stage}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 font-medium">
                      {deal.customer?.name || 'Unknown Customer'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(deal.value)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{deal.probability}% probability</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Expected: {formatDate(deal.expectedCloseDate)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Created: {formatDate(deal.createdAt)}
                    </span>
                    <div className="flex items-center space-x-1 text-blue-600 group-hover:text-blue-700">
                      <span className="text-sm font-medium">Select Deal</span>
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealSelectionPage;

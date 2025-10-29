import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Filter,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  description: string;
  value: number;
  stage: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  probability: number;
  expected_close_date: string;
  created_at: string;
  assigned_to: string;
  customer_contact?: any;
}

interface DealSelectionProps {
  onClose: () => void;
  onSelectDeal: (deal: Deal) => void;
}

const DealSelection: React.FC<DealSelectionProps> = ({ onClose, onSelectDeal }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('eligible');

  useEffect(() => {
    fetchEligibleDeals();
  }, []);

  const fetchEligibleDeals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/deals?stages=qualification,proposal,negotiation');

      if (!response.ok) {
        throw new Error(`Failed to fetch deals: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setDeals(result.data);
      } else {
        setDeals([]);
      }
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch deals');
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch =
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage =
      stageFilter === 'all' ||
      (stageFilter === 'eligible' &&
        ['qualification', 'proposal', 'negotiation'].includes(deal.stage));

    return matchesSearch && matchesStage;
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'qualification':
        return 'bg-blue-100 text-blue-800';
      case 'proposal':
        return 'bg-yellow-100 text-yellow-800';
      case 'negotiation':
        return 'bg-orange-100 text-orange-800';
      case 'won':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'qualification':
        return <Clock className="h-4 w-4" />;
      case 'proposal':
        return <FileText className="h-4 w-4" />;
      case 'negotiation':
        return <TrendingUp className="h-4 w-4" />;
      case 'won':
        return <CheckCircle className="h-4 w-4" />;
      case 'lost':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Select Deal for Quotation</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading eligible deals...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Select Deal for Quotation</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">Failed to load deals</h3>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={fetchEligibleDeals}
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Select Deal for Quotation</h1>
                <p className="text-gray-600">
                  Choose a deal in Qualification, Proposal, or Negotiation stage
                </p>
              </div>
            </div>
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
                placeholder="Search deals..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="eligible">Eligible Stages</option>
              <option value="all">All Stages</option>
              <option value="qualification">Qualification</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
        <div className="flex items-center space-x-2 text-blue-800">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">
            Only deals in <strong>Qualification</strong>, <strong>Proposal</strong>, or{' '}
            <strong>Negotiation</strong> stages are eligible for quotation creation.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {filteredDeals.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Eligible Deals Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'No deals are currently in the eligible stages for quotation creation.'}
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDeals.map(deal => (
              <div
                key={deal.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectDeal(deal)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{deal.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{deal.description}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}
                    >
                      {getStageIcon(deal.stage)}
                      <span className="ml-1 capitalize">{deal.stage}</span>
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Building className="h-4 w-4 mr-2" />
                        <span>{deal.customer_name || 'Unknown Customer'}</span>
                      </div>
                      <div className="flex items-center text-green-600 font-medium">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span>₹{deal.value.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        <span>{deal.probability}% probability</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(deal.expected_close_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelectDeal(deal);
                      }}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Create Quotation</span>
                    </button>
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

export default DealSelection;

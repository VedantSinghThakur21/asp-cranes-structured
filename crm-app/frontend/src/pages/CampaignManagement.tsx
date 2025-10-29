import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Mail,
  Users,
  Target,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
} from 'lucide-react';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type CampaignType =
  | 'email'
  | 'sms'
  | 'direct_mail'
  | 'social_media'
  | 'telemarketing'
  | 'webinar';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  budget: number;
  targetAudience: string;
  expectedRevenue: number;
  actualRevenue: number;
  totalContacts: number;
  sentContacts: number;
  openedContacts: number;
  clickedContacts: number;
  convertedContacts: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const CAMPAIGN_TYPES = [
  { value: 'email', label: 'Email Marketing', icon: <Mail size={16} /> },
  { value: 'sms', label: 'SMS Campaign', icon: <Target size={16} /> },
  { value: 'direct_mail', label: 'Direct Mail', icon: <Mail size={16} /> },
  { value: 'social_media', label: 'Social Media', icon: <Users size={16} /> },
  { value: 'telemarketing', label: 'Telemarketing', icon: <Target size={16} /> },
  { value: 'webinar', label: 'Webinar', icon: <Calendar size={16} /> },
];

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CampaignType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');

  // Mock data
  useEffect(() => {
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'Summer Crane Rental Campaign',
        description: 'Target construction companies for summer projects',
        type: 'email',
        status: 'active',
        startDate: '2024-06-01',
        endDate: '2024-08-31',
        budget: 15000,
        targetAudience: 'Construction Companies',
        expectedRevenue: 150000,
        actualRevenue: 45000,
        totalContacts: 500,
        sentContacts: 500,
        openedContacts: 285,
        clickedContacts: 89,
        convertedContacts: 12,
        createdBy: 'Sales Manager',
        createdAt: '2024-05-15',
        updatedAt: '2024-06-15',
      },
      {
        id: '2',
        name: 'Equipment Maintenance Promotion',
        description: 'Promote maintenance services to existing customers',
        type: 'direct_mail',
        status: 'completed',
        startDate: '2024-04-01',
        endDate: '2024-05-31',
        budget: 8000,
        targetAudience: 'Existing Customers',
        expectedRevenue: 80000,
        actualRevenue: 95000,
        totalContacts: 200,
        sentContacts: 200,
        openedContacts: 180,
        clickedContacts: 45,
        convertedContacts: 18,
        createdBy: 'Marketing Team',
        createdAt: '2024-03-20',
        updatedAt: '2024-06-01',
      },
      {
        id: '3',
        name: 'Heavy Lift Specialist Services',
        description: 'Target industrial clients for specialized lifting services',
        type: 'telemarketing',
        status: 'draft',
        startDate: '2024-07-01',
        endDate: '2024-09-30',
        budget: 12000,
        targetAudience: 'Industrial Clients',
        expectedRevenue: 200000,
        actualRevenue: 0,
        totalContacts: 300,
        sentContacts: 0,
        openedContacts: 0,
        clickedContacts: 0,
        convertedContacts: 0,
        createdBy: 'Sales Director',
        createdAt: '2024-06-10',
        updatedAt: '2024-06-10',
      },
    ];

    setTimeout(() => {
      setCampaigns(mockCampaigns);
      setLoading(false);
    }, 500);
  }, []);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getConversionRate = (campaign: Campaign) => {
    return campaign.sentContacts > 0
      ? ((campaign.convertedContacts / campaign.sentContacts) * 100).toFixed(1)
      : '0';
  };

  const getOpenRate = (campaign: Campaign) => {
    return campaign.sentContacts > 0
      ? ((campaign.openedContacts / campaign.sentContacts) * 100).toFixed(1)
      : '0';
  };

  const getROI = (campaign: Campaign) => {
    return campaign.budget > 0
      ? (((campaign.actualRevenue - campaign.budget) / campaign.budget) * 100).toFixed(1)
      : '0';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
          <p className="text-gray-600">Manage marketing campaigns and track performance</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <BarChart3 size={18} />
            {viewMode === 'cards' ? 'List View' : 'Card View'}
          </button>

          <button className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-blue/90">
            <Plus size={18} />
            New Campaign
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as CampaignStatus | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as CampaignType | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
        >
          <option value="all">All Types</option>
          {CAMPAIGN_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Campaign Cards/List */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map(campaign => (
            <div
              key={campaign.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{campaign.name}</h3>
                  <p className="text-gray-600 text-sm">{campaign.description}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium border ${STATUS_COLORS[campaign.status]}`}
                >
                  {campaign.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium">
                    {CAMPAIGN_TYPES.find(t => t.value === campaign.type)?.label}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Budget:</span>
                  <span className="font-medium">${campaign.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Revenue:</span>
                  <span className="font-medium text-green-600">
                    ${campaign.actualRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ROI:</span>
                  <span
                    className={`font-medium ${Number(getROI(campaign)) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {getROI(campaign)}%
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Open Rate: {getOpenRate(campaign)}%</span>
                  <span>Conversion: {getConversionRate(campaign)}%</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                    <Eye size={12} />
                    View
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100">
                    <Edit size={12} />
                    Edit
                  </button>
                  {campaign.status === 'active' && (
                    <button className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">
                      <Pause size={12} />
                      Pause
                    </button>
                  )}
                  {campaign.status === 'paused' && (
                    <button className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100">
                      <Play size={12} />
                      Resume
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Campaign</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Budget</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Revenue</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">ROI</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Conversion</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map(campaign => (
                  <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500">{campaign.description}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {CAMPAIGN_TYPES.find(t => t.value === campaign.type)?.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium border ${STATUS_COLORS[campaign.status]}`}
                      >
                        {campaign.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">${campaign.budget.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm font-medium text-green-600">
                      ${campaign.actualRevenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-sm font-medium ${Number(getROI(campaign)) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {getROI(campaign)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{getConversionRate(campaign)}%</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1 text-gray-400 hover:text-blue-600 rounded">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                          <Edit size={16} />
                        </button>
                        {campaign.status === 'active' && (
                          <button className="p-1 text-gray-400 hover:text-yellow-600 rounded">
                            <Pause size={16} />
                          </button>
                        )}
                        {campaign.status === 'paused' && (
                          <button className="p-1 text-gray-400 hover:text-green-600 rounded">
                            <Play size={16} />
                          </button>
                        )}
                        <button className="p-1 text-gray-400 hover:text-red-600 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first marketing campaign.
          </p>
          <button className="bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-blue/90">
            Create Campaign
          </button>
        </div>
      )}
    </div>
  );
}

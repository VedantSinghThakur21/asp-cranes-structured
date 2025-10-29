import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  BarChart3,
  Activity,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  dashboardService,
  type DashboardAnalytics,
  type RevenueChartData,
  type PipelineData,
} from '../../services/dashboardService';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function MetricCard({ title, value, change, icon, color, subtitle }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const changeIcon = isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${changeColor}`}>
              {changeIcon}
              <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface ChartData {
  revenueData: RevenueChartData[];
  pipelineData: PipelineData[];
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [chartData, setChartData] = useState<ChartData>({ revenueData: [], pipelineData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [authError, setAuthError] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      setConnectionError(false);
      setAuthError(false);
      const [analyticsData, revenueData, pipelineData] = await Promise.all([
        dashboardService.getDashboardAnalytics(timeRange),
        dashboardService.getRevenueChart(12),
        dashboardService.getPipelineOverview(),
      ]);

      setAnalytics(analyticsData);
      setChartData({ revenueData, pipelineData });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';

      // Check if it's an authentication error
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setAuthError(true);
        setError('You need to log in to view the dashboard. Please sign in and try again.');
      }
      // Check if it's a connection error
      else if (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('ERR_CONNECTION_REFUSED')
      ) {
        setConnectionError(true);
        setError('Unable to connect to server. Please check if the backend service is running.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {authError
            ? 'Authentication Required'
            : connectionError
              ? 'Connection Error'
              : 'Error Loading Dashboard'}
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        {authError && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 mb-3">
              <strong>Please log in:</strong> The dashboard requires authentication to display your
              data.
            </p>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition-colors"
            >
              Go to Login Page
            </a>
          </div>
        )}
        {connectionError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Troubleshooting:</strong> The backend server might be starting up or not
              running. If running in Docker, try rebuilding the containers with the latest code.
            </p>
          </div>
        )}
        <button
          onClick={handleRefresh}
          className="bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-blue/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Overview for the last {timeRange} days</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => handleTimeRangeChange(days)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === days
                    ? 'bg-white text-brand-blue shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-blue/90 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${analytics.revenue.total.toLocaleString()}`}
          change={analytics.revenue.growth}
          icon={<DollarSign className="text-white" size={20} />}
          color="bg-green-500"
          subtitle={`${analytics.revenue.dealsCount} deals closed`}
        />

        <MetricCard
          title="Active Leads"
          value={analytics.leads.total}
          icon={<Target className="text-white" size={20} />}
          color="bg-blue-500"
          subtitle={`${analytics.leads.conversionRate.toFixed(1)}% conversion rate`}
        />

        <MetricCard
          title="Pipeline Deals"
          value={analytics.deals.total - analytics.deals.won - analytics.deals.lost}
          icon={<BarChart3 className="text-white" size={20} />}
          color="bg-purple-500"
          subtitle={`${analytics.deals.winRate.toFixed(1)}% win rate`}
        />

        <MetricCard
          title="Active Customers"
          value={analytics.customers.active}
          icon={<Users className="text-white" size={20} />}
          color="bg-orange-500"
          subtitle={`${analytics.customers.total} total customers`}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <BarChart3 className="text-gray-400" size={20} />
          </div>

          <div className="space-y-4">
            {chartData.revenueData.slice(0, 6).map(month => {
              const maxRevenue = Math.max(...chartData.revenueData.map(m => m.revenue));
              const percentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;

              return (
                <div key={month.month} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{month.monthName}</span>
                    <span className="font-medium">${month.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales Pipeline */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Sales Pipeline</h3>
            <Target className="text-gray-400" size={20} />
          </div>

          <div className="space-y-4">
            {chartData.pipelineData.map((stage, index) => {
              const maxValue = Math.max(...chartData.pipelineData.map(s => s.value));
              const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
              const colors = ['bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-green-500'];
              const color = colors[index % colors.length];

              return (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">
                      {stage.stage.replace('_', ' ')}
                    </span>
                    <div className="text-right">
                      <div className="font-medium">${stage.value.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{stage.count} deals</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Qualified Leads</span>
              <span className="font-medium">{analytics.leads.qualified}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Qualification Rate</span>
              <span className="font-medium">{analytics.leads.qualificationRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Converted Leads</span>
              <span className="font-medium">{analytics.leads.converted}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Average Deal Size</span>
              <span className="font-medium">${analytics.revenue.avgDealSize.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sales Cycle</span>
              <span className="font-medium">{analytics.deals.avgCycleDays} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Win Rate</span>
              <span className="font-medium">{analytics.deals.winRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotations</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Quotations</span>
              <span className="font-medium">{analytics.quotations.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Approval Rate</span>
              <span className="font-medium">{analytics.quotations.approvalRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Approved Value</span>
              <span className="font-medium">
                ${analytics.quotations.approvedValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          <Activity className="text-gray-400" size={20} />
        </div>

        <div className="space-y-4">
          {analytics.recentActivities.length > 0 ? (
            analytics.recentActivities.map((activity, index) => (
              <div
                key={`${activity.type}-${activity.id}-${index}`}
                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
                  {activity.type === 'lead' && <Target className="text-brand-blue" size={16} />}
                  {activity.type === 'deal' && <BarChart3 className="text-brand-blue" size={16} />}
                  {activity.type === 'customer' && <Users className="text-brand-blue" size={16} />}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{activity.title}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {activity.type} • {activity.status}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activities</p>
          )}
        </div>
      </div>
    </div>
  );
}

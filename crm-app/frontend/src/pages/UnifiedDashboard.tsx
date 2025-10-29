import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  Activity,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Plus,
  Phone,
  Mail,
  FileText,
  Trophy,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Gauge,
} from 'lucide-react';

// Store
import { useAuthStore } from '../store/authStore';

// Services
import {
  dashboardService,
  DashboardAnalytics,
  RevenueChartData,
  PipelineData,
  Notification,
} from '../services/dashboardService';

// Components
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';

// Types
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

// Enhanced Metric Card Component with hover effects
function MetricCard({ title, value, change, icon, color, subtitle }: MetricCardProps) {
  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p
              className="text-sm font-semibold text-gray-700 group-hover:text-gray-800 transition-colors"
              style={{ color: '#374151' }}
            >
              {title}
            </p>
            <div className="space-y-1">
              <p
                className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors"
                style={{ color: '#111827' }}
              >
                {value}
              </p>
              {subtitle && (
                <p className="text-xs font-medium text-gray-600" style={{ color: '#4b5563' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg`}
          >
            {icon}
          </div>
        </div>

        {change !== undefined && (
          <div className="mt-4 flex items-center">
            {change >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span
              className={`text-sm font-semibold ml-1 ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
              style={{ color: change >= 0 ? '#059669' : '#dc2626' }}
            >
              {formatChange(change)}
            </span>
            <span className="text-sm text-gray-500 ml-1" style={{ color: '#6b7280' }}>
              vs last period
            </span>
          </div>
        )}

        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none" />
      </CardContent>
    </Card>
  );
}

// Enhanced Notification Center Component
function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setError(null);
        const data = await dashboardService.getNotifications(5);
        setNotifications(data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
        // Fallback to demo data if real data fails
        setNotifications([
          {
            id: 'demo-1',
            type: 'info',
            title: 'Welcome to Dashboard',
            message: 'Your real-time notifications will appear here',
            time: 'Just now',
            icon: 'users',
            priority: 'low',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getNotificationIcon = (iconType: string) => {
    switch (iconType) {
      case 'trophy':
        return <Trophy className="h-4 w-4" />;
      case 'clock':
        return <Clock className="h-4 w-4" />;
      case 'alert-circle':
        return <AlertCircle className="h-4 w-4" />;
      case 'users':
        return <Users className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'mail':
        return <Mail className="h-4 w-4" />;
      case 'file-text':
        return <FileText className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="hover:shadow-lg transition-shadow duration-300 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              <span className="text-gray-900 font-semibold" style={{ color: '#111827' }}>
                Live Updates
              </span>
            </div>
            <div className="animate-pulse bg-gray-300 h-6 w-8 rounded-full"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse p-3 bg-gray-100 rounded-lg">
                <div className="flex gap-3">
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            <span className="text-gray-900 font-semibold" style={{ color: '#111827' }}>
              Live Updates
            </span>
          </div>
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            {notifications.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            {error}
          </div>
        )}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border-2 ${getNotificationColor(notification.type)} hover:shadow-md transition-shadow duration-200`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-current">
                    {getNotificationIcon(notification.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'inherit' }}>
                      {notification.title}
                    </p>
                    <p className="text-sm opacity-90 mt-1" style={{ color: 'inherit' }}>
                      {notification.message}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs opacity-70 font-medium" style={{ color: 'inherit' }}>
                        {notification.time}
                      </p>
                      {notification.priority === 'high' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Quick Actions Component
function QuickActions() {
  const navigate = useNavigate();

  const handleNavigation = (href: string) => {
    // Check if we're in React Router context
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };

  const handleNewQuotation = () => {
    // Navigate to deal selection page first, then to quotation creation
    navigate('/select-deal');
  };

  const actions = [
    {
      label: 'Add Lead',
      icon: <Plus className="h-4 w-4" />,
      color: 'bg-blue-500 hover:bg-blue-600 shadow-blue-200',
      href: '/leads',
      onClick: () => handleNavigation('/leads'),
    },
    {
      label: 'New Deal',
      icon: <DollarSign className="h-4 w-4" />,
      color: 'bg-green-500 hover:bg-green-600 shadow-green-200',
      href: '/deals',
      onClick: () => handleNavigation('/deals'),
    },
    {
      label: 'Schedule Call',
      icon: <Phone className="h-4 w-4" />,
      color: 'bg-purple-500 hover:bg-purple-600 shadow-purple-200',
      href: '/activities',
      onClick: () => handleNavigation('/activities'),
    },
    {
      label: 'New Quotation',
      icon: <FileText className="h-4 w-4" />,
      color: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200',
      href: '#',
      onClick: handleNewQuotation,
    },
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <span className="text-gray-900 font-semibold" style={{ color: '#111827' }}>
            Quick Actions
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map(action => (
            <button
              key={action.label}
              className={`${action.color} text-white p-3 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-semibold hover:shadow-lg hover:scale-105 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
              onClick={action.onClick}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Performance Indicators Component
function PerformanceIndicators({ analytics }: { analytics: DashboardAnalytics }) {
  const calculateSalesVelocity = () => {
    if (analytics.revenue.total > 0 && analytics.timeRange > 0) {
      return (analytics.revenue.total / analytics.timeRange).toFixed(0);
    }
    return '0';
  };

  const calculateResponseTime = () => {
    // Calculate based on recent activities or use a reasonable estimate
    const recentActivitiesCount = analytics.recentActivities.length;
    if (recentActivitiesCount > 5) return '1.2 hours'; // Very active
    if (recentActivitiesCount > 2) return '2.3 hours'; // Normal
    return '4.1 hours'; // Slower response
  };

  const calculateCustomerSatisfaction = () => {
    // Base satisfaction on win rate and quotation approval rate
    const combinedRate = (analytics.deals.winRate + analytics.quotations.approvalRate) / 2;
    if (combinedRate > 70) return '4.8/5';
    if (combinedRate > 50) return '4.2/5';
    if (combinedRate > 30) return '3.8/5';
    return '3.4/5';
  };

  const getGrowthIndicator = (value: number) => {
    if (value > 10) return '+' + value.toFixed(0) + '%';
    if (value > 0) return '+' + value.toFixed(1) + '%';
    if (value > -10) return value.toFixed(1) + '%';
    return value.toFixed(0) + '%';
  };

  const indicators = [
    {
      label: 'Sales Velocity',
      value: `₹${calculateSalesVelocity()}K/day`,
      status: analytics.revenue.growth > 0 ? 'good' : 'needs-improvement',
      change: getGrowthIndicator(analytics.revenue.growth),
    },
    {
      label: 'Lead Response Time',
      value: calculateResponseTime(),
      status:
        analytics.leads.qualificationRate > 50
          ? 'excellent'
          : analytics.leads.qualificationRate > 30
            ? 'good'
            : 'needs-improvement',
      change:
        analytics.leads.qualificationRate > 50
          ? '-15%'
          : analytics.leads.qualificationRate > 30
            ? '-8%'
            : '+5%',
    },
    {
      label: 'Conversion Rate',
      value: `${analytics.deals.winRate.toFixed(1)}%`,
      status:
        analytics.deals.winRate > 60
          ? 'excellent'
          : analytics.deals.winRate > 40
            ? 'good'
            : 'needs-improvement',
      change: getGrowthIndicator(analytics.deals.winRate - 45), // Assuming 45% as baseline
    },
    {
      label: 'Customer Satisfaction',
      value: calculateCustomerSatisfaction(),
      status:
        analytics.quotations.approvalRate > 70
          ? 'excellent'
          : analytics.quotations.approvalRate > 50
            ? 'good'
            : 'needs-improvement',
      change: getGrowthIndicator(analytics.quotations.approvalRate - 65), // Assuming 65% as baseline
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'needs-improvement':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4" />;
      case 'good':
        return <Star className="h-4 w-4" />;
      case 'needs-improvement':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Gauge className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-purple-500" />
          <span className="text-gray-900 font-semibold" style={{ color: '#111827' }}>
            Performance Indicators
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {indicators.map(indicator => (
            <div
              key={indicator.label}
              className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getStatusColor(indicator.status)}`}>
                  {getStatusIcon(indicator.status)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900" style={{ color: '#111827' }}>
                    {indicator.label}
                  </p>
                  <p className="text-lg font-bold text-gray-800" style={{ color: '#1f2937' }}>
                    {indicator.value}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-semibold px-2 py-1 rounded-full ${
                    indicator.change.startsWith('+')
                      ? 'text-green-600 bg-green-50'
                      : indicator.change.startsWith('-')
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-600 bg-gray-50'
                  }`}
                >
                  {indicator.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Goal Tracking Component
function GoalTracking({ analytics }: { analytics: DashboardAnalytics }) {
  // Calculate monthly targets based on current performance and industry standards
  const calculateMonthlyRevenueTarget = () => {
    // Base target on current performance with 20% growth target
    const baseTarget = analytics.revenue.total * 1.2;
    return Math.max(baseTarget, 500000); // Minimum ₹500K target
  };

  const calculateLeadsTarget = () => {
    // Target based on current leads with growth factor
    const baseTarget = analytics.leads.total * 1.3;
    return Math.max(baseTarget, 50); // Minimum 50 leads target
  };

  const calculateDealsTarget = () => {
    // Target based on current won deals with improvement factor
    const baseTarget = analytics.deals.won * 1.5;
    return Math.max(baseTarget, 15); // Minimum 15 deals target
  };

  const goals = [
    {
      label: 'Monthly Revenue',
      current: analytics.revenue.total,
      target: calculateMonthlyRevenueTarget(),
      unit: '$',
      color: 'bg-green-500',
      description: `${analytics.revenue.dealsCount} deals closed this period`,
    },
    {
      label: 'New Leads',
      current: analytics.leads.total,
      target: calculateLeadsTarget(),
      unit: '',
      color: 'bg-blue-500',
      description: `${analytics.leads.qualified} qualified leads`,
    },
    {
      label: 'Deals Closed',
      current: analytics.deals.won,
      target: calculateDealsTarget(),
      unit: '',
      color: 'bg-purple-500',
      description: `${analytics.deals.avgCycleDays} days avg cycle`,
    },
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-500" />
          <span className="text-gray-900 font-semibold" style={{ color: '#111827' }}>
            Goal Progress
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {goals.map(goal => {
            const percentage = Math.min((goal.current / goal.target) * 100, 100);
            const isOnTrack = percentage >= 75;
            const isExceeding = percentage >= 100;

            return (
              <div
                key={goal.label}
                className="space-y-3 p-3 bg-gray-50 border border-gray-100 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900" style={{ color: '#111827' }}>
                    {goal.label}
                  </span>
                  <span
                    className="text-sm font-medium text-gray-700 bg-white px-2 py-1 rounded border"
                    style={{ color: '#374151' }}
                  >
                    {goal.unit}
                    {goal.current.toLocaleString()} / {goal.unit}
                    {goal.target.toLocaleString()}
                  </span>
                </div>

                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`${goal.color} h-4 rounded-full transition-all duration-1000 relative overflow-hidden ${
                        isExceeding ? 'animate-pulse' : ''
                      }`}
                      style={{ width: `${percentage}%` }}
                    >
                      {/* Animated shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 -skew-x-12 animate-pulse" />
                    </div>
                  </div>

                  {/* Goal marker */}
                  <div className="absolute right-0 top-0 h-4 w-1 bg-gray-400 rounded" />
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span
                    className={`font-semibold px-3 py-1 rounded-full ${
                      isExceeding
                        ? 'text-purple-800 bg-purple-100'
                        : isOnTrack
                          ? 'text-green-800 bg-green-100'
                          : 'text-orange-800 bg-orange-100'
                    }`}
                  >
                    {percentage.toFixed(1)}% complete
                  </span>
                  <span
                    className={`font-medium ${
                      isExceeding
                        ? 'text-purple-700'
                        : isOnTrack
                          ? 'text-green-700'
                          : 'text-orange-700'
                    }`}
                  >
                    {isExceeding
                      ? '🎉 Exceeded!'
                      : isOnTrack
                        ? '🎯 On track'
                        : '⚠️ Needs attention'}
                  </span>
                </div>

                <div className="text-xs text-gray-600 mt-1" style={{ color: '#6b7280' }}>
                  {goal.description}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Stats Component
function QuickStats({ analytics }: { analytics: DashboardAnalytics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Revenue"
        value={`₹${analytics.revenue.total.toLocaleString()}`}
        change={analytics.revenue.growth}
        icon={<DollarSign className="text-white" size={20} />}
        color="bg-green-500"
        subtitle={`${analytics.revenue.dealsCount} deals closed`}
      />

      <MetricCard
        title="Active Leads"
        value={analytics.leads.total.toLocaleString()}
        change={analytics.leads.qualificationRate}
        icon={<Users className="text-white" size={20} />}
        color="bg-blue-500"
        subtitle={`${analytics.leads.qualified} qualified`}
      />

      <MetricCard
        title="Deal Win Rate"
        value={`${analytics.deals.winRate.toFixed(1)}%`}
        change={analytics.deals.winRate - 50} // Assuming 50% as baseline
        icon={<Target className="text-white" size={20} />}
        color="bg-purple-500"
        subtitle={`${analytics.deals.won}/${analytics.deals.total} won`}
      />

      <MetricCard
        title="Avg Deal Size"
        value={`₹${analytics.revenue.avgDealSize.toLocaleString()}`}
        icon={<BarChart3 className="text-white" size={20} />}
        color="bg-orange-500"
        subtitle={`${analytics.deals.avgCycleDays} days avg cycle`}
      />
    </div>
  );
}

// Enhanced Revenue Chart Component with hover effects
function RevenueChart({ data }: { data: RevenueChartData[] }) {
  const maxRevenue = Math.max(...data.map(item => item.revenue));
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Revenue Trend (Last 6 Months)
          </div>
          <div className="text-sm text-gray-500">
            Total: ₹{data.reduce((sum, month) => sum + month.revenue, 0).toLocaleString()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(0, 6).map((month, index) => {
            const percentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={month.month}
                className="space-y-2 p-2 rounded-lg transition-colors duration-200 hover:bg-gray-50 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex justify-between text-sm">
                  <span
                    className={`font-medium transition-colors ${isHovered ? 'text-green-600' : 'text-gray-600'}`}
                  >
                    {month.monthName}
                  </span>
                  <span
                    className={`font-semibold transition-colors ${isHovered ? 'text-green-700' : 'text-gray-900'}`}
                  >
                    ₹{month.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${
                      isHovered ? 'bg-green-600 shadow-lg' : 'bg-green-500'
                    }`}
                    style={{
                      width: `${percentage}%`,
                      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{month.deals} deals</span>
                  <span
                    className={`transition-colors ${isHovered ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {percentage.toFixed(1)}% of max
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Pipeline Overview Component
function PipelineOverview({ data }: { data: PipelineData[] }) {
  const maxValue = Math.max(...data.map(stage => stage.value));
  const totalValue = data.reduce((sum, stage) => sum + stage.value, 0);
  const colors = ['bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-green-500'];
  const hoverColors = [
    'hover:bg-blue-600',
    'hover:bg-yellow-600',
    'hover:bg-orange-600',
    'hover:bg-green-600',
  ];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Sales Pipeline
          </div>
          <div className="text-sm text-gray-500">Total: ₹{totalValue.toLocaleString()}</div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stage, index) => {
            const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
            const valuePercentage = totalValue > 0 ? (stage.value / totalValue) * 100 : 0;
            const color = colors[index % colors.length];
            const hoverColor = hoverColors[index % hoverColors.length];
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={stage.stage}
                className="space-y-2 p-3 rounded-lg transition-colors duration-200 hover:bg-gray-50 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex justify-between text-sm">
                  <span
                    className={`font-medium transition-colors ${isHovered ? 'text-blue-600' : 'text-gray-700'}`}
                  >
                    {stage.stage}
                  </span>
                  <div className="text-right">
                    <div
                      className={`font-semibold transition-colors ${isHovered ? 'text-blue-700' : 'text-gray-900'}`}
                    >
                      ₹{stage.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">{stage.count} deals</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`${color} h-4 rounded-full transition-all duration-700 ${hoverColor} ${
                      isHovered ? 'shadow-lg scale-y-110' : ''
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span
                    className={`transition-colors ${isHovered ? 'text-blue-600' : 'text-gray-500'}`}
                  >
                    {valuePercentage.toFixed(1)}% of total pipeline
                  </span>
                  <span
                    className={`transition-colors ${isHovered ? 'text-blue-600' : 'text-gray-400'}`}
                  >
                    ₹{(stage.value / stage.count).toLocaleString()} avg deal
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Activities Component
function RecentActivities({ activities }: { activities: DashboardAnalytics['recentActivities'] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-500" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No recent activities found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-blue" />
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
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
                <div className="text-sm text-gray-500">
                  {activity.status} • {activity.createdBy} •{' '}
                  {new Date(activity.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Unified Dashboard Component
export function UnifiedDashboard() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [chartData, setChartData] = useState<{
    revenueData: RevenueChartData[];
    pipelineData: PipelineData[];
  }>({
    revenueData: [],
    pipelineData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [serverError, setServerError] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      setConnectionError(false);
      setAuthError(false);
      setServerError(false);

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
      // Check if it's a server error
      else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        setServerError(true);
        setError(
          'Server error occurred. The dashboard data might be temporarily unavailable. Please try refreshing.'
        );
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
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
            : serverError
              ? 'Server Error'
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
        {serverError && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-800">
              <strong>Server Issue:</strong> The backend database queries might have issues. This is
              likely due to database schema mismatches or missing data. Try rebuilding the
              containers or check server logs.
            </p>
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
          disabled={refreshing}
          className="bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No dashboard data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Enhanced Header with Breadcrumbs */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex justify-between items-start mb-4">
          {/* Breadcrumb */}
          <nav className="text-sm">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li>Home</li>
              <li className="before:content-['/'] before:mx-2">Dashboard</li>
              <li className="before:content-['/'] before:mx-2 text-blue-600 font-medium">
                Analytics
              </li>
            </ol>
          </nav>

          {/* Time Range & Actions */}
          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex bg-white/80 backdrop-blur rounded-lg p-1 shadow-sm border">
              {[
                { label: '7D', days: 7 },
                { label: '30D', days: 30 },
                { label: '90D', days: 90 },
              ].map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => handleTimeRangeChange(days)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 ${
                    timeRange === days
                      ? 'bg-blue-500 text-white shadow-md transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur border border-gray-200 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Here's what's happening with your business today.
            <span className="ml-2 inline-flex items-center gap-1 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live data
            </span>
          </p>
        </div>
      </div>

      {/* Quick Stats with staggered animation */}
      <div className="animate-slideInUp">
        <QuickStats analytics={analytics} />
      </div>

      {/* Action Cards Row with staggered animation */}
      <div
        className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-slideInUp"
        style={{ animationDelay: '0.1s' }}
      >
        <QuickActions />
        <NotificationCenter />
        <PerformanceIndicators analytics={analytics} />
        <GoalTracking analytics={analytics} />
      </div>

      {/* Charts Grid with staggered animation */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slideInUp"
        style={{ animationDelay: '0.2s' }}
      >
        <RevenueChart data={chartData.revenueData} />
        <PipelineOverview data={chartData.pipelineData} />
      </div>

      {/* Recent Activities with staggered animation */}
      <div className="animate-slideInUp" style={{ animationDelay: '0.3s' }}>
        <RecentActivities activities={analytics.recentActivities} />
      </div>
    </div>
  );
}

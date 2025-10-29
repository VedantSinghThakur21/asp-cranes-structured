import { useState, useEffect, useMemo, memo } from 'react';
import {
  IndianRupee,
  Truck,
  Users,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  TrendingUp,
} from 'lucide-react';

// Services
import { getLeads } from '../services/lead';
import { getJobs, getAllOperators } from '../services/job';
import { getEquipment } from '../services/equipment';
import { getDeals } from '../services/deal';

// Types
import { Lead } from '../types/lead';
import { Job } from '../types/job';
import { Equipment } from '../types/equipment';
import { Deal } from '../types/deal';

// Utils
import { formatCurrency } from '../utils/formatters';

// Components
import { StatCard } from '../components/dashboard/StatCard';
import { RecentActivities } from '../components/dashboard/RecentActivities';
import { BarChart } from '../components/dashboard/BarChart';
import { LineChart } from '../components/dashboard/LineChart';
import { DoughnutChart } from '../components/dashboard/DoughnutChart';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';

// Store
import { useAuthStore } from '../store/authStore';

// Memoized chart components for better performance
const MemoizedLineChart = memo(LineChart);
const MemoizedBarChart = memo(BarChart);
const MemoizedDoughnutChart = memo(DoughnutChart);

export function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();

  // State management
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [operatorCount, setOperatorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user) {
        console.log('⏸️ Skipping data fetch - user not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔄 AdminDashboard: Starting data fetch...');
        setError(null);

        const [leadsResponse, jobsResponse, equipmentResponse, operatorsResponse, dealsResponse] =
          await Promise.all([
            getLeads().catch((err: any) => {
              console.error('Leads error:', err);
              return [];
            }),
            getJobs().catch((err: any) => {
              console.error('Jobs error:', err);
              return [];
            }),
            getEquipment().catch((err: any) => {
              console.error('Equipment error:', err);
              return [];
            }),
            getAllOperators().catch((err: any) => {
              console.error('Operators error:', err);
              return [];
            }),
            getDeals().catch((err: any) => {
              console.error('Deals error:', err);
              return [];
            }),
          ]);

        const extractData = (response: any) => {
          if (Array.isArray(response)) {
            return response;
          } else if (
            response &&
            typeof response === 'object' &&
            response.data &&
            Array.isArray(response.data)
          ) {
            return response.data;
          } else if (
            response &&
            typeof response === 'object' &&
            response.success &&
            Array.isArray(response.data)
          ) {
            return response.data;
          }
          return [];
        };

        const leadsData = extractData(leadsResponse);
        const jobsData = extractData(jobsResponse);
        const equipmentData = extractData(equipmentResponse);
        const operatorsData = extractData(operatorsResponse);
        const dealsData = extractData(dealsResponse);

        setLeads(leadsData);
        setJobs(jobsData);
        setEquipmentCount(equipmentData.length);
        setOperatorCount(operatorsData.length);
        setEquipment(equipmentData);
        setDeals(dealsData);
      } catch (error: any) {
        console.error('❌ Error fetching dashboard data:', error);
        setError(`Failed to load dashboard data: ${error?.message || error}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  // Memoized calculations for performance
  const totalRevenue = useMemo(() => {
    if (Array.isArray(deals) && deals.length > 0) {
      // Include all deal stages: qualification, proposal, negotiation, won, and lost
      return deals.reduce((total, deal) => total + (deal.value || 0), 0);
    }
    return 0;
  }, [deals]);

  const activeEquipmentCount = useMemo(() => {
    try {
      if (Array.isArray(equipment) && equipment.length > 0) {
        const availableCount = equipment.filter(eq => eq && eq.status === 'available').length;
        console.log('Equipment calculation:', {
          total: equipment.length,
          available: availableCount,
          statuses: equipment.map(eq => eq?.status).filter(Boolean),
        });
        return availableCount;
      }
    } catch (error) {
      console.error('Error calculating equipment count:', error);
    }
    return 0;
  }, [equipment]);

  const activeJobsCount = useMemo(() => {
    try {
      if (Array.isArray(jobs) && jobs.length > 0) {
        return jobs.filter(
          job => job && (job.status === 'in_progress' || job.status === 'scheduled')
        ).length;
      }
    } catch (error) {
      console.error('Error calculating active jobs:', error);
    }
    return 0;
  }, [jobs]);

  const equipmentUtilization = useMemo(
    () =>
      Array.isArray(jobs)
        ? (jobs.filter(job => job.status === 'in_progress' || job.status === 'scheduled').length /
            (equipmentCount || 1)) *
          100
        : 0,
    [jobs, equipmentCount]
  );

  // Chart data with enhanced styling
  const monthlyRevenueData = useMemo(
    () => ({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Monthly Revenue',
          data: [150000, 200000, 180000, 220000, 250000, totalRevenue > 0 ? totalRevenue : 300000],
          backgroundColor: 'rgba(56, 81, 159, 0.1)',
          borderColor: '#38519F',
          pointBackgroundColor: '#FFCC3F',
          pointBorderColor: '#38519F',
          pointHoverBackgroundColor: '#38519F',
          pointHoverBorderColor: '#FFCC3F',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
        },
      ],
    }),
    [totalRevenue]
  );

  const equipmentStatusData = useMemo(
    () => ({
      labels: ['Available', 'In Use', 'Maintenance'],
      datasets: [
        {
          data: [
            Array.isArray(equipment) ? equipment.filter(e => e.status === 'available').length : 0,
            Array.isArray(equipment) ? equipment.filter(e => e.status === 'in_use').length : 0,
            Array.isArray(equipment) ? equipment.filter(e => e.status === 'maintenance').length : 0,
          ],
          backgroundColor: ['#22C55E', '#38519F', '#FFCC3F'],
          borderColor: ['#16A34A', '#38519F', '#FFCC3F'],
          borderWidth: 2,
          hoverBorderWidth: 4,
        },
      ],
    }),
    [equipment]
  );

  const jobStatusData = useMemo(
    () => ({
      labels: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      datasets: [
        {
          label: 'Jobs by Status',
          data: [
            Array.isArray(jobs) ? jobs.filter(j => j.status === 'scheduled').length : 0,
            Array.isArray(jobs) ? jobs.filter(j => j.status === 'in_progress').length : 0,
            Array.isArray(jobs) ? jobs.filter(j => j.status === 'completed').length : 0,
            Array.isArray(jobs) ? jobs.filter(j => j.status === 'cancelled').length : 0,
          ],
          backgroundColor: [
            'rgba(56, 81, 159, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(64, 64, 64, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: ['#38519F', '#22C55E', '#404040', '#EF4444'],
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    }),
    [jobs]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-6">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="relative">
            <div className="h-20 w-20 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
            <div
              className="absolute inset-0 h-20 w-20 border-4 border-transparent border-t-brand-gold rounded-full animate-spin animate-reverse"
              style={{ animationDelay: '0.2s', animationDuration: '1.5s' }}
            />
          </div>
          <div className="mt-6 text-center">
            <h3 className="text-lg font-semibold text-brand-blue">Loading Dashboard</h3>
            <p className="text-sm text-gray-600 mt-1">Fetching your data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-6">
        <div className="flex justify-center py-20">
          <Card variant="bordered" className="max-w-md bg-red-50 border-red-200">
            <CardContent className="text-center p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Retry
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <div className="p-6 space-y-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-blue to-brand-blue/80 bg-clip-text text-transparent">
                Welcome back, {user?.name || 'Admin'}
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your business today.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <section
          className="grid gap-6 auto-fit-grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
          role="region"
          aria-label="Key Performance Indicators"
        >
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={<IndianRupee className="h-5 w-5" />}
            variant="primary"
            trend={{
              value: 12.5,
              isPositive: true,
            }}
            loading={isLoading}
          />
          <StatCard
            title="Equipment Fleet"
            value={activeEquipmentCount}
            subtitle="Available units"
            icon={<Truck className="h-5 w-5" />}
            variant="success"
            trend={{
              value: 8.2,
              isPositive: true,
            }}
            loading={isLoading}
          />
          <StatCard
            title="Active Jobs"
            value={activeJobsCount}
            subtitle="In progress"
            icon={<Activity className="h-5 w-5" />}
            variant="warning"
            trend={{
              value: 3.1,
              isPositive: false,
            }}
            loading={isLoading}
          />
          <StatCard
            title="Operators"
            value={operatorCount}
            subtitle="Available staff"
            icon={<Users className="h-5 w-5" />}
            variant="accent"
            trend={{
              value: 5.7,
              isPositive: true,
            }}
            loading={isLoading}
          />
        </section>

        {/* Charts Section */}
        <section
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          role="region"
          aria-label="Analytics Charts"
        >
          <Card variant="glass" className="col-span-1">
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <PieChart className="h-4 w-4 text-green-600" />
                </div>
                <CardTitle className="text-lg">Equipment Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <MemoizedDoughnutChart data={equipmentStatusData} height={240} />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="col-span-1">
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Monthly Revenue</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <MemoizedLineChart data={monthlyRevenueData} height={240} />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="col-span-1">
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Jobs by Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <MemoizedBarChart data={jobStatusData} height={240} />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Main Content */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivities className="h-full" />
          </div>

          <div className="space-y-6">
            {/* Equipment Summary */}
            <Card variant="gradient" className="h-fit">
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-brand-blue/10 rounded-lg">
                    <Truck className="h-4 w-4 text-brand-blue" />
                  </div>
                  <CardTitle className="text-lg">Equipment Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Available Equipment:</span>
                    <span className="text-sm font-semibold text-green-600">
                      {Array.isArray(equipment)
                        ? equipment.filter(e => e.status === 'available').length
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">In Use:</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {Array.isArray(equipment)
                        ? equipment.filter(e => e.status === 'in_use').length
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Under Maintenance:</span>
                    <span className="text-sm font-semibold text-orange-600">
                      {Array.isArray(equipment)
                        ? equipment.filter(e => e.status === 'maintenance').length
                        : 0}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Utilization Rate:</span>
                      <span className="text-sm font-semibold text-brand-blue">
                        {equipmentCount > 0 ? Math.round(equipmentUtilization) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Overview */}
            <Card variant="gradient" className="h-fit">
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-brand-gold/10 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-brand-gold" />
                  </div>
                  <CardTitle className="text-lg">Business Overview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Leads:</span>
                    <span className="text-sm font-semibold text-blue-600">{leads.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Deals:</span>
                    <span className="text-sm font-semibold text-green-600">
                      {Array.isArray(deals) ? deals.length : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Won Deals:</span>
                    <span className="text-sm font-semibold text-green-600">
                      {Array.isArray(deals) ? deals.filter(d => d.stage === 'won').length : 0}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Conversion Rate:</span>
                      <span className="text-sm font-semibold text-brand-blue">
                        {leads.length > 0
                          ? Math.round(
                              ((Array.isArray(deals) ? deals.length : 0) / leads.length) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

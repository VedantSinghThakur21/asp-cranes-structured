/**
 * Dashboard API Service
 * Handles API calls for dashboard analytics and data
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface DashboardAnalytics {
  timeRange: number;
  startDate: string;
  endDate: string;
  revenue: {
    total: number;
    growth: number;
    dealsCount: number;
    avgDealSize: number;
  };
  leads: {
    total: number;
    qualified: number;
    converted: number;
    qualificationRate: number;
    conversionRate: number;
  };
  deals: {
    total: number;
    won: number;
    lost: number;
    winRate: number;
    avgCycleDays: number;
  };
  customers: {
    total: number;
    active: number;
  };
  quotations: {
    total: number;
    approved: number;
    approvalRate: number;
    approvedValue: number;
  };
  recentActivities: Array<{
    type: string;
    id: string;
    title: string;
    status: string;
    createdAt: string;
    createdBy: string;
  }>;
}

interface RevenueChartData {
  month: string;
  monthName: string;
  revenue: number;
  deals: number;
}

interface PipelineData {
  stage: string;
  count: number;
  value: number;
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  time: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

class DashboardService {
  private getAuthHeaders() {
    const token = localStorage.getItem('jwt-token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getDashboardAnalytics(timeRange: number = 30): Promise<DashboardAnalytics> {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/analytics?timeRange=${timeRange}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch dashboard analytics');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  }

  async getRevenueChart(months: number = 12): Promise<RevenueChartData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/revenue-chart?months=${months}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch revenue chart data');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching revenue chart:', error);
      throw error;
    }
  }

  async getPipelineOverview(): Promise<PipelineData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/pipeline-overview`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch pipeline overview');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching pipeline overview:', error);
      throw error;
    }
  }

  async getNotifications(limit: number = 10): Promise<Notification[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch notifications');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
export type { DashboardAnalytics, RevenueChartData, PipelineData, Notification };

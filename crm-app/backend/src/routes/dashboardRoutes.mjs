/**
 * Dashboard Analytics API Routes
 * 
 * Provides aggregated data for d    ];

    console.log('📊 Dashboard data aggregated successfully:', {
      revenue: revenueData,
      leads: leadsData,
      deals: dealsData,
      customers: customersData,
      quotations: quotationsData,
      activities: recentActivities.length
    });

    const analytics = {board analytics from existing database tables
 */

import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { authenticateToken } from '../authMiddleware.mjs';

dotenv.config();

const router = express.Router();

// Database connection
let pool;
try {
  pool = new pg.Pool({
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'asp_crm',
    user: process.env.DB_USER || 'asp_user',
    password: process.env.DB_PASSWORD || 'asp_password',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} catch (error) {
  console.error('Failed to create database pool:', error);
}

/**
 * Async handler for route error handling
 */
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(error => {
    console.error(`Dashboard API Error: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  });
};

/**
 * GET /api/dashboard/analytics
 * Get comprehensive dashboard analytics data
 */
router.get(
  '/analytics',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { timeRange = '30' } = req.query; // days
    const days = parseInt(timeRange, 10);

    console.log(`📊 Dashboard analytics request - timeRange: ${days} days, user: ${req.user?.uid}`);

    try {
      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Parallel queries for better performance
      const [revenueData, leadsData, dealsData, customersData, quotationsData, recentActivities] =
        await Promise.all([
          getRevenueMetrics(pool, startDate, endDate),
          getLeadsMetrics(pool, startDate, endDate),
          getDealsMetrics(pool, startDate, endDate),
          getCustomersMetrics(pool, startDate, endDate),
          getQuotationsMetrics(pool, startDate, endDate),
          getRecentActivities(pool, 10),
        ]);

      const analytics = {
        timeRange: days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        revenue: revenueData,
        leads: leadsData,
        deals: dealsData,
        customers: customersData,
        quotations: quotationsData,
        recentActivities,
      };

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      throw error;
    }
  })
);

/**
 * GET /api/dashboard/revenue-chart
 * Get revenue chart data by month
 */
router.get(
  '/revenue-chart',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { months = '12' } = req.query;
    const monthsCount = parseInt(months, 10);

    console.log(`📈 Revenue chart request - months: ${monthsCount}, user: ${req.user?.uid}`);

    const query = `
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      COUNT(*) as deals_count,
      COALESCE(SUM(CAST(value AS NUMERIC)), 0) as total_revenue
    FROM deals 
    WHERE created_at >= NOW() - INTERVAL '${monthsCount} months'
      AND stage = 'won'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC
  `;

    const result = await pool.query(query);

    const chartData = result.rows.map(row => ({
      month: row.month,
      monthName: new Date(row.month).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      revenue: parseFloat(row.total_revenue),
      deals: parseInt(row.deals_count),
    }));

    res.json({
      success: true,
      data: chartData,
    });
  })
);

/**
 * GET /api/dashboard/pipeline-overview
 * Get sales pipeline overview
 */
router.get(
  '/pipeline-overview',
  authenticateToken,
  asyncHandler(async (req, res) => {
    console.log(`🔄 Pipeline overview request - user: ${req.user?.uid}`);

    const query = `
    SELECT 
      stage,
      COUNT(*) as count,
      COALESCE(SUM(CAST(value AS NUMERIC)), 0) as total_value
    FROM deals 
    WHERE stage != 'lost' AND stage != 'won'
    GROUP BY stage
    ORDER BY 
      CASE stage
        WHEN 'qualification' THEN 1
        WHEN 'proposal' THEN 2
        WHEN 'negotiation' THEN 3
        WHEN 'won' THEN 4
        ELSE 5
      END
  `;

    const result = await pool.query(query);

    const pipelineData = result.rows.map(row => ({
      stage: row.stage,
      count: parseInt(row.count),
      value: parseFloat(row.total_value),
    }));

    res.json({
      success: true,
      data: pipelineData,
    });
  })
);

// Helper functions for data aggregation

async function getRevenueMetrics(pool, startDate, endDate) {
  const query = `
    SELECT 
      COALESCE(SUM(CAST(value AS NUMERIC)), 0) as total_revenue,
      COUNT(*) as deals_count,
      COALESCE(AVG(CAST(value AS NUMERIC)), 0) as avg_deal_size
    FROM deals 
    WHERE stage = 'won' 
      AND created_at >= $1 
      AND created_at <= $2
  `;

  const result = await pool.query(query, [startDate, endDate]);
  const current = result.rows[0];

  // Get previous period for comparison
  const prevStartDate = new Date(startDate);
  const prevEndDate = new Date(startDate);
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  prevStartDate.setDate(prevStartDate.getDate() - daysDiff);

  const prevQuery = `
    SELECT COALESCE(SUM(CAST(value AS NUMERIC)), 0) as total_revenue
    FROM deals 
    WHERE stage = 'won' 
      AND created_at >= $1 
      AND created_at < $2
  `;

  const prevResult = await pool.query(prevQuery, [prevStartDate, prevEndDate]);
  const previousRevenue = parseFloat(prevResult.rows[0].total_revenue);
  const currentRevenue = parseFloat(current.total_revenue);

  const growth =
    previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  return {
    total: currentRevenue,
    growth: growth,
    dealsCount: parseInt(current.deals_count),
    avgDealSize: parseFloat(current.avg_deal_size),
  };
}

async function getLeadsMetrics(pool, startDate, endDate) {
  const query = `
    SELECT 
      COUNT(*) as total_leads,
      COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_leads,
      COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads
    FROM leads 
    WHERE created_at >= $1 AND created_at <= $2
  `;

  const result = await pool.query(query, [startDate, endDate]);
  const data = result.rows[0];

  const total = parseInt(data.total_leads);
  const qualified = parseInt(data.qualified_leads);
  const converted = parseInt(data.converted_leads);

  return {
    total,
    qualified,
    converted,
    qualificationRate: total > 0 ? (qualified / total) * 100 : 0,
    conversionRate: qualified > 0 ? (converted / qualified) * 100 : 0,
  };
}

async function getDealsMetrics(pool, startDate, endDate) {
  const query = `
    SELECT 
      COUNT(*) as total_deals,
      COUNT(CASE WHEN stage = 'won' THEN 1 END) as won_deals,
      COUNT(CASE WHEN stage = 'lost' THEN 1 END) as lost_deals,
      COALESCE(AVG(
        CASE WHEN stage IN ('won', 'lost') 
        THEN EXTRACT(EPOCH FROM (updated_at - created_at))/86400 
        END
      ), 0) as avg_cycle_days
    FROM deals 
    WHERE created_at >= $1 AND created_at <= $2
  `;

  const result = await pool.query(query, [startDate, endDate]);
  const data = result.rows[0];

  const total = parseInt(data.total_deals);
  const won = parseInt(data.won_deals);
  const lost = parseInt(data.lost_deals);

  return {
    total,
    won,
    lost,
    winRate: won + lost > 0 ? (won / (won + lost)) * 100 : 0,
    avgCycleDays: Math.round(parseFloat(data.avg_cycle_days)),
  };
}

async function getCustomersMetrics(pool, startDate, endDate) {
  // Get total customers created in the time range
  const totalQuery = `
    SELECT COUNT(*) as total_customers
    FROM customers 
    WHERE created_at >= $1 AND created_at <= $2
  `;

  // Get active customers (those with recent deals or leads in last 90 days)
  const activeQuery = `
    SELECT COUNT(DISTINCT c.id) as active_customers
    FROM customers c
    WHERE c.created_at >= $1 AND c.created_at <= $2
      AND (
        EXISTS (SELECT 1 FROM deals d WHERE d.customer_id = c.id AND d.created_at >= NOW() - INTERVAL '90 days')
        OR EXISTS (SELECT 1 FROM leads l WHERE l.customer_id = c.id AND l.created_at >= NOW() - INTERVAL '90 days')
      )
  `;

  const [totalResult, activeResult] = await Promise.all([
    pool.query(totalQuery, [startDate, endDate]),
    pool.query(activeQuery, [startDate, endDate]),
  ]);

  return {
    total: parseInt(totalResult.rows[0].total_customers),
    active: parseInt(activeResult.rows[0].active_customers),
  };
}

async function getQuotationsMetrics(pool, startDate, endDate) {
  const query = `
    SELECT 
      COUNT(*) as total_quotations,
      COUNT(CASE WHEN status = 'accepted' THEN 1 END) as approved_quotations,
      COALESCE(SUM(
        CASE WHEN status = 'accepted' 
        THEN CAST(total_cost AS NUMERIC) 
        END
      ), 0) as approved_value
    FROM quotations 
    WHERE created_at >= $1 AND created_at <= $2
  `;

  const result = await pool.query(query, [startDate, endDate]);
  const data = result.rows[0];

  const total = parseInt(data.total_quotations);
  const approved = parseInt(data.approved_quotations);

  return {
    total,
    approved,
    approvalRate: total > 0 ? (approved / total) * 100 : 0,
    approvedValue: parseFloat(data.approved_value),
  };
}

async function getRecentActivities(pool, limit = 10) {
  // Combine recent activities from multiple tables
  const query = `
    (
      SELECT 'lead' as type, id, company_name as title, status, created_at, assigned_to as created_by
      FROM leads 
      ORDER BY created_at DESC 
      LIMIT $1
    )
    UNION ALL
    (
      SELECT 'deal' as type, id, title, stage as status, created_at, created_by
      FROM deals 
      ORDER BY created_at DESC 
      LIMIT $1
    )
    UNION ALL
    (
      SELECT 'customer' as type, id, company_name as title, 'active' as status, created_at, 'system' as created_by
      FROM customers 
      ORDER BY created_at DESC 
      LIMIT $1
    )
    ORDER BY created_at DESC 
    LIMIT $1
  `;

  const result = await pool.query(query, [limit]);

  return result.rows.map(row => ({
    type: row.type,
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }));
}

export default router;

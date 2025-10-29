import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { authenticateToken } from '../authMiddleware.mjs';
import notificationEngine from '../services/notificationEngine.js';

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

// ========== REAL-TIME NOTIFICATIONS ==========

// GET /api/notifications - Get real-time notifications based on recent activities
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user?.id;

    // Get user-specific notifications first
    const userNotificationsQuery = `
      SELECT 
        id,
        title,
        message,
        type,
        priority,
        is_read,
        created_at,
        reference_id,
        reference_type
      FROM notifications 
      WHERE user_id = $1 
      AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC 
      LIMIT $2
    `;

    const userNotifications = await pool.query(userNotificationsQuery, [userId, limit]);

    // Transform to expected format
    const notifications = userNotifications.rows.map(notification => ({
      id: notification.id,
      type: getPriorityType(notification.priority),
      title: notification.title,
      message: notification.message,
      time: getTimeAgo(notification.created_at),
      icon: getIconForType(notification.type),
      priority: notification.priority,
      isRead: notification.is_read,
      referenceId: notification.reference_id,
      referenceType: notification.reference_type,
    }));

    // If no user notifications, generate dynamic notifications based on recent activities
    if (notifications.length === 0) {
      const dynamicNotifications = await generateDynamicNotifications(limit);
      notifications.push(...dynamicNotifications);
    }

    res.json({
      success: true,
      data: notifications,
      total: notifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  }
});

// POST /api/notifications/send - Send notification manually
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const {
      type,
      recipients = [],
      data = {},
      channels = ['in_app'],
      priority = 'medium',
      scheduleAt = null,
    } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Notification type is required',
      });
    }

    const result = await notificationEngine.sendNotification({
      type,
      recipients,
      data,
      channels,
      priority,
      scheduleAt,
    });

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const query = `
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  }
});

// POST /api/notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    const query = `
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE user_id = $1 AND is_read = FALSE
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      message: `${result.rowCount} notifications marked as read`,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  }
});

// ========== NOTIFICATION PREFERENCES ==========

// GET /api/notifications/preferences - Get user notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    const query = `
      SELECT notification_type, channels, is_enabled, quiet_hours_start, quiet_hours_end, timezone
      FROM user_notification_preferences 
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  }
});

// PUT /api/notifications/preferences - Update user notification preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { preferences } = req.body;

    if (!preferences || !Array.isArray(preferences)) {
      return res.status(400).json({
        success: false,
        message: 'Preferences array is required',
      });
    }

    // Update or insert preferences
    for (const pref of preferences) {
      const query = `
        INSERT INTO user_notification_preferences 
        (user_id, notification_type, channels, is_enabled, quiet_hours_start, quiet_hours_end, timezone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, notification_type) 
        DO UPDATE SET 
          channels = EXCLUDED.channels,
          is_enabled = EXCLUDED.is_enabled,
          quiet_hours_start = EXCLUDED.quiet_hours_start,
          quiet_hours_end = EXCLUDED.quiet_hours_end,
          timezone = EXCLUDED.timezone,
          updated_at = CURRENT_TIMESTAMP
      `;

      await pool.query(query, [
        userId,
        pref.notification_type,
        JSON.stringify(pref.channels),
        pref.is_enabled,
        pref.quiet_hours_start,
        pref.quiet_hours_end,
        pref.timezone || 'Asia/Kolkata',
      ]);
    }

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  }
});

// ========== NOTIFICATION ANALYTICS ==========

// GET /api/notifications/analytics - Get notification analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user?.id;

    // Get notification statistics
    const statsQuery = `
      SELECT 
        type,
        COUNT(*) as total_count,
        SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read_count,
        COUNT(*) - SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as unread_count
      FROM notifications 
      WHERE user_id = $1
      ${startDate ? 'AND created_at >= $2' : ''}
      ${endDate ? 'AND created_at <= $3' : ''}
      GROUP BY type
      ORDER BY total_count DESC
    `;

    const params = [userId];
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);

    const stats = await pool.query(statsQuery, params);

    // Get delivery statistics from logs
    const deliveryStatsQuery = `
      SELECT 
        channel,
        COUNT(*) as total_sent,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
        COUNT(*) - SUM(CASE WHEN success THEN 1 ELSE 0 END) as failed
      FROM notification_logs 
      WHERE user_id = $1
      ${startDate ? 'AND sent_at >= $2' : ''}
      ${endDate ? 'AND sent_at <= $3' : ''}
      GROUP BY channel
    `;

    const deliveryStats = await pool.query(deliveryStatsQuery, params);

    res.json({
      success: true,
      data: {
        notificationStats: stats.rows,
        deliveryStats: deliveryStats.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching notification analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification analytics',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  }
});

// ========== HELPER FUNCTIONS ==========

// Generate dynamic notifications based on recent activities (fallback)
async function generateDynamicNotifications(limit) {
  const notifications = [];

  try {
    // Check for recently won deals
    const recentDealsQuery = `
      SELECT id, title, value, updated_at 
      FROM deals 
      WHERE stage = 'won' 
        AND updated_at >= NOW() - INTERVAL '24 hours'
      ORDER BY updated_at DESC 
      LIMIT 3
    `;

    // Check for new leads that need follow-up
    const followUpLeadsQuery = `
      SELECT COUNT(*) as count
      FROM leads 
      WHERE status = 'new' 
        AND created_at >= NOW() - INTERVAL '24 hours'
    `;

    // Check for leads that need follow-up (older than 24 hours without contact)
    const overDueLeadsQuery = `
      SELECT COUNT(*) as count
      FROM leads 
      WHERE status IN ('new', 'contacted') 
        AND updated_at <= NOW() - INTERVAL '24 hours'
    `;

    // Check for new customers
    const newCustomersQuery = `
      SELECT id, company_name, created_at
      FROM customers 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC 
      LIMIT 2
    `;

    const [recentDeals, followUpLeads, overDueLeads, newCustomers] = await Promise.all([
      pool.query(recentDealsQuery),
      pool.query(followUpLeadsQuery),
      pool.query(overDueLeadsQuery),
      pool.query(newCustomersQuery),
    ]);

    // Create notifications for recent deals
    recentDeals.rows.forEach((deal, index) => {
      notifications.push({
        id: `deal-${deal.id}`,
        type: 'success',
        title: 'Deal Closed!',
        message: `${deal.title} worth ₹${parseFloat(deal.value).toLocaleString()} just closed`,
        time: getTimeAgo(deal.updated_at),
        icon: 'trophy',
        priority: 'high',
      });
    });

    // Create notification for follow-up leads
    const followUpCount = parseInt(followUpLeads.rows[0].count);
    if (followUpCount > 0) {
      notifications.push({
        id: 'followup-leads',
        type: 'warning',
        title: 'Follow-up Required',
        message: `${followUpCount} new lead${followUpCount > 1 ? 's' : ''} need${followUpCount === 1 ? 's' : ''} attention`,
        time: 'Today',
        icon: 'clock',
        priority: 'medium',
      });
    }

    // Create notification for overdue leads
    const overDueCount = parseInt(overDueLeads.rows[0].count);
    if (overDueCount > 0) {
      notifications.push({
        id: 'overdue-leads',
        type: 'warning',
        title: 'Overdue Follow-ups',
        message: `${overDueCount} lead${overDueCount > 1 ? 's' : ''} haven't been contacted in 24+ hours`,
        time: 'Overdue',
        icon: 'alert-circle',
        priority: 'high',
      });
    }

    // Create notifications for new customers
    newCustomers.rows.forEach((customer, index) => {
      notifications.push({
        id: `customer-${customer.id}`,
        type: 'info',
        title: 'New Customer',
        message: `${customer.company_name} was added to the system`,
        time: getTimeAgo(customer.created_at),
        icon: 'users',
        priority: 'low',
      });
    });
  } catch (error) {
    console.error('Error generating dynamic notifications:', error);
  }

  // Sort by priority and time, limit results
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return notifications
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    .slice(0, limit);
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString();
}

// Helper function to get priority type for UI
function getPriorityType(priority) {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'info';
  }
}

// Helper function to get icon for notification type
function getIconForType(type) {
  const iconMap = {
    lead_created: 'users',
    quotation_created: 'file-text',
    job_assigned: 'briefcase',
    deal_won: 'trophy',
    followup_reminder: 'clock',
    job_completed: 'check-circle',
    payment_overdue: 'alert-circle',
  };

  return iconMap[type] || 'bell';
}

export default router;

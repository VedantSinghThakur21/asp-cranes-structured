/**
 * Advanced Notification Engine for ASP Cranes CRM
 * Handles automated notifications with multiple channels (email, SMS, in-app, push)
 */

import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { db } from '../lib/dbClient.js';
import { WebSocketServer } from 'ws';

class NotificationEngine {
  constructor() {
    this.emailTransporter = null;
    this.smsClient = null;
    this.webSocketServer = null;
    this.activeConnections = new Map(); // userId -> WebSocket connection
    this.notificationTemplates = new Map();
    this.notificationRules = new Map();

    this.initializeServices();
    this.loadTemplates();
    this.loadRules();
  }

  /**
   * Initialize external services (Email, SMS)
   */
  async initializeServices() {
    try {
      // Initialize Email Service
      if (process.env.SMTP_HOST) {
        this.emailTransporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        console.log('✅ Email service initialized');
      }

      // Initialize SMS Service
      if (process.env.TWILIO_ACCOUNT_SID) {
        this.smsClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('✅ SMS service initialized');
      }
    } catch (error) {
      console.error('❌ Error initializing notification services:', error);
    }
  }

  /**
   * Initialize WebSocket server for real-time notifications
   */
  initializeWebSocket(server) {
    this.webSocketServer = new WebSocketServer({ server });

    this.webSocketServer.on('connection', (ws, req) => {
      console.log('🔌 New WebSocket connection established');

      ws.on('message', message => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'auth' && data.userId) {
            this.activeConnections.set(data.userId, ws);
            console.log(`📱 User ${data.userId} connected for real-time notifications`);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        // Remove connection from active connections
        for (const [userId, connection] of this.activeConnections.entries()) {
          if (connection === ws) {
            this.activeConnections.delete(userId);
            console.log(`📱 User ${userId} disconnected`);
            break;
          }
        }
      });
    });
  }

  /**
   * Load notification templates from database
   */
  async loadTemplates() {
    try {
      const query = `
        SELECT template_type, subject_template, message_template, email_template, sms_template
        FROM notification_templates
        WHERE is_active = TRUE
      `;
      const result = await db.query(query);

      result.rows.forEach(template => {
        this.notificationTemplates.set(template.template_type, {
          subject: template.subject_template,
          message: template.message_template,
          email: template.email_template,
          sms: template.sms_template,
        });
      });

      console.log(`📋 Loaded ${result.rows.length} notification templates`);
    } catch (error) {
      console.error('Error loading notification templates:', error);
      this.loadDefaultTemplates();
    }
  }

  /**
   * Load default notification templates if database is not available
   */
  loadDefaultTemplates() {
    const defaultTemplates = {
      lead_created: {
        subject: 'New Lead: {{customerName}}',
        message: 'New lead received from {{customerName}} for {{serviceNeeded}}',
        email: `
          <h2>New Lead Notification</h2>
          <p>A new lead has been created:</p>
          <ul>
            <li><strong>Customer:</strong> {{customerName}}</li>
            <li><strong>Company:</strong> {{companyName}}</li>
            <li><strong>Service:</strong> {{serviceNeeded}}</li>
            <li><strong>Location:</strong> {{siteLocation}}</li>
          </ul>
          <p><a href="{{leadUrl}}">View Lead Details</a></p>
        `,
        sms: 'New lead from {{customerName}} for {{serviceNeeded}}. Check CRM for details.',
      },
      quotation_created: {
        subject: 'Quotation Created: {{quotationId}}',
        message: 'Quotation {{quotationId}} created for {{customerName}}',
        email: `
          <h2>Quotation Created</h2>
          <p>Quotation #{{quotationId}} has been created for {{customerName}}.</p>
          <ul>
            <li><strong>Amount:</strong> ₹{{totalCost}}</li>
            <li><strong>Machine:</strong> {{machineType}}</li>
            <li><strong>Duration:</strong> {{numberOfDays}} days</li>
          </ul>
          <p><a href="{{quotationUrl}}">View Quotation</a></p>
        `,
        sms: 'Quotation {{quotationId}} created for {{customerName}} - ₹{{totalCost}}',
      },
      job_assigned: {
        subject: 'Job Assignment: {{jobTitle}}',
        message: 'You have been assigned to job: {{jobTitle}}',
        email: `
          <h2>Job Assignment</h2>
          <p>You have been assigned to the following job:</p>
          <ul>
            <li><strong>Job:</strong> {{jobTitle}}</li>
            <li><strong>Customer:</strong> {{customerName}}</li>
            <li><strong>Location:</strong> {{location}}</li>
            <li><strong>Start Date:</strong> {{startDate}}</li>
          </ul>
          <p><a href="{{jobUrl}}">View Job Details</a></p>
        `,
        sms: 'Job assigned: {{jobTitle}} at {{location}} starting {{startDate}}',
      },
      deal_won: {
        subject: 'Deal Closed: {{dealTitle}}',
        message: 'Congratulations! Deal "{{dealTitle}}" worth ₹{{dealValue}} has been won!',
        email: `
          <h2>🎉 Deal Won!</h2>
          <p>Congratulations on closing the deal!</p>
          <ul>
            <li><strong>Deal:</strong> {{dealTitle}}</li>
            <li><strong>Value:</strong> ₹{{dealValue}}</li>
            <li><strong>Customer:</strong> {{customerName}}</li>
          </ul>
          <p>Great work on this success!</p>
        `,
        sms: '🎉 Deal won! {{dealTitle}} - ₹{{dealValue}} from {{customerName}}',
      },
      followup_reminder: {
        subject: 'Follow-up Reminder: {{customerName}}',
        message: 'Time to follow up with {{customerName}}',
        email: `
          <h2>Follow-up Reminder</h2>
          <p>It's time to follow up with {{customerName}}.</p>
          <ul>
            <li><strong>Last Contact:</strong> {{lastContact}}</li>
            <li><strong>Status:</strong> {{status}}</li>
            <li><strong>Service Needed:</strong> {{serviceNeeded}}</li>
          </ul>
          <p><a href="{{leadUrl}}">View Lead Details</a></p>
        `,
        sms: 'Follow-up reminder: {{customerName}} - {{serviceNeeded}}',
      },
    };

    Object.entries(defaultTemplates).forEach(([type, template]) => {
      this.notificationTemplates.set(type, template);
    });

    console.log('📋 Loaded default notification templates');
  }

  /**
   * Load notification rules from database
   */
  async loadRules() {
    try {
      const query = `
        SELECT event_type, user_roles, channels, conditions, is_active
        FROM notification_rules
        WHERE is_active = TRUE
      `;
      const result = await db.query(query);

      result.rows.forEach(rule => {
        this.notificationRules.set(rule.event_type, {
          userRoles: rule.user_roles,
          channels: rule.channels,
          conditions: rule.conditions,
          isActive: rule.is_active,
        });
      });

      console.log(`📏 Loaded ${result.rows.length} notification rules`);
    } catch (error) {
      console.error('Error loading notification rules:', error);
      this.loadDefaultRules();
    }
  }

  /**
   * Load default notification rules
   */
  loadDefaultRules() {
    const defaultRules = {
      lead_created: {
        userRoles: ['sales_agent', 'admin'],
        channels: ['in_app', 'email'],
        conditions: {},
        isActive: true,
      },
      quotation_created: {
        userRoles: ['sales_agent', 'admin'],
        channels: ['in_app', 'email'],
        conditions: {},
        isActive: true,
      },
      job_assigned: {
        userRoles: ['operator', 'operations_manager'],
        channels: ['in_app', 'email', 'sms'],
        conditions: {},
        isActive: true,
      },
      deal_won: {
        userRoles: ['sales_agent', 'admin'],
        channels: ['in_app', 'email'],
        conditions: {},
        isActive: true,
      },
      followup_reminder: {
        userRoles: ['sales_agent'],
        channels: ['in_app', 'email'],
        conditions: {},
        isActive: true,
      },
    };

    Object.entries(defaultRules).forEach(([type, rule]) => {
      this.notificationRules.set(type, rule);
    });

    console.log('📏 Loaded default notification rules');
  }

  /**
   * Main method to send notifications
   */
  async sendNotification({
    type,
    recipients = [],
    data = {},
    channels = ['in_app'],
    priority = 'medium',
    scheduleAt = null,
  }) {
    try {
      console.log(`📢 Sending notification: ${type}`);

      // If scheduled, save for later execution
      if (scheduleAt) {
        return await this.scheduleNotification({
          type,
          recipients,
          data,
          channels,
          priority,
          scheduleAt,
        });
      }

      // Get template
      const template = this.notificationTemplates.get(type);
      if (!template) {
        console.error(`❌ No template found for notification type: ${type}`);
        return false;
      }

      // Get notification rules
      const rules = this.notificationRules.get(type);
      if (!rules || !rules.isActive) {
        console.log(`⏭️ Notification type ${type} is disabled or has no rules`);
        return false;
      }

      // Determine recipients based on rules
      const finalRecipients =
        recipients.length > 0 ? recipients : await this.getUsersByRoles(rules.userRoles);
      const finalChannels = channels.length > 0 ? channels : rules.channels;

      // Send to each recipient via each channel
      const results = [];
      for (const recipient of finalRecipients) {
        for (const channel of finalChannels) {
          const result = await this.sendToChannel({
            recipient,
            channel,
            template,
            data,
            type,
            priority,
          });
          results.push(result);
        }
      }

      console.log(
        `✅ Notification sent to ${finalRecipients.length} recipients via ${finalChannels.length} channels`
      );
      return results;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send notification via specific channel
   */
  async sendToChannel({ recipient, channel, template, data, type, priority }) {
    try {
      switch (channel) {
        case 'in_app':
          return await this.sendInAppNotification({ recipient, template, data, type, priority });

        case 'email':
          return await this.sendEmailNotification({ recipient, template, data, type });

        case 'sms':
          return await this.sendSMSNotification({ recipient, template, data, type });

        case 'push':
          return await this.sendPushNotification({ recipient, template, data, type });

        default:
          console.error(`❌ Unknown notification channel: ${channel}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ Error sending ${channel} notification:`, error);
      return false;
    }
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification({ recipient, template, data, type, priority }) {
    try {
      // Render template
      const title = this.renderTemplate(template.subject, data);
      const message = this.renderTemplate(template.message, data);

      // Save to database
      const query = `
        INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, priority)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const result = await db.query(query, [
        recipient.id,
        title,
        message,
        type,
        data.referenceId || null,
        data.referenceType || null,
        priority,
      ]);

      // Send real-time notification via WebSocket
      const connection = this.activeConnections.get(recipient.id);
      if (connection && connection.readyState === 1) {
        connection.send(
          JSON.stringify({
            type: 'notification',
            id: result.rows[0].id,
            title,
            message,
            notificationType: type,
            priority,
            timestamp: new Date().toISOString(),
          })
        );
      }

      return { success: true, id: result.rows[0].id };
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification({ recipient, template, data, type }) {
    try {
      if (!this.emailTransporter) {
        console.log('📧 Email service not configured, skipping email notification');
        return { success: false, reason: 'Email service not configured' };
      }

      const subject = this.renderTemplate(template.subject, data);
      const htmlContent = this.renderTemplate(template.email, data);
      const textContent = this.renderTemplate(template.message, data);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@aspcranes.com',
        to: recipient.email,
        subject,
        text: textContent,
        html: htmlContent,
      };

      const result = await this.emailTransporter.sendMail(mailOptions);

      // Log email sent
      await this.logNotificationSent({
        userId: recipient.id,
        type,
        channel: 'email',
        recipient: recipient.email,
        success: true,
        messageId: result.messageId,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email notification:', error);

      // Log email failed
      await this.logNotificationSent({
        userId: recipient.id,
        type,
        channel: 'email',
        recipient: recipient.email,
        success: false,
        error: error.message,
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMSNotification({ recipient, template, data, type }) {
    try {
      if (!this.smsClient) {
        console.log('📱 SMS service not configured, skipping SMS notification');
        return { success: false, reason: 'SMS service not configured' };
      }

      if (!recipient.phone) {
        console.log('📱 No phone number for recipient, skipping SMS');
        return { success: false, reason: 'No phone number' };
      }

      const message = this.renderTemplate(template.sms, data);

      const result = await this.smsClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: recipient.phone,
      });

      // Log SMS sent
      await this.logNotificationSent({
        userId: recipient.id,
        type,
        channel: 'sms',
        recipient: recipient.phone,
        success: true,
        messageId: result.sid,
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('Error sending SMS notification:', error);

      // Log SMS failed
      await this.logNotificationSent({
        userId: recipient.id,
        type,
        channel: 'sms',
        recipient: recipient.phone,
        success: false,
        error: error.message,
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification (placeholder for future implementation)
   */
  async sendPushNotification({ recipient, template, data, type }) {
    console.log('🔔 Push notifications not yet implemented');
    return { success: false, reason: 'Push notifications not implemented' };
  }

  /**
   * Schedule notification for later delivery
   */
  async scheduleNotification({ type, recipients, data, channels, priority, scheduleAt }) {
    try {
      const query = `
        INSERT INTO scheduled_notifications 
        (type, recipients, data, channels, priority, scheduled_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING id
      `;

      const result = await db.query(query, [
        type,
        JSON.stringify(recipients),
        JSON.stringify(data),
        JSON.stringify(channels),
        priority,
        scheduleAt,
      ]);

      console.log(`⏰ Notification scheduled for ${scheduleAt}`);
      return { success: true, id: result.rows[0].id };
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications() {
    try {
      const query = `
        SELECT * FROM scheduled_notifications 
        WHERE status = 'pending' 
        AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 50
      `;

      const result = await db.query(query);

      for (const notification of result.rows) {
        try {
          await this.sendNotification({
            type: notification.type,
            recipients: JSON.parse(notification.recipients),
            data: JSON.parse(notification.data),
            channels: JSON.parse(notification.channels),
            priority: notification.priority,
          });

          // Mark as sent
          await db.query(
            'UPDATE scheduled_notifications SET status = $1, sent_at = NOW() WHERE id = $2',
            ['sent', notification.id]
          );
        } catch (error) {
          console.error(`Error processing scheduled notification ${notification.id}:`, error);

          // Mark as failed
          await db.query(
            'UPDATE scheduled_notifications SET status = $1, error = $2 WHERE id = $3',
            ['failed', error.message, notification.id]
          );
        }
      }

      if (result.rows.length > 0) {
        console.log(`📅 Processed ${result.rows.length} scheduled notifications`);
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }

  /**
   * Get users by roles
   */
  async getUsersByRoles(roles) {
    try {
      const query = `
        SELECT uid as id, email, display_name as name, role
        FROM users 
        WHERE role = ANY($1)
      `;

      const result = await db.query(query, [roles]);
      return result.rows;
    } catch (error) {
      console.error('Error getting users by roles:', error);
      return [];
    }
  }

  /**
   * Render template with data
   */
  renderTemplate(template, data) {
    if (!template) return '';

    let rendered = template;

    // Replace placeholders
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(placeholder, value || '');
    });

    return rendered;
  }

  /**
   * Log notification sent
   */
  async logNotificationSent({ userId, type, channel, recipient, success, messageId, error }) {
    try {
      const query = `
        INSERT INTO notification_logs 
        (user_id, type, channel, recipient, success, message_id, error, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `;

      await db.query(query, [userId, type, channel, recipient, success, messageId, error]);
    } catch (logError) {
      console.error('Error logging notification:', logError);
    }
  }

  /**
   * Start scheduled notification processor
   */
  startScheduledProcessor() {
    // Process scheduled notifications every minute
    setInterval(() => {
      this.processScheduledNotifications();
    }, 60000);

    console.log('⏰ Scheduled notification processor started');
  }
}

// Create singleton instance
const notificationEngine = new NotificationEngine();

// Export both the class and instance
export { NotificationEngine };
export default notificationEngine;

/**
 * Enhanced Notification Service for ASP Cranes CRM
 * Provides easy-to-use functions for common notification scenarios
 */

import notificationEngine from './notificationEngine.js';

/**
 * Create a simple notification
 */
export const createNotification = async notification => {
  try {
    console.log('📧 Creating notification:', notification);

    const result = await notificationEngine.sendNotification({
      type: notification.type || 'general',
      recipients: notification.recipients || [],
      data: notification.data || {},
      channels: notification.channels || ['in_app'],
      priority: notification.priority || 'medium',
    });

    return { id: Date.now(), ...notification, createdAt: new Date(), result };
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

/**
 * Send lead created notification
 */
export const sendLeadCreatedNotification = async leadData => {
  return await notificationEngine.sendNotification({
    type: 'lead_created',
    data: {
      customerName: leadData.customer_name,
      companyName: leadData.company_name,
      serviceNeeded: leadData.service_needed,
      siteLocation: leadData.site_location,
      leadUrl: `${process.env.FRONTEND_URL}/leads/${leadData.id}`,
    },
    priority: 'high',
  });
};

/**
 * Send quotation created notification
 */
export const sendQuotationCreatedNotification = async quotationData => {
  return await notificationEngine.sendNotification({
    type: 'quotation_created',
    data: {
      quotationId: quotationData.id,
      customerName: quotationData.customer_name,
      totalCost: quotationData.total_cost?.toLocaleString('en-IN'),
      machineType: quotationData.machine_type,
      numberOfDays: quotationData.number_of_days,
      quotationUrl: `${process.env.FRONTEND_URL}/quotations/${quotationData.id}`,
    },
    priority: 'medium',
  });
};

/**
 * Send job assignment notification
 */
export const sendJobAssignedNotification = async (jobData, operatorIds) => {
  const recipients = operatorIds.map(id => ({ id }));

  return await notificationEngine.sendNotification({
    type: 'job_assigned',
    recipients,
    data: {
      jobTitle: jobData.title,
      customerName: jobData.customer_name,
      location: jobData.location,
      startDate: new Date(jobData.scheduled_start_date).toLocaleDateString(),
      jobUrl: `${process.env.FRONTEND_URL}/jobs/${jobData.id}`,
    },
    channels: ['in_app', 'email', 'sms'],
    priority: 'high',
  });
};

/**
 * Send deal won notification
 */
export const sendDealWonNotification = async dealData => {
  return await notificationEngine.sendNotification({
    type: 'deal_won',
    data: {
      dealTitle: dealData.title,
      dealValue: dealData.value?.toLocaleString('en-IN'),
      customerName: dealData.customer_name,
      dealUrl: `${process.env.FRONTEND_URL}/deals/${dealData.id}`,
    },
    priority: 'high',
  });
};

/**
 * Send follow-up reminder notification
 */
export const sendFollowUpReminderNotification = async leadData => {
  return await notificationEngine.sendNotification({
    type: 'followup_reminder',
    data: {
      customerName: leadData.customer_name,
      lastContact: new Date(leadData.updated_at).toLocaleDateString(),
      status: leadData.status,
      serviceNeeded: leadData.service_needed,
      leadUrl: `${process.env.FRONTEND_URL}/leads/${leadData.id}`,
    },
    priority: 'medium',
  });
};

/**
 * Send job completed notification
 */
export const sendJobCompletedNotification = async jobData => {
  return await notificationEngine.sendNotification({
    type: 'job_completed',
    data: {
      jobTitle: jobData.title,
      customerName: jobData.customer_name,
      completedDate: new Date(jobData.actual_end_date).toLocaleDateString(),
      jobUrl: `${process.env.FRONTEND_URL}/jobs/${jobData.id}`,
    },
    priority: 'medium',
  });
};

/**
 * Send payment overdue notification
 */
export const sendPaymentOverdueNotification = async invoiceData => {
  return await notificationEngine.sendNotification({
    type: 'payment_overdue',
    data: {
      invoiceNumber: invoiceData.invoice_number,
      amount: invoiceData.amount?.toLocaleString('en-IN'),
      dueDate: new Date(invoiceData.due_date).toLocaleDateString(),
      customerName: invoiceData.customer_name,
      invoiceUrl: `${process.env.FRONTEND_URL}/invoices/${invoiceData.id}`,
    },
    priority: 'high',
  });
};

/**
 * Schedule a follow-up reminder
 */
export const scheduleFollowUpReminder = async (leadData, reminderDate) => {
  return await notificationEngine.sendNotification({
    type: 'followup_reminder',
    data: {
      customerName: leadData.customer_name,
      serviceNeeded: leadData.service_needed,
      leadUrl: `${process.env.FRONTEND_URL}/leads/${leadData.id}`,
    },
    scheduleAt: reminderDate,
    priority: 'medium',
  });
};

/**
 * Send bulk notifications to multiple users
 */
export const sendBulkNotification = async ({ type, message, userIds, priority = 'medium' }) => {
  const recipients = userIds.map(id => ({ id }));

  return await notificationEngine.sendNotification({
    type: type || 'general',
    recipients,
    data: { message },
    priority,
  });
};

/**
 * Send notification to specific user roles
 */
export const sendRoleBasedNotification = async ({ type, message, roles, priority = 'medium' }) => {
  return await notificationEngine.sendNotification({
    type: type || 'general',
    data: { message },
    priority,
  });
};

export default {
  createNotification,
  sendLeadCreatedNotification,
  sendQuotationCreatedNotification,
  sendJobAssignedNotification,
  sendDealWonNotification,
  sendFollowUpReminderNotification,
  sendJobCompletedNotification,
  sendPaymentOverdueNotification,
  scheduleFollowUpReminder,
  sendBulkNotification,
  sendRoleBasedNotification,
};

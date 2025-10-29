/**
 * API routes for job scheduling (jobs, job_equipment, job_operators)
 */
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.mjs';
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getJobEquipment,
  addJobEquipment,
  removeJobEquipment,
  getJobOperators,
  addJobOperator,
  removeJobOperator,
} from '../services/postgres/jobRepository.js';
import { createJobActivity } from '../services/activityService.js';
import {
  sendJobAssignedNotification,
  sendJobCompletedNotification,
} from '../services/notificationService.js';

const router = express.Router();

const getErrorMessage = error => {
  if (error instanceof Error) return error.message;
  return String(error);
};

// Get all jobs
router.get('/', async (_req, res) => {
  try {
    const jobs = await getJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get leads with won deals (for job scheduling dropdown)
router.get('/leads/won-deals', async (req, res) => {
  try {
    console.log('🎯 Fetching leads with won deals for job scheduling...');

    // Import required modules
    const { db } = await import('../lib/dbClient.js');

    // Query to get leads that have won deals
    const query = `
      SELECT DISTINCT l.id, l.company_name, l.contact_name, l.email, l.phone, l.status,
             d.id as deal_id, d.value as deal_value, d.stage, d.closing_date,
             l.created_at, l.updated_at
      FROM leads l
      INNER JOIN deals d ON l.id = d.lead_id
      WHERE d.stage = 'won' AND l.status = 'converted'
      ORDER BY d.closing_date DESC, l.company_name ASC
    `;

    const results = await db.any(query);

    // Transform for frontend consumption
    const transformedResults = results.map(row => ({
      id: row.id,
      companyName: row.company_name,
      contactName: row.contact_name,
      email: row.email,
      phone: row.phone,
      status: row.status,
      dealId: row.deal_id,
      dealValue: row.deal_value,
      dealStage: row.stage,
      closingDate: row.closing_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    console.log(`✅ Found ${transformedResults.length} leads with won deals`);

    res.json({
      success: true,
      data: transformedResults,
      count: transformedResults.length,
    });
  } catch (error) {
    console.error('❌ Error fetching leads with won deals:', error);
    res.status(500).json({
      success: false,
      error: getErrorMessage(error),
    });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Create job
router.post('/', authenticateToken, async (req, res) => {
  try {
    const job = await createJob(req.body);

    // Create activity for job creation
    try {
      await createJobActivity(job.customerName, 'created', job.createdBy || 'System');
    } catch (activityError) {
      console.error('Error creating activity:', activityError);
      // Don't fail the job creation if activity creation fails
    }

    // Send notifications for job assignment
    try {
      if (job.operatorIds && job.operatorIds.length > 0) {
        await sendJobAssignedNotification(job, job.operatorIds);
        console.log(`📧 Job assignment notifications sent for job ${job.id}`);
      }
    } catch (notificationError) {
      console.error('Error sending job assignment notifications:', notificationError);
      // Don't fail the job creation if notification sending fails
    }

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Update job
router.put('/:id', async (req, res) => {
  try {
    const job = await updateJob(req.params.id, req.body);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Check if job status changed to completed
    if (req.body.status === 'completed' && job.status === 'completed') {
      try {
        await sendJobCompletedNotification(job);
        console.log(`📧 Job completion notification sent for job ${job.id}`);
      } catch (notificationError) {
        console.error('Error sending job completion notification:', notificationError);
      }
    }

    // Check if new operators were assigned
    if (req.body.operatorIds && req.body.operatorIds.length > 0) {
      // Find newly assigned operators (this is a simplified check)
      try {
        await sendJobAssignedNotification(job, req.body.operatorIds);
        console.log(`📧 Job assignment notifications sent for updated job ${job.id}`);
      } catch (notificationError) {
        console.error('Error sending job assignment notifications:', notificationError);
      }
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Delete job
router.delete('/:id', async (req, res) => {
  try {
    const success = await deleteJob(req.params.id);
    if (!success) return res.status(404).json({ error: 'Job not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Job Equipment endpoints
router.get('/:id/equipment', async (req, res) => {
  try {
    const equipment = await getJobEquipment(req.params.id);
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
router.post('/:id/equipment', authenticateToken, async (req, res) => {
  try {
    const { equipmentId } = req.body;
    const result = await addJobEquipment(req.params.id, equipmentId);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
router.delete('/:id/equipment/:equipmentId', async (req, res) => {
  try {
    const success = await removeJobEquipment(req.params.id, req.params.equipmentId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Job Operators endpoints
router.get('/:id/operators', async (req, res) => {
  try {
    const operators = await getJobOperators(req.params.id);
    res.json(operators);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
router.post('/:id/operators', authenticateToken, async (req, res) => {
  try {
    const { operatorId } = req.body;
    const result = await addJobOperator(req.params.id, operatorId);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
router.delete('/:id/operators/:operatorId', async (req, res) => {
  try {
    const success = await removeJobOperator(req.params.id, req.params.operatorId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;

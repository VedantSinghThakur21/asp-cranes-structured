// Enhanced jobRepository using centralized db client
import { db } from '../../lib/dbClient.js';

export const getJobs = async () => {
  try {
    console.log('📋 Fetching all jobs...');
    const jobs = await db.any('SELECT * FROM jobs ORDER BY created_at DESC');
    console.log(`✅ Found ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error('❌ Error fetching jobs:', error);
    return [];
  }
};

export const getJobById = async id => {
  try {
    console.log(`🔍 Fetching job by ID: ${id}`);
    const job = await db.oneOrNone('SELECT * FROM jobs WHERE id = $1', [id]);
    console.log(`📝 Job found: ${job ? 'Yes' : 'No'}`);
    return job;
  } catch (error) {
    console.error('❌ Error fetching job by ID:', error);
    return null;
  }
};

export const createJob = async jobData => {
  try {
    console.log('🆕 Creating new job...');
    const result = await db.one(
      `INSERT INTO jobs (title, description, status, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
      [jobData.title, jobData.description, jobData.status || 'pending']
    );
    console.log(`✅ Job created successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error creating job:', error);
    throw error;
  }
};

export const updateJob = async (id, jobData) => {
  try {
    console.log(`📝 Updating job: ${id}`);
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (jobData.title) {
      updates.push(`title = $${paramIndex++}`);
      values.push(jobData.title);
    }
    if (jobData.description) {
      updates.push(`description = $${paramIndex++}`);
      values.push(jobData.description);
    }
    if (jobData.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(jobData.status);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE jobs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.one(query, values);
    console.log(`✅ Job updated successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error updating job:', error);
    throw error;
  }
};

export const deleteJob = async id => {
  try {
    console.log(`🗑️ Deleting job: ${id}`);
    await db.none('DELETE FROM jobs WHERE id = $1', [id]);
    console.log(`✅ Job deleted successfully: ${id}`);
  } catch (error) {
    console.error('❌ Error deleting job:', error);
    throw error;
  }
};

export const getJobEquipment = async jobId => {
  try {
    console.log(`📋 Fetching equipment for job: ${jobId}`);
    const equipment = await db.any('SELECT * FROM job_equipment WHERE job_id = $1', [jobId]);
    console.log(`✅ Found ${equipment.length} equipment items for job`);
    return equipment;
  } catch (error) {
    console.error('❌ Error fetching job equipment:', error);
    return [];
  }
};

export const addJobEquipment = async (jobId, equipmentId) => {
  try {
    console.log(`🔗 Adding equipment ${equipmentId} to job ${jobId}`);
    const result = await db.one(
      'INSERT INTO job_equipment (job_id, equipment_id, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [jobId, equipmentId]
    );
    console.log(`✅ Equipment added to job successfully`);
    return result;
  } catch (error) {
    console.error('❌ Error adding job equipment:', error);
    throw error;
  }
};

export const removeJobEquipment = async (jobId, equipmentId) => {
  try {
    console.log(`🗑️ Removing equipment ${equipmentId} from job ${jobId}`);
    await db.none('DELETE FROM job_equipment WHERE job_id = $1 AND equipment_id = $2', [
      jobId,
      equipmentId,
    ]);
    console.log(`✅ Equipment removed from job successfully`);
  } catch (error) {
    console.error('❌ Error removing job equipment:', error);
    throw error;
  }
};

export const getJobOperators = async jobId => {
  try {
    console.log(`👥 Fetching operators for job: ${jobId}`);
    const operators = await db.any('SELECT * FROM job_operators WHERE job_id = $1', [jobId]);
    console.log(`✅ Found ${operators.length} operators for job`);
    return operators;
  } catch (error) {
    console.error('❌ Error fetching job operators:', error);
    return [];
  }
};

export const addJobOperator = async (jobId, operatorId) => {
  try {
    console.log(`🔗 Adding operator ${operatorId} to job ${jobId}`);
    const result = await db.one(
      'INSERT INTO job_operators (job_id, operator_id, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [jobId, operatorId]
    );
    console.log(`✅ Operator added to job successfully`);
    return result;
  } catch (error) {
    console.error('❌ Error adding job operator:', error);
    throw error;
  }
};

export const removeJobOperator = async (jobId, operatorId) => {
  try {
    console.log(`🗑️ Removing operator ${operatorId} from job ${jobId}`);
    await db.none('DELETE FROM job_operators WHERE job_id = $1 AND operator_id = $2', [
      jobId,
      operatorId,
    ]);
    console.log(`✅ Operator removed from job successfully`);
  } catch (error) {
    console.error('❌ Error removing job operator:', error);
    throw error;
  }
};

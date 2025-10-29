/**
 * MFA Repository Functions
 * Database operations for Multi-Factor Authentication
 */

import pool from '../../lib/dbConnection.js';
import bcrypt from 'bcrypt';

/**
 * Store temporary MFA secret during setup process
 */
export async function storeTempMFASecret(userId, secret) {
  const client = await pool.connect();
  try {
    // Remove any existing temp secret for this user
    await client.query('DELETE FROM user_mfa_temp_secrets WHERE user_id = $1', [userId]);

    // Store new temp secret
    await client.query('INSERT INTO user_mfa_temp_secrets (user_id, temp_secret) VALUES ($1, $2)', [
      userId,
      secret,
    ]);
  } finally {
    client.release();
  }
}

/**
 * Get temporary MFA secret for user
 */
export async function getTempMFASecret(userId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT temp_secret FROM user_mfa_temp_secrets WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP',
      [userId]
    );
    return result.rows[0]?.temp_secret || null;
  } finally {
    client.release();
  }
}

/**
 * Delete temporary MFA secret
 */
export async function deleteTempMFASecret(userId) {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM user_mfa_temp_secrets WHERE user_id = $1', [userId]);
  } finally {
    client.release();
  }
}

/**
 * Enable MFA for user and store permanent secret
 */
export async function enableMFA(userId, secret) {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE users SET mfa_enabled = TRUE, mfa_secret = $1, mfa_enabled_at = CURRENT_TIMESTAMP WHERE id = $2',
      [secret, userId]
    );
  } finally {
    client.release();
  }
}

/**
 * Disable MFA for user
 */
export async function disableMFA(userId) {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE users SET mfa_enabled = FALSE, mfa_secret = NULL, mfa_backup_codes = NULL WHERE id = $1',
      [userId]
    );

    // Clean up backup codes
    await client.query('DELETE FROM user_mfa_backup_codes WHERE user_id = $1', [userId]);
  } finally {
    client.release();
  }
}

/**
 * Get MFA secret for user
 */
export async function getMFASecret(userId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT mfa_secret FROM users WHERE id = $1 AND mfa_enabled = TRUE',
      [userId]
    );
    return result.rows[0]?.mfa_secret || null;
  } finally {
    client.release();
  }
}

/**
 * Store backup codes for user
 */
export async function storeBackupCodes(userId, codes) {
  const client = await pool.connect();
  try {
    // Hash backup codes before storing
    const hashedCodes = await Promise.all(
      codes.map(async code => ({
        code_hash: await bcrypt.hash(code, 10),
        user_id: userId,
      }))
    );

    // Remove existing backup codes
    await client.query('DELETE FROM user_mfa_backup_codes WHERE user_id = $1', [userId]);

    // Insert new backup codes
    for (const { code_hash } of hashedCodes) {
      await client.query('INSERT INTO user_mfa_backup_codes (user_id, code_hash) VALUES ($1, $2)', [
        userId,
        code_hash,
      ]);
    }
  } finally {
    client.release();
  }
}

/**
 * Check if user has backup codes
 */
export async function hasBackupCodes(userId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT COUNT(*) as count FROM user_mfa_backup_codes WHERE user_id = $1 AND used_at IS NULL',
      [userId]
    );
    return parseInt(result.rows[0].count) > 0;
  } finally {
    client.release();
  }
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(userId, code) {
  const client = await pool.connect();
  try {
    // Get all unused backup codes for user
    const result = await client.query(
      'SELECT id, code_hash FROM user_mfa_backup_codes WHERE user_id = $1 AND used_at IS NULL',
      [userId]
    );

    for (const row of result.rows) {
      const isValid = await bcrypt.compare(code, row.code_hash);
      if (isValid) {
        // Mark backup code as used
        await client.query(
          'UPDATE user_mfa_backup_codes SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
          [row.id]
        );
        return true;
      }
    }

    return false;
  } finally {
    client.release();
  }
}

/**
 * Log MFA attempt for security monitoring
 */
export async function logMFAAttempt(userId, attemptType, success, ipAddress, userAgent) {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO mfa_attempts (user_id, attempt_type, success, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [userId, attemptType, success, ipAddress, userAgent]
    );
  } finally {
    client.release();
  }
}

/**
 * Update last MFA used timestamp
 */
export async function updateLastMFAUsed(userId) {
  const client = await pool.connect();
  try {
    await client.query('UPDATE users SET last_mfa_used = CURRENT_TIMESTAMP WHERE id = $1', [
      userId,
    ]);
  } finally {
    client.release();
  }
}

/**
 * Get user with MFA info by ID (extended from existing function)
 */
export async function findUserById(userId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, username, email, password_hash, mfa_enabled, mfa_secret, last_mfa_used, created_at FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

/**
 * Check if user has recent failed MFA attempts (rate limiting)
 */
export async function getRecentFailedMFAAttempts(userId, minutesBack = 5) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT COUNT(*) as count FROM mfa_attempts WHERE user_id = $1 AND success = FALSE AND created_at > CURRENT_TIMESTAMP - INTERVAL $2 MINUTE',
      [userId, minutesBack]
    );
    return parseInt(result.rows[0].count);
  } finally {
    client.release();
  }
}

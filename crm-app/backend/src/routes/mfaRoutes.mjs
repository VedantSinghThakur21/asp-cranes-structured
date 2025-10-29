/**
 * Multi-Factor Authentication Service
 * Implements TOTP-based MFA using speakeasy library
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { authenticateToken } from '../middleware/authMiddleware.mjs';
import express from 'express';
import * as mfaRepository from '../services/postgres/mfaRepository.js';

const router = express.Router();

/**
 * Generate MFA Secret and QR Code
 */
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Check if user already has MFA enabled
    const user = await mfaRepository.findUserById(userId);
    if (user.mfa_enabled) {
      return res.status(400).json({
        error: 'MFA_ALREADY_ENABLED',
        message: 'MFA is already enabled for this account',
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `ASP Cranes CRM (${userEmail})`,
      issuer: 'ASP Cranes',
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store temporary secret (not yet activated)
    await mfaRepository.storeTempMFASecret(userId, secret.base32);

    res.status(200).json({
      message: 'MFA setup initiated',
      secret: secret.base32,
      qrCodeUrl,
      manualEntryKey: secret.base32,
      instructions: [
        '1. Install an authenticator app (Google Authenticator, Authy, etc.)',
        '2. Scan the QR code or manually enter the key',
        '3. Enter the 6-digit code from your app to verify setup',
      ],
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({
      error: 'MFA_SETUP_ERROR',
      message: 'Error setting up MFA',
    });
  }
});

/**
 * Verify and Enable MFA
 */
router.post('/verify-setup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token || token.length !== 6) {
      return res.status(400).json({
        error: 'INVALID_TOKEN_FORMAT',
        message: 'Please provide a 6-digit verification code',
      });
    }

    // Get temporary secret
    const tempSecret = await mfaRepository.getTempMFASecret(userId);
    if (!tempSecret) {
      return res.status(400).json({
        error: 'NO_PENDING_SETUP',
        message: 'No pending MFA setup found. Please start setup process again.',
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: tempSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time windows (±60 seconds)
    });

    if (!verified) {
      return res.status(400).json({
        error: 'INVALID_VERIFICATION_CODE',
        message: 'Invalid verification code. Please try again.',
      });
    }

    // Enable MFA and store permanent secret
    await mfaRepository.enableMFA(userId, tempSecret);
    await mfaRepository.deleteTempMFASecret(userId);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    await mfaRepository.storeBackupCodes(userId, backupCodes);

    res.status(200).json({
      message: 'MFA enabled successfully',
      backupCodes,
      warning:
        'Store these backup codes securely. They can be used if you lose access to your authenticator app.',
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({
      error: 'MFA_VERIFICATION_ERROR',
      message: 'Error verifying MFA setup',
    });
  }
});

/**
 * Verify MFA Token During Login
 */
router.post('/verify-login', async (req, res) => {
  try {
    const { email, password, mfaToken } = req.body;

    if (!email || !password || !mfaToken) {
      return res.status(400).json({
        error: 'MISSING_CREDENTIALS',
        message: 'Email, password, and MFA token are required',
      });
    }

    // This would be called from the main login flow
    // Implementation details would be integrated into the main auth flow

    res.status(200).json({
      message: 'MFA verification endpoint - integrate with main login flow',
    });
  } catch (error) {
    console.error('MFA login verification error:', error);
    res.status(500).json({
      error: 'MFA_LOGIN_ERROR',
      message: 'Error verifying MFA during login',
    });
  }
});

/**
 * Disable MFA
 */
router.post('/disable', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password, mfaToken } = req.body;

    if (!password || !mfaToken) {
      return res.status(400).json({
        error: 'MISSING_CREDENTIALS',
        message: 'Password and MFA token are required to disable MFA',
      });
    }

    // Verify password
    const user = await mfaRepository.findUserById(userId);
    const bcrypt = await import('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'INVALID_PASSWORD',
        message: 'Invalid password',
      });
    }

    // Verify MFA token
    const mfaSecret = await mfaRepository.getMFASecret(userId);
    if (!mfaSecret) {
      return res.status(400).json({
        error: 'MFA_NOT_ENABLED',
        message: 'MFA is not enabled for this account',
      });
    }

    const verified = speakeasy.totp.verify({
      secret: mfaSecret,
      encoding: 'base32',
      token: mfaToken,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({
        error: 'INVALID_MFA_TOKEN',
        message: 'Invalid MFA token',
      });
    }

    // Disable MFA
    await mfaRepository.disableMFA(userId);

    res.status(200).json({
      message: 'MFA disabled successfully',
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({
      error: 'MFA_DISABLE_ERROR',
      message: 'Error disabling MFA',
    });
  }
});

/**
 * Get MFA Status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await mfaRepository.findUserById(userId);

    res.status(200).json({
      mfaEnabled: !!user.mfa_enabled,
      hasBackupCodes: user.mfa_enabled ? await mfaRepository.hasBackupCodes(userId) : false,
    });
  } catch (error) {
    console.error('MFA status error:', error);
    res.status(500).json({
      error: 'MFA_STATUS_ERROR',
      message: 'Error getting MFA status',
    });
  }
});

export default router;

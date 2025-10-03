/**
 * Company Settings Routes
 * Handle company information and letterhead management
 */

import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.mjs';
import pool from '../lib/dbConnection.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/letterheads';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'letterhead-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

/**
 * GET /api/company-settings - Get company settings
 */
router.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          company_name as name,
          address,
          phone,
          email,
          website,
          gst_number,
          letterhead_url,
          letterhead_position,
          is_active
        FROM company_settings 
        WHERE is_active = true 
        ORDER BY updated_at DESC 
        LIMIT 1
      `);
      
      if (result.rows.length > 0) {
        const settings = result.rows[0];
        res.json({
          success: true,
          data: {
            name: settings.name,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
            website: settings.website,
            gstNumber: settings.gst_number,
            letterheadUrl: settings.letterhead_url,
            letterheadPosition: settings.letterhead_position || {
              x: 0, y: 0, width: '100%', height: 'auto', 
              opacity: 0.1, zIndex: -1
            }
          }
        });
      } else {
        // Return default settings if none found
        res.json({
          success: true,
          data: {
            name: 'ASP Cranes Pvt. Ltd.',
            address: 'Industrial Area, Pune, Maharashtra 411019',
            phone: '+91 99999 88888',
            email: 'sales@aspcranes.com',
            website: 'www.aspcranes.com',
            gstNumber: '07XXXXX1234X1XX',
            letterheadUrl: null,
            letterheadPosition: {
              x: 0, y: 0, width: '100%', height: 'auto',
              opacity: 0.1, zIndex: -1
            }
          }
        });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company settings',
      message: error.message
    });
  }
});

/**
 * PUT /api/company-settings - Update company settings
 */
router.put('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      address,
      phone,
      email,
      website,
      gstNumber,
      letterheadPosition
    } = req.body;
    
    const client = await pool.connect();
    try {
      // First, deactivate existing settings
      await client.query('UPDATE company_settings SET is_active = false');
      
      // Insert new settings
      const result = await client.query(`
        INSERT INTO company_settings (
          company_name, address, phone, email, website, gst_number, letterhead_position, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        RETURNING *
      `, [name, address, phone, email, website, gstNumber, letterheadPosition]);
      
      res.json({
        success: true,
        data: result.rows[0],
        message: 'Company settings updated successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update company settings',
      message: error.message
    });
  }
});

/**
 * POST /api/company-settings/letterhead - Upload letterhead
 */
router.post('/letterhead', authenticateToken, upload.single('letterhead'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const letterheadUrl = `/uploads/letterheads/${req.file.filename}`;
    const letterheadPosition = req.body.position ? JSON.parse(req.body.position) : {
      x: 0, y: 0, width: '100%', height: 'auto',
      opacity: 0.3, zIndex: -1, enabled: true
    };
    
    const client = await pool.connect();
    try {
      // Update the current active company settings with letterhead
      const result = await client.query(`
        UPDATE company_settings 
        SET letterhead_url = $1, letterhead_position = $2, updated_at = CURRENT_TIMESTAMP
        WHERE is_active = true
        RETURNING *
      `, [letterheadUrl, letterheadPosition]);
      
      if (result.rows.length === 0) {
        // No active settings found, create new one
        await client.query(`
          INSERT INTO company_settings (
            company_name, letterhead_url, letterhead_position, is_active
          ) VALUES ('ASP Cranes Pvt. Ltd.', $1, $2, true)
        `, [letterheadUrl, letterheadPosition]);
      }
      
      res.json({
        success: true,
        data: {
          letterheadUrl,
          letterheadPosition,
          filename: req.file.filename
        },
        message: 'Letterhead uploaded successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error uploading letterhead:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload letterhead',
      message: error.message
    });
  }
});

/**
 * DELETE /api/company-settings/letterhead - Remove letterhead
 */
router.delete('/letterhead', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Get current letterhead URL for cleanup
      const currentResult = await client.query(`
        SELECT letterhead_url FROM company_settings WHERE is_active = true
      `);
      
      // Update to remove letterhead
      await client.query(`
        UPDATE company_settings 
        SET letterhead_url = NULL, letterhead_position = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE is_active = true
      `);
      
      // Clean up file if it exists
      if (currentResult.rows.length > 0 && currentResult.rows[0].letterhead_url) {
        const filePath = path.join('public', currentResult.rows[0].letterhead_url);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (unlinkError) {
            console.error('Error deleting letterhead file:', unlinkError);
          }
        }
      }
      
      res.json({
        success: true,
        message: 'Letterhead removed successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error removing letterhead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove letterhead',
      message: error.message
    });
  }
});

export default router;
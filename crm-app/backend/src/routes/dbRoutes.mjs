/**
 * API routes for database operations
 * This file provides a secure way for the frontend to make database queries
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/authMiddleware.mjs';

dotenv.config();

const router = express.Router();

// Database connection
const pool = new pg.Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || '',
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// JWT secret from environment variables
const JWT_SECRET = process.env.VITE_JWT_SECRET || 'your-secure-jwt-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user data to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * Database query endpoint
 */
router.post('/query', authenticateToken, async (req, res) => {
  try {
    const { query, values, type } = req.body;

    if (!query || !type) {
      return res.status(400).json({ error: 'Query and type are required' });
    }

    // Security check: Prevent dangerous operations
    if (
      query.toLowerCase().includes('delete') ||
      query.toLowerCase().includes('drop') ||
      query.toLowerCase().includes('truncate') ||
      query.toLowerCase().includes('alter')
    ) {
      return res.status(403).json({ error: 'Forbidden query type' });
    }

    // Get database connection
    const client = await pool.connect();

    // Execute query based on type
    let result;
    switch (type) {
      case 'oneOrNone':
        const oneOrNoneResult = await client.query(query, values || []);
        result = oneOrNoneResult.rows[0] || null;
        break;
      case 'one':
        const oneResult = await client.query(query, values || []);
        if (oneResult.rows.length !== 1) {
          client.release();
          throw new Error('Expected exactly one row');
        }
        result = oneResult.rows[0];
        break;
      case 'any':
        const anyResult = await client.query(query, values || []);
        result = anyResult.rows;
        break;
      case 'none':
        await client.query(query, values || []);
        result = { success: true };
        break;
      case 'query':
        const queryResult = await client.query(query, values || []);
        result = {
          rows: queryResult.rows,
          rowCount: queryResult.rowCount,
        };
        break;
      default:
        client.release();
        return res.status(400).json({ error: 'Invalid query type' });
    }

    client.release();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ error: error.message || 'Database error' });
  }
});

export default router;

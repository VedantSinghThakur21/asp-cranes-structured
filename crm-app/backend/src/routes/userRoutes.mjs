/**
 * User Management API Routes
 * Handles CRUD operations for user management
 * Includes role-based access control and proper validation
 */

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const router = express.Router();

// Database configuration
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'asp_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'crmdb@21',
  ssl: process.env.DB_SSL === 'true' ? true : false,
});

// Public API endpoint for testing connection - does not require authentication
// IMPORTANT: Define specific routes BEFORE routes with path parameters
router.get('/public/count', async (req, res) => {
  try {
    console.log('Public count endpoint accessed');
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const count = parseInt(result.rows[0].count);

    res.json({
      count,
      message: 'Public endpoint working correctly',
    });
  } catch (error) {
    console.error('Error getting user count:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_for_development';

// Strict JWT authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// GET /api/users - Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        uid as id,
        email,
        display_name as name,
        role,
        avatar,
        created_at,
        updated_at,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM auth_tokens 
            WHERE user_id = users.uid 
            AND expires_at > NOW()
          ) THEN 'active'
          ELSE 'inactive'
        END as status
      FROM users
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    // Add search filter
    if (search) {
      paramCount++;
      query += ` AND (display_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Add role filter
    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM users WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 0;

    if (search) {
      countParamIndex++;
      countQuery += ` AND (display_name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    if (role) {
      countParamIndex++;
      countQuery += ` AND role = $${countParamIndex}`;
      countParams.push(role);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalUsers = parseInt(countResult.rows[0].count);

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users/:id - Get single user (Admin or self)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Allow access to own profile or admin access
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await pool.query(
      `
      SELECT 
        uid as id,
        email,
        display_name as name,
        role,
        avatar,
        created_at,
        updated_at,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM auth_tokens 
            WHERE user_id = users.uid 
            AND expires_at > NOW()
          ) THEN 'active'
          ELSE 'inactive'
        END as status
      FROM users 
      WHERE uid = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/users - Create new user (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role = 'operator', phone, avatar } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    if (!['admin', 'sales_agent', 'operations_manager', 'operator', 'support'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if email already exists
    const existingUser = await pool.query('SELECT uid FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Generate user ID and hash password
    const userUid = 'usr_' + Math.random().toString(36).substring(2, 10);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      `
      INSERT INTO users (uid, email, password_hash, display_name, role, avatar)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING uid as id, email, display_name as name, role, avatar, created_at, updated_at
    `,
      [userUid, email, hashedPassword, name, role, avatar]
    );

    const newUser = result.rows[0];
    newUser.status = 'pending'; // New users start as pending

    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/users/:id - Update user (Admin or self for limited fields)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, avatar, password } = req.body;

    // Check permissions
    const isSelf = req.user.id === id;
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Non-admin users can only update their own limited fields
    if (!isAdmin && role !== undefined) {
      return res.status(403).json({ message: 'Cannot update role - admin access required' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT uid FROM users WHERE uid = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramIndex = 0;

    if (email !== undefined) {
      paramIndex++;
      updates.push(`email = $${paramIndex}`);
      params.push(email);
    }

    if (name !== undefined) {
      paramIndex++;
      updates.push(`display_name = $${paramIndex}`);
      params.push(name);
    }

    if (role !== undefined && isAdmin) {
      paramIndex++;
      updates.push(`role = $${paramIndex}`);
      params.push(role);
    }

    if (avatar !== undefined) {
      paramIndex++;
      updates.push(`avatar = $${paramIndex}`);
      params.push(avatar);
    }

    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      paramIndex++;
      updates.push(`password_hash = $${paramIndex}`);
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    // Add updated_at
    paramIndex++;
    updates.push(`updated_at = $${paramIndex}`);
    params.push(new Date());

    // Add user ID for WHERE clause
    paramIndex++;
    params.push(id);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE uid = $${paramIndex}
      RETURNING uid as id, email, display_name as name, role, avatar, created_at, updated_at
    `;

    const result = await pool.query(query, params);
    const updatedUser = result.rows[0];
    updatedUser.status = 'active'; // Assume active after update

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === '23505') {
      // Unique constraint violation
      res.status(409).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// DELETE /api/users/:id - Delete user (Admin only, cannot delete self)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT uid, role FROM users WHERE uid = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of other admin users (optional business rule)
    if (userCheck.rows[0].role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    // Delete user (CASCADE will handle related records)
    await pool.query('DELETE FROM users WHERE uid = $1', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users/profile/me - Get current user profile
router.get('/profile/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        uid as id,
        email,
        display_name as name,
        role,
        avatar,
        created_at,
        updated_at,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM auth_tokens 
            WHERE user_id = users.uid 
            AND expires_at > NOW()
          ) THEN 'active'
          ELSE 'inactive'
        END as status
      FROM users 
      WHERE uid = $1
    `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users/stats - Get user statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'sales_agent' THEN 1 END) as sales_agents,
        COUNT(CASE WHEN role = 'operations_manager' THEN 1 END) as operations_managers,
        COUNT(CASE WHEN role = 'operator' THEN 1 END) as operators,
        COUNT(CASE WHEN role = 'support' THEN 1 END) as support_users,
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM auth_tokens 
          WHERE user_id = users.uid 
          AND expires_at > NOW()
        ) THEN 1 END) as active_users
      FROM users
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

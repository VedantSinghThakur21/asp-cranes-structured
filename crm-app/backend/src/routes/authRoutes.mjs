/**
 * Authentication API Routes
 * Handles user authentication, login, registration, and token validation
 * Uses repository pattern to separate database logic from route handling
 */

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Import repository functions
import * as authRepository from '../services/postgres/authRepository.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Get JWT secret from env or use default for development
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_for_development';

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email using repository
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Guard: Ensure user.password_hash exists
    if (!user.password_hash) {
      console.error('Login error: User record missing password hash');
      return res.status(500).json({ message: 'User record is corrupted: missing password hash' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.uid, // use uid from DB
        email: user.email,
        role: user.role,
        name: user.display_name, // use display_name from DB
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.uid,
        email: user.email,
        role: user.role,
        name: user.display_name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'user' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await authRepository.findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate UID that matches schema format
    const userUid = 'usr_' + Math.random().toString(36).substring(2, 10);

    // Create new user using repository
    await authRepository.createUser(userUid, email, hashedPassword, role, name);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: userUid,
        email,
        role,
        name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      token,
      user: {
        id: userUid,
        email,
        role,
        name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Validate token route
router.get('/validate', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Return user info from token
    return res.status(200).json({
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      },
    });
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
});

// Verify token route (alternative endpoint for frontend compatibility)
router.post('/verify-token', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get fresh user data from database
    const user = await authRepository.findUserById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ valid: false, message: 'Invalid or expired token' });
  }
});

// Dev bypass middleware
const isDev = process.env.NODE_ENV !== 'production';
const devBypass = (req, res, next) => {
  if (
    isDev &&
    (req.headers['x-bypass-auth'] === 'true' ||
      req.headers['x-bypass-auth'] === 'development-only-123')
  ) {
    console.log('Authentication bypassed for sales agents with development header');
    req.user = { uid: 'dev-user', email: 'dev@example.com', role: 'admin' };
    return next();
  }
  next();
};

// Get sales agents (for lead assignment)
router.get('/sales-agents', devBypass, async (req, res) => {
  try {
    console.log('📋 Fetching sales agents...');

    // Get all users with sales_agent role
    const salesAgents = await authRepository.findUsersByRole('sales_agent');

    // Format for frontend use
    const formattedAgents = salesAgents.map(agent => ({
      id: agent.uid,
      name: agent.display_name,
      email: agent.email,
    }));

    console.log(`✅ Found ${formattedAgents.length} sales agents`);
    res.json(formattedAgents);
  } catch (error) {
    console.error('Error fetching sales agents:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    // Get user by ID using repository
    const user = await authRepository.findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Export the router
export default router;

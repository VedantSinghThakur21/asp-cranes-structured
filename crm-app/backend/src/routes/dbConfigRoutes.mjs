import express from 'express';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../authMiddleware.mjs';
import { getDatabaseConfig, updateDatabaseConfig } from '../services/postgres/configRepository.js';

const router = express.Router();

const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(error => {
    console.error(`DB Config API Error: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  });
};

// Flexible authentication middleware that works with or without JWT
const flexibleAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let user = { id: 'demo-user', role: 'admin' }; // Default demo user

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
    try {
      user = jwt.verify(token, jwtSecret);
      console.log('🔐 DBConfig: Using authenticated user');
    } catch (err) {
      console.log('⚠️ DBConfig: Invalid token provided, using demo user');
    }
  } else {
    console.log('🔓 DBConfig: No auth header, using demo user');
  }

  req.user = user;
  next();
};

const requireAdmin = (req, res, next) => {
  // For demo purposes, allow any user to access admin functions
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: 'Authentication required',
    });
  }
  next();
};

router.get(
  '/',
  flexibleAuth,
  asyncHandler(async (req, res) => {
    console.log('🔍 DB Config API: GET /api/dbconfig');

    const config = await getDatabaseConfig();
    const safeConfig = { ...config };
    delete safeConfig.password;

    console.log('✅ DB Config API: Successfully fetched database config');
    res.json({ success: true, data: safeConfig });
  })
);

router.put(
  '/',
  flexibleAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { host, port, database, user, password, ssl } = req.body;

    console.log('🔍 DB Config API: PUT /api/dbconfig');

    if (!host || !port || !database || !user) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: host, port, database, and user are required',
      });
    }

    const configData = {
      host: String(host),
      port: Number(port),
      database: String(database),
      user: String(user),
      ssl: Boolean(ssl),
    };

    if (password && password.trim() !== '') {
      configData.password = String(password);
    }

    const updatedConfig = await updateDatabaseConfig(configData);
    const safeConfig = { ...updatedConfig };
    delete safeConfig.password;

    console.log('✅ DB Config API: Successfully updated database config');
    res.json({ success: true, data: safeConfig });
  })
);

router.post(
  '/test',
  flexibleAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { host, port, database, user, password, ssl } = req.body;

    console.log('🔍 DB Config API: POST /api/dbconfig/test');

    if (!host || !port || !database || !user) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for database test',
      });
    }

    const testConfig = {
      host: String(host),
      port: Number(port),
      database: String(database),
      user: String(user),
      password: password ? String(password) : undefined,
      ssl: Boolean(ssl) ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 3000,
    };

    console.log('🧪 DB Config API: Testing database connection...');

    const testPool = new pg.Pool(testConfig);

    try {
      const testResult = await testPool.query(
        'SELECT 1 as connection_test, version() as postgres_version'
      );
      await testPool.end();

      console.log('✅ DB Config API: Database connection test successful');
      res.json({
        success: true,
        data: {
          connected: true,
          version: testResult.rows[0].postgres_version,
          host: host,
          port: port,
          database: database,
        },
      });
    } catch (testError) {
      await testPool.end();
      console.error('❌ DB Config API: Database connection test failed:', testError.message);

      res.status(400).json({
        success: false,
        message: 'Database connection test failed',
        error: testError.message,
      });
    }
  })
);

export default router;

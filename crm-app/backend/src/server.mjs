/**
 * API Server for ASP Cranes CRM
 * Production-ready server with proper error handling and security
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Import all route files
import authRoutes from './routes/authRoutes.mjs';
import dealsRoutes from './routes/dealsRoutes.mjs';
import leadsRoutes from './routes/leadsRoutes.mjs';
import quotationRoutes from './routes/quotationRoutes.mjs';
import customerRoutes from './routes/customerRoutes.mjs';
import equipmentRoutes from './routes/equipmentRoutes.mjs';
import configRoutes from './routes/configRoutes.mjs';
import userRoutes from './routes/userRoutes.mjs';
import jobRoutes from './routes/jobRoutes.mjs';
import operatorRoutes from './routes/operatorRoutes.mjs';
import activityRoutes from './routes/activityRoutes.mjs';
import notificationRoutes from './routes/notificationRoutes.mjs';

import dbConfigRoutes from './routes/dbConfigRoutes.mjs';
import templateRoutes from './routes/templateRoutes.mjs';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

console.log(`Environment check: NODE_ENV=${process.env.NODE_ENV || 'undefined'}, isProduction=${isProduction}`);
console.log(`ALLOWED_ORIGINS env var: "${process.env.ALLOWED_ORIGINS}"`);

// Set allowed origin for CORS
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://103.224.243.242:3000';

// Security middleware
if (isProduction) {
  app.use(helmet());
  app.use(compression());
}

// CORS configuration - allow credentials and set origin to frontend
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin === FRONTEND_ORIGIN) {
      callback(null, FRONTEND_ORIGIN);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-bypass-auth', 'x-application-type'],
  optionsSuccessStatus: 200
}));

// Log all request headers for debugging
app.use((req, res, next) => {
  console.log('🔎 [REQUEST] Method:', req.method, 'URL:', req.originalUrl);
  console.log('🔎 [REQUEST] Headers:', req.headers);
  next();
});

// Logging
if (isProduction) {
  // Create logs directory if it doesn't exist
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const logDir = path.join(__dirname, '../logs');
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Setup access logging to file
  const accessLogStream = fs.createWriteStream(
    path.join(logDir, 'access.log'),
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
} else {
  // Development logging to console
  app.use(morgan('dev'));
}

// Request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'ASP Cranes CRM API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      health: '/api/health',
      status: '/api/check',
      auth: '/api/auth',
      deals: '/api/deals',
      leads: '/api/leads',
      quotations: '/api/quotations',
      customers: '/api/customers',
      equipment: '/api/equipment',
      config: '/api/config',
      users: '/api/users',
      jobs: '/api/jobs',
      operators: '/api/operators'
    }
  });
});

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API status check
app.get('/api/check', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV || 'development',
    apiVersion: '1.0.0'
  });
});

// Mount all API routes
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/config', configRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);

// Mount template routes
app.use('/api/templates', templateRoutes);

// Mount database config routes
app.use('/api/dbconfig', dbConfigRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'ASP Cranes CRM API Server' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const logError = statusCode >= 500;
  
  if (logError) {
    console.error(`Server error (${req.method} ${req.originalUrl}):`, err);
  }
  
  res.status(statusCode).json({ 
    error: err.message || 'Internal Server Error',
    stack: isProduction ? undefined : err.stack,
    path: req.originalUrl
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (!isProduction) {
    console.log('\nAvailable endpoints:');
    console.log(`- Health check: http://localhost:${PORT}/api/health`);
    console.log(`- API status: http://localhost:${PORT}/api/check`);
    console.log(`- Auth routes: http://localhost:${PORT}/api/auth`);
    console.log(`- Deals routes: http://localhost:${PORT}/api/deals`);
    console.log(`- Leads routes: http://localhost:${PORT}/api/leads`);
    console.log(`- Quotation routes: http://localhost:${PORT}/api/quotations`);
    console.log(`- Customer routes: http://localhost:${PORT}/api/customers`);
    console.log(`- Equipment routes: http://localhost:${PORT}/api/equipment`);
    console.log(`- Config routes: http://localhost:${PORT}/api/config`);
    console.log(`- Job routes: http://localhost:${PORT}/api/jobs`);
    console.log(`- Operator routes: http://localhost:${PORT}/api/operators`);
    console.log(`- Activity routes: http://localhost:${PORT}/api/activities`);
  }
});

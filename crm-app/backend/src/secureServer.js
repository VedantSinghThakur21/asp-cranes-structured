/**
 * Enhanced Server Configuration with Security Middleware
 * Implements comprehensive security controls and authentication
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { securityHeaders } from './middleware/authMiddleware.js';
import { createSecureAIRouter } from './ai/SecureAISystemManager.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import mfaRoutes from './routes/mfaRoutes.js';
// ... other route imports

const app = express();
const PORT = process.env.PORT || 3000;

// ===== SECURITY MIDDLEWARE =====

// Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'https://asp-cranes-ai-sales-chatbot-v1-19ac7cde-f23-cb712937.crewai.com',
        ],
      },
    },
  })
);

// Custom security headers
app.use(securityHeaders);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Authentication rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts',
    retryAfter: 15 * 60,
  },
});

// ===== BASIC MIDDLEWARE =====

// Request logging
app.use(
  morgan('combined', {
    skip: function (req, res) {
      // Skip logging for health checks
      return req.url === '/health';
    },
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

// ===== ROUTES =====

// Health check (no authentication required)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes with appropriate rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/mfa', authLimiter, mfaRoutes);
app.use('/api/ai', createSecureAIRouter());

// Apply authentication to all other API routes
import { authenticateToken } from './middleware/authMiddleware.js';

// Protected routes (add your existing routes here with authentication)
app.use('/api/equipment', authenticateToken, equipmentRoutes);
app.use('/api/deals', authenticateToken, dealRoutes);
app.use('/api/quotations', authenticateToken, quotationRoutes);
app.use('/api/leads', authenticateToken, leadRoutes);
app.use('/api/customers', authenticateToken, customerRoutes);
// ... other protected routes

// ===== ERROR HANDLING =====

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'The requested resource was not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: error.message,
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  });
});

// ===== SERVER STARTUP =====

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Secure ASP Cranes CRM API server running on port ${PORT}`);
  console.log(
    `🔐 Security middleware: ${process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'} mode`
  );
  console.log(`🌍 CORS origins: ${process.env.ALLOWED_ORIGINS || 'http://localhost:5173'}`);
});

export default app;

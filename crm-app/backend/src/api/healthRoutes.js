const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Readiness check endpoint
router.get('/ready', (req, res) => {
  // Add any database connectivity checks here if needed
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

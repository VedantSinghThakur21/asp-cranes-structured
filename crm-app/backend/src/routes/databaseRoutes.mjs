/**
 * Database Connection Testing Route
 *
 * This endpoint allows frontend to test database connections without actually
 * establishing a persistent connection.
 */
import express from 'express';
import pg from 'pg';

import { authenticateToken } from '../authMiddleware.mjs';

// Use strict authentication everywhere
import { authenticateToken } from '../authMiddleware.mjs';

const router = express.Router();

// POST /api/database/test-connection - Test database connection with provided parameters
router.post('/test-connection', authenticateToken, async (req, res) => {
  // Only allow admins to test database connections
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can test database connections' });
  }

  const { host, port, database, user, password, ssl } = req.body;

  // Validate required fields
  if (!host || !port || !database || !user) {
    return res.status(400).json({ message: 'Missing required connection parameters' });
  }

  let client = null;

  try {
    // Create a temporary client with the provided configuration
    client = new pg.Client({
      host,
      port,
      database,
      user,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      // Set short timeout for quick feedback
      connectionTimeoutMillis: 5000,
    });

    console.log('Testing database connection with parameters:', {
      host,
      port,
      database,
      user,
      passwordProvided: password ? 'Yes' : 'No',
      ssl,
    });

    // Try to connect
    await client.connect();

    // Execute a simple query to verify connection works
    const result = await client.query('SELECT NOW() as current_time');

    // Success - return the current time from the database
    res.status(200).json({
      message: 'Connection successful',
      timestamp: result.rows[0].current_time,
      version: client.serverVersion,
    });
  } catch (error) {
    console.error('Database connection test failed:', error);

    // Format a user-friendly error message
    let errorMessage = 'Connection failed';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = `Could not connect to PostgreSQL at ${host}:${port}. Is the server running?`;
    } else if (error.code === '28P01') {
      errorMessage = 'Invalid username or password';
    } else if (error.code === '3D000') {
      errorMessage = `Database "${database}" does not exist`;
    } else {
      errorMessage = `Connection error: ${error.message}`;
    }

    res.status(500).json({ message: errorMessage, error: error.message, code: error.code });
  } finally {
    // Always close the client if it was created
    if (client) {
      try {
        await client.end();
      } catch (e) {
        console.error('Error closing database client:', e);
      }
    }
  }
});

// GET /api/database/config - Get current database configuration (minus password)
router.get('/config', devBypass, async (req, res) => {
  // Only allow admins to view database configuration
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can view database configuration' });
  }

  try {
    // Import the configuration repository
    const { getDatabaseConfig } = await import('../services/postgres/configRepository.js');

    // Get the database configuration
    const config = await getDatabaseConfig();

    // Return the configuration (password should already be removed by the repository)
    res.status(200).json(config);
  } catch (error) {
    console.error('Error retrieving database configuration:', error);
    res.status(500).json({
      message: 'Failed to retrieve database configuration',
      error: error.message,
    });
  }
});

// PUT /api/database/config - Update database configuration
router.put('/config', devBypass, async (req, res) => {
  // Only allow admins to update database configuration
  if (req.user.role !== 'admin') {
    return res
      .status(403)
      .json({ message: 'Only administrators can update database configuration' });
  }

  try {
    // Validate the required fields
    const { host, port, database, user } = req.body;

    if (!host || !port || !database || !user) {
      return res.status(400).json({ message: 'Missing required connection parameters' });
    }

    // Import the configuration repository
    const { updateDatabaseConfig } = await import('../services/postgres/configRepository.js');

    // Update the database configuration
    const updatedConfig = await updateDatabaseConfig(req.body);

    // Return the updated configuration (password should be removed by the repository)
    res.status(200).json({
      ...updatedConfig,
      message: 'Database configuration updated successfully',
    });

    // Log the change (but don't include password)
    const { password, ...logConfig } = req.body;
    console.log('Database configuration updated:', logConfig);
  } catch (error) {
    console.error('Error updating database configuration:', error);
    res.status(500).json({
      message: 'Failed to update database configuration',
      error: error.message,
    });
  }
});

export default router;

/**
 * PostgreSQL Database Connection Utility (JavaScript version)
 *
 * This module provides a centralized connection to the PostgreSQL database
 * using the node-postgres library. It creates and manages a connection pool
 * that can be reused across the application.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Load environment variables from .env file (server-side only)
if (!isBrowser) {
  dotenv.config();
}

// Get database configuration from environment variables
const dbConfig = {
  host: isBrowser ? 'localhost' : process.env.DB_HOST || 'localhost',
  port: parseInt(isBrowser ? '5432' : process.env.DB_PORT || '5432'),
  database: isBrowser ? 'asp_crm' : process.env.DB_NAME || 'asp_crm',
  user: isBrowser ? 'postgres' : process.env.DB_USER || 'postgres',
  password: isBrowser ? 'postgres' : process.env.DB_PASSWORD || 'crmdb@21',
  ssl: isBrowser ? false : process.env.DB_SSL === 'true' ? true : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create a singleton connection pool
const pool = new Pool(dbConfig);

// In browser, log a warning
if (isBrowser) {
  console.warn(
    'PostgreSQL connection is not available in browser environment. This is a mock implementation.'
  );
}

// Log when the pool establishes a new connection
pool.on('connect', () => {
  console.log('PostgreSQL pool connection established');
});

// Log any errors from the pool
pool.on('error', err => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute a SQL query against the database
 *
 * @param {string} text The SQL query to execute
 * @param {any[]} params The parameters to pass to the query
 * @returns {Promise} A promise that resolves to the query result
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration: `${duration}ms`, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
};

/**
 * Get a client from the pool for transaction support
 *
 * @returns {Promise} A pooled client that can be used for transactions
 */
export const getClient = async () => {
  const client = await pool.connect();
  const originalRelease = client.release;

  // Override the release method to log when a client is released back to the pool
  client.release = () => {
    console.log('PostgreSQL client released back to pool');
    originalRelease.apply(client);
  };

  return client;
};

/**
 * Health check function to test database connectivity
 *
 * @returns {Promise} A promise that resolves if the connection is successful, rejects otherwise
 */
export const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW()');
    return {
      status: 'ok',
      timestamp: result.rows[0].now,
      connection: 'PostgreSQL connection established',
    };
  } catch (error) {
    console.error('Database health check failed', error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

// Export the pool for use in other modules
export default pool;

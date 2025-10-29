/**
 * PostgreSQL Database Client
 * Manages connections to the PostgreSQL database
 */
import pgPromise from './pg-promise-server.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection options
const dbConfig = {
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
  database: process.env.DB_NAME || process.env.PGDATABASE || 'asp_crm',
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
  ssl:
    process.env.DB_SSL === 'true' || process.env.PGSSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
};

// Initialize pg-promise with options and plugins
const pgp = pgPromise({
  // Initialization options
  capSQL: true, // capitalize all generated SQL
  // Additional options
});

// Create the database instance
const db = pgp(dbConfig);

// Test the connection on startup
db.connect()
  .then(obj => {
    console.log('Database connection successful');
    console.log(
      `Connected to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} as ${dbConfig.user}`
    );
    obj.done(); // release the connection
  })
  .catch(error => {
    console.error('Database connection error:', error.message);
  });

// Export the database instance and pgp
export { db, pgp };

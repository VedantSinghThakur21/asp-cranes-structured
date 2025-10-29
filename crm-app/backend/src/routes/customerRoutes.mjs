/**
 * API routes for customer operations
 * This file provides endpoints to manage customers in PostgreSQL
 */

import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { authenticateToken } from '../authMiddleware.mjs';

dotenv.config();

const router = express.Router();

// Debug route to check if routes are loaded
router.get('/debug', (req, res) => {
  console.log('Customer routes debug endpoint hit');
  res.json({
    status: 'ok',
    message: 'Customer routes are loaded',
    timestamp: new Date().toISOString(),
  });
});

// Database connection with error handling
let pool;
try {
  pool = new pg.Pool({
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'asp_crm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'crmdb@21',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  console.log('Customer routes: PostgreSQL connection pool created');
} catch (error) {
  console.error('Customer routes: Failed to create PostgreSQL connection pool:', error);
}

// Import authentication middleware from central file
// CORS support for all customer endpoints
import cors from 'cors';
router.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Helper function to convert snake_case to camelCase
function snakeToCamel(obj) {
  if (obj === null || obj === undefined) return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamel(item));
  }

  // Handle non-objects
  if (typeof obj !== 'object') return obj;

  // Handle special cases like date objects
  if (obj instanceof Date) return obj;

  // Handle the conversion
  const newObj = {};
  Object.keys(obj).forEach(key => {
    // Convert key from snake_case to camelCase
    const newKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    // Handle JSON data stored in PostgreSQL
    if (typeof obj[key] === 'string' && (key.endsWith('_json') || key.includes('contact'))) {
      try {
        const parsed = JSON.parse(obj[key]);
        newObj[newKey] = snakeToCamel(parsed);
      } catch (e) {
        newObj[newKey] = obj[key];
      }
    } else {
      // Recursively convert nested objects
      newObj[newKey] = snakeToCamel(obj[key]);
    }
  });

  return newObj;
}

// Helper to ensure database tables exist
async function ensureTables(client) {
  try {
    console.log('🏗️ Ensuring customers table exists...');

    // Check if customers table exists
    const customersTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
      ) as exists
    `);

    const customersTableExists = customersTableCheck.rows[0].exists;
    console.log(`📊 Customers table exists: ${customersTableExists}`);

    // Create customers table if it doesn't exist
    if (!customersTableExists) {
      console.log('🔧 Creating customers table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          contact_name VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          address TEXT,
          type VARCHAR(50),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✅ Customers table created successfully');
    }

    console.log('🏗️ Ensuring customer_contacts table exists...');

    // Check if customer_contacts table exists
    const contactsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customer_contacts'
      ) as exists
    `);

    const contactsTableExists = contactsTableCheck.rows[0].exists;
    console.log(`📊 Customer contacts table exists: ${contactsTableExists}`);

    // Create customer_contacts table if it doesn't exist
    if (!contactsTableExists) {
      console.log('🔧 Creating customer_contacts table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS customer_contacts (
          id VARCHAR(50) PRIMARY KEY,
          customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          position VARCHAR(255),
          is_primary BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✅ Customer contacts table created successfully');
    }

    // Check if tables have data
    console.log('🔍 Checking if customers table has data...');
    const customersDataCheck = await client.query('SELECT COUNT(*) FROM customers');
    const customersCount = parseInt(customersDataCheck.rows[0].count);
    console.log(`📊 Customers table has ${customersCount} records`);

    return {
      success: true,
      tablesCreated: {
        customers: !customersTableExists,
        customer_contacts: !contactsTableExists,
      },
      recordCounts: {
        customers: customersCount,
      },
    };
  } catch (error) {
    console.error('❌ Error ensuring tables exist:', error);
    return { success: false, error: error.message };
  }
}

// GET all customers
router.get('/', async (req, res) => {
  console.log('🔍 GET /api/customers endpoint hit - inside route handler');
  if (!pool) {
    console.error('❌ Database pool not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }
  try {
    console.log('👉 Acquiring database client from pool...');
    const client = await pool.connect();
    console.log('✅ Database client acquired successfully');
    try {
      // Ensure tables exist
      console.log('👉 Ensuring database tables exist...');
      const tablesResult = await ensureTables(client);
      console.log('✅ Tables check completed:', tablesResult);
      // Get all customers
      console.log('👉 Querying for all customers...');
      const result = await client.query(`
        SELECT 
          c.id,
          c.name,
          c.company_name,
          c.contact_name,
          c.email,
          c.phone,
          c.address,
          c.type,
          c.designation,
          c.notes,
          c.created_at,
          c.updated_at,
          (
            SELECT json_agg(
              json_build_object(
                'id', ct.id,
                'name', ct.name,
                'email', ct.email,
                'phone', ct.phone,
                'role', ct.role,
                'createdAt', ct.created_at,
                'updatedAt', ct.updated_at
              )
            )
            FROM contacts ct
            WHERE ct.customer_id = c.id
          ) as contacts
        FROM customers c
        ORDER BY c.name ASC
      `);
      console.log(`✅ Query returned ${result.rowCount} customers`);
      // Convert snake_case to camelCase and ensure contacts is always an array
      const customers = result.rows.map(row => {
        const customer = snakeToCamel(row);
        if (!Array.isArray(customer.contacts)) customer.contacts = [];
        return customer;
      });
      console.log('� Full customer data:', JSON.stringify(customers, null, 2));
      res.status(200).json(customers);
    } finally {
      console.log('👉 Releasing database client back to pool');
      client.release();
    }
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers: ' + error.message });
  }
});

// GET customer by ID
router.get('/:id', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const { id } = req.params;
    const client = await pool.connect();

    try {
      // Get customer by ID
      const result = await client.query(
        `
        SELECT 
          c.*,
          (
            SELECT json_agg(
              json_build_object(
                'id', cc.id,
                'name', cc.name,
                'email', cc.email,
                'phone', cc.phone,
                'position', cc.position,
                'isPrimary', cc.is_primary,
                'createdAt', cc.created_at,
                'updatedAt', cc.updated_at
              )
            )
            FROM customer_contacts cc
            WHERE cc.customer_id = c.id
          ) as contacts
        FROM customers c
        WHERE c.id = $1
      `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Convert snake_case to camelCase
      const customer = snakeToCamel(result.rows[0]);

      res.status(200).json(customer);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error fetching customer with id ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST create new customer
router.post('/', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const customerData = req.body;
    const userId = req.user?.userId || 'unknown';

    // Validate required fields
    if (!customerData.name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const client = await pool.connect();

    try {
      // Ensure tables exist
      await ensureTables(client);

      // Generate a unique ID
      const customerId = `customer-${Date.now()}`;
      const now = new Date().toISOString();

      // Start transaction
      await client.query('BEGIN');

      // Insert customer
      await client.query(
        `
        INSERT INTO customers (
          id, name, company_name, contact_name, email, phone, address, type, notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
      `,
        [
          customerId,
          customerData.name,
          customerData.company_name || customerData.companyName || customerData.name, // Default to name if no company name
          customerData.contactName || customerData.contact_name || customerData.name,
          customerData.email || null,
          customerData.phone || null,
          customerData.address || null,
          customerData.type || 'other',
          customerData.notes || null,
          now,
          now,
        ]
      );

      // Insert contacts if provided
      if (
        customerData.contacts &&
        Array.isArray(customerData.contacts) &&
        customerData.contacts.length > 0
      ) {
        for (const contact of customerData.contacts) {
          const contactId = `contact-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          await client.query(
            `
            INSERT INTO customer_contacts (
              id, customer_id, name, email, phone, position, is_primary, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9
            )
          `,
            [
              contactId,
              customerId,
              contact.name,
              contact.email || null,
              contact.phone || null,
              contact.position || null,
              contact.isPrimary || false,
              now,
              now,
            ]
          );
        }
      }

      // Commit transaction
      await client.query('COMMIT');

      // Return the created customer
      const result = await client.query(
        `
        SELECT 
          c.*,
          (
            SELECT json_agg(
              json_build_object(
                'id', cc.id,
                'name', cc.name,
                'email', cc.email,
                'phone', cc.phone,
                'position', cc.position,
                'isPrimary', cc.is_primary,
                'createdAt', cc.created_at,
                'updatedAt', cc.updated_at
              )
            )
            FROM customer_contacts cc
            WHERE cc.customer_id = c.id
          ) as contacts
        FROM customers c
        WHERE c.id = $1
      `,
        [customerId]
      );

      const customer = snakeToCamel(result.rows[0]);

      res.status(201).json(customer);
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const { id } = req.params;
    const customerData = req.body;
    const now = new Date().toISOString();

    const client = await pool.connect();

    try {
      // Check if customer exists
      const checkResult = await client.query('SELECT id FROM customers WHERE id = $1', [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Start transaction
      await client.query('BEGIN');

      // Update customer
      await client.query(
        `
        UPDATE customers
        SET
          name = COALESCE($2, name),
          contact_name = COALESCE($3, contact_name),
          email = COALESCE($4, email),
          phone = COALESCE($5, phone),
          address = COALESCE($6, address),
          type = COALESCE($7, type),
          notes = COALESCE($8, notes),
          updated_at = $9
        WHERE id = $1
      `,
        [
          id,
          customerData.name,
          customerData.contactName,
          customerData.email,
          customerData.phone,
          customerData.address,
          customerData.type,
          customerData.notes,
          now,
        ]
      );

      // Update contacts if provided
      if (customerData.contacts && Array.isArray(customerData.contacts)) {
        // Get existing contact IDs
        const existingContactsResult = await client.query(
          'SELECT id FROM customer_contacts WHERE customer_id = $1',
          [id]
        );

        const existingContactIds = new Set(existingContactsResult.rows.map(row => row.id));
        const updatedContactIds = new Set();

        // Update or insert contacts
        for (const contact of customerData.contacts) {
          if (contact.id && existingContactIds.has(contact.id)) {
            // Update existing contact
            await client.query(
              `
              UPDATE customer_contacts
              SET
                name = $2,
                email = $3,
                phone = $4,
                position = $5,
                is_primary = $6,
                updated_at = $7
              WHERE id = $1
            `,
              [
                contact.id,
                contact.name,
                contact.email || null,
                contact.phone || null,
                contact.position || null,
                contact.isPrimary || false,
                now,
              ]
            );

            updatedContactIds.add(contact.id);
          } else {
            // Insert new contact
            const contactId =
              contact.id || `contact-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            await client.query(
              `
              INSERT INTO customer_contacts (
                id, customer_id, name, email, phone, position, is_primary, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9
              )
            `,
              [
                contactId,
                id,
                contact.name,
                contact.email || null,
                contact.phone || null,
                contact.position || null,
                contact.isPrimary || false,
                now,
                now,
              ]
            );

            updatedContactIds.add(contactId);
          }
        }

        // Delete contacts that were not updated
        for (const existingId of existingContactIds) {
          if (!updatedContactIds.has(existingId)) {
            await client.query('DELETE FROM customer_contacts WHERE id = $1', [existingId]);
          }
        }
      }

      // Commit transaction
      await client.query('COMMIT');

      // Return the updated customer
      const result = await client.query(
        `
        SELECT 
          c.*,
          (
            SELECT json_agg(
              json_build_object(
                'id', cc.id,
                'name', cc.name,
                'email', cc.email,
                'phone', cc.phone,
                'position', cc.position,
                'isPrimary', cc.is_primary,
                'createdAt', cc.created_at,
                'updatedAt', cc.updated_at
              )
            )
            FROM customer_contacts cc
            WHERE cc.customer_id = c.id
          ) as contacts
        FROM customers c
        WHERE c.id = $1
      `,
        [id]
      );

      const customer = snakeToCamel(result.rows[0]);

      res.status(200).json(customer);
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error updating customer with id ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const { id } = req.params;
    const client = await pool.connect();

    try {
      // Check if customer exists
      const checkResult = await client.query('SELECT id FROM customers WHERE id = $1', [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Start transaction
      await client.query('BEGIN');

      // Delete customer contacts (cascade should handle this, but just to be safe)
      await client.query('DELETE FROM customer_contacts WHERE customer_id = $1', [id]);

      // Delete customer
      await client.query('DELETE FROM customers WHERE id = $1', [id]);

      // Commit transaction
      await client.query('COMMIT');

      res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error deleting customer with id ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// GET contacts for a customer
router.get('/:customerId/contacts', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const { customerId } = req.params;
    const client = await pool.connect();

    try {
      // Check if customer exists
      const checkResult = await client.query('SELECT id FROM customers WHERE id = $1', [
        customerId,
      ]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Get contacts
      const result = await client.query(
        `
        SELECT
          id,
          name,
          email,
          phone,
          position,
          is_primary as "isPrimary",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM customer_contacts
        WHERE customer_id = $1
        ORDER BY is_primary DESC, name ASC
      `,
        [customerId]
      );

      const contacts = result.rows;

      res.status(200).json(contacts);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error fetching contacts for customer ${req.params.customerId}:`, error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// POST create contact for a customer
router.post('/:customerId/contacts', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const { customerId } = req.params;
    const contactData = req.body;

    // Validate required fields
    if (!contactData.name) {
      return res.status(400).json({ error: 'Contact name is required' });
    }

    const client = await pool.connect();

    try {
      // Check if customer exists
      const checkResult = await client.query('SELECT id FROM customers WHERE id = $1', [
        customerId,
      ]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Generate a unique ID and timestamps
      const contactId = `contact-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const now = new Date().toISOString();

      // Insert contact
      await client.query(
        `
        INSERT INTO customer_contacts (
          id, customer_id, name, email, phone, position, is_primary, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
      `,
        [
          contactId,
          customerId,
          contactData.name,
          contactData.email || null,
          contactData.phone || null,
          contactData.position || null,
          contactData.isPrimary || false,
          now,
          now,
        ]
      );

      // Return the created contact
      const result = await client.query(
        `
        SELECT
          id,
          name,
          email,
          phone,
          position,
          is_primary as "isPrimary",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM customer_contacts
        WHERE id = $1
      `,
        [contactId]
      );

      const contact = result.rows[0];

      res.status(201).json(contact);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error creating contact for customer ${req.params.customerId}:`, error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

export default router;

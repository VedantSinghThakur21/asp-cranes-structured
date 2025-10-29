import { db } from '../../lib/dbClient.js';

// Track database connection status
let dbConnectionAvailable = true;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds

// Test database connection
const testDbConnection = async () => {
  const now = Date.now();
  if (now - lastConnectionCheck < CONNECTION_CHECK_INTERVAL) {
    return dbConnectionAvailable;
  }

  try {
    await db.one('SELECT 1');
    dbConnectionAvailable = true;
    lastConnectionCheck = now;
    return true;
  } catch (error) {
    dbConnectionAvailable = false;
    lastConnectionCheck = now;
    console.log('📵 Database connection not available, using default configs');
    return false;
  }
};

export const DEFAULT_CONFIGS = {
  quotation: {
    orderTypeLimits: {
      micro: { minDays: 1, maxDays: 10 },
      small: { minDays: 11, maxDays: 25 },
      monthly: { minDays: 26, maxDays: 365 },
      yearly: { minDays: 366, maxDays: 3650 },
    },
  },
  resourceRates: {
    foodRatePerMonth: null,
    accommodationRatePerMonth: null,
    transportRate: 5000, // Default transport base cost for mob/demob
  },
  additionalParams: {
    riggerAmount: 40000,
    helperAmount: 12000,
    incidentalOptions: [
      { value: 'incident1', label: 'Incident 1 - ₹5,000', amount: 5000 },
      { value: 'incident2', label: 'Incident 2 - ₹10,000', amount: 10000 },
      { value: 'incident3', label: 'Incident 3 - ₹15,000', amount: 15000 },
    ],
    usageFactors: { normal: 0, medium: 20, heavy: 50 },
    riskFactors: { low: 0, medium: 10, high: 20 },
    shiftFactors: { single: 1.0, double: 1.8 },
    dayNightFactors: { day: 1.0, night: 1.3 },
    riskUsagePercentage: 5.0,
  },
  defaultTemplate: {
    defaultTemplateId: 'qtpl_a650c77a',
    updatedAt: new Date().toISOString(),
  },
  database: {
    host: 'postgres',
    port: 5432,
    database: 'asp_crm',
    user: 'postgres',
    ssl: false,
  },
};

export const getConfig = async configName => {
  console.log(`🔍 Getting ${configName} config`);

  // Check database connection first
  const isDbAvailable = await testDbConnection();

  if (!isDbAvailable) {
    if (configName === 'resourceRates') {
      throw new Error('Database connection required for resource rates configuration');
    }
    console.log(`� Using default config for ${configName} (DB unavailable)`);
    return DEFAULT_CONFIGS[configName] || {};
  }

  try {
    const result = await db.oneOrNone('SELECT value, updated_at FROM config WHERE name = $1', [
      configName,
    ]);

    if (result) {
      let configValue = result.value;
      if (typeof configValue === 'string') {
        try {
          configValue = JSON.parse(configValue);
        } catch (e) {
          if (configName === 'resourceRates') {
            throw new Error('Invalid resource rates configuration in database');
          }
          configValue = DEFAULT_CONFIGS[configName] || {};
        }
      }

      // Validate required resource rates
      if (configName === 'resourceRates') {
        if (!configValue.foodRatePerMonth || !configValue.accommodationRatePerMonth) {
          throw new Error(
            'Resource rates must be properly configured in database (foodRatePerMonth and accommodationRatePerMonth are required)'
          );
        }
      }

      return { ...configValue, updatedAt: result.updated_at };
    }

    // For resourceRates, require database configuration
    if (configName === 'resourceRates') {
      throw new Error('Resource rates not found in database - please configure them first');
    }

    return DEFAULT_CONFIGS[configName] || {};
  } catch (error) {
    console.error(`Error fetching ${configName}:`, error);
    dbConnectionAvailable = false; // Mark DB as unavailable

    // For resourceRates, don't fall back to defaults
    if (configName === 'resourceRates') {
      throw error;
    }

    return DEFAULT_CONFIGS[configName] || {};
  }
};

export const updateConfig = async (configName, configData, auditInfo = {}) => {
  console.log(`📝 Updating ${configName} config`);

  // Check database connection first
  const isDbAvailable = await testDbConnection();

  if (!isDbAvailable) {
    throw new Error('Database connection not available for config updates');
  }

  try {
    // Get the current value for audit trail
    const currentConfig = await db.oneOrNone('SELECT id, value FROM config WHERE name = $1', [
      configName,
    ]);

    const result = await db.one(
      `
      INSERT INTO config (name, value) VALUES ($1, $2)
      ON CONFLICT (name) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
      RETURNING id, value, updated_at
    `,
      [configName, JSON.stringify(configData)]
    );

    // Log the change to audit table with enhanced user information
    try {
      await db.none(
        `
        INSERT INTO config_audit (
          config_id, config_name, action, old_value, new_value,
          changed_by, changed_by_email, change_reason, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
        [
          result.id,
          configName,
          currentConfig ? 'UPDATE' : 'CREATE',
          currentConfig ? currentConfig.value : null,
          result.value,
          auditInfo.userId || 'UNKNOWN',
          auditInfo.userEmail || null,
          auditInfo.reason ||
            `${currentConfig ? 'Updated' : 'Created'} ${configName} configuration`,
          auditInfo.ipAddress || null,
          auditInfo.userAgent || null,
        ]
      );

      console.log(
        `📋 Logged config change to audit trail: ${configName} ${currentConfig ? 'updated' : 'created'} by ${auditInfo.userId || 'UNKNOWN'}`
      );
    } catch (auditError) {
      console.error('Failed to log to audit trail:', auditError);
      // Don't fail the config update if audit logging fails
    }

    let updatedValue = result.value;
    if (typeof updatedValue === 'string') {
      try {
        updatedValue = JSON.parse(updatedValue);
      } catch (e) {
        updatedValue = configData;
      }
    }

    return { ...updatedValue, updatedAt: result.updated_at };
  } catch (error) {
    console.error(`Error updating ${configName}:`, error);
    dbConnectionAvailable = false; // Mark DB as unavailable
    throw error;
  }
};

export const getAllConfigs = async () => {
  // Check database connection first
  const isDbAvailable = await testDbConnection();

  if (!isDbAvailable) {
    console.log('📝 Using default configs (DB unavailable)');
    return DEFAULT_CONFIGS;
  }

  try {
    const result = await db.any('SELECT name, value, updated_at FROM config ORDER BY name');
    const configs = {};

    result.forEach(row => {
      let value = row.value;
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = {};
        }
      }
      configs[row.name] = { ...value, updatedAt: row.updated_at };
    });

    return configs;
  } catch (error) {
    console.error('Error fetching all configs:', error);
    dbConnectionAvailable = false; // Mark DB as unavailable
    return DEFAULT_CONFIGS;
  }
};

export const initializeDefaultConfigs = async () => {
  try {
    console.log('🔄 Initializing default configurations...');

    for (const [configName, configValue] of Object.entries(DEFAULT_CONFIGS)) {
      const existing = await db.oneOrNone('SELECT name FROM config WHERE name = $1', [configName]);

      if (!existing) {
        await db.none('INSERT INTO config (name, value) VALUES ($1, $2)', [
          configName,
          JSON.stringify(configValue),
        ]);
      }
    }

    console.log('✅ Default configurations initialized');
  } catch (error) {
    console.error('Error initializing configs:', error);
    throw error;
  }
};

// Audit trail functions
export const getConfigAuditHistory = async (configName = null, limit = 50) => {
  console.log(`🔍 Getting audit history${configName ? ` for ${configName}` : ''}`);

  const isDbAvailable = await testDbConnection();
  if (!isDbAvailable) {
    throw new Error('Database connection not available for audit history');
  }

  try {
    let query = `
      SELECT 
        ca.id,
        ca.config_id,
        ca.config_name,
        ca.action,
        ca.old_value,
        ca.new_value,
        ca.changed_by,
        ca.changed_by_email,
        ca.change_reason,
        ca.ip_address,
        ca.user_agent,
        ca.created_at,
        c.name as current_config_name
      FROM config_audit ca
      LEFT JOIN config c ON ca.config_id = c.id
    `;

    const params = [];
    if (configName) {
      query += ` WHERE ca.config_name = $1`;
      params.push(configName);
    }

    query += ` ORDER BY ca.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const results = await db.any(query, params);

    return results.map(row => ({
      id: row.id,
      configId: row.config_id,
      configName: row.config_name,
      action: row.action,
      oldValue: row.old_value,
      newValue: row.new_value,
      changedBy: row.changed_by,
      changedByEmail: row.changed_by_email,
      changeReason: row.change_reason,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      currentConfigName: row.current_config_name,
    }));
  } catch (error) {
    console.error('Error fetching audit history:', error);
    throw error;
  }
};

export const getConfigChangesSummary = async (days = 30) => {
  console.log(`📊 Getting config changes summary for last ${days} days`);

  const isDbAvailable = await testDbConnection();
  if (!isDbAvailable) {
    throw new Error('Database connection not available for changes summary');
  }

  try {
    const results = await db.any(`
      SELECT 
        config_name,
        action,
        changed_by,
        COUNT(*) as change_count,
        MAX(created_at) as latest_change
      FROM config_audit 
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
      GROUP BY config_name, action, changed_by
      ORDER BY latest_change DESC
    `);

    return results.map(row => ({
      configName: row.config_name,
      action: row.action,
      changedBy: row.changed_by,
      changeCount: parseInt(row.change_count),
      latestChange: row.latest_change,
    }));
  } catch (error) {
    console.error('Error fetching changes summary:', error);
    throw error;
  }
};

export const getDatabaseConfig = () => getConfig('database');
export const updateDatabaseConfig = config => updateConfig('database', config);

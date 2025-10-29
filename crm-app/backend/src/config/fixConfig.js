/**
 * Fix Config Migration Script
 * Updates the config table with correct values for frontend
 */
import { db } from '../lib/db.js';

export const fixConfigData = async () => {
  try {
    console.log('Fixing config data...');

    // Update resourceRates
    await db.none(
      `
      UPDATE config 
      SET value = $1::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE name = 'resourceRates'
    `,
      [
        JSON.stringify({
          foodRate: 2500,
          accommodationRate: 4000,
          transportRate: 5000, // Default transport base cost for mob/demob
        }),
      ]
    );

    // Update additionalParams
    await db.none(
      `
      UPDATE config 
      SET value = $1::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE name = 'additionalParams'
    `,
      [
        JSON.stringify({
          riggerAmount: 40000,
          helperAmount: 12000,
          incidentalOptions: [
            {
              value: 'incident1',
              label: 'Incident 1 - ₹5,000',
              amount: 5000,
            },
            {
              value: 'incident2',
              label: 'Incident 2 - ₹10,000',
              amount: 10000,
            },
            {
              value: 'incident3',
              label: 'Incident 3 - ₹15,000',
              amount: 15000,
            },
          ],
        }),
      ]
    );

    // Insert if they don't exist (fallback)
    await db.none(
      `
      INSERT INTO config (name, value) 
      VALUES 
        ('resourceRates', $1::jsonb),
        ('additionalParams', $2::jsonb)
      ON CONFLICT (name) DO NOTHING
    `,
      [
        JSON.stringify({
          foodRate: 2500,
          accommodationRate: 4000,
          transportRate: 5000, // Default transport base cost for mob/demob
        }),
        JSON.stringify({
          riggerAmount: 40000,
          helperAmount: 12000,
          incidentalOptions: [
            {
              value: 'incident1',
              label: 'Incident 1 - ₹5,000',
              amount: 5000,
            },
            {
              value: 'incident2',
              label: 'Incident 2 - ₹10,000',
              amount: 10000,
            },
            {
              value: 'incident3',
              label: 'Incident 3 - ₹15,000',
              amount: 15000,
            },
          ],
        }),
      ]
    );

    console.log('✅ Config data fixed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error fixing config data:', error);
    return false;
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixConfigData()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error during config fix:', err);
      process.exit(1);
    });
}

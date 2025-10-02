import express from 'express';
import pool from '../lib/dbConnection.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.mjs';

// Define admin roles for maintenance operations
const MAINTENANCE_ROLES = ['admin', 'operations_manager'];

const router = express.Router();

// GET /api/templates/enhanced/:id/raw – raw DB row (admin only)
router.get('/enhanced/:id/raw', authenticateToken, authorizeRoles(MAINTENANCE_ROLES), async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM enhanced_templates WHERE id = $1', [id]);
      if (!result.rows.length) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }
      const row = result.rows[0];
      const analyze = (val) => {
        if (val == null) return { type: 'null' };
        if (typeof val === 'string') {
          return { type: 'string', length: val.length, startsWith: val.slice(0, 20) };
        }
        return { type: typeof val };
      };
      res.json({
        success: true,
        id: row.id,
        diagnostics: {
          elements: analyze(row.elements),
          layout: analyze(row.layout),
          settings: analyze(row.settings),
          branding: analyze(row.branding)
        },
        raw: row
      });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Raw template fetch error', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/templates/enhanced/maintenance/repair – normalize malformed JSON columns (admin only)
router.post('/enhanced/maintenance/repair', authenticateToken, authorizeRoles(MAINTENANCE_ROLES), async (req, res) => {
  const report = [];
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, elements, layout, settings, branding FROM enhanced_templates');
    for (const row of result.rows) {
      const mutated = { elements: false, layout: false, settings: false, branding: false };
      const fixColumn = (raw, fallback) => {
        if (raw == null) return JSON.stringify(fallback);
        if (typeof raw === 'object') return JSON.stringify(raw); // already object
        if (typeof raw !== 'string') return JSON.stringify(fallback);
        const trimmed = raw.trim();
        if (!trimmed) return JSON.stringify(fallback);
        if (trimmed === '[object Object]') return JSON.stringify(fallback);
        try {
          if ((trimmed.startsWith('"{') && trimmed.endsWith('}"')) || (trimmed.startsWith('"[') && trimmed.endsWith(']"'))) {
            // unwrap double stringified
            const unwrapped = trimmed.slice(1, -1).replace(/\\"/g, '"');
            JSON.parse(unwrapped); // validate
            return unwrapped;
          }
          JSON.parse(trimmed); // validate
          return trimmed; // OK
        } catch (err) {
          return JSON.stringify(fallback);
        }
      };

      const original = { ...row };
      const fixedElements = fixColumn(row.elements, []);
      if (fixedElements !== row.elements) mutated.elements = true;
      const fixedLayout = fixColumn(row.layout, {});
      if (fixedLayout !== row.layout) mutated.layout = true;
      const fixedSettings = fixColumn(row.settings, {});
      if (fixedSettings !== row.settings) mutated.settings = true;
      const fixedBranding = fixColumn(row.branding, {});
      if (fixedBranding !== row.branding) mutated.branding = true;

      const any = Object.values(mutated).some(v => v);
      if (any) {
        await client.query(
          'UPDATE enhanced_templates SET elements=$2, layout=$3, settings=$4, branding=$5, updated_at=NOW() WHERE id=$1',
          [row.id, fixedElements, fixedLayout, fixedSettings, fixedBranding]
        );
      }
      report.push({ id: row.id, mutated, changed: any });
    }

    res.json({ success: true, repaired: report.filter(r => r.changed).length, total: report.length, report });
  } catch (e) {
    console.error('Repair templates error', e);
    res.status(500).json({ success: false, error: e.message });
  } finally {
    client.release();
  }
});

export default router;

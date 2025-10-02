#!/usr/bin/env node

/**
 * Template Repair Utility
 * Fixes malformed JSON columns in enhanced_templates table
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const headers = {
  'Content-Type': 'application/json',
  'X-Bypass-Auth': 'development-only-123'
};

async function repairTemplates() {
  try {
    console.log('🔧 Starting template repair...');
    
    const response = await fetch(`${API_BASE}/api/templates/enhanced/maintenance/repair`, {
      method: 'POST',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Repair completed!');
    console.log(`📊 Processed: ${result.total} templates`);
    console.log(`🔧 Repaired: ${result.repaired} templates`);
    
    if (result.repaired > 0) {
      console.log('\n📋 Repair Details:');
      result.report.filter(r => r.changed).forEach(item => {
        console.log(`  - Template ${item.id}:`);
        Object.entries(item.mutated).forEach(([column, changed]) => {
          if (changed) console.log(`    ✓ Fixed ${column} column`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Repair failed:', error.message);
    process.exit(1);
  }
}

async function checkTemplateHealth() {
  try {
    console.log('🔍 Checking template health...');
    
    const response = await fetch(`${API_BASE}/api/quotations-preview/debug/templates`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log(`📊 Found ${result.count} templates in database`);
    result.templates.forEach((tpl, i) => {
      console.log(`  ${i + 1}. ${tpl.name} (${tpl.id}) - ${tpl.elementCount} elements`);
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

async function main() {
  console.log('🚀 ASP Cranes Template Maintenance Utility\n');
  
  await checkTemplateHealth();
  console.log('');
  await repairTemplates();
}

if (process.argv[1].endsWith('repair-templates.mjs')) {
  main().catch(console.error);
}

export { repairTemplates, checkTemplateHealth };
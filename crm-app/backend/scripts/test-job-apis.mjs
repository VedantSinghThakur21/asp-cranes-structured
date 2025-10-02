#!/usr/bin/env node

/**
 * Job Scheduling API Test
 * Tests equipment, operators, and leads endpoints for job scheduling
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const headers = {
  'Content-Type': 'application/json',
  'X-Bypass-Auth': 'development-only-123'
};

async function testEndpoint(name, url) {
  try {
    console.log(`🧪 Testing ${name}...`);
    
    const response = await fetch(`${API_BASE}${url}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log(`✅ ${name} - Success`);
    
    if (Array.isArray(result)) {
      console.log(`   📊 Count: ${result.length}`);
      if (result.length > 0) {
        console.log(`   📝 Sample:`, JSON.stringify(result[0], null, 2).substring(0, 200) + '...');
      }
    } else if (result.data && Array.isArray(result.data)) {
      console.log(`   📊 Count: ${result.data.length}`);
      if (result.data.length > 0) {
        console.log(`   📝 Sample:`, JSON.stringify(result.data[0], null, 2).substring(0, 200) + '...');
      }
    } else {
      console.log(`   📝 Result:`, JSON.stringify(result, null, 2).substring(0, 200) + '...');
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ ${name} - Failed:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Job Scheduling API Test Suite\n');
  
  // Test all endpoints
  await testEndpoint('Equipment API', '/api/equipment');
  console.log('');
  await testEndpoint('Operators API', '/api/operators');
  console.log('');
  await testEndpoint('Jobs API', '/api/jobs');
  console.log('');
  await testEndpoint('Leads with Won Deals API', '/api/jobs/leads/won-deals');
  console.log('');
  
  console.log('🏁 API test completed!');
}

if (process.argv[1].endsWith('test-job-apis.mjs')) {
  main().catch(console.error);
}

export { testEndpoint };
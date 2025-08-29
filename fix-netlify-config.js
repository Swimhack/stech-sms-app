#!/usr/bin/env node

/**
 * Netlify Configuration Fix Script
 * 
 * This script provides the exact commands and steps needed to fix the
 * "Server configuration error" by setting up environment variables in Netlify.
 * 
 * Run this after setting up environment variables in Netlify dashboard.
 */

const https = require('https');

const REQUIRED_ENV_VARS = {
  'TWILIO_ACCOUNT_SID': 'your_twilio_account_sid',
  'TWILIO_AUTH_TOKEN': 'your_twilio_auth_token',
  'TWILIO_PHONE_NUMBER': 'your_twilio_phone_number',
  'ADMIN_KEY': 'sms-app-admin-2025',
  'LOG_ACCESS_SECRET': 'sms-log-secret-2025-secure',
  'NODE_ENV': 'production'
};

console.log('\n🔧 NETLIFY CONFIGURATION FIX');
console.log('================================\n');

console.log('❌ ISSUE: Server configuration error - Missing environment variables\n');

console.log('✅ SOLUTION: Add these environment variables in Netlify Dashboard:\n');
console.log('1. Go to: https://app.netlify.com/sites/stech-sms-app/settings/env');
console.log('2. Click "Add variable" for each of these:\n');

Object.entries(REQUIRED_ENV_VARS).forEach(([key, value]) => {
  console.log(`   ${key} = ${value}`);
});

console.log('\n3. After adding all variables, redeploy:');
console.log('   - Go to Deploys tab');
console.log('   - Click "Trigger deploy" → "Deploy site"\n');

console.log('🧪 VERIFICATION COMMANDS:');
console.log('After deployment completes, test these URLs:\n');
console.log('Health Check:');
console.log('curl https://stech-sms-app.netlify.app/health\n');
console.log('Diagnostics:');
console.log('curl https://stech-sms-app.netlify.app/diagnostics\n');
console.log('Should show: "twilioConfigured": true\n');

// Test current status
console.log('📊 TESTING CURRENT STATUS...\n');

function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`${description}: ${res.statusCode === 200 ? '✅' : '❌'}`);
          if (parsed.twilioConfigured !== undefined) {
            console.log(`   Twilio Configured: ${parsed.twilioConfigured ? '✅' : '❌'}`);
          }
          if (parsed.status) {
            console.log(`   Status: ${parsed.status}`);
          }
        } catch (e) {
          console.log(`${description}: ❌ (${res.statusCode})`);
        }
        resolve();
      });
    });
    req.on('error', () => {
      console.log(`${description}: ❌ (Connection failed)`);
      resolve();
    });
    req.setTimeout(5000, () => {
      console.log(`${description}: ❌ (Timeout)`);
      resolve();
    });
  });
}

async function runTests() {
  await testEndpoint('https://stech-sms-app.netlify.app/health', 'Health Check');
  await testEndpoint('https://stech-sms-app.netlify.app/diagnostics', 'Diagnostics');
  
  console.log('\n📝 SUMMARY:');
  console.log('If you see "Twilio Configured: ❌", follow the solution steps above.');
  console.log('After fixing, all endpoints should show "✅" status.\n');
  
  console.log('💡 QUICK ACCESS:');
  console.log('Netlify Dashboard: https://app.netlify.com/sites/stech-sms-app/settings/env');
  console.log('SMS App: https://stech-sms-app.netlify.app/\n');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { REQUIRED_ENV_VARS, testEndpoint };
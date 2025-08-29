#!/usr/bin/env node

/**
 * SMS App Test Sprite
 * 
 * Comprehensive testing script for the SMS application
 * Tests all endpoints and provides detailed status reports
 */

const https = require('https');
const { promisify } = require('util');

class SMSTestSprite {
  constructor() {
    this.baseUrl = 'https://stech-sms-app.netlify.app';
    this.adminKey = 'sms-app-admin-2025';
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTests() {
    console.log('🧪 SMS APP TEST SPRITE');
    console.log('=====================\n');
    
    await this.testHealthEndpoint();
    await this.testDiagnosticsEndpoint();
    await this.testMainInterface();
    await this.testSMSEndpoint();
    await this.testWebhookEndpoint();
    await this.testLoggingEndpoints();
    await this.testConfigurationStatus();
    
    this.printResults();
  }

  async testHealthEndpoint() {
    console.log('🏥 Testing Health Endpoint...');
    
    try {
      const response = await this.makeRequest('/health');
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.data);
        if (data.twilioConfigured === true) {
          this.addResult('✅ Health Check', 'PASS', 'Twilio configured and healthy');
        } else {
          this.addResult('⚠️ Health Check', 'WARN', 'App healthy but Twilio not configured');
        }
      } else if (response.statusCode === 500) {
        const data = JSON.parse(response.data || '{}');
        this.addResult('❌ Health Check', 'FAIL', `Configuration error: ${data.message || 'Unknown error'}`);
      } else {
        this.addResult('❌ Health Check', 'FAIL', `Unexpected status: ${response.statusCode}`);
      }
    } catch (error) {
      this.addResult('❌ Health Check', 'FAIL', `Request failed: ${error.message}`);
    }
  }

  async testDiagnosticsEndpoint() {
    console.log('🔍 Testing Diagnostics Endpoint...');
    
    try {
      const response = await this.makeRequest('/diagnostics');
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.data);
        if (data.status === 'CONFIGURED') {
          this.addResult('✅ Diagnostics', 'PASS', 'All configuration complete');
        } else {
          this.addResult('⚠️ Diagnostics', 'WARN', `Configuration issues: ${data.validation?.summary || 'Unknown'}`);
        }
      } else if (response.statusCode === 500) {
        const data = JSON.parse(response.data || '{}');
        this.addResult('❌ Diagnostics', 'FAIL', `Configuration error detected: ${data.message || 'Unknown'}`);
      } else {
        this.addResult('❌ Diagnostics', 'FAIL', `Unexpected status: ${response.statusCode}`);
      }
    } catch (error) {
      this.addResult('❌ Diagnostics', 'FAIL', `Request failed: ${error.message}`);
    }
  }

  async testMainInterface() {
    console.log('🌐 Testing Main Interface...');
    
    try {
      const response = await this.makeRequest('/');
      
      if (response.statusCode === 200 && response.data.includes('SMS Messaging App')) {
        this.addResult('✅ Main Interface', 'PASS', 'Web interface loading correctly');
      } else {
        this.addResult('❌ Main Interface', 'FAIL', `Interface not loading properly (${response.statusCode})`);
      }
    } catch (error) {
      this.addResult('❌ Main Interface', 'FAIL', `Request failed: ${error.message}`);
    }
  }

  async testSMSEndpoint() {
    console.log('📱 Testing SMS Endpoint...');
    
    try {
      // Test with GET (should return 405 Method Not Allowed)
      const getResponse = await this.makeRequest('/send-sms');
      
      if (getResponse.statusCode === 405) {
        this.addResult('✅ SMS Endpoint (GET)', 'PASS', 'Correctly rejects GET requests');
      } else {
        this.addResult('❌ SMS Endpoint (GET)', 'FAIL', `Unexpected GET response: ${getResponse.statusCode}`);
      }

      // Test with POST (empty body - should return configuration error)
      const postData = JSON.stringify({ to: '+15551234567', message: 'Test message' });
      const postResponse = await this.makeRequest('/send-sms', 'POST', postData);
      
      if (postResponse.statusCode === 500) {
        const data = JSON.parse(postResponse.data || '{}');
        if (data.message && data.message.includes('configuration')) {
          this.addResult('✅ SMS Endpoint (POST)', 'PASS', 'Correctly detects configuration error');
        } else {
          this.addResult('⚠️ SMS Endpoint (POST)', 'WARN', `Error response: ${data.message || 'Unknown'}`);
        }
      } else {
        this.addResult('❌ SMS Endpoint (POST)', 'FAIL', `Unexpected POST response: ${postResponse.statusCode}`);
      }
    } catch (error) {
      this.addResult('❌ SMS Endpoint', 'FAIL', `Request failed: ${error.message}`);
    }
  }

  async testWebhookEndpoint() {
    console.log('🔗 Testing Webhook Endpoint...');
    
    try {
      const getResponse = await this.makeRequest('/webhook/sms');
      
      if (getResponse.statusCode === 405) {
        this.addResult('✅ Webhook Endpoint', 'PASS', 'Correctly rejects non-POST requests');
      } else {
        this.addResult('❌ Webhook Endpoint', 'FAIL', `Unexpected response: ${getResponse.statusCode}`);
      }
    } catch (error) {
      this.addResult('❌ Webhook Endpoint', 'FAIL', `Request failed: ${error.message}`);
    }
  }

  async testLoggingEndpoints() {
    console.log('📋 Testing Logging Endpoints...');
    
    try {
      // Test agent-logs endpoint
      const logsResponse = await this.makeRequest(`/agent-logs?admin_key=${this.adminKey}&format=json&limit=5`);
      
      if (logsResponse.statusCode === 200) {
        this.addResult('✅ Agent Logs', 'PASS', 'Logging endpoint accessible');
      } else if (logsResponse.statusCode === 401) {
        this.addResult('⚠️ Agent Logs', 'WARN', 'Authentication required (expected if ADMIN_KEY not set)');
      } else {
        this.addResult('❌ Agent Logs', 'FAIL', `Unexpected response: ${logsResponse.statusCode}`);
      }

      // Test log-token endpoint
      const tokenResponse = await this.makeRequest(`/log-token?admin_key=${this.adminKey}`);
      
      if (tokenResponse.statusCode === 200) {
        this.addResult('✅ Log Token', 'PASS', 'Token generation working');
      } else if (tokenResponse.statusCode === 401) {
        this.addResult('⚠️ Log Token', 'WARN', 'Authentication required (expected if ADMIN_KEY not set)');
      } else {
        this.addResult('❌ Log Token', 'FAIL', `Unexpected response: ${tokenResponse.statusCode}`);
      }
    } catch (error) {
      this.addResult('❌ Logging Endpoints', 'FAIL', `Request failed: ${error.message}`);
    }
  }

  async testConfigurationStatus() {
    console.log('⚙️ Testing Configuration Status...');
    
    try {
      const response = await this.makeRequest('/health');
      const data = JSON.parse(response.data || '{}');
      
      const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
      
      if (data.twilioConfigured === true) {
        this.addResult('✅ Configuration', 'PASS', 'All Twilio variables configured');
      } else {
        this.addResult('❌ Configuration', 'FAIL', 'Missing Twilio environment variables');
        console.log('\n📋 CONFIGURATION FIX REQUIRED:');
        console.log('1. Go to: https://app.netlify.com/sites/stech-sms-app/settings/env');
        console.log('2. Add these environment variables:');
        console.log('   TWILIO_ACCOUNT_SID=your_twilio_account_sid');
        console.log('   TWILIO_AUTH_TOKEN=your_twilio_auth_token');
        console.log('   TWILIO_PHONE_NUMBER=your_twilio_phone_number');
        console.log('   ADMIN_KEY=sms-app-admin-2025');
        console.log('   LOG_ACCESS_SECRET=sms-log-secret-2025-secure');
        console.log('3. Trigger deployment: Deploys → Trigger Deploy → Deploy Site');
        console.log('4. Rerun this test: npm run test:sprite\n');
      }
    } catch (error) {
      this.addResult('❌ Configuration', 'FAIL', `Could not check config: ${error.message}`);
    }
  }

  makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve) => {
      const url = new URL(this.baseUrl + path);
      
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'User-Agent': 'SMS-Test-Sprite/1.0'
        },
        timeout: 10000
      };

      if (data && method === 'POST') {
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(data);
      }

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          statusCode: 0,
          error: error.message,
          data: null
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          statusCode: 0,
          error: 'Request timeout',
          data: null
        });
      });

      if (data && method === 'POST') {
        req.write(data);
      }
      
      req.end();
    });
  }

  addResult(test, status, details) {
    this.results.tests.push({ test, status, details });
    if (status === 'PASS') this.results.passed++;
    else this.results.failed++;
    console.log(`${test}: ${details}`);
  }

  printResults() {
    console.log('\n📊 TEST RESULTS');
    console.log('================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📋 Total: ${this.results.tests.length}\n`);
    
    if (this.results.failed > 0) {
      console.log('❌ ISSUES FOUND:');
      this.results.tests
        .filter(t => t.status === 'FAIL')
        .forEach(t => console.log(`   ${t.test}: ${t.details}`));
      console.log('');
    }

    if (this.results.tests.some(t => t.status === 'WARN')) {
      console.log('⚠️ WARNINGS:');
      this.results.tests
        .filter(t => t.status === 'WARN')
        .forEach(t => console.log(`   ${t.test}: ${t.details}`));
      console.log('');
    }

    const status = this.results.failed === 0 ? 'HEALTHY' : 'NEEDS_CONFIGURATION';
    console.log(`🎯 OVERALL STATUS: ${status}`);
    
    if (status === 'NEEDS_CONFIGURATION') {
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Configure Twilio environment variables in Netlify');
      console.log('2. Redeploy the application');
      console.log('3. Rerun tests to verify functionality');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const sprite = new SMSTestSprite();
  sprite.runTests().catch(console.error);
}

module.exports = SMSTestSprite;
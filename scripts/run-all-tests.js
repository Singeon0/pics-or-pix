#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create scripts directory if it doesn't exist
const scriptsDir = path.join(__dirname);
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

// Create results directory if it doesn't exist
const resultsDir = path.join(__dirname, '../test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Function to run a command and log the output
function runCommand(command, description) {
  console.log(`\n\n=============================================`);
  console.log(`Running ${description}...`);
  console.log(`=============================================\n`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    console.log(`✅ ${description} completed successfully!`);
    return { success: true, output };
  } catch (error) {
    console.error(`❌ ${description} failed with error:`, error.message);
    return { success: false, error };
  }
}

// Start the server (if not already running)
let serverProcess;
try {
  const isServerRunning = execSync('lsof -i:3000').toString().includes('node');
  if (!isServerRunning) {
    console.log('Starting the server...');
    serverProcess = require('child_process').spawn('node', ['index.js'], { 
      detached: true,
      stdio: 'ignore'
    });
    serverProcess.unref();
    // Wait for server to start
    execSync('sleep 3');
  }
} catch (error) {
  console.log('Starting the server...');
  serverProcess = require('child_process').spawn('node', ['index.js'], { 
    detached: true,
    stdio: 'ignore'
  });
  serverProcess.unref();
  // Wait for server to start
  execSync('sleep 3');
}

// Run Jest unit tests
runCommand('npx jest', 'Jest Unit Tests');

// Run Playwright tests across browsers
runCommand('npx playwright test', 'Playwright Cross-Browser Tests');

// Run Cypress E2E tests
runCommand('npx cypress run', 'Cypress E2E Tests');

// Run Lighthouse performance test
runCommand('node tests/performance/lighthouse.js', 'Lighthouse Performance Tests');

// Run accessibility tests
runCommand('npx playwright test tests/accessibility/a11y.spec.js', 'Accessibility Tests');

console.log('\n\n=============================================');
console.log('🎉 All tests completed!');
console.log('Check the test-results directory for detailed reports.');
console.log('=============================================\n');
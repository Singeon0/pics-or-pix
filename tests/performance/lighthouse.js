const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const { expect } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

async function runLighthouseTest() {
  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });
  
  // Define options for Lighthouse
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port
  };
  
  // Define the URL to test
  const url = 'http://localhost:3000';
  
  try {
    // Run Lighthouse
    const runnerResult = await lighthouse(url, options);
    
    // Create results directory if it doesn't exist
    const resultsDir = path.join(__dirname, '../../lighthouse-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
    }
    
    // Save the results as HTML
    const reportHtml = runnerResult.report;
    fs.writeFileSync(path.join(resultsDir, 'lighthouse-report.html'), reportHtml);
    
    // Extract scores
    const scores = {
      performance: runnerResult.lhr.categories.performance.score * 100,
      accessibility: runnerResult.lhr.categories.accessibility.score * 100,
      bestPractices: runnerResult.lhr.categories['best-practices'].score * 100,
      seo: runnerResult.lhr.categories.seo.score * 100
    };
    
    console.log('Lighthouse scores:', scores);
    
    // Assert scores meet minimum thresholds
    expect(scores.performance).toBeGreaterThanOrEqual(70);
    expect(scores.accessibility).toBeGreaterThanOrEqual(80);
    expect(scores.bestPractices).toBeGreaterThanOrEqual(85);
    expect(scores.seo).toBeGreaterThanOrEqual(80);
    
    // Log specific performance metrics
    const metrics = {
      firstContentfulPaint: runnerResult.lhr.audits['first-contentful-paint'].numericValue,
      speedIndex: runnerResult.lhr.audits['speed-index'].numericValue,
      largestContentfulPaint: runnerResult.lhr.audits['largest-contentful-paint'].numericValue,
      interactive: runnerResult.lhr.audits['interactive'].numericValue,
      totalBlockingTime: runnerResult.lhr.audits['total-blocking-time'].numericValue
    };
    
    console.log('Performance metrics (ms):', metrics);
    
    // Assert on specific metrics
    expect(metrics.firstContentfulPaint).toBeLessThan(2000); // 2 seconds
    expect(metrics.largestContentfulPaint).toBeLessThan(2500); // 2.5 seconds
    
  } catch (error) {
    console.error('Error running Lighthouse:', error);
    throw error;
  } finally {
    // Always close Chrome
    await chrome.kill();
  }
}

// Create a Jest test that runs the Lighthouse test
describe('Lighthouse Performance Tests', () => {
  it('should meet performance thresholds', async () => {
    await runLighthouseTest();
  }, 60000); // Long timeout as Lighthouse takes time
});

module.exports = { runLighthouseTest };
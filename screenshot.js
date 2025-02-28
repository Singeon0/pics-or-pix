const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    // Navigate to the site
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    console.log('Main page loaded successfully');

    // Take screenshot of the main page
    await page.screenshot({ path: 'main-page.png' });
    console.log('Main page screenshot saved');
    
    // Find and click the first portfolio item
    const portfolioItemExists = await page.evaluate(() => {
      const items = document.querySelectorAll('.portfolio-item, .gallery-item, .album-item');
      if (items.length > 0) {
        items[0].click();
        return true;
      }
      return false;
    });
    
    if (portfolioItemExists) {
      console.log('Clicked on portfolio item');
      
      // Wait for content load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot of the portfolio page
      await page.screenshot({ path: 'portfolio-page.png' });
      console.log('Portfolio page screenshot saved');

      // Log the HTML for debugging
      const html = await page.content();
      console.log('Page HTML:', html);
    }
  } catch (error) {
    console.error('Error during screenshot:', error);
  } finally {
    await browser.close();
  }
})();
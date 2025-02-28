const puppeteer = require('puppeteer');

(async () => {
  // Launch a headless browser
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    // Navigate to the site
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    console.log('Main page loaded successfully');
    
    // Get the DOM structure
    const homeClasses = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const classes = new Set();
      allElements.forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(cls => {
            if (cls) classes.add(cls);
          });
        }
      });
      return Array.from(classes);
    });
    
    console.log('Home page classes:', homeClasses);
    
    // Find and click the first portfolio item to check portfolio page structure
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
      
      // Wait for navigation/content load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get DOM structure of portfolio page
      const portfolioClasses = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        const classes = new Set();
        allElements.forEach(el => {
          if (el.className && typeof el.className === 'string') {
            el.className.split(' ').forEach(cls => {
              if (cls) classes.add(cls);
            });
          }
        });
        return Array.from(classes);
      });
      
      console.log('Portfolio page classes:', portfolioClasses);
      
      // Try to find image items
      const imageItemExists = await page.evaluate(() => {
        const items = document.querySelectorAll('.masonry-item, .image-item, .photo-item, img');
        if (items.length > 0) {
          items[0].click();
          return true;
        }
        return false;
      });
      
      if (imageItemExists) {
        console.log('Clicked on image item');
        
        // Wait for modal to appear
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get DOM structure of modal
        const modalClasses = await page.evaluate(() => {
          const allElements = document.querySelectorAll('*');
          const classes = new Set();
          allElements.forEach(el => {
            if (el.className && typeof el.className === 'string') {
              el.className.split(' ').forEach(cls => {
                if (cls) classes.add(cls);
              });
            }
          });
          return Array.from(classes);
        });
        
        console.log('Modal classes:', modalClasses);
      }
    }
  } catch (error) {
    console.error('Error during inspection:', error);
  } finally {
    await browser.close();
  }
})();
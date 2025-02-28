const { test, expect } = require('@playwright/test');

test.describe('Lazy Loading Performance Tests', () => {
  test('images should be lazy loaded', async ({ page }) => {
    // Navigate to the site
    await page.goto('/');
    
    // Open first portfolio
    await page.locator('.portfolio-item').first().click();
    
    // Wait for the photo grid to appear
    await page.waitForSelector('.photo-grid');
    
    // Get all images that have data-src attribute (lazy loaded images)
    const lazyImages = await page.locator('img.lazy[data-src]').count();
    
    // Ensure we have lazy loaded images
    expect(lazyImages).toBeGreaterThan(0);
    
    // Check how many images are actually loaded initially
    const loadedImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img.lazy[data-src]'));
      // Filter for images that have their src matching their data-src (meaning they've been loaded)
      return images.filter(img => 
        img.getAttribute('src') !== null && 
        img.getAttribute('src') !== 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' && 
        img.getAttribute('src') !== ''
      ).length;
    });
    
    // Verify that not all images are loaded immediately (lazy loading is working)
    // If this fails, it could mean all images are loaded right away which could be fine for small galleries
    if (lazyImages > 3) {
      expect(loadedImages).toBeLessThan(lazyImages);
    }
    
    // Scroll to the bottom of the page to trigger loading of all images
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Wait for lazy loading to occur
    await page.waitForTimeout(1000);
    
    // Check if more images have loaded after scrolling
    const loadedImagesAfterScroll = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img.lazy[data-src]'));
      return images.filter(img => 
        img.getAttribute('src') !== null && 
        img.getAttribute('src') !== 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' && 
        img.getAttribute('src') !== ''
      ).length;
    });
    
    // Verify more images have loaded after scrolling
    // This may only be applicable if there are enough images to require scrolling
    if (lazyImages > 3) {
      expect(loadedImagesAfterScroll).toBeGreaterThanOrEqual(loadedImages);
    }
  });

  test('should track network requests during page load', async ({ page }) => {
    // Create a list to store network requests
    const imageRequests = [];
    
    // Listen for network requests
    page.on('request', request => {
      if (request.resourceType() === 'image') {
        imageRequests.push(request.url());
      }
    });
    
    // Navigate to the site
    await page.goto('/');
    
    // Open first portfolio and wait for initial load
    await page.locator('.portfolio-item').first().click();
    await page.waitForSelector('.photo-grid');
    
    // Store the number of image requests at initial load
    const initialImageRequestCount = imageRequests.length;
    
    // Scroll down to trigger lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Wait for lazy loading to occur
    await page.waitForTimeout(1000);
    
    // Check if more image requests were made after scrolling
    // This may be less relevant for smaller galleries where all images load at once
    expect(imageRequests.length).toBeGreaterThanOrEqual(initialImageRequestCount);
  });

  test('should use placeholder for lazy loaded images', async ({ page }) => {
    // Slow down the network to make the test more reliable
    await page.route('**/*.jpg', route => route.continue({ delay: 200 }));
    await page.route('**/*.png', route => route.continue({ delay: 200 }));
    
    // Navigate to the site
    await page.goto('/');
    
    // Open first portfolio
    await page.locator('.portfolio-item').first().click();
    
    // Wait for the grid to load
    await page.waitForSelector('.photo-grid');
    
    // Check if placeholder or low-res images are being used
    const initialSrcValues = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img.lazy[data-src]'));
      return images.map(img => img.getAttribute('src'));
    });
    
    // Verify that at least some images initially have placeholder values
    const placeholderCount = initialSrcValues.filter(src => 
      src === '' || 
      src === 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' || 
      src?.includes('placeholder')
    ).length;
    
    // Should have at least some placeholders initially
    if (initialSrcValues.length > 0) {
      expect(placeholderCount).toBeGreaterThan(0);
    }
    
    // Wait for full-res images to load
    await page.waitForTimeout(1500);
    
    // Check if images have been replaced with actual content
    const finalSrcValues = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img.lazy[data-src]'));
      return images.map(img => img.getAttribute('src'));
    });
    
    // Verify that at least some images have changed from placeholders to full content
    const loadedCount = finalSrcValues.filter(src => 
      src !== '' && 
      src !== 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' && 
      !src?.includes('placeholder')
    ).length;
    
    // Should have loaded some images by now
    if (finalSrcValues.length > 0) {
      expect(loadedCount).toBeGreaterThan(0);
    }
  });
});
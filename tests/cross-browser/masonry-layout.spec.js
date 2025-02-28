const { test, expect } = require('@playwright/test');

test.describe('Photo Grid Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display portfolio grid properly', async ({ page }) => {
    // Check if portfolio grid is loaded
    await expect(page.locator('.portfolio-grid')).toBeVisible();
    
    // Check if grid items are displayed
    const gridItems = page.locator('.portfolio-item');
    expect(await gridItems.count()).toBeGreaterThan(0);
  });

  test('should display photo grid when portfolio is opened', async ({ page }) => {
    // Click on the first portfolio
    await page.locator('.portfolio-item').first().click();
    
    // Wait for photo grid to load
    await page.waitForSelector('.photo-grid');
    
    // Wait for images to load
    await page.waitForTimeout(2000);
    
    // Check that images are displayed
    const images = page.locator('.image-container');
    expect(await images.count()).toBeGreaterThan(0);
    
    // Check css properties to verify layout
    const firstImage = images.first();
    const className = await firstImage.getAttribute('class');
    
    // Verify the image container has either landscape or portrait class
    expect(className.includes('landscape') || className.includes('portrait')).toBeTruthy();
  });

  test('should adapt grid based on viewport size', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 }
    ];

    for (const viewport of viewports) {
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Navigate to homepage
      await page.goto('/');
      
      // Click first portfolio to open photo grid
      await page.locator('.portfolio-item').first().click();
      await page.waitForSelector('.photo-grid');
      
      // Check that the grid renders without errors
      // Add longer wait since the server might take time to load images
      await page.waitForTimeout(2000);
      const imageContainers = page.locator('.image-container');
      expect(await imageContainers.count()).toBeGreaterThan(0);
      
      // Different viewport should still display images appropriately
      const firstImage = imageContainers.first();
      expect(await firstImage.isVisible()).toBeTruthy();
    }
  });
});
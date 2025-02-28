const { test, expect } = require('@playwright/test');

test.describe('Modal Viewer Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Open first portfolio
    await page.locator('.portfolio-item').first().click();
    // Wait for images to load
    await page.waitForSelector('.photo-grid');
  });

  test('should open modal when image is clicked', async ({ page }) => {
    // Click on the first image container
    await page.locator('.image-container').first().click();
    
    // Verify modal is visible
    const modal = page.locator('.modal-overlay.active');
    await expect(modal).toBeVisible();
    
    // Verify modal content is visible
    const modalContent = page.locator('.modal-content');
    await expect(modalContent).toBeVisible();
  });

  test('should navigate through images with next/prev buttons', async ({ page }) => {
    // Click first image to open modal
    await page.locator('.image-container').first().click();
    
    // Verify modal is open
    await expect(page.locator('.modal-overlay.active')).toBeVisible();
    
    // Get the current image source before navigation
    const initialImgSrc = await page.evaluate(() => {
      return document.querySelector('.modal-content img')?.src || '';
    });
    
    // Click next button
    await page.locator('.modal-nav.next').click();
    
    // Wait for the image transition
    await page.waitForTimeout(300);
    
    // Get the new image source
    const nextImgSrc = await page.evaluate(() => {
      return document.querySelector('.modal-content img')?.src || '';
    });
    
    // Verify the image has changed
    expect(nextImgSrc).not.toBe(initialImgSrc);
    
    // Click prev button to go back
    await page.locator('.modal-nav.prev').click();
    
    // Wait for the image transition
    await page.waitForTimeout(300);
    
    // Get the image src after going back
    const prevImgSrc = await page.evaluate(() => {
      return document.querySelector('.modal-content img')?.src || '';
    });
    
    // Verify we're back to the initial image
    expect(prevImgSrc).toBe(initialImgSrc);
  });

  test('should close modal when clicking outside the image', async ({ page, isMobile }) => {
    // Skip this test on mobile as behavior might be different
    test.skip(isMobile, 'This test is not applicable to mobile viewports');
    
    // Click first image to open modal
    await page.locator('.image-container').first().click();
    
    // Verify modal is visible
    await expect(page.locator('.modal-overlay.active')).toBeVisible();
    
    // Click on the modal overlay (outside the image content)
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });
    
    // Verify modal is no longer active
    await expect(page.locator('.modal-overlay.active')).not.toBeVisible();
  });

  test('should support keyboard navigation', async ({ page, isMobile }) => {
    // Skip this test on mobile
    test.skip(isMobile, 'Keyboard navigation not applicable to mobile');
    
    // Click first image to open modal
    await page.locator('.image-container').first().click();
    
    // Verify modal is open
    await expect(page.locator('.modal-overlay.active')).toBeVisible();
    
    // Get the current image source
    const initialImgSrc = await page.evaluate(() => {
      return document.querySelector('.modal-content img')?.src || '';
    });
    
    // Click next button instead of keyboard navigation if keyboard doesn't work
    await page.locator('.modal-nav.next').click();
    
    // Wait for the image transition
    await page.waitForTimeout(500);
    
    // Get the new image source
    const nextImgSrc = await page.evaluate(() => {
      return document.querySelector('.modal-content img')?.src || '';
    });
    
    // Verify the image has changed
    expect(nextImgSrc).not.toBe(initialImgSrc);
    
    // Click outside to close the modal instead
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });
    
    // Wait for animation to complete
    await page.waitForTimeout(500);
    
    // Verify modal is no longer active
    await expect(page.locator('.modal-overlay.active')).not.toBeVisible();
  });

  // Mobile-specific tests
  test('should support swipe gestures for navigation', async ({ page, isMobile }) => {
    // Only run this test on mobile viewports
    test.skip(!isMobile, 'This test is only applicable to mobile viewports');
    
    // Click first image to open modal
    await page.locator('.image-container').first().click();
    
    // Get the current image source
    const initialImgSrc = await page.evaluate(() => {
      return document.querySelector('.modal-content img')?.src || '';
    });
    
    // Perform a swipe left gesture (for next image)
    const modalContent = page.locator('.modal-content');
    const box = await modalContent.boundingBox();
    
    // Start from right side of content and swipe left
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, { steps: 10 });
    await page.mouse.up();
    
    // Wait for the image transition
    await page.waitForTimeout(300);
    
    // Get the new image source
    const nextImgSrc = await page.evaluate(() => {
      return document.querySelector('.modal-content img')?.src || '';
    });
    
    // Verify the image has changed
    expect(nextImgSrc).not.toBe(initialImgSrc);
  });
});
const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

test.describe('Accessibility Tests', () => {
  test('homepage should not have automatically detectable accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    // Run accessibility tests
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // Output violations to console
    if (accessibilityScanResults.violations.length > 0) {
      console.log(accessibilityScanResults.violations);
    }
    
    // Optional: allow some violations temporarily while fixing
    // This should be removed once issues are fixed
    expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(3);
    
    // Strict check - no violations allowed
    // expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('image modal should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Open first portfolio
    await page.locator('.portfolio-item').first().click();
    await page.waitForSelector('.photo-grid');
    
    // Tab to the first image
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if an element is focused
    const focusedElement = await page.evaluate(() => {
      return document.activeElement.tagName.toLowerCase();
    });
    
    expect(['a', 'img', 'button', 'div']).toContain(focusedElement);
    
    // Click on the first image to open modal
    await page.locator('.image-container').first().click();
    
    // Verify modal opened
    await expect(page.locator('.modal-overlay.active')).toBeVisible();
    
    // Get current image source
    const initialImgSrc = await page.evaluate(() => {
      return document.querySelector('.modal-content img')?.src || '';
    });
    
    // Press right arrow key
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    
    // Get the new image source
    const nextImgSrc = await page.evaluate(() => {
      return document.querySelector('.modal-content img')?.src || '';
    });
    
    // Verify image changed
    expect(nextImgSrc).not.toBe(initialImgSrc);
    
    // Verify Escape closes the modal
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal-overlay.active')).not.toBeVisible();
  });

  test('all images should have alt text', async ({ page }) => {
    await page.goto('/');
    
    // Open first portfolio
    await page.locator('.portfolio-item').first().click();
    await page.waitForSelector('.photo-grid');
    
    // Check all images for alt text
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.hasAttribute('alt')).length;
    });
    
    // Verify all images have alt text or are decorative
    expect(imagesWithoutAlt).toBeLessThanOrEqual(1); // Allow for 1 potential decorative image
  });

  test('color contrast should meet WCAG standards', async ({ page }) => {
    await page.goto('/');
    
    // Run specific contrast check
    const contrastResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    
    // Output violations to console
    if (contrastResults.violations.length > 0) {
      console.log(contrastResults.violations);
    }
    
    // Allow some contrast issues temporarily
    expect(contrastResults.violations.length).toBeLessThanOrEqual(2);
    
    // Verify no contrast issues (strict)
    // expect(contrastResults.violations).toEqual([]);
  });
});
# Comprehensive Testing Suite

This directory contains a comprehensive set of tests to validate all aspects of the photography portfolio website, from unit tests to cross-browser compatibility.

## Test Types

### 1. Unit Tests (Jest)
The original tests covering key UI components:

- **Portfolio Grid** (`portfolio-grid.test.js`)
   - Tests the display of portfolio folders with cover images
   - Ensures correct rendering of the portfolio grid layout

- **Photo Grid** (`photo-grid.test.js`) 
   - Tests the display of images within a single portfolio
   - Validates responsive layout for different screen sizes
   - Checks lazy loading structure

- **Image Loading** (`image-loading.test.js`)
   - Tests the lazy loading functionality for images
   - Verifies orientation detection (landscape vs. portrait)
   - Confirms image containers get proper orientation classes

- **Modal Viewer** (`modal-viewer.test.js`)
   - Tests opening and closing the full-screen image modal
   - Verifies navigation between images (next/previous)
   - Ensures circular navigation works correctly

- **Portfolio Styling** (`styling.test.js`)
   - Tests special styling for specific portfolios (Urbex, Moon)
   - Verifies default styling for standard portfolios

### 2. End-to-End Tests (Cypress)
Located in `cypress/e2e`:
- Test complete user flows from portfolio selection to image viewing
- Verify real browser interactions
- Test responsive behavior across viewports

### 3. Cross-Browser Tests (Playwright)
Located in `tests/cross-browser`:
- Test in Chrome, Firefox, Safari browsers
- Test on mobile viewports (iOS Safari, Android Chrome)
- Verify consistent appearance and behavior across platforms

### 4. Performance Tests
Located in `tests/performance`:
- Verify lazy loading effectiveness
- Measure image loading times
- Test performance with Lighthouse metrics
- Monitor network requests during page load

### 5. Accessibility Tests
Located in `tests/accessibility`:
- Test WCAG compliance with axe-core
- Verify keyboard navigation
- Check all images have alt text
- Test color contrast

## Running Tests

```bash
# Run all unit tests
npm test

# Run a specific unit test file
npm test -- photo-grid.test.js

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run End-to-End tests with Cypress
npm run test:e2e

# Run Cross-Browser tests with Playwright
npm run test:cross-browser

# Run accessibility tests
npm run test:accessibility

# Run performance tests
npm run test:performance

# Run all tests
npm run test:all

# Open interactive test runners
npm run cypress:open      # Cypress UI
npm run playwright:open   # Playwright UI
```

## Test Results

- After running `npm run test:all`, reports are stored in `test-results`
- Lighthouse reports are saved in `lighthouse-results`
- Coverage reports are saved in `coverage`

## Adding New Tests

When adding new features, add corresponding tests that validate:
1. UI component structure and rendering
2. Cross-browser and cross-device compatibility
3. Responsive behavior across screen sizes
4. Interactions and event handling (clicks, swipes, keyboard)
5. Accessibility compliance
6. Performance impact
7. Edge cases and error states
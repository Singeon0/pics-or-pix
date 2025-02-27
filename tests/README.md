# Frontend Testing Suite

This directory contains a set of Jest tests to validate the core frontend functionality of the photography portfolio website.

## Test Structure

The tests are organized to cover the key aspects of the UI:

1. **Portfolio Grid** (`portfolio-grid.test.js`)
   - Tests the display of portfolio folders with cover images
   - Ensures correct rendering of the portfolio grid layout

2. **Photo Grid** (`photo-grid.test.js`) 
   - Tests the display of images within a single portfolio
   - Validates responsive layout for different screen sizes
   - Checks lazy loading structure

3. **Image Loading** (`image-loading.test.js`)
   - Tests the lazy loading functionality for images
   - Verifies orientation detection (landscape vs. portrait)
   - Confirms image containers get proper orientation classes

4. **Modal Viewer** (`modal-viewer.test.js`)
   - Tests opening and closing the full-screen image modal
   - Verifies navigation between images (next/previous)
   - Ensures circular navigation works correctly

5. **Portfolio Styling** (`styling.test.js`)
   - Tests special styling for specific portfolios (Urbex, Moon)
   - Verifies default styling for standard portfolios

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- portfolio-grid.test.js

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

The test suite covers:
- Component rendering and structure
- State management and transitions
- Responsive layout changes
- Special portfolio styling 
- Image orientation handling
- Modal navigation

## Adding New Tests

When adding new frontend features, please add corresponding tests that validate:
1. UI component structure
2. Responsive behavior
3. Interactions and event handling
4. Edge cases and error states
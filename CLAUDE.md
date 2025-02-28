# CLAUDE.md - Photography Portfolio Website

## Project Structure
- **Backend**: Node.js/Express server (index.js)
- **Frontend**: Single-page application with vanilla JavaScript
- **Main files**: index.js (server), public/index.html, public/main.js, public/home.css, public/photo-grid.css

## Development Commands
- `npm start`: Run the Express server
- `npm test`: Run all unit tests with Jest
- `npm test -- <test-file-name>`: Run specific test file (e.g., `npm test -- photo-grid.test.js`)
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Generate test coverage report
- `npm run test:e2e`: Run Cypress end-to-end tests
- `npm run test:cross-browser`: Run Playwright cross-browser tests
- `npm run test:accessibility`: Run accessibility tests
- `npm run test:all`: Run all test suites

## Code Style Guidelines
- **Imports/Exports**: CommonJS pattern (require/module.exports)
- **Naming**: camelCase for variables/functions; descriptive function names
- **Formatting**: 4-space indentation; clear sections with comment headers
- **Error Handling**: try/catch blocks with console.error for logging
- **Code Organization**: Functions grouped by purpose with comment headers (/**** Section Title ***/)
- **Documentation**: JSDoc format comments for function documentation
- **Testing**: Write tests for new functionality; each feature should be testable in isolation

## Architecture Features
- Dynamic portfolio discovery from public/images/* folders
- Lazy loading with IntersectionObserver and fallback scroll events
- Modal image viewer with keyboard navigation and touch swipe
- Mobile-optimized with tap/swipe gestures and iOS Safari optimizations
- Responsive design with viewport adaptations

## Cross-Browser Compatibility
- Use vendor prefixes for Safari compatibility (-webkit-)
- Test all features in Chrome, Firefox, and Safari
- Include mobile-specific optimizations for touch interactions
- Add hardware acceleration for better performance on mobile
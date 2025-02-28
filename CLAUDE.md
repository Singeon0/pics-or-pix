# CLAUDE.md - Photography Portfolio Website

## Project Structure
- **Backend**: Node.js/Express server (index.js)
- **Frontend**: Single-page application with vanilla JavaScript
- **Main files**: index.js (server), public/index.html, public/main.js, public/home.css, public/photo-grid.css

## Development Commands
- `npm start`: Run the Express server
- `npm test`: Run all frontend tests
- `npm test -- <test-file-name>`: Run specific test file (e.g., `npm test -- photo-grid.test.js`)
- `npm run test:watch`: Run tests in watch mode 
- `npm run test:coverage`: Generate test coverage report

## Code Style Guidelines
- **Imports/Exports**: CommonJS pattern (require/module.exports)
- **Naming**: camelCase for variables/functions; descriptive function names
- **Formatting**: 4-space indentation; clear sections with comment headers
- **Error Handling**: try/catch blocks with console.error for logging
- **Code Organization**: Functions grouped by purpose with clear comments (/**** Section Title ***/)
- **Documentation**: JSDoc format comments for function documentation

## API Endpoints
- GET /api/portfolios - Lists all portfolio folders with cover images
- GET /api/portfolios/:folderName - Returns images in a specific portfolio

## Architecture & Features
- Dynamic portfolio discovery from public/images/* folders
- Masonry layout for image grid display
- Lazy loading for optimized image performance
- Modal image viewer with navigation
- Mobile-optimized with touch gestures (swipe, double-tap)
- Special styling for 'urbex' and 'moon' portfolios

## Testing Architecture
- Jest + Testing Library for frontend tests
- Test files mirror component structure in /tests folder
- Mock API responses and browser functions for unit testing
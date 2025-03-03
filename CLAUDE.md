# CLAUDE.md - Pics or Pix Project Guide

## Build & Run Commands
- `npm start` - Start the Express server (runs index.js)
- `node index.js` - Direct server start
- No testing framework configured yet

## Project Structure
- Express backend (index.js) serves static files from /public
- Single-page app with dynamic portfolio discovery
- Image folders in /public/images represent photo collections

## Code Style Guidelines
- Use CommonJS imports with `require()`
- Indentation: 4 spaces
- Naming: camelCase for variables and functions
- Use JSDoc comments for function documentation
- ES6 features: arrow functions, template literals, destructuring

## Error Handling
- Use try/catch blocks in filesystem operations
- Log errors to console with meaningful context
- Use HTTP status codes for API errors (404, 500, etc.)

## Front-end Conventions
- DOM manipulation through vanilla JS
- Event listeners should be properly cleaned up
- Use requestAnimationFrame for animations
- Prefer CSS transitions when possible
# CLAUDE.md - Project Documentation

## Project Summary
This is a personal photography website that displays multiple "portfolios" (e.g., Spain, Urbex, etc.) in a dynamic way, with separate optimized experiences for desktop and mobile devices. The website automatically discovers any new portfolio folder uploaded, displaying it without needing to manually update the HTML.

## Key Technologies
- **Node.js + Express.js**: Server for handling API endpoints, dynamic folder reading, and device detection
- **Front-End**: Two separate SPAs (Single-Page Applications) - one for desktop and one for mobile
- **Dynamic Content**: JavaScript fetches data from the server APIs and updates the page on the fly

## Build Commands
- `npm start` - Start the Express server
- `node index.js` - Alternative way to start the server
- No specific test commands are configured
- No linting tools configured, consider adding ESLint

## Project Structure
- **Server Code**: 
  - `index.js`: Main Express server with device detection and API endpoints
  - `package.json`: Dependencies and scripts

- **Client Code**: 
  - `/public/desktop/`: Desktop-specific files (index.html, styles.css, main.js)
  - `/public/mobile/`: Mobile-specific files (index.html, styles.css, main.js)
  - `/public/images/`: Portfolio images organized in subfolders (each with cover.jpg)
  - `/public/index.html`: Redirection page with loading indicator

## API Endpoints
- `GET /api/portfolios`: Returns a list of portfolio folders with their cover images
- `GET /api/portfolios/:folderName`: Returns all images within a specific portfolio folder
- `GET /api/device`: Returns device type information (isMobile: true/false)

## Desktop Functionalities
- **Portfolio Grid**: 4-column responsive grid layout optimized for large screens
- **Hover Effects**: Image zoom and overlay text on hover
- **Keyboard Navigation**: Arrow keys for navigating images in modal view
- **Escape Key**: Close modal view with ESC key
- **Mouse Interactions**: Click to open portfolio/image, click navigation buttons
- **Visual Enhancements**: Subtle animations on hover, elevated card shadows
- **Direct Interaction**: Single click to open portfolios
- **Responsive Layout**: Adjusts columns based on screen size while maintaining desktop experience
- **Image Modal**: Full-screen viewing with keyboard controls
- **Large Navigation Controls**: Circular buttons with hover effects
- **Performance Optimization**: Lazy loading with larger viewports

## Mobile Functionalities
- **Portfolio Grid**: Single-column layout optimized for small screens
- **Touch Gestures**: Swipe left/right to navigate images in modal view
- **Double-Tap Interaction**: Double tap to open portfolio items
- **Always-Visible Labels**: Portfolio names always visible (not just on hover)
- **Larger Touch Targets**: Bigger navigation buttons optimized for fingers
- **Visual Feedback**: Temporary overlays to confirm taps
- **Swipe Navigation**: Horizontal swipe to navigate between images
- **Full-Width Images**: Images take maximum available width on mobile screens
- **Minimal Margins**: Reduced spacing to maximize content area
- **Simplified Interactions**: Touch-optimized interface with fewer animations
- **Performance Optimization**: Lazy loading with smaller image batches

## Code Style Guidelines
- **Naming**: Use camelCase for variables/functions, PascalCase for classes
- **Formatting**: 4-space indentation, semicolons required
- **JavaScript**: ES6+ features (arrow functions, template literals)
- **Error Handling**: Use try/catch blocks for filesystem operations
- **Constants**: Use UPPERCASE_WITH_UNDERSCORES for config values
- **Comments**: JSDoc-style for function documentation
- **DOM Manipulation**: Create elements with document.createElement, not innerHTML when possible
- **Event Listeners**: Use addEventListener with named functions for clarity
- **CSS**: Use BEM-inspired class naming (component-name__element--modifier)

## How It Works
1. **Server Initialization**:
   - Express server starts and sets up device detection middleware
   - Static file serving from public directory is configured
   - API endpoints are defined for portfolio discovery

2. **Device Detection**:
   - Server analyzes User-Agent to determine if device is mobile
   - Appropriate version (desktop/mobile) is served based on device type
   - Each version has unique optimizations for its platform

3. **Dynamic Content Loading**:
   - Server scans the images directory to find portfolio folders
   - Frontend makes API calls to get portfolio list and image paths
   - JavaScript dynamically builds the UI based on the API responses

4. **User Interaction Flow**:
   - User sees grid of portfolio covers on initial load
   - Clicking/tapping a portfolio shows its images in a responsive grid
   - Images can be viewed in a full-screen modal with navigation
   - User can return to portfolio list or navigate between images
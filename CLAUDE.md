# CLAUDE.md - Project Documentation

## Project Summary
This is a personal photography website that displays multiple "portfolios" (e.g., Valencia, Urbex, etc.) in a dynamic way, with separate optimized experiences for desktop and mobile devices. The website automatically discovers any new portfolio folder uploaded, displaying it without needing to manually update the HTML.

## Key Technologies
- **Node.js + Express.js**: Server for handling API endpoints, dynamic folder reading, and device detection
- **Front-End**: Two separate SPAs (Single-Page Applications) - one for desktop and one for mobile
- **Dynamic Content**: JavaScript fetches data from the server APIs and updates the page on the fly

## Build Commands
- `npm start` - Start the Express server
- `node index.js` - Alternative way to start the server
- `pm2 start ecosystem.config.js` - Start with PM2 in production with cluster mode
- `pm2 reload pics-or-pix` - Zero-downtime reload of the application
- `systemctl restart pics-or-pix` - Restart using systemd service
- `nginx -t && systemctl reload nginx` - Test and reload Nginx configuration

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
- **Error Handling**: Use try/catch blocks for filesystem operations (as seen in index.js)
- **Constants**: Use UPPERCASE_WITH_UNDERSCORES for config values (e.g., PORT)
- **Comments**: Use meaningful comments to describe complex logic
- **Security**: Use Helmet middleware for HTTP security headers
- **Performance**: Use compression middleware for response compression
- **API Design**: RESTful endpoints with descriptive names (e.g., /api/portfolios)
- **Code Organization**: Group related functionality together (as seen in index.js)
- **Package Management**: Use specific version dependencies in package.json

## Server Deployment
- **Process Management**: PM2 in cluster mode with auto-restart (ecosystem.config.js)
- **Logs**: Stored in /var/log/pics-or-pix/
- **Web Server**: Nginx as reverse proxy with SSL (sites-available/pics-or-pix.uk.conf)
- **Service**: Systemd service for automatic startup (pics-or-pix.service)
- **Security**: Fail2Ban for brute force protection, UFW firewall
- **Backups**: Daily backups at 3 AM (backup-pics-or-pix.sh)
- **Monitoring**: Process and system monitoring via PM2

## How It Works
1. **Server Initialization**:
   - Express server starts and sets up device detection middleware
   - Static file serving from public directory is configured
   - API endpoints are defined for portfolio discovery

2. **Device Detection**:
   - Server analyzes User-Agent to determine if device is mobile
   - Appropriate version (desktop/mobile) is served based on device type
   - Each version has unique optimizations for its platform

3. **Portfolio Discovery**:
   - Server scans the images directory to find portfolio folders
   - Each portfolio is expected to have a cover.jpg file
   - Special "Complete Collection" portfolio aggregates all images
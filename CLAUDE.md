# CLAUDE.md - Project Documentation

*Last updated: March 21, 2025*

## Build Commands
- `npm start` - Start the Express server 
- `node index.js` - Start the server directly
- `pm2 start index.js --name pics-or-pix` - Start with PM2 in fork mode
- `pm2 start ecosystem.config.js` - Start with PM2 in production with cluster mode
- `pm2 reload pics-or-pix` - Zero-downtime reload of the application
- `pm2 logs pics-or-pix` - View application logs
- `pm2 monit` - Monitor application processes
- `nginx -t && systemctl reload nginx` - Test and reload Nginx configuration
- `sudo tail -f /var/log/pics-or-pix/error.log` - Check application error logs
- `npm install --production` - Install production dependencies
- `npm run optimize-images` - Run the image optimization script manually

## Server Infrastructure
- HTTP/2 is enabled for improved performance
- HTTP/3 preparation with Alt-Svc headers for future support
- HTTPS is configured with Let's Encrypt certificates
- Nginx serves as reverse proxy (config: `/etc/nginx/sites-available/pics-or-pix.uk.conf`)
- Full documentation in `/var/www/pics-or-pix/SERVER_DOCUMENTATION.md`

## Repository Information
- `/var/www/pics-or-pix` is a Git repository
- Main branch is used for production
- Commits should follow conventional commit format
- Run `git status` to check for changes
- Run `git add .` to stage all changes
- Run `git commit -m "message"` to create a commit
- Run `git push origin main` to push to remote

## Code Style Guidelines
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Formatting**: 4-space indentation, semicolons required
- **JavaScript**: ES6+ features (arrow functions, template literals, async/await)
- **Error Handling**: Use try/catch blocks for filesystem operations and API calls
- **Constants**: UPPERCASE_WITH_UNDERSCORES for config values (e.g., PORT)
- **Comments**: Add meaningful comments for complex logic
- **Security**: Use Helmet middleware for HTTP security headers
- **Performance**: Use compression middleware for response compression
- **API Design**: RESTful endpoints with descriptive names (e.g., /api/portfolios)
- **File Structure**:
  - `index.js`: Main Express server with API endpoints
  - `/public/js/`: Shared JavaScript utilities and modules
    - `/public/js/utils/`: Utility functions used across the application
    - `/public/js/components/`: Reusable UI components
    - `/public/js/config/`: Configuration settings and constants
    - `/public/js/api/`: API client functions for frontend
  - `/public/desktop/`: Desktop-specific frontend files
  - `/public/mobile/`: Mobile-specific frontend files
  - `/public/images/`: Portfolio images (each subfolder with cover.jpg)

## API Endpoints
- `GET /api/portfolios`: List of portfolio folders with cover images
- `GET /api/portfolios/:folderName`: All images within a specific portfolio
- `GET /api/device`: Device type information (isMobile: true/false)

## Deployment
- **Process Manager**: PM2 in cluster mode with auto-restart
- **Logs**: Stored in /var/log/pics-or-pix/
- **Web Server**: Nginx as reverse proxy with SSL
- **Backups**: Daily backups at 3 AM via /root/backup-pics-or-pix.sh
- **Memory Limit**: Application restarts if memory exceeds 200MB

## Project Structure
This photography website displays multiple portfolios with separate experiences for desktop and mobile devices. It automatically discovers any new portfolio folder uploaded, without needing manual HTML updates. Key technologies include Node.js+Express.js for the server, with dynamic content loaded via JavaScript API calls.

## Architecture Improvements (March 21, 2025)
The application code has been refactored to improve:

1. **Modularization**:
   - Shared utility functions moved to common modules
   - Platform-specific code separated from shared logic
   - Configuration constants centralized in constants.js
   - Reusable UI components extracted as ES modules
   - API client functions centralized with caching

2. **Performance Optimization**:
   - Removed unnecessary setTimeout calls
   - Improved lazy loading implementation with IntersectionObserver
   - Reduced DOM operations with batched updates
   - Enhanced image loading strategy with preloading
   - Implemented response caching in API client

3. **Code Quality**:
   - Eliminated code duplication (~60% reduction in duplicate code)
   - Consistent error handling with try/catch blocks
   - Better separation of concerns with module system
   - Improved naming conventions and semantic function names
   - ES modules with proper import/export patterns

4. **UX Enhancements**:
   - More responsive interface with optimized events
   - Better handling of touch events on mobile devices
   - Smoother transitions and hardware-accelerated animations
   - Optimized for Safari mobile with specific fixes

## Recent Changes
- **2025-03-21**: Refactored frontend code for better modularity and performance
- **2025-03-21**: Removed unused image-optimizer.js file and updated PM2 configuration
- **2025-03-18**: Added HTTP/2 support and performance optimizations
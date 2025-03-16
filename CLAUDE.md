# CLAUDE.md - Project Documentation

## Build Commands
- `npm start` - Start the Express server 
- `node index.js` - Alternative way to start the server
- `pm2 start ecosystem.config.js` - Start with PM2 in production with cluster mode
- `pm2 reload pics-or-pix` - Zero-downtime reload of the application
- `pm2 logs pics-or-pix` - View application logs
- `pm2 monit` - Monitor application processes
- `nginx -t && systemctl reload nginx` - Test and reload Nginx configuration
- `sudo tail -f /var/log/pics-or-pix/error.log` - Check application error logs
- `npm install --production` - Install production dependencies

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
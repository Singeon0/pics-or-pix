# Pics-or-Pix Server Documentation

## Table of Contents
1. [Server Overview](#server-overview)
2. [Application Architecture](#application-architecture)
3. [Web Server Configuration](#web-server-configuration)
4. [Node.js Application](#nodejs-application)
5. [Process Management](#process-management)
6. [Performance Optimizations](#performance-optimizations)
7. [HTTP/3 Implementation Plan](#http3-implementation-plan)
8. [Security Measures](#security-measures)
9. [Logging Setup](#logging-setup)
10. [Backup Procedures](#backup-procedures)
11. [Important File Locations](#important-file-locations)
12. [Troubleshooting Guide](#troubleshooting-guide)
13. [Maintenance Tasks](#maintenance-tasks)
14. [Frontend Architecture](#frontend-architecture)

## Server Overview

- **Server Type**: Virtual Private Server (VPS)
- **Operating System**: Ubuntu (based on systemd presence)
- **Domain**: pics-or-pix.uk
- **IP Address**: Server's IP (not displayed for security reasons)
- **Primary Services**:
  - Nginx (Web Server)
  - Node.js (Application Server)
  - PM2 (Process Manager)
  - Fail2Ban (Security)

## Application Architecture

The Pics-or-Pix website is a Node.js application with the following components:

- **Frontend**: Static HTML/CSS/JS files served from `/var/www/pics-or-pix/public/`
- **Backend**: Node.js application running on port 3000
- **Web Server**: Nginx acting as a reverse proxy, handling SSL and serving static files
- **Process Management**: PM2 in cluster mode for high availability

The application follows a typical web architecture where:

1. Nginx receives all incoming requests on ports 80/443
2. Static files are served directly by Nginx from the public directory
3. Dynamic requests are proxied to the Node.js application
4. Node.js handles business logic and API requests

## Web Server Configuration

### Nginx Configuration

Nginx is configured as a reverse proxy with the following features:

- **Configuration File**: `/etc/nginx/sites-available/pics-or-pix.uk.conf`
- **Enabled Via**: Symlink at `/etc/nginx/sites-enabled/pics-or-pix.uk.conf`
- **SSL/TLS**: Enabled via Let's Encrypt certificates
- **Certificate Path**: `/etc/letsencrypt/live/pics-or-pix.uk/`

**Key Features**:

- HTTP to HTTPS redirection
- Gzip compression enabled for text-based file types
- Browser caching configured for static assets (7 days)
- Image caching configured for 30 days
- Optimized images caching for 60 days
- Security headers implemented (XSS Protection, Content-Type Options, etc.)
- Separate location blocks for API and static files
- HTTP/2 support enabled
- Alt-Svc headers for future HTTP/3 support

**To Reload Nginx After Configuration Changes**:
```bash
sudo nginx -t       # Test configuration
sudo systemctl reload nginx  # Apply changes without downtime
```

## Node.js Application

The Node.js application is the core of the website:

- **Main Application File**: `/var/www/pics-or-pix/index.js`
- **Dependencies**: Listed in `/var/www/pics-or-pix/package.json`
- **Environment**: Production (NODE_ENV=production)
- **Port**: 3000

**Directory Structure**:
- `/var/www/pics-or-pix/` - Root application directory
- `/var/www/pics-or-pix/public/` - Static files
  - `/var/www/pics-or-pix/public/images/` - Image directories
  - `/var/www/pics-or-pix/public/desktop/` - Desktop-specific resources
  - `/var/www/pics-or-pix/public/mobile/` - Mobile-specific resources
  - `/var/www/pics-or-pix/public/js/` - Shared JavaScript modules
- `/var/www/pics-or-pix/scripts/` - Utility scripts
- `/var/www/pics-or-pix/node_modules/` - Node.js dependencies

**To Update Application**:
```bash
cd /var/www/pics-or-pix
git pull                      # If using git for deployment
npm install --production      # Update dependencies
pm2 reload pics-or-pix        # Reload application without downtime
```

## Process Management

PM2 is used to ensure the application stays running and automatically restarts if it crashes:

- **PM2 Configuration**: `/var/www/pics-or-pix/ecosystem.config.js`
- **Process Name**: pics-or-pix
- **Mode**: Cluster mode with maximum number of instances
- **Memory Limit**: Restarts if memory exceeds 200MB
- **Logs**: Stored in `/var/log/pics-or-pix/`

**Key PM2 Commands**:
```bash
pm2 list                      # List all processes
pm2 show pics-or-pix          # Show detailed information
pm2 logs pics-or-pix          # View logs
pm2 reload pics-or-pix        # Zero-downtime reload
pm2 restart pics-or-pix       # Hard restart
pm2 monit                     # Monitor all processes
```

**PM2 Auto-Start**:
PM2 is configured to start on system boot through:
- PM2 startup script: `pm2-root` systemd service
- Saved process list via: `pm2 save`

## Performance Optimizations

*Last updated: March 21, 2025*

### Compression

#### Nginx Compression
Gzip compression is configured in the Nginx server block:
- `gzip on` - Enables gzip compression
- `gzip_comp_level 6` - Sets compression level (1-9, higher = more compression but more CPU)
- `gzip_min_length 256` - Only compress responses larger than 256 bytes
- `gzip_proxied any` - Compress responses to proxied requests
- `gzip_vary on` - Adds "Vary: Accept-Encoding" header
- `gzip_types` - List of MIME types to compress

Configuration location: `/etc/nginx/sites-available/pics-or-pix.uk.conf`

#### Express Compression
The application also uses the Express compression middleware as a second layer:
- Installed via npm: `compression`
- Implemented in `index.js`
- Compresses all compatible responses
- Works for both static and dynamic content

This dual-layer approach ensures:
1. Nginx handles compression for static assets
2. Express handles compression for dynamic API responses
3. Fallback compression if either layer is bypassed


### Caching Strategy

#### Static Assets
- Long cache lifetimes for static assets (7 days)
- `Cache-Control: public, max-age=604800` header
- File fingerprinting for cache busting

#### Images
- Extended cache lifetimes (30-60 days)
- Immutable flag for improved caching
- Different policies for original vs. optimized images

### HTTP/2 Support
- Enabled in Nginx configuration
- Multiplexing for parallel resource loading
- Header compression
- Server push capabilities (not currently used)

### Performance Monitoring
- Use Chrome DevTools Network tab to monitor compression ratios
- Check response headers for:
  - `Content-Encoding: gzip` - Confirms compression is working
  - `Vary: Accept-Encoding` - Ensures proper caching
- Verify Gzip is working with: `curl -H "Accept-Encoding: gzip" -I https://pics-or-pix.uk/`

## HTTP/3 Implementation Plan

*Created: March 18, 2025*

### Current Status

HTTP/2 has been successfully implemented on the site, providing performance improvements through:
- Multiplexed connections
- Header compression
- Binary protocol
- Connection prioritization

Additionally, Alt-Svc headers have been added to indicate HTTP/3 availability for compatible clients, preparing them for the future HTTP/3 implementation:
```nginx
add_header Alt-Svc 'h3=":443"; ma=86400, h3-29=":443"; ma=86400' always;
```

### HTTP/3 Implementation Requirements

The current Ubuntu Nginx package (1.24.0) does not include HTTP/3 support. To implement full HTTP/3:

1. **Upgrade Nginx with HTTP/3 Support**
   - Option 1: Install from NGINX's official repository with HTTP/3 module
   - Option 2: Compile Nginx from source with quiche library (Cloudflare's QUIC implementation)
   - Option 3: Use nginx-quic branch which contains NGINX's HTTP/3 implementation

2. **Requirements for HTTP/3**
   - BoringSSL (not OpenSSL)
   - QUICHE or ngtcp2 library
   - Compilation with --with-http_v3_module flag

3. **Implementation Steps**
   ```bash
   # Install build dependencies
   apt install -y build-essential cmake golang libunwind-dev libpcre3-dev

   # Clone required repositories
   git clone https://github.com/google/boringssl.git
   git clone --recursive https://github.com/nginx/nginx-quic.git

   # Build BoringSSL
   cd boringssl
   mkdir build && cd build
   cmake ..
   make -j$(nproc)
   cd ../..

   # Build NGINX with HTTP/3
   cd nginx-quic
   ./auto/configure \
     --prefix=/etc/nginx \
     --sbin-path=/usr/sbin/nginx \
     --conf-path=/etc/nginx/nginx.conf \
     --error-log-path=/var/log/nginx/error.log \
     --http-log-path=/var/log/nginx/access.log \
     --pid-path=/var/run/nginx.pid \
     --with-http_ssl_module \
     --with-http_v2_module \
     --with-http_v3_module \
     --with-openssl=../boringssl \
     --with-cc-opt="-I../boringssl/include" \
     --with-ld-opt="-L../boringssl/build/ssl -L../boringssl/build/crypto"
   make -j$(nproc)
   make install
   ```

### Configuration Example for HTTP/3

Once HTTP/3-capable Nginx is installed, update the configuration:

```nginx
server {
    # Existing HTTP/2 configuration
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    # Add HTTP/3 (QUIC) configuration
    listen 443 quic;
    listen [::]:443 quic;

    # Enable HTTP/3
    http3 on;
    
    # Add Alt-Svc header
    add_header Alt-Svc 'h3=":443"; ma=86400, h3-29=":443"; ma=86400' always;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/pics-or-pix.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pics-or-pix.uk/privkey.pem;
    ssl_protocols TLSv1.3;    # QUIC requires TLSv1.3
    
    # Other configuration remains the same...
}
```

### Testing HTTP/3

After implementation, test HTTP/3 support with:

```bash
# Install curl with HTTP/3
apt install curl-impersonate

# Test
curl-impersonate -I --http3 https://pics-or-pix.uk
```

Browser testing:
- Chrome: Enable chrome://flags/#enable-quic
- Firefox: Set network.http.http3.enabled to true in about:config

### Potential Issues

1. **UDP Port Accessibility**
   - Ensure firewall allows UDP traffic on port 443
   - Check if hosting provider blocks UDP on port 443

2. **Performance Monitoring**
   - Set up monitoring to compare HTTP/2 vs HTTP/3 performance
   - Track metrics like Time to First Byte (TTFB) and page load times

3. **Backward Compatibility**
   - Continue serving HTTP/2 for clients that don't support HTTP/3
   - Monitor errors in logs after implementation

### Resource Requirements

- Increased memory usage (QUIC implementation requires more memory)
- Additional CPU usage for UDP packet processing
- Possible need for firewall configuration changes

### Timeline

1. **Preparation Phase** - Complete
   - HTTP/2 implementation
   - Alt-Svc header addition

2. **Implementation Phase** - Next Steps
   - Set up test environment
   - Install HTTP/3-capable Nginx
   - Test configuration
   - Deploy to production

3. **Monitoring Phase**
   - Track HTTP/3 adoption
   - Monitor performance improvements
   - Address any issues

### Conclusion

The website is now prepared for HTTP/3 with the Alt-Svc headers, informing compatible browsers about future HTTP/3 support. Full HTTP/3 implementation requires upgrading Nginx to a version with HTTP/3 capabilities.

## Security Measures

Multiple security measures have been implemented:

### Firewall (UFW)
UFW is enabled and configured to allow only necessary services:
- SSH (port 22)
- HTTP (port 80)
- HTTPS (port 443)

**UFW Commands**:
```bash
sudo ufw status              # Check firewall status
sudo ufw allow [port/service] # Allow new service
```

### Fail2Ban
Fail2Ban is installed to protect against brute force attacks:
- **Configuration**: `/etc/fail2ban/jail.local`
- **Protected Services**: SSH, Nginx HTTP Auth, and Nginx Bot Detection
- **Ban Time**: 1 hour
- **Find Time**: 10 minutes
- **Max Retry**: 5 attempts (3 for SSH)

**Fail2Ban Commands**:
```bash
sudo fail2ban-client status  # General status
sudo fail2ban-client status sshd  # SSH jail status
sudo fail2ban-client set sshd unbanip [IP]  # Unban an IP
```

### SSL/TLS
Let's Encrypt certificates are deployed for HTTPS:
- **Certificate Path**: `/etc/letsencrypt/live/pics-or-pix.uk/`
- **Auto-renewal**: Handled by Certbot's cron job

### File Permissions
- Web application files owned by www-data
- Log directory has appropriate permissions
- Sensitive configuration files restricted to root

## Logging Setup

Comprehensive logging is configured for all components:

- **Application Logs**:
  - Output logs: `/var/log/pics-or-pix/out.log`
  - Error logs: `/var/log/pics-or-pix/error.log`
  - Backup logs: `/var/log/pics-or-pix/backup.log`

- **Nginx Logs**:
  - Access logs: `/var/log/nginx/access.log`
  - Error logs: `/var/log/nginx/error.log`

- **System Logs**:
  - Authentication: `/var/log/auth.log`
  - System logs: `/var/log/syslog`

**Log Rotation**:
Logs are automatically rotated by the system's logrotate service.

## Backup Procedures

A daily backup system is in place:

- **Backup Script**: `/root/backup-pics-or-pix.sh`
- **Backup Schedule**: Daily at 3:00 AM via cron
- **Backup Location**: `/root/backups/`
- **Retention**: 7 days (older backups are automatically deleted)

**The backup script performs the following**:
1. Creates a timestamped tarball of the entire application
2. Stores it in the backup directory
3. Removes backups older than 7 days
4. Logs the process to `/var/log/pics-or-pix/backup.log`

**To Manually Run a Backup**:
```bash
sudo /root/backup-pics-or-pix.sh
```

## Important File Locations

### Configuration Files
- **Nginx Site Config**: `/etc/nginx/sites-available/pics-or-pix.uk.conf`
- **PM2 Config**: `/var/www/pics-or-pix/ecosystem.config.js`
- **Systemd Service**: `/etc/systemd/system/pics-or-pix.service`
- **Fail2Ban Config**: `/etc/fail2ban/jail.local`

### Application Files
- **Application Root**: `/var/www/pics-or-pix/`
- **Main Application**: `/var/www/pics-or-pix/index.js`
- **Package Info**: `/var/www/pics-or-pix/package.json`
- **Public Files**: `/var/www/pics-or-pix/public/`
- **Images**: `/var/www/pics-or-pix/public/images/`

### Log Files
- **Application Logs**: `/var/log/pics-or-pix/`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `/var/log/`

### Backup Files
- **Backup Script**: `/root/backup-pics-or-pix.sh`
- **Backup Directory**: `/root/backups/`

## Troubleshooting Guide

### Common Issues and Solutions

#### Application Not Running
1. Check application status: `pm2 list` or `systemctl status pics-or-pix`
2. Check application logs: `tail -n 100 /var/log/pics-or-pix/error.log`
3. Restart application: `pm2 restart pics-or-pix` or `systemctl restart pics-or-pix`

#### Nginx Issues
1. Test configuration: `nginx -t`
2. Check Nginx status: `systemctl status nginx`
3. Check Nginx logs: `tail -n 100 /var/log/nginx/error.log`
4. Restart Nginx: `systemctl restart nginx`

#### SSL Certificate Issues
1. Check certificate validity: `certbot certificates`
2. Test renewal: `certbot renew --dry-run`
3. Force renewal if needed: `certbot renew --force-renewal`

#### Server Load Issues
1. Check system resources: `top` or `htop`
2. Check disk space: `df -h`
3. Check memory usage: `free -m`
4. Check load average: `uptime`

#### Security Issues
1. Check Fail2Ban status: `fail2ban-client status`
2. Check firewall status: `ufw status`
3. Check recent logins: `last` or `lastlog`
4. Check authorization logs: `tail -n 100 /var/log/auth.log`

## Maintenance Tasks

### Regular Maintenance Checklist

#### Daily
- Check application logs for errors
- Verify backups are running successfully

#### Weekly
- Check disk space usage: `df -h`
- Check system updates: `apt update`
- Review Nginx access logs for unusual activity

#### Monthly
- Apply system updates: `apt update && apt upgrade`
- Verify SSL certificate validity
- Check PM2 and Node.js for updates
- Review and rotate any large log files
- Test application recovery from backup

#### Quarterly
- Comprehensive security review
- Password rotation for critical services
- Test full server recovery procedure

### Updating Components

#### Node.js Updates
```bash
# Check current version
node -v

# Update Node.js (if needed)
# Follow official Node.js documentation for major version updates
```

#### NPM Packages Updates
```bash
cd /var/www/pics-or-pix
npm outdated          # Check outdated packages
npm update            # Update packages within version constraints
```

#### System Updates
```bash
apt update            # Update package lists
apt upgrade           # Upgrade packages
apt autoremove        # Remove unnecessary packages
```

### Monitoring System Health

- **Process Monitoring**: PM2 provides real-time monitoring via `pm2 monit`
- **System Monitoring**: Basic monitoring through standard Linux tools
  - `top` or `htop` for CPU and memory
  - `df -h` for disk space
  - `netstat -tuln` for network connections

## Frontend Architecture

*Added: March 21, 2025*

### Overview

The frontend architecture has been redesigned to implement modern JavaScript practices and improve maintainability. Key improvements include:

1. **Modular Code Structure**
   - Shared utility functions moved to common modules
   - Platform-specific code separated from shared logic
   - Configuration constants centralized in constants.js
   - Component-based architecture with ES modules

2. **New Directory Structure**
   ```
   /public/
     /js/
       /api/        - API client functions
       /utils/      - Shared utility functions
       /components/ - Reusable UI components
       /config/     - Constants and configuration
     /desktop/      - Desktop-specific files
     /mobile/       - Mobile-specific files
     /images/       - Portfolio images
   ```

3. **Loading Strategy**
   - Core shared modules loaded first with ES module imports
   - Platform-specific modules loaded dynamically
   - Improved lazy loading for images using IntersectionObserver
   - HTML updated to use type="module" for proper ES module loading

### Key Components

#### Shared Modules

1. **Config Module** (`/public/js/config/constants.js`)
   - Centralizes all configuration values as exported constants
   - Provides platform-specific overrides and detection
   - Eliminates magic numbers throughout the codebase
   - Contains selectors, class names, and animation durations
   - Special configurations for different portfolio types

2. **API Client** (`/public/js/api/portfolio-api.js`)
   - Wraps all API calls in a single module with exported functions
   - Implements proper error handling with try/catch
   - Provides caching for repeated API calls using Map
   - Consistent interface for portfolio and device detection
   - Handles sorting of portfolio images

3. **Image Utils** (`/public/js/utils/image-utils.js`)
   - Image manipulation utilities like dominant color extraction
   - Lazy loading implementation with IntersectionObserver
   - Responsive image handling and orientation detection
   - Browser-specific optimizations for image loading
   - Fallback for older browsers without IntersectionObserver

4. **DOM Utils** (`/public/js/utils/dom-utils.js`)
   - Creation of UI elements with standardized interfaces
   - DOM manipulation helpers for consistent styling
   - Event handling utilities with proper cleanup
   - Factory functions for common UI elements
   - Platform-specific DOM manipulation

5. **UI Components** (`/public/js/components/`)
   - Modal component (`modal.js`) with platform-specific extensions
   - Platform detection component (`platform.js`) for responsive design
   - Exported as ES modules with proper encapsulation
   - Object-oriented design patterns with classes
   - Singleton pattern for shared components

#### Platform-Specific Implementation

Both desktop and mobile implementations follow the same pattern:

1. **Entry Point** (`main.js`)
   - Import shared modules
   - Initialize platform detection
   - Bootstrap application

2. **Platform Extensions**
   - Desktop: Mouse-based interactions
   - Mobile: Touch-based interactions with Safari optimizations

### Performance Improvements

1. **Lazy Loading**
   - Implemented with IntersectionObserver API for modern browsers
   - Fallback with scroll listener for older browsers
   - Optimized loading order based on viewport position
   - Prefetching of images to reduce visible loading transitions
   - Dynamic attribute and class switching to minimize repaints

2. **Event Handling**
   - Debounced and throttled event handlers for scroll and resize
   - Passive event listeners where appropriate for better scrolling
   - Improved touch event handling with proper gesture detection
   - Consolidated event handlers to reduce memory usage
   - Proper event cleanup to prevent memory leaks

3. **Animation Optimization**
   - Hardware-accelerated animations with CSS transforms
   - Reduced layout thrashing with batched DOM reads/writes
   - CSS transitions over JavaScript animations for better performance
   - requestAnimationFrame for smoother JavaScript animations
   - Reduced transition complexity for mobile devices

4. **Rendering Performance**
   - Reduced unnecessary DOM operations with element caching
   - Batch DOM updates for improved rendering pipeline
   - Properly sequenced animations to minimize reflows
   - Image dimension detection for smoother layout
   - Module preloading to reduce render-blocking resources

### Browser Compatibility

- **Modern Browsers**: Full functionality with optimal performance
- **Older Browsers**: Graceful degradation with feature detection
- **Mobile Browsers**: Optimized experience with specific enhancements for:
  - Safari on iOS (viewport fixes, momentum scrolling)
  - Chrome on Android (touch optimizations)
- **Image Format Support**:
  - JPEG/JPG: All browsers
  - PNG: All browsers
  - GIF: All browsers
  - WebP: Most modern browsers
  - AVIF: Chrome 85+, Firefox 93+, Safari 16+

### Future Enhancements

1. **Build Process**
   - Implement module bundling with Vite or Rollup for production
   - Add code minification and tree-shaking for smaller bundle size
   - Implement CSS preprocessing with SASS
   - Configure code splitting for improved loading performance
   - Automated build and deployment pipeline

2. **Progressive Enhancement**
   - Service worker for offline functionality and caching
   - Progressive Web App capabilities with installable web app
   - Advanced image optimization and WebP conversion on upload
   - Background image prefetching for faster navigation
   - Client-side caching strategies for faster repeat visits

3. **Accessibility Improvements**
   - Improve keyboard navigation with ARIA enhancements
   - Enhance screen reader support with semantic markup
   - Better focus management for modal and navigation elements
   - Color contrast improvements for vision-impaired users
   - Responsive design improvements for various devices and screen readers

---

This documentation serves as a comprehensive guide for managing your Pics-or-Pix server. Keep it updated as you make changes to your configuration or application deployment.

**Last Updated**: March 21, 2025
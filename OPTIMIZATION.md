# Performance Optimization Documentation

*Last updated: March 18, 2025*

## Compression

### Nginx Compression
Gzip compression is configured in the Nginx server block:
- `gzip on` - Enables gzip compression
- `gzip_comp_level 6` - Sets compression level (1-9, higher = more compression but more CPU)
- `gzip_min_length 256` - Only compress responses larger than 256 bytes
- `gzip_proxied any` - Compress responses to proxied requests
- `gzip_vary on` - Adds "Vary: Accept-Encoding" header
- `gzip_types` - List of MIME types to compress

Configuration location: `/etc/nginx/sites-available/pics-or-pix.uk.conf`

### Express Compression
The application also uses the Express compression middleware as a second layer:
- Installed via npm: `compression`
- Implemented in `index.js`
- Compresses all compatible responses
- Works for both static and dynamic content

This dual-layer approach ensures:
1. Nginx handles compression for static assets
2. Express handles compression for dynamic API responses
3. Fallback compression if either layer is bypassed

## Image Optimization

### WebP Conversion
- Images are automatically converted to WebP format
- Original format preserved for browsers without WebP support
- Implementation in `image-optimizer.js` and `scripts/optimize-images.js`

### Responsive Images
- Multiple resolutions generated for different device sizes
- Srcset and sizes attributes used for responsive loading
- Content negotiation via Accept header

## Caching Strategy

### Static Assets
- Long cache lifetimes for static assets (7 days)
- `Cache-Control: public, max-age=604800` header
- File fingerprinting for cache busting

### Images
- Extended cache lifetimes (30-60 days)
- Immutable flag for improved caching
- Different policies for original vs. optimized images

## HTTP/2 Support
- Enabled in Nginx configuration
- Multiplexing for parallel resource loading
- Header compression
- Server push capabilities (not currently used)

## HTTP/3 Preparation
- Alt-Svc headers for future HTTP/3 support
- Details in `/var/www/pics-or-pix/HTTP3-IMPLEMENTATION.md`

## Performance Monitoring
- Use Chrome DevTools Network tab to monitor compression ratios
- Check response headers for:
  - `Content-Encoding: gzip` - Confirms compression is working
  - `Vary: Accept-Encoding` - Ensures proper caching
- Verify Gzip is working with: `curl -H "Accept-Encoding: gzip" -I https://pics-or-pix.uk/`
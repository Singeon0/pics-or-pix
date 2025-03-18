# HTTP/3 Implementation Plan

*Created: March 18, 2025*

## Current Status

HTTP/2 has been successfully implemented on the site, providing performance improvements through:
- Multiplexed connections
- Header compression
- Binary protocol
- Connection prioritization

Additionally, Alt-Svc headers have been added to indicate HTTP/3 availability for compatible clients, preparing them for the future HTTP/3 implementation:
```nginx
add_header Alt-Svc 'h3=":443"; ma=86400, h3-29=":443"; ma=86400' always;
```

## HTTP/3 Implementation Requirements

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

## Configuration Example for HTTP/3

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

## Testing HTTP/3

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

## Potential Issues

1. **UDP Port Accessibility**
   - Ensure firewall allows UDP traffic on port 443
   - Check if hosting provider blocks UDP on port 443

2. **Performance Monitoring**
   - Set up monitoring to compare HTTP/2 vs HTTP/3 performance
   - Track metrics like Time to First Byte (TTFB) and page load times

3. **Backward Compatibility**
   - Continue serving HTTP/2 for clients that don't support HTTP/3
   - Monitor errors in logs after implementation

## Resource Requirements

- Increased memory usage (QUIC implementation requires more memory)
- Additional CPU usage for UDP packet processing
- Possible need for firewall configuration changes

## Timeline

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

## Conclusion

The website is now prepared for HTTP/3 with the Alt-Svc headers, informing compatible browsers about future HTTP/3 support. Full HTTP/3 implementation requires upgrading Nginx to a version with HTTP/3 capabilities.
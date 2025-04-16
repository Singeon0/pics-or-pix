const express = require("express");
const path = require("path");
const fs = require("fs");
const compression = require("compression");
const zstdnapi = require('zstd-napi');
const { createReadStream, createWriteStream } = require('fs');
const { Stream } = require('stream');

const app = express();
const PORT = process.env.PORT || 3000;

// Custom zstd compression middleware
const zstdCompression = (options = {}) => {
    const level = options.level || 6;
    const threshold = options.threshold || 1024;
    const filter = options.filter || ((req, res) => {
        const type = res.getHeader('Content-Type');
        if (type === undefined) {
            return false;
        }
        const contentTypes = [
            'application/javascript',
            'application/json',
            'application/x-javascript',
            'application/xml',
            'application/xml+rss',
            'application/vnd.ms-fontobject',
            'application/wasm',
            'font/eot',
            'font/otf',
            'font/ttf',
            'image/svg+xml',
            'text/css',
            'text/javascript',
            'text/plain',
            'text/xml'
        ];
        return contentTypes.some(ct => type.includes(ct));
    });

    return (req, res, next) => {
        const acceptEncoding = req.headers['accept-encoding'] || '';
        
        // Only compress if client accepts zstd
        if (!acceptEncoding.includes('zstd')) {
            // If zstd not supported, use standard compression
            return compression()(req, res, next);
        }
        
        // Save original functions
        const _write = res.write;
        const _end = res.end;
        
        // Buffer to collect response data
        let chunks = [];
        
        // Override write
        res.write = function(chunk, encoding) {
            if (chunk) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
            }
            return true;
        };
        
        // Override end
        res.end = function(chunk, encoding) {
            if (chunk) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
            }
            
            // Get full response body
            const buffer = Buffer.concat(chunks);
            
            // Apply filter and threshold
            if (!filter(req, res) || buffer.length < threshold) {
                // Reset original functions
                res.write = _write;
                res.end = _end;
                
                // Send uncompressed response
                res.setHeader('Content-Length', buffer.length);
                _write.call(res, buffer);
                _end.call(res);
                return;
            }
            
            try {
                // Compress with zstd - use compressionLevel parameter
                const compressed = zstdnapi.compress(buffer, { compressionLevel: level });
                
                // Set headers
                res.setHeader('Content-Encoding', 'zstd');
                res.setHeader('Vary', 'Accept-Encoding');
                res.setHeader('Content-Length', compressed.length);
                
                // Send compressed response
                res.write = _write;
                res.end = _end;
                _write.call(res, compressed);
                _end.call(res);
            } catch (err) {
                console.error('Compression error:', err);
                // In case of error, send uncompressed
                res.write = _write;
                res.end = _end;
                _write.call(res, buffer);
                _end.call(res);
            }
        };
        
        next();
    };
};

// Enable compression for all requests - use zstd if supported, fallback to gzip
app.use(zstdCompression({ level: 6 }));

// Add support for AVIF MIME type
express.static.mime.define({'image/avif': ['avif']});

// Helper function to detect mobile devices
const isMobile = (req) => {
    const userAgent = req.headers['user-agent'] || '';
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

// Static files middleware with conditional routing
app.use((req, res, next) => {
    // Skip API requests
    if (req.path.startsWith('/api/')) {
        return next();
    }
    
    // For the root path, serve the appropriate index.html
    if (req.path === '/' || req.path === '/index.html') {
        const isMobileDevice = isMobile(req);
        const htmlPath = isMobileDevice 
            ? path.join(__dirname, 'public', 'mobile', 'index.html')
            : path.join(__dirname, 'public', 'desktop', 'index.html');
        
        // Check if the file exists, otherwise fallback to standard index.html
        if (fs.existsSync(htmlPath)) {
            return res.sendFile(htmlPath);
        }
        // Fallback to the standard index.html if device-specific version doesn't exist
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    
    next();
});

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Helper function to get all images from a folder
const getImagesFromFolder = (folderPath, folderName) => {
    try {
        const files = fs.readdirSync(folderPath);
        
        const filteredFiles = files.filter(file => {
            // Exclude cover.jpg and check for supported image formats
            return file !== 'cover.jpg' && 
                   /\.(jpe?g|png|gif|webp|avif)$/i.test(file);
        });
        
        return filteredFiles.map(file => {
            // Create a properly encoded URL path that's safe for URLs and JSON
            // We need to properly handle special characters in filenames
            const encodedFile = encodeURIComponent(file);
            return `/images/${encodeURIComponent(folderName)}/${encodedFile}`;
        });
    } catch (err) {
        console.error(`Error reading folder ${folderPath}:`, err);
        return [];
    }
};

// API endpoint: list all portfolios
app.get("/api/portfolios", (req, res) => {
    const imagesDir = path.join(__dirname, "public", "images");

    // Get all subfolders in public/images
    let folders = [];
    try {
        folders = fs
            .readdirSync(imagesDir)
            .filter((item) => {
                const itemPath = path.join(imagesDir, item);
                return fs.statSync(itemPath).isDirectory();
            });

        // Get the first image found to use as Complete Collection cover
        let completeCollectionCover = null;
        for (const folder of folders) {
            const folderPath = path.join(imagesDir, folder);
            const files = fs.readdirSync(folderPath);
            const nonCoverImage = files.find(file => file !== 'cover.jpg' && file !== 'cover.avif');
            if (nonCoverImage) {
                completeCollectionCover = `/images/${folder}/${nonCoverImage}`;
                break;
            }
        }

        // Add Complete Collection to portfolios list
        const portfolios = folders.map((folderName) => {
            // Check for cover image in different formats
            const folderPath = path.join(imagesDir, folderName);
            const files = fs.readdirSync(folderPath);
            
            // First check for cover.avif, then fall back to cover.jpg
            const coverFile = files.find(file => file === 'cover.avif') || 'cover.jpg';
            
            return {
                name: folderName,
                cover: `/images/${folderName}/${coverFile}`,
            };
        });

        if (completeCollectionCover) {
            portfolios.unshift({
                name: "Complete Collection",
                cover: completeCollectionCover
            });
        }

        res.json(portfolios);
    } catch (err) {
        return res.json([]);
    }
});

// API endpoint: list images in a specific portfolio folder
app.get("/api/portfolios/:folderName", (req, res) => {
    const folderName = req.params.folderName;
    const imagesDir = path.join(__dirname, "public", "images");

    // Special handling for Complete Collection
    if (folderName === "Complete Collection") {
        try {
            // Get all folders
            const folders = fs
                .readdirSync(imagesDir)
                .filter(item => fs.statSync(path.join(imagesDir, item)).isDirectory());

            // Get all images from all folders
            let allImages = [];
            
            // Process each folder
            for (const folder of folders) {
                try {
                    const folderPath = path.join(imagesDir, folder);
                    const folderImages = getImagesFromFolder(folderPath, folder);
                    allImages = [...allImages, ...folderImages];
                } catch (folderErr) {
                    console.error(`Error processing folder ${folder}:`, folderErr);
                }
            }
            
            // Ensure the Content-Type header is properly set with charset
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            
            // Send the response with proper UTF-8 encoding
            res.json({
                name: folderName,
                images: allImages
            });
            return;
        } catch (err) {
            console.error('Error reading Complete Collection:', err);
            return res.status(500).json({ error: "Error reading Complete Collection" });
        }
    }

    // Regular portfolio handling
    // Decode the URL-encoded folderName for filesystem access
    const decodedFolderName = decodeURIComponent(folderName);
    const folderPath = path.join(imagesDir, decodedFolderName);

    if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ error: "Portfolio not found" });
    }

    const images = getImagesFromFolder(folderPath, decodedFolderName);
    
    // Ensure proper content type with charset
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    res.json({
        name: decodedFolderName,
        images,
    });
});

// API endpoint to get client device type
app.get("/api/device", (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    
    res.json({
        isMobile: isMobile(req),
        isSafari: isSafari,
        userAgent: userAgent
    });
});

// Test endpoint for compression
app.get("/api/test-compression", (req, res) => {
    // Generate large JSON data to test compression
    const largeData = {
        message: "This is a large response to test compression",
        items: []
    };
    
    // Add enough items to exceed compression threshold
    for (let i = 0; i < 1000; i++) {
        largeData.items.push({
            id: i,
            name: `Item ${i}`,
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        });
    }
    
    // Set Content-Type explicitly
    res.setHeader('Content-Type', 'application/json');
    res.json(largeData);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
const express = require("express");
const path = require("path");
const fs = require("fs");
const compression = require("compression");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable Gzip compression for all requests
app.use(compression());

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
        return fs.readdirSync(folderPath)
            .filter(file => {
                // Exclude cover.jpg and check for supported image formats
                return file !== 'cover.jpg' && 
                       /\.(jpe?g|png|gif|webp|avif)$/i.test(file);
            })
            .map(file => `/images/${folderName}/${file}`);
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
            const allImages = folders.reduce((acc, folder) => {
                const folderPath = path.join(imagesDir, folder);
                const folderImages = getImagesFromFolder(folderPath, folder);
                return [...acc, ...folderImages];
            }, []);

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
    const folderPath = path.join(imagesDir, folderName);

    if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ error: "Portfolio not found" });
    }

    const images = getImagesFromFolder(folderPath, folderName);

    res.json({
        name: folderName,
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
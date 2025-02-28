const express = require("express");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for image requests
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// 1) Serve static files from "public" folder with proper caching
app.use(express.static(path.join(__dirname, "public"), {
    // Cache static assets for 1 day (in milliseconds)
    maxAge: '1d',
    // Set Cache-Control header
    setHeaders: (res, path) => {
        // Apply different caching strategies based on file type
        if (path.endsWith('.html')) {
            // Don't cache HTML files
            res.setHeader('Cache-Control', 'no-cache');
        } else if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            // Cache images for longer (1 week)
            res.setHeader('Cache-Control', 'public, max-age=604800');
        } else if (path.match(/\.(js|css)$/i)) {
            // Cache JS/CSS for 1 day
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));

// 2) Image optimization routes
// Generate low-quality image placeholders (LQIP)
app.get('/api/lqip/:folderName/:imageName', async (req, res) => {
    try {
        const { folderName, imageName } = req.params;
        const imagePath = path.join(__dirname, 'public', 'images', folderName, imageName);
        
        if (!fs.existsSync(imagePath)) {
            return res.status(404).send('Image not found');
        }
        
        // Generate a very small, blurred, low-quality placeholder
        const buffer = await sharp(imagePath)
            .resize(20) // Tiny image
            .blur(5)    // Add blur effect
            .toBuffer();
        
        // Convert to base64 for inline use
        const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        res.send(base64Image);
    } catch (error) {
        console.error('Error generating LQIP:', error);
        res.status(500).send('Error generating placeholder');
    }
});

// Simple image resizer API
app.get('/api/images/:path(*)', async (req, res) => {
    try {
        // Parse parameters
        const imagePath = req.params.path;
        const width = parseInt(req.query.width) || null;
        const format = req.query.format || 'jpeg';
        
        // Full path to original image
        const fullPath = path.join(__dirname, 'public', imagePath);
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            return res.status(404).send('Image not found');
        }
        
        // Start Sharp transformer
        let transformer = sharp(fullPath);
        
        // Resize if width is specified
        if (width) {
            transformer = transformer.resize({ width });
        }
        
        // Set output format
        switch (format.toLowerCase()) {
            case 'webp':
                transformer = transformer.webp({ quality: 80 });
                res.type('image/webp');
                break;
            case 'png':
                transformer = transformer.png();
                res.type('image/png');
                break;
            case 'jpeg':
            case 'jpg':
            default:
                transformer = transformer.jpeg({ quality: 80 });
                res.type('image/jpeg');
                break;
        }
        
        // Add caching headers
        res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week
        
        // Generate and send image
        const buffer = await transformer.toBuffer();
        res.send(buffer);
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send('Error processing image');
    }
});

// Helper function to get all images from a folder with optimized paths
const getImagesFromFolder = (folderPath, folderName) => {
    try {
        // Get all image files (excluding cover.jpg)
        const files = fs.readdirSync(folderPath)
            .filter(file => file !== 'cover.jpg');
            
        // Create an array of image objects with various optimized versions
        return files.map(file => {
            // Extract file extension
            const extension = path.extname(file).toLowerCase();
            const fileName = path.basename(file, extension);
            
            // Prepare paths for different optimized versions
            return {
                // Original high-quality image
                original: `/images/${folderName}/${file}`,
                
                // Optimized WebP format for modern browsers (smaller file size)
                optimized: `/api/images/images/${folderName}/${file}?width=1200&format=webp`,
                
                // Small thumbnail for grid view
                thumbnail: `/api/images/images/${folderName}/${file}?width=400&format=webp`,
                
                // LQIP (Low Quality Image Placeholder) for immediate display
                placeholder: `/api/lqip/${folderName}/${file}`,
                
                // Metadata about the image
                name: fileName,
                folder: folderName,
                
                // Add width and height for proper layout (will be estimated)
                // These will be updated with real values when images load
                width: 800,
                height: 600
            };
        });
    } catch (err) {
        console.error(`Error reading folder ${folderPath}:`, err);
        return [];
    }
};

// 3) API endpoint: list all portfolios with optimized covers
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
        let completeCollectionPlaceholder = null;
        
        for (const folder of folders) {
            const folderPath = path.join(imagesDir, folder);
            const files = fs.readdirSync(folderPath);
            const nonCoverImage = files.find(file => file !== 'cover.jpg');
            
            if (nonCoverImage) {
                // Use optimized version for cover
                completeCollectionCover = `/api/images/images/${folder}/${nonCoverImage}?width=800&format=webp`;
                completeCollectionPlaceholder = `/api/lqip/${folder}/${nonCoverImage}`;
                break;
            }
        }

        // Add optimized covers for each portfolio
        const portfolios = folders.map((folderName) => {
            // Check if cover.jpg exists
            const coverPath = path.join(imagesDir, folderName, 'cover.jpg');
            const hasCover = fs.existsSync(coverPath);
            
            return {
                name: folderName,
                cover: hasCover ? `/api/images/images/${folderName}/cover.jpg?width=800&format=webp` : null,
                coverPlaceholder: hasCover ? `/api/lqip/${folderName}/cover.jpg` : null,
                coverOriginal: hasCover ? `/images/${folderName}/cover.jpg` : null,
                // Include image dimensions for proper layout
                width: 800,
                height: 600
            };
        });

        // Add Complete Collection to portfolios list
        if (completeCollectionCover) {
            portfolios.unshift({
                name: "Complete Collection",
                cover: completeCollectionCover,
                coverPlaceholder: completeCollectionPlaceholder,
                coverOriginal: completeCollectionCover.replace('?width=800&format=webp', ''),
                width: 800,
                height: 600
            });
        }

        res.json(portfolios);
    } catch (err) {
        console.error('Error reading portfolios:', err);
        return res.json([]);
    }
});

// 4) API endpoint: list images in a specific portfolio folder with optimized versions
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

            // Get all images from all folders with optimized versions
            const allImages = folders.reduce((acc, folder) => {
                const folderPath = path.join(imagesDir, folder);
                const folderImages = getImagesFromFolder(folderPath, folder);
                return [...acc, ...folderImages];
            }, []);

            res.json({
                name: folderName,
                images: allImages,
                // Flag to indicate we're using optimized images
                useOptimizedImages: true
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
        // Flag to indicate we're using optimized images
        useOptimizedImages: true
    });
});

// 4) Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
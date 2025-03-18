const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const { execSync } = require('child_process');

// Constants for optimization
const WEBP_QUALITY = 85;
const RESPONSIVE_SIZES = [320, 640, 1024, 1920]; // Common responsive breakpoints
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const OPTIMIZED_DIR = path.join(__dirname, '..', 'public', 'images-optimized');

// Check if required tools are installed
function checkDependencies() {
    try {
        execSync('which cwebp', { stdio: 'ignore' });
        execSync('which identify', { stdio: 'ignore' });
        return true;
    } catch (error) {
        console.error('Required dependencies not found. Please install:');
        console.error('- cwebp (from libwebp package)');
        console.error('- identify (from ImageMagick package)');
        console.error('Install with: sudo apt-get install webp imagemagick');
        return false;
    }
}

// Create directory structure if it doesn't exist
async function createDirectoryStructure() {
    try {
        await fsPromises.mkdir(OPTIMIZED_DIR, { recursive: true });
        const portfolios = await fsPromises.readdir(IMAGES_DIR);
        
        for (const portfolio of portfolios) {
            const portfolioDir = path.join(OPTIMIZED_DIR, portfolio);
            await fsPromises.mkdir(portfolioDir, { recursive: true });
        }
        
        console.log('Directory structure created successfully');
        return true;
    } catch (error) {
        console.error('Error creating directory structure:', error);
        return false;
    }
}

// Get image dimensions
function getImageDimensions(imagePath) {
    try {
        const output = execSync(`identify -format "%w %h" "${imagePath}"`).toString().trim();
        const [width, height] = output.split(' ').map(Number);
        return { width, height };
    } catch (error) {
        console.error(`Error getting dimensions for ${imagePath}:`, error);
        return { width: 0, height: 0 };
    }
}

// Generate WebP image at specified size
function generateWebP(sourcePath, destPath, width) {
    try {
        // Ensure the parent directory exists
        const parentDir = path.dirname(destPath);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }
        
        // Convert to WebP using cwebp with specified quality and resize
        if (width) {
            execSync(`cwebp -q ${WEBP_QUALITY} -resize ${width} 0 "${sourcePath}" -o "${destPath}"`);
        } else {
            execSync(`cwebp -q ${WEBP_QUALITY} "${sourcePath}" -o "${destPath}"`);
        }
        
        return true;
    } catch (error) {
        console.error(`Error generating WebP for ${sourcePath}:`, error);
        return false;
    }
}

// Optimize a single image
async function optimizeImage(portfolioName, imageName) {
    const sourcePath = path.join(IMAGES_DIR, portfolioName, imageName);
    const baseOutputPath = path.join(OPTIMIZED_DIR, portfolioName);
    
    // Skip non-image files (check extension)
    const fileExtension = path.extname(imageName).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
        console.log(`Skipping non-image file: ${imageName}`);
        return;
    }
    
    const baseName = path.basename(imageName, fileExtension);
    
    // Create original WebP
    const originalWebP = path.join(baseOutputPath, `${baseName}.webp`);
    generateWebP(sourcePath, originalWebP);
    
    // Also create responsive versions
    for (const width of RESPONSIVE_SIZES) {
        const responsiveWebP = path.join(baseOutputPath, `${baseName}-${width}.webp`);
        generateWebP(sourcePath, responsiveWebP, width);
    }
    
    // Copy original to maintain compatibility
    await fsPromises.copyFile(sourcePath, path.join(baseOutputPath, imageName));
    
    console.log(`Optimized: ${portfolioName}/${imageName}`);
}

// Process all images in a portfolio
async function processPortfolio(portfolioName) {
    const portfolioDir = path.join(IMAGES_DIR, portfolioName);
    
    try {
        // Check if it's a directory
        const stats = await fsPromises.stat(portfolioDir);
        if (!stats.isDirectory()) {
            return;
        }
        
        console.log(`Processing portfolio: ${portfolioName}`);
        const images = await fsPromises.readdir(portfolioDir);
        
        for (const image of images) {
            await optimizeImage(portfolioName, image);
        }
    } catch (error) {
        console.error(`Error processing portfolio ${portfolioName}:`, error);
    }
}

// Main function to run the optimization process
async function optimizeAllImages() {
    if (!checkDependencies()) {
        return;
    }
    
    if (!await createDirectoryStructure()) {
        return;
    }
    
    try {
        const portfolios = await fsPromises.readdir(IMAGES_DIR);
        
        for (const portfolio of portfolios) {
            const stats = await fsPromises.stat(path.join(IMAGES_DIR, portfolio));
            if (stats.isDirectory()) {
                await processPortfolio(portfolio);
            }
        }
        
        console.log('Image optimization complete!');
    } catch (error) {
        console.error('Error during image optimization:', error);
    }
}

// Run the optimization
optimizeAllImages();
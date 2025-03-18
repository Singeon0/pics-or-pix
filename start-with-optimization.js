/**
 * Start script with image optimization for Pics-or-Pix
 * 
 * This script runs the image optimization process and then starts the server.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Constants
const OPTIMIZED_DIR = path.join(__dirname, 'public', 'images-optimized');

// Check if optimization has already been run
const hasOptimizedImages = () => {
    try {
        if (!fs.existsSync(OPTIMIZED_DIR)) return false;
        
        const files = fs.readdirSync(OPTIMIZED_DIR);
        return files.length > 0;
    } catch (error) {
        return false;
    }
};

// Main process
async function start() {
    // Check for image optimization
    if (!hasOptimizedImages()) {
        console.log('Starting image optimization process...');
        try {
            // Run the image optimization script
            execSync('node scripts/optimize-images.js', { stdio: 'inherit' });
            console.log('Image optimization completed successfully.');
        } catch (error) {
            console.error('Error during image optimization:', error.message);
            console.log('Continuing without optimization...');
        }
    } else {
        console.log('Using existing optimized images...');
    }
    
    // Start the server
    console.log('Starting server...');
    require('./index.js');
}

// Run the start process
start();
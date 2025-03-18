/**
 * Image Optimizer Module for Pics-or-Pix
 * 
 * This module adds WebP support and responsive image handling to the Express application.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');

// Constants
const IMAGES_DIR = path.join(__dirname, 'public', 'images');
const OPTIMIZED_DIR = path.join(__dirname, 'public', 'images-optimized');
const RESPONSIVE_SIZES = [320, 640, 1024, 1920];

/**
 * Check if a WebP version exists for the given image
 */
function hasWebP(imagePath) {
    const imageDir = path.dirname(imagePath);
    const baseName = path.basename(imagePath, path.extname(imagePath));
    const webpPath = path.join(imageDir, `${baseName}.webp`);
    
    return fs.existsSync(webpPath);
}

/**
 * Generate HTML for responsive images with WebP and fallback
 */
function generateResponsiveImageHtml(imagePath, alt = '') {
    const imageDir = path.dirname(imagePath);
    const baseName = path.basename(imagePath, path.extname(imagePath));
    const ext = path.extname(imagePath);
    
    // Check if optimized versions exist
    const hasOptimized = fs.existsSync(path.join(OPTIMIZED_DIR, imagePath.replace('/images/', '')));
    
    if (!hasOptimized) {
        // Return standard img tag if no optimized versions
        return `<img src="${imagePath}" alt="${alt}" />`;
    }
    
    // Path to the optimized directory equivalent
    const optimizedBasePath = imagePath.replace('/images/', '/images-optimized/');
    const optimizedDir = path.dirname(optimizedBasePath);
    
    // Generate srcset for WebP
    const webpSrcset = RESPONSIVE_SIZES.map(size => 
        `${optimizedDir}/${baseName}-${size}.webp ${size}w`
    ).join(', ');
    
    // Generate srcset for original format (fallback)
    const originalSrcset = RESPONSIVE_SIZES.map(size => 
        `${optimizedDir}/${baseName}-${size}${ext} ${size}w`
    ).join(', ');
    
    // Create picture element with source sets
    return `
    <picture>
        <source srcset="${webpSrcset}" type="image/webp" />
        <source srcset="${originalSrcset}" type="image/${ext.substring(1)}" />
        <img src="${imagePath}" alt="${alt}" loading="lazy" />
    </picture>
    `;
}

/**
 * Express middleware to serve WebP images if available and supported
 */
function webpMiddleware(req, res, next) {
    // Only process image requests
    if (!req.path.match(/\.(jpe?g|png|gif)$/i)) {
        return next();
    }
    
    // Check for WebP support in the Accept header
    const acceptsWebP = req.headers.accept && req.headers.accept.includes('image/webp');
    
    if (acceptsWebP) {
        const imagePath = req.path;
        const imageFilePath = path.join(__dirname, 'public', imagePath);
        const webpPath = imageFilePath.replace(/\.(jpe?g|png|gif)$/i, '.webp');
        
        // Check if WebP version exists
        if (fs.existsSync(webpPath)) {
            // Change the path to the WebP version
            req.url = req.url.replace(/\.(jpe?g|png|gif)$/i, '.webp');
        }
    }
    
    next();
}

/**
 * Initialize the image optimization system
 */
function initialize(app) {
    // Create optimized directory if it doesn't exist
    if (!fs.existsSync(OPTIMIZED_DIR)) {
        try {
            fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
        } catch (error) {
            console.error('Failed to create optimized images directory:', error);
        }
    }
    
    // Setup the Express middleware
    app.use(webpMiddleware);
    
    // Serve the optimized images directory
    app.use('/images-optimized', express.static(OPTIMIZED_DIR, {
        maxAge: '30d' // 30-day cache
    }));
    
    console.log('Image optimization system initialized');
}

module.exports = {
    initialize,
    generateResponsiveImageHtml,
    hasWebP,
    webpMiddleware
};
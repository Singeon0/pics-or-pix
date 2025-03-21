/**
 * Image Optimizer Module for Pics-or-Pix
 * 
 * This module now only provides basic image serving functionality.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');

// Constants
const IMAGES_DIR = path.join(__dirname, 'public', 'images');

/**
 * Generate HTML for basic image tags
 */
function generateResponsiveImageHtml(imagePath, alt = '') {
    // Return standard img tag
    return `<img src="${imagePath}" alt="${alt}" loading="lazy" />`;
}

/**
 * Initialize the image system
 */
function initialize(app) {
    console.log('Basic image system initialized');
}

module.exports = {
    initialize,
    generateResponsiveImageHtml
};
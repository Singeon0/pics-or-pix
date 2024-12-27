/**
 * @file main.js
 * @description Entry point script. Declares global variables/config and starts the app.
 */

// ----------------- Global / Configurable Variables -----------------
/**
 * @constant {number}
 * @description Delay (in ms) before showing images in the portfolio.
 */
window.SHOW_IMAGES_DELAY = 800;

/**
 * @constant {number}
 * @description Duration (in ms) for modal transition animations.
 */
window.MODAL_TRANSITION_DURATION = 300;

/**
 * @constant {number}
 * @description Gap size (in px) for the masonry layout.
 */
window.MASONRY_GAP = 12;

/**
 * @global {string[]}
 * @description List of the current portfolio's images (for modal navigation).
 */
window.currentPortfolioImages = [];

/**
 * @global {number}
 * @description Index of the currently displayed image in the modal.
 */
window.currentImageIndex = 0;


// ----------------- Main Entry Point -----------------

document.addEventListener("DOMContentLoaded", () => {
    // Kick off the initial portfolio listing
    showPortfolioList();
});
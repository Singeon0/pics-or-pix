/**
 * Main entry point for desktop experience
 */
import { initPlatform, redirectIfNeeded } from '../js/components/platform.js';
import { CLASSES, SELECTORS, ANIMATION, SPECIAL_PORTFOLIOS } from '../js/config/constants.js';
import { fetchPortfolios, fetchPortfolioImages } from '../js/api/portfolio-api.js';
import { getDominantColor, initLazyLoading, loadImage } from '../js/utils/image-utils.js';
import { createElement, createImageContainer, createPortfolioItem, createFixedHeader, applyPortfolioStyling } from '../js/utils/dom-utils.js';
import modal from '../js/components/modal.js';

// -- State
let currentPortfolioImages = [];

/**
 * Initialize the application
 */
async function init() {
  // First verify we're on the correct platform
  const redirect = await redirectIfNeeded();
  if (redirect) return; // Stop if redirecting
  
  // Then load the portfolio list
  showPortfolioList();
}

/**
 * Fetch and display the list of portfolios
 */
async function showPortfolioList() {
  // Reset any special styling
  document.body.style.backgroundColor = '';
  document.body.style.color = '';
  
  try {
    // Fetch portfolios from API
    const portfolios = await fetchPortfolios();
    
    // Get the app container
    const app = document.querySelector(SELECTORS.APP);
    
    // Create the UI
    app.innerHTML = `<h1 class="site-title" style="cursor: pointer;">PICSORPIX</h1>`;
    
    // Create grid for portfolios
    const grid = createElement('div', {
      attributes: { class: 'portfolio-grid' }
    });
    
    // Add portfolios to grid
    portfolios.forEach(portfolio => {
      const item = createPortfolioItem(portfolio, () => {
        showSinglePortfolio(portfolio.name);
      });
      
      // Process image after load to get dominant color
      const img = item.querySelector('img');
      img.addEventListener('load', () => {
        const color = getDominantColor(img);
        const h2 = item.querySelector('h2');
        h2.style.backgroundColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`;
      });
      
      grid.appendChild(item);
    });
    
    // Add click handler for site title
    const title = app.querySelector('.site-title');
    title.addEventListener('click', showPortfolioList);
    
    // Add the grid to the app
    app.appendChild(grid);
  } catch (error) {
    console.error('Error showing portfolio list:', error);
  }
}

/**
 * Fetch and display a single portfolio's images
 * @param {string} folderName - The name of the portfolio folder
 */
async function showSinglePortfolio(folderName) {
  // Scroll to top smoothly
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
  
  // Apply portfolio-specific styling
  const isDarkTheme = applyPortfolioStyling(folderName, SPECIAL_PORTFOLIOS.DARK_THEME);
  
  try {
    // Fetch portfolio data
    const data = await fetchPortfolioImages(folderName);
    
    // Get app container
    const app = document.querySelector(SELECTORS.APP);
    app.innerHTML = '';
    
    // Create the fixed header
    const backgroundColor = isDarkTheme ? 'black' : 'white';
    const fixedHeader = createFixedHeader(backgroundColor, showPortfolioList);
    app.appendChild(fixedHeader);
    
    // Create photo grid
    const grid = createElement('div', {
      attributes: {
        class: 'photo-grid has-fixed-header'
      },
      properties: {
        style: 'opacity: 0; transition: opacity 0.5s ease-in-out;'
      }
    });
    
    // Store current images for modal navigation
    currentPortfolioImages = data.images;
    
    // Create images with lazy loading
    data.images.forEach((imgSrc, index) => {
      const imgContainer = createImageContainer(imgSrc, index, () => {
        // Only open modal if image is loaded
        const img = imgContainer.querySelector('img');
        if (!img.classList.contains(CLASSES.LAZY_IMAGE)) {
          openModal(imgSrc, index);
        }
      });
      
      grid.appendChild(imgContainer);
    });
    
    app.appendChild(grid);
    
    // Initialize modal
    modal.setPortfolioImages(currentPortfolioImages);
    
    // Initialize lazy loading
    initLazyLoading(loadImage);
    
    // Show grid after a short delay for smoother transition
    setTimeout(() => {
      grid.style.opacity = '1';
    }, ANIMATION.DELAY_BEFORE_SHOWING_PORTFOLIO);
  } catch (error) {
    console.error(`Error showing portfolio ${folderName}:`, error);
  }
}

/**
 * Opens the modal with the specified image
 * @param {string} imgSrc - Source of the image to show
 * @param {number} index - Index of the image in the portfolio
 */
function openModal(imgSrc, index) {
  modal.open(imgSrc, index);
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
/**
 * Utility functions for DOM manipulation
 */
import { CLASSES, IMAGES, PLATFORM } from '../config/constants.js';

/**
 * Creates an element with specified attributes, properties, and children
 * @param {string} tagName - The tag name of the element to create
 * @param {Object} options - Options for the element 
 * @param {Object} options.attributes - HTML attributes to set
 * @param {Object} options.properties - Properties to set on the DOM element
 * @param {string} options.textContent - Text content to set
 * @param {string} options.innerHTML - HTML content to set (use with caution)
 * @param {Array} options.children - Child elements to append
 * @param {Object} options.eventListeners - Event listeners to add
 * @returns {HTMLElement} The created element
 */
export function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);
  
  // Set attributes (like class, id, data-*, etc.)
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  
  // Set properties directly on the element
  if (options.properties) {
    Object.entries(options.properties).forEach(([key, value]) => {
      element[key] = value;
    });
  }
  
  // Set text content if provided
  if (options.textContent) {
    element.textContent = options.textContent;
  }
  
  // Set inner HTML if provided
  if (options.innerHTML) {
    element.innerHTML = options.innerHTML;
  }
  
  // Add children if provided
  if (options.children) {
    options.children.forEach(child => {
      element.appendChild(child);
    });
  }
  
  // Add event listeners if provided
  if (options.eventListeners) {
    Object.entries(options.eventListeners).forEach(([event, listener]) => {
      element.addEventListener(event, listener);
    });
  }
  
  return element;
}

/**
 * Creates an image container with lazy loading functionality
 * @param {string} imgSrc - The source URL of the image
 * @param {number} index - The index of the image in the portfolio
 * @param {Function} onClick - Click handler for the image
 * @returns {HTMLElement} The image container element
 */
export function createImageContainer(imgSrc, index, onClick) {
  // Create the container
  const imgContainer = createElement('div', {
    attributes: {
      class: CLASSES.IMAGE_CONTAINER
    },
    eventListeners: {
      click: onClick
    }
  });
  
  // Create the lazy-loaded image
  const img = createElement('img', {
    attributes: {
      src: IMAGES.PLACEHOLDER,
      'data-src': imgSrc,
      alt: `Portfolio image ${index + 1}`,
      class: CLASSES.LAZY_IMAGE
    }
  });
  
  // Add to container
  imgContainer.appendChild(img);
  
  return imgContainer;
}

/**
 * Creates a portfolio item for the grid
 * @param {Object} portfolio - Portfolio data with name and cover
 * @param {Function} onClick - Click handler for the portfolio item
 * @returns {HTMLElement} The portfolio item element
 */
export function createPortfolioItem(portfolio, onClick) {
  // Create tap/click text based on platform
  const actionText = PLATFORM.IS_MOBILE ? 'tap to open' : 'click to open';
  
  // Create the portfolio item
  const item = createElement('div', {
    attributes: {
      class: CLASSES.PORTFOLIO_ITEM
    },
    innerHTML: `
      <img src="${portfolio.cover}" alt="${portfolio.name}" />
      <h2>
        ${portfolio.name}
        <span class="click-text">${actionText}</span>
      </h2>
    `,
    eventListeners: {
      click: onClick
    }
  });
  
  return item;
}

/**
 * Creates a fixed header for the portfolio view
 * @param {string} backgroundColor - The background color for the header
 * @param {Function} onTitleClick - Click handler for the site title
 * @returns {HTMLElement} The header element
 */
export function createFixedHeader(backgroundColor, onTitleClick) {
  // Create the header container
  const fixedHeader = createElement('div', {
    attributes: {
      class: 'fixed-header'
    },
    properties: {
      style: `background-color: ${backgroundColor};`
    }
  });
  
  // Create the site title
  const siteTitle = createElement('h1', {
    attributes: {
      class: 'site-title'
    },
    properties: {
      style: 'cursor: pointer;'
    },
    textContent: 'PICSORPIX',
    eventListeners: {
      click: onTitleClick
    }
  });
  
  // Add title to header
  fixedHeader.appendChild(siteTitle);
  
  return fixedHeader;
}

/**
 * Shows a temporary overlay on a portfolio item
 * Mobile-specific to provide visual feedback
 * @param {HTMLElement} item - The portfolio item element
 * @param {string} portfolioName - The name of the portfolio
 * @param {number} duration - How long to show the overlay in ms
 */
export function showTemporaryOverlay(item, portfolioName, duration = 2000) {
  // Skip on desktop
  if (!PLATFORM.IS_MOBILE) return;
  
  // Remove any existing temporary overlay
  const existingOverlay = item.querySelector('.temporary-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  // Get the portfolio background color
  const existingH2 = item.querySelector('h2');
  const overlayBackground = existingH2.style.backgroundColor;
  
  // Create overlay with animation
  const tempOverlay = createElement('div', {
    attributes: {
      class: 'temporary-overlay'
    },
    innerHTML: `
      <h2>
        ${portfolioName}
        <span class="click-text">tap to open</span>
      </h2>
    `,
    properties: {
      style: `background-color: ${overlayBackground};`
    }
  });
  
  // Add to DOM
  item.appendChild(tempOverlay);
  
  // Show with animation
  requestAnimationFrame(() => {
    tempOverlay.classList.add('show');
    
    // Hide and remove after duration
    setTimeout(() => {
      tempOverlay.classList.remove('show');
      
      // Remove from DOM after fade out
      setTimeout(() => {
        tempOverlay.remove();
      }, 500); // Match the CSS transition time
    }, duration);
  });
}

/**
 * Applies theme-specific styling based on portfolio name
 * @param {string} portfolioName - The name of the portfolio
 * @param {Array<string>} darkThemePortfolios - List of portfolio names that use dark theme
 */
export function applyPortfolioStyling(portfolioName, darkThemePortfolios) {
  // Check if this portfolio should have dark theme
  const isDarkTheme = darkThemePortfolios.includes(portfolioName.toLowerCase());
  
  // Apply appropriate theme
  if (isDarkTheme) {
    document.body.style.backgroundColor = 'black';
    document.body.style.color = 'red';
  } else {
    // Reset styling for other portfolios
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
  }
  
  return isDarkTheme;
}
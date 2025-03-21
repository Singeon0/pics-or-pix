/**
 * Utility functions for image handling
 */
import { CLASSES, IMAGES, PLATFORM } from '../config/constants.js';

/**
 * Extracts the dominant color from an image using a canvas.
 * @param {HTMLImageElement} img - The image element
 * @returns {Object} { r: number, g: number, b: number }
 */
export function getDominantColor(img) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0, img.width, img.height);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;

  let r = 0, g = 0, b = 0, count = 0;

  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  return {
    r: Math.floor(r / count),
    g: Math.floor(g / count),
    b: Math.floor(b / count)
  };
}

/**
 * Determines if an image is landscape or portrait
 * @param {HTMLImageElement} img - The image element to check
 * @returns {string} 'landscape' or 'portrait'
 */
export function getImageOrientation(img) {
  return img.naturalWidth >= img.naturalHeight ? CLASSES.LANDSCAPE_IMAGE : CLASSES.PORTRAIT_IMAGE;
}

/**
 * Initializes lazy loading for images with different strategies based on browser support
 * @param {Function} loadImageCallback - Callback function to load the image once visible
 */
export function initLazyLoading(loadImageCallback) {
  // No operation if no callback provided
  if (!loadImageCallback) {
    console.error('No loadImageCallback provided to initLazyLoading');
    return;
  }

  // Check for IntersectionObserver support (Safari < 12.1 fallback)
  if (!('IntersectionObserver' in window) || 
      (PLATFORM.IS_SAFARI && 
       PLATFORM.IS_MOBILE &&
       /Version\/(\d+\.\d+)/.test(navigator.userAgent) &&
       parseFloat(navigator.userAgent.match(/Version\/(\d+\.\d+)/)[1]) < 12.1)) {
      
    // Fallback for older browsers: simple scroll-based loading
    const lazyImages = document.querySelectorAll(`img.${CLASSES.LAZY_IMAGE}`);
    
    function lazyLoad() {
      const scrollTop = window.pageYOffset;
      lazyImages.forEach(img => {
        if (img.offsetTop < window.innerHeight + scrollTop + 250) {
          loadImageCallback(img);
        }
      });
    }
    
    // Load visible images immediately
    lazyLoad();
    
    // Then listen for scroll events
    let lazyLoadThrottleTimeout;
    window.addEventListener('scroll', function() {
      if (lazyLoadThrottleTimeout) {
        clearTimeout(lazyLoadThrottleTimeout);
      }
      lazyLoadThrottleTimeout = setTimeout(lazyLoad, 20);
    });
    
    return;
  }
  
  // Modern browsers including Safari 12.1+
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        loadImageCallback(img);
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: IMAGES.LAZY_LOAD_MARGIN,
    threshold: IMAGES.LAZY_LOAD_THRESHOLD
  });

  // Observe all lazy images
  document.querySelectorAll(`img.${CLASSES.LAZY_IMAGE}`).forEach(img => {
    imageObserver.observe(img);
  });
}

/**
 * Loads the actual image for a lazy-loaded image
 * @param {HTMLImageElement} img - The image element to load
 */
export function loadImage(img) {
  const actualSrc = img.dataset.src;
  if (!actualSrc) return;
  
  if (PLATFORM.IS_SAFARI && PLATFORM.IS_MOBILE) {
    // Safari-specific optimized loading
    const tempImage = new Image();
    tempImage.onload = () => {
      img.src = actualSrc;
      
      // Add orientation class to parent container
      const orientation = getImageOrientation(tempImage);
      img.parentElement?.classList.add(orientation);
      
      // Ensure image is properly rendered before removing lazy class
      requestAnimationFrame(() => {
        img.classList.remove(CLASSES.LAZY_IMAGE);
        img.removeAttribute('data-src');
      });
    };
    tempImage.src = actualSrc;
  } else {
    // Standard loading for other browsers
    img.src = actualSrc;
    img.addEventListener('load', () => {
      // Add orientation class to parent container
      const orientation = getImageOrientation(img);
      img.parentElement?.classList.add(orientation);
      
      img.classList.remove(CLASSES.LAZY_IMAGE);
      img.removeAttribute('data-src');
    });
  }
}
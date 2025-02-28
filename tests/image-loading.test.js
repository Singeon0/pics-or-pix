import { screen, fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';

// Setup proper DOM environment for testing
document.body.innerHTML = `
  <div id="app">
    <div class="photo-grid">
      <div class="image-container">
        <img class="lazy" 
             data-src="/images/test/landscape.jpg" 
             src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
             alt="Test landscape image">
      </div>
      <div class="image-container">
        <img class="lazy" 
             data-src="/images/test/portrait.jpg" 
             src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
             alt="Test portrait image">
      </div>
    </div>
  </div>
`;

// Simple implementation of getImageOrientation for testing
function getImageOrientation(img) {
  if (!img || !img.naturalWidth || !img.naturalHeight) return 'landscape';
  return img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait';
}

// Simple implementation of loadImage for testing
function loadImage(img) {
  if (!img || !img.dataset || !img.dataset.src) return;
  
  const actualSrc = img.dataset.src;
  img.src = actualSrc;
  
  // Trigger load event manually in test
  const loadEvent = new Event('load');
  
  // Add orientation class - use the helper function for this
  const orientation = window.getImageOrientation(img);
  if (img.parentElement) {
    // Clear any existing orientation classes
    img.parentElement.classList.remove('landscape', 'portrait');
    // Add the new orientation class
    img.parentElement.classList.add(orientation);
  }
  
  // Clean up
  img.classList.remove('lazy');
  img.classList.add('loaded');
  img.removeAttribute('data-src');
  
  // Dispatch load event after changes
  img.dispatchEvent(loadEvent);
}

// Simple implementation of lazy loading for testing 
function initLazyLoading() {
  // Check for native lazy loading support
  const hasNativeLazyLoading = 'loading' in HTMLImageElement.prototype;
  
  if (hasNativeLazyLoading) {
    // Use native lazy loading
    document.querySelectorAll('img.lazy').forEach(img => {
      // Set loading attribute to lazy
      img.loading = 'lazy';
      
      if (img.dataset.src) {
        // Add load event listener before setting src
        img.addEventListener('load', () => {
          // Add orientation class
          const orientation = window.getImageOrientation(img);
          if (img.parentElement) {
            img.parentElement.classList.add(orientation);
          }
          
          // Remove lazy class and add loaded class
          img.classList.remove('lazy');
          img.classList.add('loaded');
          img.removeAttribute('data-src');
        });
        
        // Set src to data-src to trigger loading
        img.src = img.dataset.src;
      }
    });
    
    return null; // No observer to return
  } else {
    // Fallback to IntersectionObserver
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImage(entry.target);
          imageObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '200px 0px',
      threshold: 0.01
    });
    
    // Observe all lazy images
    document.querySelectorAll('img.lazy').forEach(img => {
      imageObserver.observe(img);
    });
    
    return imageObserver;
  }
}

// Export functions for testing
window.loadImage = loadImage;
window.initLazyLoading = initLazyLoading;
window.getImageOrientation = getImageOrientation;

describe('Image Lazy Loading', () => {
  beforeEach(() => {
    // Reset DOM before each test
    document.querySelectorAll('img').forEach(img => {
      img.classList.remove('loaded');
      img.classList.add('lazy');
      img.dataset.src = img.dataset.src || '/images/test/landscape.jpg';
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    });
    
    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn((callback) => {
      // Store the callback for manual triggering
      global.intersectionCallback = callback;
      
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };
    });
    
    // Mock Image to control naturalWidth/Height for orientation testing
    global.Image = function() {
      return {
        naturalWidth: 1200,
        naturalHeight: 800,
      };
    };
  });
  
  test('loadImage should replace placeholder with actual image', () => {
    // Get the first lazy image
    const lazyImg = document.querySelector('img.lazy');
    const originalDataSrc = lazyImg.dataset.src;
    
    // Initial state check
    expect(lazyImg.classList.contains('lazy')).toBe(true);
    expect(lazyImg.classList.contains('loaded')).toBe(false);
    expect(lazyImg.src).not.toContain(originalDataSrc);
    
    // Call loadImage
    loadImage(lazyImg);
    
    // Check that the image was updated
    expect(lazyImg.src).toContain(originalDataSrc);
    expect(lazyImg.classList.contains('lazy')).toBe(false);
    expect(lazyImg.classList.contains('loaded')).toBe(true);
    expect(lazyImg.dataset.src).toBeUndefined();
  });
  
  test('loadImage should add orientation class to parent container', () => {
    // Mock getImageOrientation to return different values
    const originalGetImageOrientation = window.getImageOrientation;
    
    // First test landscape
    window.getImageOrientation = jest.fn().mockReturnValue('landscape');
    
    // Get the lazy image and its container
    const lazyImg = document.querySelector('img.lazy');
    const container = lazyImg.parentElement;
    
    // Call loadImage
    loadImage(lazyImg);
    
    // Check that the container has the landscape class
    expect(container.classList.contains('landscape')).toBe(true);
    expect(container.classList.contains('portrait')).toBe(false);
    
    // Reset for portrait test
    container.classList.remove('landscape');
    
    // Mock portrait orientation for second image
    window.getImageOrientation = jest.fn().mockReturnValue('portrait');
    
    // Call loadImage on second image
    loadImage(document.querySelectorAll('img')[1]);
    
    // Check that the second container has the portrait class
    expect(document.querySelectorAll('.image-container')[1].classList.contains('portrait')).toBe(true);
    
    // Restore original function
    window.getImageOrientation = originalGetImageOrientation;
  });
  
  test('initLazyLoading should set up IntersectionObserver and observe lazy images', () => {
    // Initialize lazy loading
    const observer = initLazyLoading();
    
    // Check that IntersectionObserver was created
    expect(global.IntersectionObserver).toHaveBeenCalled();
    
    // Check that observe was called for each lazy image
    const lazyImages = document.querySelectorAll('img.lazy');
    expect(global.IntersectionObserver.mock.results[0].value.observe).toHaveBeenCalledTimes(lazyImages.length);
  });
  
  test('images should load when they intersect the viewport', () => {
    // Make sure we're using IntersectionObserver in this test
    delete HTMLImageElement.prototype.loading;
    
    // Initialize lazy loading
    initLazyLoading();
    
    // Get lazy images
    const lazyImages = document.querySelectorAll('img.lazy');
    
    // Simulate intersection for the first image
    global.intersectionCallback([{
      target: lazyImages[0],
      isIntersecting: true
    }]);
    
    // Check that the first image was loaded
    expect(lazyImages[0].classList.contains('lazy')).toBe(false);
    expect(lazyImages[0].classList.contains('loaded')).toBe(true);
    
    // Check that the second image is still lazy
    expect(lazyImages[1].classList.contains('lazy')).toBe(true);
    expect(lazyImages[1].classList.contains('loaded')).toBe(false);
  });
  
  test('should use native lazy loading when supported', () => {
    // Mock native lazy loading
    HTMLImageElement.prototype.loading = undefined;
    Object.defineProperty(HTMLImageElement.prototype, 'loading', {
      configurable: true,
      get: function() {
        return this._loading;
      },
      set: function(value) {
        this._loading = value;
      }
    });
    
    // Add data-src attribute to test loading behavior
    const lazyImages = document.querySelectorAll('img.lazy');
    lazyImages.forEach(img => {
      img.dataset.src = '/images/test/landscape.jpg';
    });
    
    // Initialize lazy loading
    initLazyLoading();
    
    // Check that loading attribute was set for all lazy images
    lazyImages.forEach(img => {
      expect(img.loading).toBe('lazy');
    });
    
    // Simulate load event for the first image
    lazyImages[0].dispatchEvent(new Event('load'));
    
    // Check that the first image was marked as loaded
    expect(lazyImages[0].classList.contains('lazy')).toBe(false);
    expect(lazyImages[0].classList.contains('loaded')).toBe(true);
    
    // Clean up
    delete HTMLImageElement.prototype.loading;
  });
});
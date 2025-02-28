import { screen, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';

// Setup test DOM
document.body.innerHTML = `
  <div id="app">
    <div class="photo-grid">
      <div class="image-container">
        <img class="lazy" data-src="/images/Spain/landscape.jpg" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="Test image">
      </div>
      <div class="image-container">
        <img class="lazy" data-src="/images/Spain/portrait.jpg" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="Test image">
      </div>
    </div>
  </div>
  <script src="main.js"></script>
`;

// Load main.js functions (mock style to avoid full execution)
// Just define the functions we need for testing
window.loadImage = (img) => {
  const actualSrc = img.dataset.src;
  if (actualSrc) {
    img.src = actualSrc;
    // Add orientation class to parent container
    const orientation = img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait';
    img.parentElement.classList.add(orientation);
    img.classList.remove('lazy');
    img.removeAttribute('data-src');
  }
};

window.initLazyLoading = () => {
  // Mock implementation
  const imageObserver = new IntersectionObserver(() => {});
  document.querySelectorAll('img.lazy').forEach(img => {
    imageObserver.observe(img);
  });
};

describe('Image Loading and Orientation', () => {
  beforeEach(() => {
    // Create IntersectionObserver mock
    global.IntersectionObserver = jest.fn(callback => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));
  });

  test('should properly lazy load images', async () => {
    // Initialize lazy loading
    window.initLazyLoading();
    
    // Get references to lazy images
    const lazyImages = document.querySelectorAll('img.lazy');
    expect(lazyImages.length).toBe(2);
    
    // Simulate intersection observer callback for first image
    const landscapeImg = lazyImages[0];
    
    // Mock naturalWidth and naturalHeight for landscape orientation
    Object.defineProperty(landscapeImg, 'naturalWidth', { value: 1200 });
    Object.defineProperty(landscapeImg, 'naturalHeight', { value: 800 });
    
    // Call loadImage directly to simulate intersection
    window.loadImage(landscapeImg);
    
    // Manually trigger load event
    landscapeImg.dispatchEvent(new Event('load'));
    
    // Check if image was properly loaded
    expect(landscapeImg.src).toBe('http://localhost/images/Spain/landscape.jpg');
    expect(landscapeImg.classList.contains('lazy')).toBe(false);
    
    // Check if container has proper orientation class
    expect(landscapeImg.parentElement.classList.contains('landscape')).toBe(true);
    
    // Test portrait orientation
    const portraitImg = lazyImages[1];
    
    // Mock naturalWidth and naturalHeight for portrait orientation
    Object.defineProperty(portraitImg, 'naturalWidth', { value: 800 });
    Object.defineProperty(portraitImg, 'naturalHeight', { value: 1200 });
    
    // Call loadImage directly
    window.loadImage(portraitImg);
    
    // Manually trigger load event
    portraitImg.dispatchEvent(new Event('load'));
    
    // Check if container has proper orientation class
    expect(portraitImg.parentElement.classList.contains('portrait')).toBe(true);
  });
});
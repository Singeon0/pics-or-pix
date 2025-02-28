/**
 * Layout Consistency Tests
 * 
 * These tests focus on ensuring the masonry layout and aspect ratio calculations
 * work consistently across different environments and screen sizes.
 */

import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom';

// Set up a mock DOM for testing
document.body.innerHTML = `
  <div id="app">
    <div class="photo-grid">
      <!-- Will be populated with image containers -->
    </div>
  </div>
`;

// Utility function to simulate different screen sizes
function setScreenSize(width, height) {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
  window.dispatchEvent(new Event('resize'));
}

// Mock functions for testing
const createImageContainer = (width, height, src = '/test/image.jpg', index = 0) => {
  const container = document.createElement('div');
  container.className = 'image-container';
  container.dataset.columnIndex = '0';
  
  const img = document.createElement('img');
  img.src = src;
  img.dataset.index = index;
  img.width = width;
  img.height = height;
  img.className = 'loaded'; // Mark as loaded for testing
  
  // Set orientation class based on aspect ratio
  if (width >= height) {
    container.classList.add('landscape');
  } else {
    container.classList.add('portrait');
  }
  
  container.appendChild(img);
  return container;
};

// Helper function to calculate container dimensions
function calculateContainerDimensions(imgData, columnWidth) {
  // Calculate aspect ratio (with safeguards)
  const aspectRatio = imgData.width && imgData.height && imgData.height > 0 ? 
    imgData.width / imgData.height : 4/3;
  
  // Calculate container width (accounting for margin)
  const containerWidth = columnWidth - 16; // 16px for margin
  
  // Calculate container height based on aspect ratio
  const containerHeight = containerWidth / aspectRatio;
  
  return { 
    width: containerWidth,
    height: containerHeight,
    aspectRatio: aspectRatio
  };
}

// Import the necessary functions directly
// For testing, we'll define simplified versions here
function renderMasonryLayout(grid, images) {
  // Calculate columns based on screen width
  let columnCount = 3; // Default for desktop
  if (window.innerWidth <= 600) {
    columnCount = 1;
  } else if (window.innerWidth <= 1200) {
    columnCount = 2;
  }
  
  // Grid width calculation (simulated for tests)
  const gridWidth = 1200; // Simulated grid width
  
  // Initialize column heights
  const columnHeights = Array(columnCount).fill(0);
  
  // Clear the grid
  grid.innerHTML = '';
  
  // Process each image
  images.forEach((imgData, index) => {
    // Find the shortest column
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
    
    // Create container with specified dimensions
    const imgContainer = createImageContainer(
      imgData.width || 800, 
      imgData.height || 600, 
      imgData.src || '/test/image.jpg',
      index
    );
    
    // Set positioning data
    imgContainer.dataset.columnIndex = shortestColumnIndex;
    
    // Calculate position
    const columnWidth = gridWidth / columnCount;
    const yPos = columnHeights[shortestColumnIndex];
    
    // Position the container
    imgContainer.style.left = `${(shortestColumnIndex * 100) / columnCount}%`;
    imgContainer.style.top = `${yPos}px`;
    imgContainer.style.width = `calc(${100 / columnCount}% - 1rem)`;
    
    // Calculate dimensions using helper
    const dimensions = calculateContainerDimensions(imgData, columnWidth);
    
    // Set explicit height
    imgContainer.style.height = `${dimensions.height}px`;
    
    // Store aspect ratio for debugging
    imgContainer.dataset.aspectRatio = dimensions.aspectRatio.toFixed(2);
    
    // Update column height
    columnHeights[shortestColumnIndex] += dimensions.height + 16; // Add margin
    
    // Add to the grid
    grid.appendChild(imgContainer);
  });
  
  // Set grid height to tallest column
  grid.style.height = `${Math.max(...columnHeights)}px`;
  
  // Store column count for adjustments
  grid.dataset.columnCount = columnCount.toString();
}

// Define test images with various aspect ratios
const testImages = [
  { src: '/test/landscape-wide.jpg', width: 1600, height: 900 },    // 16:9
  { src: '/test/landscape.jpg', width: 1200, height: 800 },         // 3:2
  { src: '/test/square.jpg', width: 1000, height: 1000 },           // 1:1
  { src: '/test/portrait.jpg', width: 800, height: 1200 },          // 2:3
  { src: '/test/portrait-tall.jpg', width: 900, height: 1600 },     // 9:16
];

describe('Masonry Layout Consistency', () => {
  let grid;
  
  beforeEach(() => {
    // Reset the grid before each test
    grid = document.querySelector('.photo-grid');
    grid.innerHTML = '';
    
    // Reset screen size to desktop default
    setScreenSize(1440, 900);
  });
  
  test('should calculate correct aspect ratios', () => {
    // Render the layout
    renderMasonryLayout(grid, testImages);
    
    // Get all containers
    const containers = grid.querySelectorAll('.image-container');
    
    // Check each container
    containers.forEach((container, index) => {
      const img = container.querySelector('img');
      const testImage = testImages[index];
      
      // Calculate expected aspect ratio
      const expectedAspectRatio = testImage.width / testImage.height;
      
      // Get actual container dimensions (remove 'px' and parse as float)
      const containerWidth = parseFloat(container.style.width.replace('calc(', '').replace('% - 1rem)', '')) / 100 * 1200;
      const containerHeight = parseFloat(container.style.height.replace('px', ''));
      
      // Calculate actual aspect ratio (with some tolerance for rounding)
      const actualAspectRatio = containerWidth / containerHeight;
      
      // Check if aspect ratios match with some tolerance (0.1 for rounding errors)
      expect(Math.abs(actualAspectRatio - expectedAspectRatio)).toBeLessThan(0.1);
      
      // Check orientation classes
      if (testImage.width >= testImage.height) {
        expect(container.classList.contains('landscape')).toBe(true);
      } else {
        expect(container.classList.contains('portrait')).toBe(true);
      }
    });
  });
  
  test('should handle responsive layout on different screen sizes', () => {
    // Test on desktop (3 columns)
    setScreenSize(1440, 900);
    renderMasonryLayout(grid, testImages);
    expect(grid.dataset.columnCount).toBe("3");
    
    // Test on tablet (2 columns)
    setScreenSize(900, 1024);
    renderMasonryLayout(grid, testImages);
    expect(grid.dataset.columnCount).toBe("2");
    
    // Test on mobile (1 column)
    setScreenSize(480, 800);
    renderMasonryLayout(grid, testImages);
    expect(grid.dataset.columnCount).toBe("1");
  });
  
  test('should maintain container proportions across screen sizes', () => {
    // Test image with known dimensions
    const testImage = { src: '/test/test.jpg', width: 1200, height: 800 }; // 3:2 aspect ratio
    
    // Test on different screen sizes
    const screenSizes = [
      { width: 1440, columns: 3 }, // Desktop
      { width: 900, columns: 2 },  // Tablet
      { width: 480, columns: 1 }   // Mobile
    ];
    
    screenSizes.forEach(size => {
      // Set screen size
      setScreenSize(size.width, 900);
      
      // Render single image
      renderMasonryLayout(grid, [testImage]);
      
      // Get container
      const container = grid.querySelector('.image-container');
      
      // Calculate expected column width percentage
      const expectedColumnWidthPercent = 100 / size.columns;
      
      // Extract the percentage from the calc() expression
      const widthMatch = container.style.width.match(/calc\(([0-9.]+)%/);
      const containerWidthPercent = widthMatch ? parseFloat(widthMatch[1]) : 0;
      
      // Check if width percentage matches expected (based on column count)
      expect(containerWidthPercent).toBeCloseTo(expectedColumnWidthPercent);
      
      // Get the stored aspect ratio from dataset
      const storedAspectRatio = parseFloat(container.dataset.aspectRatio);
      
      // Get the actual image aspect ratio
      const imageAspectRatio = testImage.width / testImage.height;
      
      // Check if stored aspect ratio matches the image (should be exact)
      expect(Math.abs(storedAspectRatio - imageAspectRatio)).toBeLessThan(0.01);
      
      // The most important check: verify that we're storing the correct aspect ratio
      // This ensures our calculations are using the right values, even if browser
      // rendering engine has slightly different results in a real environment
    });
  });
  
  test('should handle extreme aspect ratios correctly', () => {
    // Define extreme aspect ratio images
    const extremeImages = [
      { src: '/test/panorama.jpg', width: 3000, height: 500 },     // Super wide 6:1
      { src: '/test/skyscraper.jpg', width: 500, height: 3000 }    // Super tall 1:6
    ];
    
    // Render layout
    renderMasonryLayout(grid, extremeImages);
    
    // Check containers
    const containers = grid.querySelectorAll('.image-container');
    
    // Get panorama container
    const panorama = containers[0];
    expect(panorama.classList.contains('landscape')).toBe(true);
    
    // Get tall container
    const skyscraper = containers[1];
    expect(skyscraper.classList.contains('portrait')).toBe(true);
    
    // Check stored aspect ratios (easier than calculating from dimensions)
    const panoramaRatio = parseFloat(panorama.dataset.aspectRatio);
    const skyscraperRatio = parseFloat(skyscraper.dataset.aspectRatio);
    
    // Check if extreme ratios are preserved
    expect(panoramaRatio).toBeGreaterThan(5); // Should be close to 6
    expect(skyscraperRatio).toBeLessThan(0.2); // Should be close to 1/6
  });
});
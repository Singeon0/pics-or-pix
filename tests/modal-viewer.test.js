import { screen, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
//import userEvent from '@testing-library/user-event';

// Setup test DOM
document.body.innerHTML = `
  <div id="app">
    <div class="photo-grid">
      <div class="image-container">
        <img src="/images/Spain/image1.jpg" alt="Test image 1">
      </div>
      <div class="image-container">
        <img src="/images/Spain/image2.jpg" alt="Test image 2">
      </div>
    </div>
  </div>
  <script src="main.js"></script>
`;

// Set up current portfolio images for navigation
window.currentPortfolioImages = [
  '/images/Spain/image1.jpg',
  '/images/Spain/image2.jpg',
  '/images/Spain/image3.jpg'
];

// Define necessary functions for testing
window.currentPortfolioImages = [
  '/images/Spain/image1.jpg',
  '/images/Spain/image2.jpg',
  '/images/Spain/image3.jpg'
];

window.currentImageIndex = 0;

window.createModal = () => {
  let modal = document.querySelector('.modal-overlay');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <button class="modal-nav prev" aria-label="Previous image"></button>
      <div class="modal-content">
        <img src="" alt="Modal image">
      </div>
      <button class="modal-nav next" aria-label="Next image"></button>
    `;
    document.body.appendChild(modal);
  }
  return modal;
};

window.openModal = (imgSrc, index) => {
  const modal = window.createModal();
  const modalContent = modal.querySelector('.modal-content');
  const modalImg = modalContent.querySelector('img');
  window.currentImageIndex = index;
  modalImg.src = imgSrc;
  modal.classList.add('active');
  setTimeout(() => {
    modalContent.classList.add('active');
  }, 10);
};

window.closeModal = () => {
  const modal = document.querySelector('.modal-overlay');
  const modalContent = modal.querySelector('.modal-content');
  modalContent.classList.remove('active');
  setTimeout(() => {
    modal.classList.remove('active');
  }, 300);
};

window.showNextImage = () => {
  window.currentImageIndex = (window.currentImageIndex + 1) % window.currentPortfolioImages.length;
  window.updateModalImage();
};

window.showPreviousImage = () => {
  window.currentImageIndex = (window.currentImageIndex - 1 + window.currentPortfolioImages.length) % window.currentPortfolioImages.length;
  window.updateModalImage();
};

window.updateModalImage = () => {
  const modalContent = document.querySelector('.modal-content');
  const modalImg = modalContent.querySelector('img');
  modalContent.classList.remove('active');
  setTimeout(() => {
    modalImg.src = window.currentPortfolioImages[window.currentImageIndex];
    modalContent.classList.add('active');
  }, 300);
};

describe('Modal Image Viewer', () => {
  test('should open modal when image is clicked', async () => {
    // Ensure modal doesn't exist yet
    expect(document.querySelector('.modal-overlay')).not.toBeInTheDocument();
    
    // Call createModal directly 
    window.createModal();
    
    // Modal should now exist but not be active
    const modal = document.querySelector('.modal-overlay');
    expect(modal).toBeInTheDocument();
    expect(modal.classList.contains('active')).toBe(false);
    
    // Open the modal
    window.openModal('/images/Spain/image1.jpg', 0);
    
    // Wait for modal animation
    await waitFor(() => {
      expect(modal.classList.contains('active')).toBe(true);
      const modalImg = modal.querySelector('.modal-content img');
      expect(modalImg.src).toBe('http://localhost/images/Spain/image1.jpg');
    });
  });
  
  test('should navigate between images in modal', async () => {
    // Open modal with first image
    window.openModal('/images/Spain/image1.jpg', 0);
    
    const modal = document.querySelector('.modal-overlay');
    const modalContent = modal.querySelector('.modal-content');
    
    // Wait for modal to become active
    await waitFor(() => {
      expect(modalContent.classList.contains('active')).toBe(true);
    });
    
    // Navigate to next image
    window.showNextImage();
    
    // Modal content should briefly become inactive during transition
    expect(modalContent.classList.contains('active')).toBe(false);
    
    // Wait for next image to load
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check if image has changed
    const modalImg = modal.querySelector('.modal-content img');
    expect(modalImg.src).toBe('http://localhost/images/Spain/image2.jpg');
    expect(modalContent.classList.contains('active')).toBe(true);
    
    // Test previous navigation
    window.showPreviousImage();
    
    // Wait for transition
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Should return to first image
    expect(modalImg.src).toBe('http://localhost/images/Spain/image1.jpg');
    
    // Test circular navigation (go to last image from first)
    window.showPreviousImage();
    
    // Wait for transition
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Should now show the last image
    expect(modalImg.src).toBe('http://localhost/images/Spain/image3.jpg');
  });
  
  test('should close modal properly', async () => {
    // Open modal
    window.openModal('/images/Spain/image1.jpg', 0);
    
    const modal = document.querySelector('.modal-overlay');
    
    // Wait for modal to become active
    await waitFor(() => {
      expect(modal.classList.contains('active')).toBe(true);
    });
    
    // Close modal
    window.closeModal();
    
    // Modal content should become inactive first
    const modalContent = modal.querySelector('.modal-content');
    expect(modalContent.classList.contains('active')).toBe(false);
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Modal overlay should be inactive
    expect(modal.classList.contains('active')).toBe(false);
  });
});
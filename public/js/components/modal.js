/**
 * Modal component for displaying portfolio images
 */
import { CLASSES, SELECTORS, ANIMATION, PLATFORM, MOBILE } from '../config/constants.js';

class Modal {
  constructor() {
    this.element = null;
    this.contentElement = null;
    this.imgElement = null;
    this.portfolioImages = [];
    this.currentImageIndex = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isSwiping = false;
  }
  
  /**
   * Creates the modal if it doesn't exist yet
   * @returns {HTMLElement} The modal element
   */
  create() {
    // Return existing modal if already created
    if (this.element) {
      return this.element;
    }
    
    // Create modal structure
    this.element = document.createElement('div');
    this.element.className = 'modal-overlay';
    
    // Basic structure with navigation buttons
    this.element.innerHTML = `
      <button class="modal-nav prev" aria-label="Previous image"></button>
      <div class="modal-content">
        <img src="" alt="Modal image">
      </div>
      <button class="modal-nav next" aria-label="Next image"></button>
      ${PLATFORM.IS_MOBILE ? '<button class="modal-close" aria-label="Close modal">×</button>' : ''}
    `;
    
    // Store references to elements
    this.contentElement = this.element.querySelector(SELECTORS.MODAL_CONTENT);
    this.imgElement = this.contentElement.querySelector('img');
    
    // Add event listeners
    this.addEventListeners();
    
    // Add to DOM
    document.body.appendChild(this.element);
    
    return this.element;
  }
  
  /**
   * Adds all event listeners to the modal
   */
  addEventListeners() {
    // Backdrop click to close
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.close();
      }
    });
    
    // Navigation buttons
    const prevBtn = this.element.querySelector('.prev');
    const nextBtn = this.element.querySelector('.next');
    
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showPreviousImage();
    });
    
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showNextImage();
    });
    
    // Close button (mobile)
    if (PLATFORM.IS_MOBILE) {
      const closeBtn = this.element.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Only process if modal is active
      if (this.element.classList.contains(CLASSES.MODAL_ACTIVE)) {
        if (e.key === 'Escape') {
          this.close();
        } else if (e.key === 'ArrowLeft') {
          this.showPreviousImage();
        } else if (e.key === 'ArrowRight') {
          this.showNextImage();
        }
      }
    });
    
    // Touch events for mobile
    if (PLATFORM.IS_MOBILE) {
      this.initTouchEvents();
    }
  }
  
  /**
   * Initializes touch events for swipe navigation on mobile
   */
  initTouchEvents() {
    // Touch event options
    const options = { passive: false };
    
    // Add touch event listeners
    this.contentElement.addEventListener('touchstart', this.handleTouchStart.bind(this), options);
    this.contentElement.addEventListener('touchmove', this.handleTouchMove.bind(this), options);
    this.contentElement.addEventListener('touchend', this.handleTouchEnd.bind(this), options);
    
    // Handle swipe cancellation
    window.addEventListener('touchcancel', () => {
      this.isSwiping = false;
    }, options);
  }
  
  /**
   * Handle touch start event
   * @param {TouchEvent} e - The touch event
   */
  handleTouchStart(e) {
    // Ignore multi-touch gestures
    if (e.touches.length > 1) return;
    
    // Prevent default to stop scrolling
    e.preventDefault();
    
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchStartTime = Date.now();
    this.isSwiping = true;
  }
  
  /**
   * Handle touch move event
   * @param {TouchEvent} e - The touch event
   */
  handleTouchMove(e) {
    if (!this.isSwiping || e.touches.length > 1) return;
    e.preventDefault();
  }
  
  /**
   * Handle touch end event
   * @param {TouchEvent} e - The touch event
   */
  handleTouchEnd(e) {
    if (!this.isSwiping) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    
    // Calculate swipe distance and time
    const swipeDistance = touchEndX - this.touchStartX;
    const swipeTime = touchEndTime - this.touchStartTime;
    
    // Calculate vertical movement
    const verticalDistance = Math.abs(touchEndY - this.touchStartY);
    
    // Reset swiping state
    this.isSwiping = false;
    
    // Ignore if:
    // 1. Swipe took too long
    // 2. Swipe was too short
    // 3. More vertical than horizontal movement
    if (swipeTime > MOBILE.SWIPE_TIMEOUT ||
        Math.abs(swipeDistance) < MOBILE.SWIPE_THRESHOLD ||
        verticalDistance > Math.abs(swipeDistance)) {
      return;
    }
    
    // Determine swipe direction and navigate
    if (swipeDistance > 0) {
      // Swipe right -> Previous image
      this.showPreviousImage();
    } else {
      // Swipe left -> Next image
      this.showNextImage();
    }
  }
  
  /**
   * Sets the portfolio images for navigation
   * @param {Array<string>} images - Array of image URLs
   */
  setPortfolioImages(images) {
    this.portfolioImages = images;
  }
  
  /**
   * Opens the modal with a specific image
   * @param {string} imgSrc - The image source URL
   * @param {number} index - The index of the image in the portfolio
   */
  open(imgSrc, index) {
    // Make sure the modal exists
    this.create();
    
    // Update current image index
    this.currentImageIndex = index;
    
    // Set the image source
    this.imgElement.src = imgSrc;
    
    // Show with animation
    requestAnimationFrame(() => {
      this.element.classList.add(CLASSES.MODAL_ACTIVE);
      
      // Slight delay for smooth transition
      setTimeout(() => {
        this.contentElement.classList.add(CLASSES.MODAL_ACTIVE);
      }, 10);
    });
  }
  
  /**
   * Closes the modal
   */
  close() {
    this.contentElement.classList.remove(CLASSES.MODAL_ACTIVE);
    
    // Wait for content animation to finish before hiding modal
    setTimeout(() => {
      this.element.classList.remove(CLASSES.MODAL_ACTIVE);
    }, ANIMATION.MODAL_TRANSITION_DURATION);
  }
  
  /**
   * Shows the next image in the portfolio
   */
  showNextImage() {
    if (!this.portfolioImages.length) return;
    
    this.currentImageIndex = (this.currentImageIndex + 1) % this.portfolioImages.length;
    this.updateImage();
  }
  
  /**
   * Shows the previous image in the portfolio
   */
  showPreviousImage() {
    if (!this.portfolioImages.length) return;
    
    this.currentImageIndex = (this.currentImageIndex - 1 + this.portfolioImages.length) % 
                             this.portfolioImages.length;
    this.updateImage();
  }
  
  /**
   * Updates the modal image while maintaining the modal state
   */
  updateImage() {
    // Remove active class to fade out
    this.contentElement.classList.remove(CLASSES.MODAL_ACTIVE);
    
    // Wait for animation, then update image and fade back in
    setTimeout(() => {
      this.imgElement.src = this.portfolioImages[this.currentImageIndex];
      this.contentElement.classList.add(CLASSES.MODAL_ACTIVE);
    }, ANIMATION.MODAL_TRANSITION_DURATION);
  }
}

// Export as singleton
export default new Modal();
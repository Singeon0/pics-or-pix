/**
 * Global configuration constants for Pics-or-Pix application
 */

// Core platform detection (will be updated by platform detection)
export const PLATFORM = {
  IS_MOBILE: false,
  IS_SAFARI: false,
  IS_DESKTOP: true
};

// Animation timing constants (milliseconds)
export const ANIMATION = {
  DELAY_BEFORE_SHOWING_PORTFOLIO: 5,
  OVERLAY_FADE_DURATION: 150,
  MODAL_TRANSITION_DURATION: 300
};

// Mobile-specific constants
export const MOBILE = {
  DOUBLE_TAP_TIMEOUT: 2000,
  SWIPE_THRESHOLD: 50,
  SWIPE_TIMEOUT: 300  
};

// DOM element class names
export const CLASSES = {
  LAZY_IMAGE: 'lazy',
  MODAL_ACTIVE: 'active',
  PORTRAIT_IMAGE: 'portrait',
  LANDSCAPE_IMAGE: 'landscape',
  PORTFOLIO_ITEM: 'portfolio-item',
  IMAGE_CONTAINER: 'image-container'
};

// Special portfolio styling
export const SPECIAL_PORTFOLIOS = {
  DARK_THEME: ['urbex', 'moon']
};

// DOM selectors
export const SELECTORS = {
  APP: '#app',
  MODAL_OVERLAY: '.modal-overlay',
  MODAL_CONTENT: '.modal-content',
  MODAL_IMAGE: '.modal-content img',
  PHOTO_GRID: '.photo-grid',
  PORTFOLIO_GRID: '.portfolio-grid'
};

// API endpoints
export const API = {
  PORTFOLIOS: '/api/portfolios',
  DEVICE: '/api/device'
};

// Image related constants
export const IMAGES = {
  LAZY_LOAD_MARGIN: '250px 0px',
  LAZY_LOAD_THRESHOLD: 0.025,
  PLACEHOLDER: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
};
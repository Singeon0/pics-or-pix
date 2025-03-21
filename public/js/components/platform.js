/**
 * Platform detection and initialization
 */
import { PLATFORM } from '../config/constants.js';
import { detectDevice } from '../api/portfolio-api.js';

/**
 * Initializes platform detection
 * @returns {Promise<Object>} Platform information
 */
export async function initPlatform() {
  try {
    // Get device information from API
    const deviceInfo = await detectDevice();
    
    // Update platform constants
    PLATFORM.IS_MOBILE = deviceInfo.isMobile;
    PLATFORM.IS_DESKTOP = !deviceInfo.isMobile;
    PLATFORM.IS_SAFARI = deviceInfo.isSafari;
    
    // Add platform classes to body
    if (PLATFORM.IS_MOBILE) {
      document.body.classList.add('mobile');
    } else {
      document.body.classList.add('desktop');
    }
    
    if (PLATFORM.IS_SAFARI) {
      document.body.classList.add('safari');
      
      // Fix for Safari viewport height issues on mobile
      if (PLATFORM.IS_MOBILE) {
        updateViewportHeight();
        window.addEventListener('resize', updateViewportHeight);
        window.addEventListener('orientationchange', updateViewportHeight);
      }
    }
    
    return PLATFORM;
  } catch (error) {
    console.error('Error initializing platform detection:', error);
    
    // Fallback to UA detection
    return fallbackPlatformDetection();
  }
}

/**
 * Fallback platform detection based on user agent
 * @returns {Object} Platform information
 */
function fallbackPlatformDetection() {
  const userAgent = navigator.userAgent || '';
  
  // Detect mobile
  PLATFORM.IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  PLATFORM.IS_DESKTOP = !PLATFORM.IS_MOBILE;
  
  // Detect Safari
  PLATFORM.IS_SAFARI = /^((?!chrome|android).)*safari/i.test(userAgent);
  
  // Add platform classes
  if (PLATFORM.IS_MOBILE) {
    document.body.classList.add('mobile');
  } else {
    document.body.classList.add('desktop');
  }
  
  if (PLATFORM.IS_SAFARI) {
    document.body.classList.add('safari');
  }
  
  return PLATFORM;
}

/**
 * Update viewport height CSS variable for iOS Safari
 */
function updateViewportHeight() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}

/**
 * Redirects to the appropriate platform version if needed
 * @returns {Promise<boolean>} True if redirect occurred
 */
export async function redirectIfNeeded() {
  const platform = await initPlatform();
  const currentPath = window.location.pathname;
  
  // If we're on desktop path but should be on mobile
  if (currentPath.includes('/desktop/') && platform.IS_MOBILE) {
    console.log("Mobile device detected, redirecting to mobile experience");
    window.location.href = "/"; // Redirect to root to get proper detection
    return true;
  }
  
  // If we're on mobile path but should be on desktop
  if (currentPath.includes('/mobile/') && platform.IS_DESKTOP) {
    console.log("Desktop device detected, redirecting to desktop experience");
    window.location.href = "/"; // Redirect to root to get proper detection
    return true;
  }
  
  return false;
}
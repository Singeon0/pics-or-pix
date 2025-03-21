/**
 * API client for Pics-or-Pix portfolios
 */
import { API } from '../config/constants.js';

// Cache for API responses to avoid redundant calls
const apiCache = new Map();

/**
 * Fetch all portfolios from the API
 * @returns {Promise<Array>} Array of portfolio objects with name and cover
 */
export async function fetchPortfolios() {
  // Return cached data if available
  if (apiCache.has('portfolios')) {
    return apiCache.get('portfolios');
  }
  
  try {
    const response = await fetch(API.PORTFOLIOS);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch portfolios: ${response.status}`);
    }
    
    const portfolios = await response.json();
    
    // Cache the response
    apiCache.set('portfolios', portfolios);
    
    return portfolios;
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return [];
  }
}

/**
 * Fetch a specific portfolio's images
 * @param {string} folderName - The name of the portfolio folder
 * @returns {Promise<Object>} Object containing portfolio name and array of images
 */
export async function fetchPortfolioImages(folderName) {
  // Create a cache key for this specific portfolio
  const cacheKey = `portfolio_${folderName}`;
  
  // Return cached data if available
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }
  
  try {
    const response = await fetch(`${API.PORTFOLIOS}/${folderName}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio ${folderName}: ${response.status}`);
    }
    
    const portfolioData = await response.json();
    
    // Sort images in reverse order (newer first)
    if (portfolioData.images && Array.isArray(portfolioData.images)) {
      portfolioData.images.sort().reverse();
    }
    
    // Cache the response
    apiCache.set(cacheKey, portfolioData);
    
    return portfolioData;
  } catch (error) {
    console.error(`Error fetching portfolio ${folderName}:`, error);
    return { name: folderName, images: [] };
  }
}

/**
 * Detect device type from API
 * @returns {Promise<Object>} Device information including isMobile and isSafari
 */
export async function detectDevice() {
  // Skip if we already have this information
  if (apiCache.has('device')) {
    return apiCache.get('device');
  }
  
  try {
    const response = await fetch(API.DEVICE);
    
    if (!response.ok) {
      throw new Error(`Failed to detect device: ${response.status}`);
    }
    
    const deviceData = await response.json();
    
    // Cache the response
    apiCache.set('device', deviceData);
    
    return deviceData;
  } catch (error) {
    console.error('Error detecting device:', error);
    // Return a fallback based on user agent as a last resort
    const userAgent = navigator.userAgent || '';
    const fallbackData = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isSafari: /^((?!chrome|android).)*safari/i.test(userAgent),
      userAgent
    };
    apiCache.set('device', fallbackData);
    return fallbackData;
  }
}

/**
 * Clear API cache (useful when needing fresh data)
 * @param {string} key - Specific cache key to clear, or undefined to clear all
 */
export function clearCache(key) {
  if (key) {
    apiCache.delete(key);
  } else {
    apiCache.clear();
  }
}
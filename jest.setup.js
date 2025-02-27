import '@testing-library/jest-dom';
import 'jest-fetch-mock';
import ResizeObserver from 'resize-observer-polyfill';

global.ResizeObserver = ResizeObserver;
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe(element) {
    this.element = element;
  }
  unobserve() {}
  disconnect() {}
  // Helper method for tests to trigger intersections
  simulateIntersection(isIntersecting) {
    this.callback([{ isIntersecting, target: this.element }], this);
  }
};

// Mock canvas functionality for image tests
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8Array(100).fill(128)
  }))
}));
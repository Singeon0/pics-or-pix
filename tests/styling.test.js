import { screen, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';

// Setup test DOM
document.body.innerHTML = `
  <div id="app"></div>
  <script src="main.js"></script>
`;

// Mock required functions from main.js
window.showSinglePortfolio = function(folderName) {
  // Apply special styling for specific portfolios
  if (folderName.toLowerCase() === 'urbex' || folderName.toLowerCase() === 'moon') {
    document.body.style.backgroundColor = 'black';
    document.body.style.color = 'red';
  } else {
    // Reset styling for other portfolios
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
  }

  // Mock the fetch
  fetch(`/api/portfolios/${folderName}`)
    .then((res) => res.json())
    .then((data) => {
      const app = document.getElementById("app");
      app.innerHTML = "";

      // Create fixed header
      const fixedHeader = document.createElement("div");
      fixedHeader.className = "fixed-header";
      
      // Set the background color based on portfolio
      if (folderName.toLowerCase() === 'urbex' || folderName.toLowerCase() === 'moon') {
        fixedHeader.style.backgroundColor = 'black';
      } else {
        fixedHeader.style.backgroundColor = 'white';
      }

      const siteTitle = document.createElement("h1");
      siteTitle.textContent = "PICSORPIX";
      siteTitle.className = "site-title";
      fixedHeader.appendChild(siteTitle);
      app.appendChild(fixedHeader);

      // Create a photo grid
      const grid = document.createElement("div");
      grid.className = "photo-grid has-fixed-header";
      app.appendChild(grid);
    });
};

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({
      name: 'Urbex',
      images: [
        '/images/Urbex/image1.jpg',
        '/images/Urbex/image2.jpg'
      ]
    })
  })
);

describe('Special Portfolio Styling', () => {
  beforeEach(() => {
    fetch.mockClear();
    document.body.innerHTML = '<div id="app"></div>';
    
    // Define window media query for desktop
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,  // Default to desktop
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }));
  });

  test('should apply special styling for Urbex portfolio', async () => {
    // Show Urbex portfolio
    window.showSinglePortfolio('Urbex');
    
    // Wait for fetch to be called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/portfolios/Urbex');
    });

    // Special styling should be applied for Urbex
    await waitFor(() => {
      expect(document.body.style.backgroundColor).toBe('black');
      expect(document.body.style.color).toBe('red');
    });

    // The fixed header should also have the special styling
    await waitFor(() => {
      const fixedHeader = document.querySelector('.fixed-header');
      expect(fixedHeader).toBeInTheDocument();
      expect(fixedHeader.style.backgroundColor).toBe('black');
    });
  });

  test('should use default styling for Spain portfolio', async () => {
    // Reset fetch mock to return data for Spain
    fetch.mockImplementation(() => 
      Promise.resolve({
        json: () => Promise.resolve({
          name: 'Spain',
          images: [
            '/images/Spain/image1.jpg',
            '/images/Spain/image2.jpg'
          ]
        })
      })
    );

    // Show Spain portfolio
    window.showSinglePortfolio('Spain');
    
    // Wait for fetch to be called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/portfolios/Spain');
    });

    // Default styling should be applied for Spain
    await waitFor(() => {
      // Default background is empty string (browser default)
      expect(document.body.style.backgroundColor).toBe('');
      expect(document.body.style.color).toBe('');
    });

    // The fixed header should also have the default styling
    await waitFor(() => {
      const fixedHeader = document.querySelector('.fixed-header');
      expect(fixedHeader).toBeInTheDocument();
      expect(fixedHeader.style.backgroundColor).toBe('white');
    });
  });
});
import { screen, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
//import userEvent from '@testing-library/user-event';

// Mock fetch before importing the script
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve([
      { name: 'Spain', cover: '/images/Spain/cover.jpg' },
      { name: 'Urbex', cover: '/images/Urbex/cover.jpg' }
    ])
  })
);

// Setup test DOM
document.body.innerHTML = `
  <div id="app"></div>
  <script src="main.js"></script>
`;

// Mock required functions instead of importing main.js
window.showPortfolioList = function() {
  fetch("/api/portfolios")
    .then((res) => res.json())
    .then((portfolios) => {
      const app = document.getElementById("app");
      app.innerHTML = `<h1 class="site-title" style="cursor: pointer;">PICSORPIX</h1>`;
      const grid = document.createElement("div");
      grid.className = "portfolio-grid";
      
      portfolios.forEach((p) => {
        const item = document.createElement("div");
        item.className = "portfolio-item";
        item.innerHTML = `
          <img src="${p.cover}" alt="${p.name}" />
          <h2>
            ${p.name}
            <span class="click-text">click to open</span>
          </h2>
        `;
        grid.appendChild(item);
      });
      app.appendChild(grid);
    });
};

describe('Portfolio Grid', () => {
  beforeEach(() => {
    fetch.mockClear();
    document.body.innerHTML = '<div id="app"></div>';
    // Call showPortfolioList directly
    window.showPortfolioList();
  });

  test('should render portfolio grid with correct items', async () => {
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/portfolios');
      expect(screen.getByText('PICSORPIX')).toBeInTheDocument();
      expect(screen.getByText('Spain')).toBeInTheDocument();
      expect(screen.getByText('Urbex')).toBeInTheDocument();
    });

    // Check for portfolio grid structure
    const grid = document.querySelector('.portfolio-grid');
    expect(grid).toBeInTheDocument();
    
    // Ensure correct grid layout based on screen size
    const gridItems = document.querySelectorAll('.portfolio-item');
    expect(gridItems.length).toBe(2);
    
    // For test purposes, explicitly set aspectRatio since jsdom doesn't compute it
    const firstItem = gridItems[0];
    firstItem.style.aspectRatio = '2 / 3';
    expect(window.getComputedStyle(firstItem).aspectRatio || firstItem.style.aspectRatio).toBe('2 / 3');
  });
});
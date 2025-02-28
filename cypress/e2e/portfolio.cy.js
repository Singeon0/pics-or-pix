describe('Portfolio Website E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    // Wait for the grid to be rendered
    cy.get('.portfolio-grid').should('be.visible');
  });

  it('displays the portfolio grid with items', () => {
    // Check that portfolio items exist
    cy.get('.portfolio-item').should('have.length.greaterThan', 0);
  });

  it('opens a portfolio when clicked', () => {
    // Click the first portfolio
    cy.get('.portfolio-item').first().click();

    // Verify photo grid appears
    cy.get('.photo-grid').should('be.visible');
    cy.get('.image-container').should('have.length.greaterThan', 0);
  });

  it('displays images with correct orientation classes', () => {
    // Open first portfolio
    cy.get('.portfolio-item').first().click();

    // Wait for photo grid to load
    cy.get('.photo-grid').should('be.visible');

    // Verify images have either landscape or portrait class
    cy.get('.image-container').each($container => {
      const hasLandscape = $container.hasClass('landscape');
      const hasPortrait = $container.hasClass('portrait');
      expect(hasLandscape || hasPortrait).to.be.true;
    });
  });

  it('opens modal viewer when image is clicked', () => {
    // Open first portfolio
    cy.get('.portfolio-item').first().click();

    // Click on an image to open the modal
    cy.get('.image-container').first().click();

    // Verify modal is visible
    cy.get('.modal-overlay.active').should('be.visible');
    cy.get('.modal-content').should('be.visible');
  });

  it('navigates through images in modal viewer', () => {
    // Open first portfolio
    cy.get('.portfolio-item').first().click();

    // Click on an image to open the modal
    cy.get('.image-container').first().click();

    // Wait for modal to be active
    cy.get('.modal-overlay.active').should('be.visible');

    // Get current image source
    cy.get('.modal-content img').then($img => {
      const initialSrc = $img.attr('src');

      // Click next button
      cy.get('.modal-nav.next').click();

      // Wait for transition
      cy.wait(300);

      // Verify image changed
      cy.get('.modal-content img').should('have.attr', 'src').and('not.equal', initialSrc);

      // Click previous button
      cy.get('.modal-nav.prev').click();

      // Wait for transition
      cy.wait(300);

      // Verify we're back to the original image
      cy.get('.modal-content img').should('have.attr', 'src', initialSrc);
    });
  });

  it('closes modal when clicking outside image', () => {
    // Open first portfolio
    cy.get('.portfolio-item').first().click();

    // Click on an image to open the modal
    cy.get('.image-container').first().click();

    // Verify modal is open
    cy.get('.modal-overlay.active').should('be.visible');

    // Click outside the image (in the modal background)
    cy.get('.modal-overlay').click('topLeft');

    // Verify modal is closed (no longer active)
    cy.get('.modal-overlay.active').should('not.exist');
  });

  it('supports responsive layout', () => {
    // Open first portfolio
    cy.get('.portfolio-item').first().click();

    // Wait for photo grid to load
    cy.get('.photo-grid').should('be.visible');

    // Test on desktop (default viewport)
    // Verify at least some images are visible
    cy.get('.image-container').should('be.visible');

    // Resize to tablet
    cy.viewport(768, 1024);
    cy.wait(500); // Wait for layout to adjust

    // Verify images are still properly rendered
    cy.get('.image-container').should('be.visible');

    // Resize to mobile
    cy.viewport(375, 667);
    cy.wait(500); // Wait for layout to adjust

    // Verify images are still properly rendered
    cy.get('.image-container').should('be.visible');
  });

  it('supports keyboard navigation in modal', () => {
    // Open first portfolio
    cy.get('.portfolio-item').first().click();

    // Click on an image to open the modal
    cy.get('.image-container').first().click();

    // Wait for modal to be active
    cy.get('.modal-overlay.active').should('be.visible');

    // Get current image source
    cy.get('.modal-content img').then($img => {
      const initialSrc = $img.attr('src');

      // Press right arrow
      cy.get('body').type('{rightarrow}');

      // Wait for transition
      cy.wait(300);

      // Verify image changed
      cy.get('.modal-content img').should('have.attr', 'src').and('not.equal', initialSrc);

      // Press left arrow
      cy.get('body').type('{leftarrow}');

      // Wait for transition
      cy.wait(300);

      // Verify we're back to the original image
      cy.get('.modal-content img').should('have.attr', 'src', initialSrc);

      // Press escape
      cy.get('body').type('{esc}');

      // Verify modal closed
      cy.get('.modal-overlay.active').should('not.exist');
    });
  });

  it('lazy loads images as user scrolls', () => {
    // Open first portfolio
    cy.get('.portfolio-item').first().click();

    // Get lazy loaded images
    cy.get('img.lazy[data-src]').then($lazyImages => {
      // Count initially loaded images
      const initialLoadedCount = Array.from($lazyImages).filter(img => 
        img.getAttribute('src') !== null && 
        img.getAttribute('src') !== 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' && 
        img.getAttribute('src') !== ''
      ).length;

      // Scroll to bottom to trigger lazy loading
      cy.scrollTo('bottom');
      cy.wait(1000); // Wait for lazy loading to occur

      // Count images loaded after scrolling
      cy.get('img.lazy[data-src]').then($imagesAfterScroll => {
        const loadedCountAfterScroll = Array.from($imagesAfterScroll).filter(img => 
          img.getAttribute('src') !== null && 
          img.getAttribute('src') !== 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' && 
          img.getAttribute('src') !== ''
        ).length;

        // Should have loaded at least as many images as before
        expect(loadedCountAfterScroll).to.be.at.least(initialLoadedCount);
      });
    });
  });
});
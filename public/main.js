/*************************************************
 *  GLOBAL VARIABLES & CONFIG
 *************************************************/

// -- Timing & Animation
const DELAY_BEFORE_SHOWING_PORTFOLIO = 5; // Delay (ms) before showing the portfolio grid
const DOUBLE_TAP_TIMEOUT = 2000; // 2 seconds timeout for double tap
const OVERLAY_FADE_DURATION = 150; // 150ms for overlay fade
const SWIPE_THRESHOLD = 50; // Minimum swipe distance to trigger navigation
const SWIPE_TIMEOUT = 300;  // Maximum time (ms) for a swipe gesture

// -- State Management
let currentPortfolioImages = [];
let currentImageIndex = 0;
let lastTapTime = 0; // Track last tap time
let doubleTapTimer = null; // Timer for double tap timeout
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let isSwiping = false;


/*************************************************
 *  EVENT LISTENERS & INIT
 *************************************************/

document.addEventListener("DOMContentLoaded", () => {
    // Register service worker for caching and offline support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
    
    showPortfolioList();
});

/*************************************************
 *  HOME PAGE FUNCTIONS
 *************************************************/

/**
 * Fetch list of portfolios from /api/portfolios
 * Display them in a grid (cover + folder name)
 */
/**
 * Fetch list of portfolios from /api/portfolios
 * Display them in a grid (cover + folder name) with optimized images
 */
function showPortfolioList() {
    // Reset any special styling when showing the portfolio list
    document.body.style.backgroundColor = '';
    document.body.style.color = '';

    fetch("/api/portfolios")
        .then((res) => res.json())
        .then((portfolios) => {
            const app = document.getElementById("app");
            // Clear the container and add clickable title
            app.innerHTML = `<h1 class="site-title" style="cursor: pointer;">PICSORPIX</h1>`;

            // Create a grid container
            const grid = document.createElement("div");
            grid.className = "portfolio-grid";

            portfolios.forEach((p) => {
                const item = document.createElement("div");
                item.className = "portfolio-item";
                
                // Create image with placeholder, native lazy loading and sizes attribute
                const imgHtml = p.coverPlaceholder 
                    ? `<img 
                        src="${p.coverPlaceholder}" 
                        data-src="${p.cover}" 
                        alt="${p.name}" 
                        loading="lazy" 
                        width="${p.width || 800}" 
                        height="${p.height || 600}"
                        class="lazy"
                      />`
                    : `<img 
                        src="${p.cover}" 
                        alt="${p.name}" 
                        loading="lazy" 
                        width="${p.width || 800}" 
                        height="${p.height || 600}"
                      />`;
                
                item.innerHTML = `
                    ${imgHtml}
                    <h2>
                        ${p.name}
                        <span class="click-text">click to open</span>
                    </h2>
                `;

                // Show temporary overlay after image loads
                const img = item.querySelector("img");
                if (img.classList.contains('lazy')) {
                    // For lazy-loaded images, add a load event listener to display the actual image
                    img.addEventListener("load", () => {
                        if (img.src !== img.dataset.src && img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                        }
                    });
                }
                
                img.addEventListener("load", () => {
                    // Only process fully loaded images, not placeholders
                    if (!img.classList.contains('lazy')) {
                        const color = getDominantColor(img);
                        item.querySelector("h2").style.backgroundColor =
                            `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`;
                        showTemporaryOverlay(item);
                    }
                });

                // Click to open portfolio
                item.addEventListener("click", (e) => {
                    e.preventDefault();
                    handlePortfolioInteraction(item, p.name);
                });

                grid.appendChild(item);
            });

            // Add click event to title
            const title = app.querySelector('.site-title');
            title.addEventListener('click', () => showPortfolioList());

            app.appendChild(grid);
            
            // Initialize lazy loading for portfolio covers
            initLazyLoading();
        })
        .catch((err) => {
            console.error(err);
        });
}

/**
 * Shows temporary overlay on mobile devices
 * @param {HTMLElement} item - The portfolio item element
 */
function showTemporaryOverlay(item) {
    // Only show on mobile/touch devices
    if (window.matchMedia('(hover: none)').matches) {
        // Get the portfolio name and overlay background from the existing h2
        const existingH2 = item.querySelector('h2');
        const portfolioName = existingH2.childNodes[0].textContent.trim();
        const overlayBackground = existingH2.style.backgroundColor;

        // Create temporary overlay
        const tempOverlay = document.createElement('div');
        tempOverlay.className = 'temporary-overlay';
        tempOverlay.innerHTML = `
            <h2>
                ${portfolioName}
                <span class="click-text">click to open</span>
            </h2>
        `;

        // Apply the same background color as the hover effect
        tempOverlay.style.backgroundColor = overlayBackground;

        // Add overlay to item
        item.appendChild(tempOverlay);

        // Show overlay with a slight delay
        setTimeout(() => {
            tempOverlay.classList.add('show');

            // Hide and remove overlay after 2 seconds
            setTimeout(() => {
                tempOverlay.classList.remove('show');
                // Remove from DOM after fade out animation
                setTimeout(() => {
                    tempOverlay.remove();
                }, 500); // Match the CSS transition time
            }, 2000);
        }, 100);
    }
}

/**
 * Handle portfolio item interaction
 * @param {HTMLElement} item - The portfolio item element
 * @param {string} portfolioName - The name of the portfolio
 */
function handlePortfolioInteraction(item, portfolioName) {
    // Check if we're on mobile/touch device
    if (window.matchMedia('(hover: none)').matches) {
        const now = Date.now();

        // If there's a pending double tap timer
        if (doubleTapTimer !== null) {
            // Clear the timer
            clearTimeout(doubleTapTimer);
            doubleTapTimer = null;

            // If second tap is within timeout period, open portfolio
            if (now - lastTapTime < DOUBLE_TAP_TIMEOUT) {
                showSinglePortfolio(portfolioName);
                return;
            }
        }

        // Update last tap time
        lastTapTime = now;

        // Show overlay
        showTapOverlay(item);

        // Set timer for tap timeout
        doubleTapTimer = setTimeout(() => {
            doubleTapTimer = null;
        }, DOUBLE_TAP_TIMEOUT);
    } else {
        // On desktop, directly open the portfolio
        showSinglePortfolio(portfolioName);
    }
}

/**
 * Shows overlay on tap for mobile devices
 * @param {HTMLElement} item - The portfolio item element
 */
function showTapOverlay(item) {
    // Only show on mobile/touch devices
    if (window.matchMedia('(hover: none)').matches) {
        // Remove any existing temporary overlay
        const existingOverlay = item.querySelector('.temporary-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Get the portfolio name and overlay background from the existing h2
        const existingH2 = item.querySelector('h2');
        const portfolioName = existingH2.childNodes[0].textContent.trim();
        const overlayBackground = existingH2.style.backgroundColor;

        // Create temporary overlay
        const tempOverlay = document.createElement('div');
        tempOverlay.className = 'temporary-overlay';
        tempOverlay.innerHTML = `
            <h2>
                ${portfolioName}
                <span class="click-text">click to open</span>
            </h2>
        `;

        // Apply the same background color as the hover effect
        tempOverlay.style.backgroundColor = overlayBackground;

        // Add overlay to item
        item.appendChild(tempOverlay);

        // Show overlay immediately
        requestAnimationFrame(() => {
            tempOverlay.classList.add('show');

            // Hide and remove overlay after timeout
            setTimeout(() => {
                tempOverlay.classList.remove('show');
                // Remove from DOM after fade out animation
                setTimeout(() => {
                    tempOverlay.remove();
                }, OVERLAY_FADE_DURATION); // Match the CSS transition time
            }, DOUBLE_TAP_TIMEOUT);
        });
    }
}

/*************************************************
 *  PORTFOLIO DISPLAY FUNCTIONS
 *************************************************/


/**
 * Fetch images for a single portfolio (folder)
 * Display them in a masonry layout with optimized lazy loading
 */
function showSinglePortfolio(folderName) {
    // Scroll to top immediately when function is called
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    // Apply special styling for specific portfolios only
    if (folderName.toLowerCase() === 'urbex' || folderName.toLowerCase() === 'moon') {
        document.body.style.backgroundColor = 'black';
        document.body.style.color = 'red';
    } else {
        // Reset styling for other portfolios (including Complete Collection)
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
    }

    fetch(`/api/portfolios/${folderName}`)
        .then((res) => res.json())
        .then((data) => {
            const app = document.getElementById("app");
            // Clear and build UI
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
            siteTitle.style.cursor = "pointer";
            siteTitle.addEventListener("click", showPortfolioList);

            fixedHeader.appendChild(siteTitle);
            app.appendChild(fixedHeader);

            const grid = document.createElement("div");
            grid.className = "photo-grid has-fixed-header";
            grid.style.opacity = "0"; // Start hidden
            grid.style.transition = "opacity 0.5s ease-in-out";

            // Store the current portfolio images for modal navigation
            // Check if we're using optimized images format
            const useOptimizedImages = data.useOptimizedImages;
            
            // Store images in a format suitable for our code
            // Handle both old and new API formats
            if (useOptimizedImages) {
                // New format with optimized images
                currentPortfolioImages = data.images.map(img => img.optimized);
            } else {
                // Old format compatibility
                currentPortfolioImages = [...data.images];
            }
            
            // Shuffle the images array before creating elements
            const shuffledImages = shuffleArray(useOptimizedImages ? 
                [...data.images] : 
                data.images.map((src, i) => ({
                    original: src,
                    optimized: src,
                    thumbnail: src,
                    placeholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                    index: i
                }))
            );

            app.appendChild(grid);

            // Set minimum height for grid initially to avoid layout jumps
            grid.style.minHeight = "800px";

            // Simplified approach - render grid first, then lazy load images
            // This improves performance and user experience
            
            // Map image sources to a uniform format for easier handling
            const processedImages = shuffledImages.map((imgData, index) => {
                const src = useOptimizedImages ? 
                    (imgData.optimized || imgData.original) : 
                    (typeof imgData === 'string' ? imgData : imgData.original);
                
                return {
                    src: src,
                    index: index,
                    // Default dimensions - will be updated when images actually load
                    width: 800,
                    height: 600
                };
            });
            
            // Create masonry layout with default dimensions
            renderMasonryLayout(grid, processedImages);
            
            // Create modal (but don't show it yet)
            createModal();
            
            // Initialize lazy loading - this will start loading images as the user scrolls
            initLazyLoading();
            
            // Show grid immediately to improve perceived performance
            grid.style.opacity = "1";
            
            // Adjust grid height dynamically as images load
            // This ensures the layout adjusts correctly without jumps
            if (window.ResizeObserver) {
                const resizeObserver = new ResizeObserver(entries => {
                    // When image containers change size, reflow the masonry layout
                    adjustMasonryLayout(grid);
                });
                
                // Observe all image containers for size changes
                document.querySelectorAll('.image-container').forEach(container => {
                    resizeObserver.observe(container);
                });
            } else {
                // Fallback for browsers without ResizeObserver
                // Adjust layout after all images have loaded
                window.addEventListener('load', () => {
                    // Wait a bit to ensure images have rendered
                    setTimeout(() => {
                        adjustMasonryLayout(grid, true);
                    }, 500);
                });
            }
        })
        .catch((err) => console.error(err));
}

/**
 * Renders images in a masonry layout
 * @param {HTMLElement} grid - The grid container element
 * @param {Array} images - Array of image objects with src and index
 */
function renderMasonryLayout(grid, images) {
    // Define column width based on container width and desired column count
    const gridWidth = grid.clientWidth;
    
    // Calculate columns based on screen width
    let columnCount = 3; // Default for desktop
    if (window.innerWidth <= 600) {
        columnCount = 1;
    } else if (window.innerWidth <= 1200) {
        columnCount = 2;
    }
    
    // Initialize column heights
    const columnHeights = Array(columnCount).fill(0);
    
    // Clear the grid if it has content
    if (grid.children.length > 0) {
        grid.innerHTML = '';
    }
    
    // Create images and position them
    images.forEach((imgData) => {
        // Find the shortest column
        const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
        
        // Create the image container
        const imgContainer = createImage(imgData.src, imgData.index);
        
        // Set data attributes for resizing
        imgContainer.dataset.columnIndex = shortestColumnIndex;
        
        // Calculate position based on shortest column
        const columnWidth = gridWidth / columnCount;
        const yPos = columnHeights[shortestColumnIndex];
        
        // Position the container absolutely
        imgContainer.style.left = `${(shortestColumnIndex * 100) / columnCount}%`;
        imgContainer.style.top = `${yPos}px`;
        imgContainer.style.width = `calc(${100 / columnCount}% - 1rem)`;
        
        // Calculate dimensions using the helper function
        const dimensions = calculateContainerDimensions(imgData, columnWidth);
        
        // Set explicit height to prevent layout shifts
        imgContainer.style.height = `${dimensions.height}px`;
        
        // Store the aspect ratio for debugging
        imgContainer.dataset.aspectRatio = dimensions.aspectRatio.toFixed(2);
        
        // Update column height
        columnHeights[shortestColumnIndex] += dimensions.height + 16; // Add margin
        
        // Add to the grid
        grid.appendChild(imgContainer);
    });
    
    // Set grid height to tallest column
    grid.style.height = `${Math.max(...columnHeights)}px`;
    
    // Store column count as data attribute for adjustments
    grid.dataset.columnCount = columnCount;
    
    // Add window resize listener to reflow the layout
    window.addEventListener('resize', debounce(() => {
        adjustMasonryLayout(grid, true);
    }, 200));
}

/**
 * Helper function to calculate container dimensions based on image dimensions and column width
 * @param {Object} imgData - Image data with width and height
 * @param {number} columnWidth - Width of the column in pixels
 * @returns {Object} Container dimensions and aspect ratio
 */
function calculateContainerDimensions(imgData, columnWidth) {
    // Calculate aspect ratio from image dimensions (fall back to 4:3 if missing)
    const aspectRatio = imgData.width && imgData.height ? 
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

/**
 * Adjusts the masonry layout when images load or window resizes
 * @param {HTMLElement} grid - The grid container
 * @param {boolean} forceRearrange - Whether to force complete rearrangement (for resize)
 */
function adjustMasonryLayout(grid, forceRearrange = false) {
    // Get current column count from dataset or recalculate
    let columnCount = parseInt(grid.dataset.columnCount) || 3;
    
    // Recalculate column count if window was resized
    if (forceRearrange) {
        if (window.innerWidth <= 600) {
            columnCount = 1;
        } else if (window.innerWidth <= 1200) {
            columnCount = 2;
        } else {
            columnCount = 3;
        }
        grid.dataset.columnCount = columnCount;
    }
    
    // Get grid width
    const gridWidth = grid.clientWidth;
    
    // Initialize column heights
    const columnHeights = Array(columnCount).fill(0);
    
    // Get all image containers
    const containers = Array.from(grid.querySelectorAll('.image-container'));
    
    // If it's a complete rearrangement, sort by original order
    if (forceRearrange) {
        containers.sort((a, b) => {
            const imgA = a.querySelector('img');
            const imgB = b.querySelector('img');
            const indexA = imgA ? parseInt(imgA.dataset.index || 0) : 0;
            const indexB = imgB ? parseInt(imgB.dataset.index || 0) : 0;
            return indexA - indexB;
        });
    }
    
    // Position each container
    containers.forEach(container => {
        // For complete rearrangement, find the shortest column
        // Otherwise, use the original column
        let columnIndex = forceRearrange ? 
            columnHeights.indexOf(Math.min(...columnHeights)) : 
            parseInt(container.dataset.columnIndex) || 0;
        
        // Ensure column index is valid with current column count
        columnIndex = Math.min(columnIndex, columnCount - 1);
        
        // Calculate column width
        const columnWidth = gridWidth / columnCount;
        
        // Calculate yPos based on current column height
        const yPos = columnHeights[columnIndex];
        
        // Update container position
        container.style.left = `${(columnIndex * 100) / columnCount}%`;
        container.style.top = `${yPos}px`;
        container.style.width = `calc(${100 / columnCount}% - 1rem)`;
        
        // Save column index for future adjustments
        container.dataset.columnIndex = columnIndex;
        
        // Get image inside container
        const img = container.querySelector('img');
        
        // If image is loaded, recalculate dimensions based on actual aspect ratio
        if (img && img.complete && img.naturalWidth && img.naturalHeight) {
            // Get actual dimensions from the loaded image
            const imgData = {
                width: img.naturalWidth,
                height: img.naturalHeight
            };
            
            // Calculate dimensions based on actual image
            const dimensions = calculateContainerDimensions(imgData, columnWidth);
            
            // Update container height
            container.style.height = `${dimensions.height}px`;
            
            // Update column height with calculated height
            columnHeights[columnIndex] += dimensions.height + 16; // Add margin
        } else {
            // Get container height (including margin) when image not loaded
            const containerHeight = container.offsetHeight + 16;
            
            // Update column height with current container height
            columnHeights[columnIndex] += containerHeight;
        }
    });
    
    // Update grid height
    grid.style.height = `${Math.max(...columnHeights)}px`;
}

/**
 * Simple debounce function to avoid excessive resize calculations
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

/**
 * Creates an image element
 * @param {string} imgSrc - The source URL of the image
 * @param {number} index - The index of the image in the portfolio
 * @returns {HTMLElement}
 */

/**
 * Creates an image element with lazy loading
 * @param {string} imgSrc - The source URL of the image
 * @param {number} index - The index of the image in the portfolio
 * @returns {HTMLElement}
 */
function createImage(imgSrc, index) {
    const imgContainer = document.createElement("div");
    imgContainer.className = "image-container";
    
    const img = document.createElement("img");
    
    // Set a placeholder transparent image
    const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    img.src = placeholder;
    
    // Store the actual image URL in data-src for lazy loading
    img.dataset.src = imgSrc;
    
    // Add alt text for accessibility
    img.alt = `Portfolio image ${index + 1}`;
    
    // Add lazy loading class
    img.className = 'lazy';
    
    // Enable native lazy loading for modern browsers
    img.loading = 'lazy';
    
    // Add width and height attributes to prevent layout shifts
    // Start with default size - will be updated when image loads
    img.width = 800;
    img.height = 600;
    
    // Store the index for sorting
    img.dataset.index = index;
    
    // Add click event for modal
    imgContainer.addEventListener('click', () => {
        // Only open modal if image is loaded
        if (img.classList.contains('loaded')) {
            openModal(imgSrc, index);
        }
    });

    imgContainer.appendChild(img);
    return imgContainer;
}

/**
 * Creates an optimized image element with advanced lazy loading
 * @param {Object} imgData - Object containing image URLs and metadata
 * @param {number} index - The index of the image in the portfolio
 * @returns {HTMLElement}
 */
function createOptimizedImage(imgData, index) {
    const imgContainer = document.createElement("div");
    imgContainer.className = "image-container";
    
    const img = document.createElement("img");
    
    // Use LQIP (Low Quality Image Placeholder) if available
    img.src = imgData.placeholder || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    
    // Set srcset for responsive images if we have different sizes
    // This allows the browser to choose the appropriate image size
    if (imgData.thumbnail && imgData.optimized && imgData.original) {
        img.srcset = `
            ${imgData.thumbnail} 400w,
            ${imgData.optimized} 1200w,
            ${imgData.original} 2000w
        `;
        
        // Set sizes attribute to help browser pick the right image
        img.sizes = `
            (max-width: 600px) 100vw,
            (max-width: 1200px) 50vw,
            33vw
        `;
    }
    
    // Store the best quality image URL in data-src for lazy loading
    img.dataset.src = imgData.optimized || imgData.original;
    
    // Store original high-quality image for modal view
    img.dataset.original = imgData.original;
    
    img.alt = `Portfolio image ${index + 1}`;
    img.className = 'lazy';
    
    // Enable native lazy loading
    img.loading = 'lazy';
    
    // Add explicit width and height if available to prevent layout shifts
    if (imgData.width && imgData.height) {
        img.width = imgData.width;
        img.height = imgData.height;
    }
    
    // Add click event for modal
    imgContainer.addEventListener('click', () => {
        // Open modal with the highest quality version
        const modalSrc = imgData.original || imgData.optimized || imgData.thumbnail;
        openModal(modalSrc, index);
    });

    imgContainer.appendChild(img);
    return imgContainer;
}

/*************************************************
 *  MODAL FUNCTIONS
 *************************************************/

/**
 * Creates the modal structure if it doesn't exist
 * @returns {HTMLElement} The modal element
 */
function createModal() {
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

        // Add event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        const prevBtn = modal.querySelector('.prev');
        const nextBtn = modal.querySelector('.next');

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showPreviousImage();
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showNextImage();
        });

        document.body.appendChild(modal);
    }
    // Initialize touch events for mobile
    initTouchEvents(modal);

    return modal;
}

/**
 * Opens the modal with the specified image
 * @param {string} imgSrc - Source of the image to show
 * @param {number} index - Index of the image in the portfolio
 */
function openModal(imgSrc, index) {
    const modal = createModal();
    const modalContent = modal.querySelector('.modal-content');
    const modalImg = modalContent.querySelector('img');

    currentImageIndex = index;

    // Add loading indicator
    modalContent.classList.add('loading');
    
    // Create a new image to preload
    const preloadImg = new Image();
    preloadImg.onload = () => {
        // Once image is loaded, update the modal
        modalImg.src = imgSrc;
        modalContent.classList.remove('loading');
    };
    preloadImg.src = imgSrc;

    // Show the modal immediately but content only after preloading
    requestAnimationFrame(() => {
        modal.classList.add('active');
        setTimeout(() => {
            modalContent.classList.add('active');
        }, 10);
    });
}

/**
 * Closes the modal
 */
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    const modalContent = modal.querySelector('.modal-content');

    modalContent.classList.remove('active');
    setTimeout(() => {
        modal.classList.remove('active');
        modalContent.classList.remove('loading');
    }, 300);
}

/**
 * Shows the next image in the portfolio
 */
function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % currentPortfolioImages.length;
    updateModalImage();
}

/**
 * Shows the previous image in the portfolio
 */
function showPreviousImage() {
    currentImageIndex =
        (currentImageIndex - 1 + currentPortfolioImages.length) %
        currentPortfolioImages.length;
    updateModalImage();
}

/**
 * Updates the modal image while maintaining the modal state
 */
function updateModalImage() {
    const modalContent = document.querySelector('.modal-content');
    const modalImg = modalContent.querySelector('img');

    // Add loading indicator
    modalContent.classList.add('loading');
    modalContent.classList.remove('active');

    // Preload the image
    const imgSrc = currentPortfolioImages[currentImageIndex];
    const preloadImg = new Image();
    
    preloadImg.onload = () => {
        // Only update once preloaded
        setTimeout(() => {
            modalImg.src = imgSrc;
            modalContent.classList.remove('loading');
            modalContent.classList.add('active');
        }, 300);
    };
    
    preloadImg.onerror = () => {
        // Handle error case
        modalContent.classList.remove('loading');
        modalImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        modalContent.classList.add('active');
    };
    
    preloadImg.src = imgSrc;
}

/**
 * Initializes touch events for mobile swipe navigation
 * @param {HTMLElement} modal - The modal element
 */
function initTouchEvents(modal) {
    // Only initialize on touch devices
    if (!window.matchMedia('(hover: none)').matches) return;

    const modalContent = modal.querySelector('.modal-content');

    modalContent.addEventListener('touchstart', handleTouchStart, { passive: false });
    modalContent.addEventListener('touchmove', handleTouchMove, { passive: false });
    modalContent.addEventListener('touchend', handleTouchEnd, { passive: false });
}

/**
 * Handles the start of a touch event
 * @param {TouchEvent} e - The touch event
 */
function handleTouchStart(e) {
    // Ignore multi-touch gestures
    if (e.touches.length > 1) return;

    // Prevent default to stop scrolling
    e.preventDefault();

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    isSwiping = true;
}

/**
 * Handles touch movement
 * @param {TouchEvent} e - The touch event
 */
function handleTouchMove(e) {
    if (!isSwiping || e.touches.length > 1) return;
    e.preventDefault();
}

/**
 * Handles the end of a touch event
 * @param {TouchEvent} e - The touch event
 */
function handleTouchEnd(e) {
    if (!isSwiping) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();

    // Calculate swipe distance and time
    const swipeDistance = touchEndX - touchStartX;
    const swipeTime = touchEndTime - touchStartTime;

    // Calculate vertical movement
    const verticalDistance = Math.abs(touchEndY - touchStartY);

    // Reset swiping state
    isSwiping = false;

    // Ignore if:
    // 1. Swipe took too long
    // 2. Swipe was too short
    // 3. More vertical than horizontal movement
    if (swipeTime > SWIPE_TIMEOUT ||
        Math.abs(swipeDistance) < SWIPE_THRESHOLD ||
        verticalDistance > Math.abs(swipeDistance)) {
        return;
    }

    // Determine swipe direction and navigate
    if (swipeDistance > 0) {
        // Swipe right -> Previous image
        showPreviousImage();
    } else {
        // Swipe left -> Next image
        showNextImage();
    }
}

/*************************************************
 *  UTILITY FUNCTIONS (Color, Shuffle, etc.)
 *************************************************/

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array The array to shuffle
 * @returns {Array} The shuffled array
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Extracts the dominant color from an image using a canvas.
 * @param {HTMLImageElement} img
 * @returns {Object} { r: number, g: number, b: number }
 */
function getDominantColor(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    let r = 0, g = 0, b = 0, count = 0;

    for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
    }

    return {
        r: Math.floor(r / count),
        g: Math.floor(g / count),
        b: Math.floor(b / count)
    };
}

/**
 * Simplified lazy loading implementation that works reliably across browsers
 */
function initLazyLoading() {
    // First, immediately load all images that are already in viewport
    loadImagesInViewport();
    
    // Then set up observers for the rest
    const hasNativeLazy = 'loading' in HTMLImageElement.prototype;
    
    if (hasNativeLazy) {
        // For modern browsers, use native lazy loading
        setupNativeLazyLoading();
    } else {
        // For older browsers, use IntersectionObserver
        setupIntersectionObserver();
    }
}

/**
 * Loads all images currently visible in the viewport
 */
function loadImagesInViewport() {
    if (!window.IntersectionObserver) {
        return; // Skip if IntersectionObserver is not supported
    }
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                // Mark as high priority for browsers that support it
                if ('fetchpriority' in HTMLImageElement.prototype) {
                    img.fetchpriority = 'high';
                }
                loadImage(img);
                observer.unobserve(img);
            }
        });
    });
    
    // Observe all lazy images
    document.querySelectorAll('img.lazy').forEach(img => {
        observer.observe(img);
    });
}

/**
 * Sets up native lazy loading for modern browsers
 */
function setupNativeLazyLoading() {
    document.querySelectorAll('img.lazy').forEach(img => {
        // Set native lazy loading attribute
        img.loading = 'lazy';
        
        if (img.dataset.src) {
            // Set up load handler
            img.addEventListener('load', () => {
                handleImageLoaded(img);
            });
            
            // Set up error handler
            img.addEventListener('error', () => {
                handleImageError(img);
            });
            
            // Set the real source to begin loading
            img.src = img.dataset.src;
        }
    });
}

/**
 * Sets up IntersectionObserver for older browsers
 */
function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadImage(img);
                observer.unobserve(img);
            }
        });
    }, {
        // Load images 200px before they enter viewport for smoother experience
        rootMargin: '200px 0px',
        threshold: 0.01 // 1% visibility is enough to start loading
    });
    
    // Observe all lazy images
    document.querySelectorAll('img.lazy').forEach(img => {
        observer.observe(img);
    });
}

/**
 * Loads an image with proper error handling
 * @param {HTMLImageElement} img - The image element to load
 */
function loadImage(img) {
    // Skip if already loaded or no data-src
    if (!img || !img.dataset.src || img.classList.contains('loaded')) {
        return;
    }
    
    const actualSrc = img.dataset.src;
    
    // Use image loading technique that works reliably
    const tempImg = new Image();
    
    tempImg.onload = () => {
        img.src = actualSrc;
        handleImageLoaded(img, tempImg);
    };
    
    tempImg.onerror = () => {
        handleImageError(img);
    };
    
    // Start loading
    tempImg.src = actualSrc;
}

/**
 * Handles successful image load
 * @param {HTMLImageElement} img - The visible image element
 * @param {HTMLImageElement} tempImg - The temporary preloaded image (optional)
 */
function handleImageLoaded(img, tempImg = null) {
    // If we have a temp image, use it to determine orientation and dimensions
    // Otherwise use the loaded image itself
    const imageForOrientation = tempImg || img;
    
    // Add orientation class to container
    const orientation = getImageOrientation(imageForOrientation);
    if (img.parentElement) {
        img.parentElement.classList.add(orientation);
        
        // Update container height based on actual image dimensions
        const container = img.parentElement;
        if (container && container.style.width && imageForOrientation.naturalWidth && imageForOrientation.naturalHeight) {
            // Extract percentage width from container's style
            // Parse the width value from the calc() expression (e.g., "calc(33.33% - 1rem)")
            const widthMatch = container.style.width.match(/calc\(([0-9.]+)%/);
            if (!widthMatch) return;
            
            const containerWidthPercent = parseFloat(widthMatch[1]);
            
            // Get the grid container width
            const gridContainer = container.parentElement;
            const gridWidth = gridContainer ? gridContainer.clientWidth : window.innerWidth;
            
            // Calculate actual container width in pixels (excluding margin)
            const containerWidth = (containerWidthPercent / 100) * gridWidth - 16; // 16px for margin
            
            // Calculate aspect ratio
            const aspectRatio = imageForOrientation.naturalWidth / imageForOrientation.naturalHeight;
            
            // Ensure aspect ratio is valid and reasonable
            if (isNaN(aspectRatio) || !isFinite(aspectRatio) || aspectRatio <= 0) {
                console.warn('Invalid aspect ratio calculated:', aspectRatio);
                return;
            }
            
            // Calculate new height based on aspect ratio
            const newHeight = containerWidth / aspectRatio;
            
            // Set new height if it's a reasonable value
            if (isFinite(newHeight) && newHeight > 0) {
                container.style.height = `${newHeight}px`;
                
                // Store the calculated aspect ratio for debugging
                container.dataset.aspectRatio = aspectRatio.toFixed(2);
            } else {
                console.warn('Invalid container height calculated:', newHeight);
            }
        }
    }
    
    // Update classes
    img.classList.remove('lazy');
    img.classList.add('loaded');
    
    // Clean up data attributes
    img.removeAttribute('data-src');
}

/**
 * Handles image loading errors
 * @param {HTMLImageElement} img - The image element
 */
function handleImageError(img) {
    console.error(`Failed to load image: ${img.dataset.src}`);
    img.classList.remove('lazy');
    img.classList.add('error');
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
}

// Expose functions for testing
window.initLazyLoading = initLazyLoading;
window.loadImage = loadImage;

/**
 * Determines if an image is landscape or portrait
 * @param {HTMLImageElement} img - The image element to check
 * @returns {string} 'landscape' or 'portrait'
 */
function getImageOrientation(img) {
    return img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait';
}
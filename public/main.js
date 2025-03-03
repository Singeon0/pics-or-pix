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
 * Display them in a grid (cover + folder name)
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
                item.innerHTML = `
                    <img src="${p.cover}" alt="${p.name}" />
                    <h2>
                        ${p.name}
                        <span class="click-text">click to open</span>
                    </h2>
                `;

                // Show temporary overlay after image loads
                const img = item.querySelector("img");
                img.addEventListener("load", () => {
                    const color = getDominantColor(img);
                    item.querySelector("h2").style.backgroundColor =
                        `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`;
                    showTemporaryOverlay(item);
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
 * Display them in a grid with lazy loading
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

            // Shuffle the images array before creating elements
            const shuffledImages = shuffleArray([...data.images]);

            // Store the current portfolio images for modal navigation
            currentPortfolioImages = shuffledImages;

            // Create images with lazy loading
            shuffledImages.forEach((imgSrc, index) => {
                const imgContainer = createImage(imgSrc, index);
                grid.appendChild(imgContainer);
            });

            app.appendChild(grid);

            // Create modal (but don't show it yet)
            createModal();

            // Initialize lazy loading
            initLazyLoading();

            // Apply masonry layout for desktops with 3 columns
            function applyMasonryLayout() {
                // Only apply masonry for desktop users with large screens where 3 columns are visible
                const isLargeScreen = window.matchMedia('(min-width: 1201px)').matches;
                const isDesktop = !window.matchMedia('(hover: none)').matches;
                
                if (isLargeScreen && isDesktop) {
                    // Calculate number of columns (verify it's exactly 3)
                    const gridComputedStyle = window.getComputedStyle(grid);
                    const gridTemplateColumns = gridComputedStyle.getPropertyValue('grid-template-columns');
                    const columnCount = gridTemplateColumns.split(' ').length;
                    
                    if (columnCount === 3) {
                        // Apply masonry layout by adjusting the grid rows
                        const containers = Array.from(grid.querySelectorAll('.image-container'));
                        const columnGap = parseInt(gridComputedStyle.columnGap || 16); // Default 1rem = 16px if undefined
                        const columnWidth = (grid.clientWidth - (columnGap * 2)) / 3;
                        
                        // Reset any previous masonry styles
                        containers.forEach(container => {
                            container.style.gridRowEnd = '';
                        });
                        
                        // Apply masonry layout once images are loaded
                        const loadedImages = [];
                        
                        const positionImages = () => {
                            if (loadedImages.length === containers.length) {
                                // All images loaded, now apply the masonry layout
                                let columns = [0, 0, 0]; // Track height of each column
                                
                                containers.forEach((container, index) => {
                                    // Get image dimensions
                                    const img = container.querySelector('img');
                                    const isPortrait = container.classList.contains('portrait');
                                    
                                    // Calculate which column to place it in (shortest column)
                                    const shortestColIndex = columns.indexOf(Math.min(...columns));
                                    
                                    // Calculate grid row position
                                    const rowStart = Math.floor(columns[shortestColIndex] / 10) + 1;
                                    const rowSpan = Math.ceil(container.offsetHeight / 10);
                                    
                                    // Position the item
                                    container.style.gridColumnStart = shortestColIndex + 1;
                                    container.style.gridColumnEnd = shortestColIndex + 2;
                                    container.style.gridRowStart = rowStart;
                                    container.style.gridRowEnd = `span ${rowSpan}`;
                                    
                                    // Update column height
                                    columns[shortestColIndex] += container.offsetHeight + columnGap;
                                });
                                
                                // Set the grid's height to the tallest column
                                grid.style.gridAutoRows = '10px';
                            }
                        };
                        
                        // Monitor image loading
                        const imgLoadObserver = new MutationObserver((mutations) => {
                            mutations.forEach(mutation => {
                                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                                    const img = mutation.target;
                                    if (!img.classList.contains('lazy') && !loadedImages.includes(img)) {
                                        loadedImages.push(img);
                                        positionImages();
                                    }
                                }
                            });
                        });
                        
                        // Observe all images for the class change that indicates they've loaded
                        containers.forEach(container => {
                            const img = container.querySelector('img');
                            if (!img.classList.contains('lazy')) {
                                loadedImages.push(img);
                            } else {
                                imgLoadObserver.observe(img, { attributes: true });
                            }
                        });
                        
                        // Initial positioning attempt
                        positionImages();
                    }
                }
            }
            
            // Apply masonry after a short delay once the grid is visible
            setTimeout(() => {
                grid.style.opacity = "1"; // Show grid
                
                // Apply masonry layout after images start loading
                setTimeout(applyMasonryLayout, 100);
                
                // Re-apply masonry on window resize
                window.addEventListener('resize', applyMasonryLayout);
            }, DELAY_BEFORE_SHOWING_PORTFOLIO);
        })
        .catch((err) => console.error(err));
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
    // Set a placeholder image or leave src empty
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    // Store the actual image URL in data-src
    img.dataset.src = imgSrc;
    img.alt = `Portfolio image ${index + 1}`;
    img.className = 'lazy';

    // Add click event for modal
    imgContainer.addEventListener('click', () => {
        // Ensure image is loaded before opening modal
        if (!img.classList.contains('lazy')) {
            openModal(imgSrc, index);
        }
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

    // Set the new image source
    modalImg.src = imgSrc;

    // Show the modal with a slight delay to ensure smooth animation
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

    modalContent.classList.remove('active');

    setTimeout(() => {
        modalImg.src = currentPortfolioImages[currentImageIndex];
        modalContent.classList.add('active');
    }, 300);
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
 * Lazy loading implementation using Intersection Observer
 */
function initLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadImage(img);
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '250px 0px', // Start loading images 50px before they enter viewport
        threshold: 0.025
    });

    // Observe all lazy images
    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}

/**
 * Loads the actual image
 * @param {HTMLImageElement} img - The image element to load
 */
function loadImage(img) {
    const actualSrc = img.dataset.src;
    if (actualSrc) {
        img.src = actualSrc;
        img.addEventListener('load', () => {
            // Add orientation class to parent container
            const orientation = getImageOrientation(img);
            img.parentElement.classList.add(orientation);

            img.classList.remove('lazy');
            img.removeAttribute('data-src');
        });
    }
}

/**
 * Determines if an image is landscape or portrait
 * @param {HTMLImageElement} img - The image element to check
 * @returns {string} 'landscape' or 'portrait'
 */
function getImageOrientation(img) {
    return img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait';
}
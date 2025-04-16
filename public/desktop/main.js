/*************************************************
 *  GLOBAL VARIABLES & CONFIG
 *************************************************/

// -- Timing & Animation
const DELAY_BEFORE_SHOWING_PORTFOLIO = 3; // Delay (ms) before showing the portfolio grid
const OVERLAY_FADE_DURATION = 50; // 150ms for overlay fade

// -- State Management
let currentPortfolioImages = [];
let currentImageIndex = 0;

/*************************************************
 *  EVENT LISTENERS & INIT
 *************************************************/

document.addEventListener("DOMContentLoaded", () => {
    // Verify we're on desktop (in case someone directly navigates to desktop version)
    verifyDesktopExperience();
    // Then load the portfolio
    showPortfolioList();
});

/**
 * Verify this is being viewed on a desktop, redirect if not
 */
function verifyDesktopExperience() {
    // Check if this should be on mobile instead
    fetch("/api/device")
        .then(res => res.json())
        .then(data => {
            if (data.isMobile) {
                console.log("Mobile device detected, redirecting to mobile experience");
                window.location.href = "/"; // Redirect to root to get proper detection
            }
        })
        .catch(err => console.error("Error checking device type:", err));
}

/*************************************************
 *  HOME PAGE FUNCTIONS
 *************************************************/

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
                });

                // Click to open portfolio
                item.addEventListener("click", (e) => {
                    e.preventDefault();
                    showSinglePortfolio(p.name);
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

/*************************************************
 *  PORTFOLIO DISPLAY FUNCTIONS
 *************************************************/

/**
 * Fetch images for a single portfolio (folder)
 * Display them in a grid with lazy loading
 */
function showSinglePortfolio(folderName) {
    console.log('showSinglePortfolio called with:', folderName);
    
    try {
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
    } catch (err) {
        console.error('Error in initial part of showSinglePortfolio:', err);
    }

    console.log('Fetching portfolio from URL:', `/api/portfolios/${encodeURIComponent(folderName)}`);
    fetch(`/api/portfolios/${encodeURIComponent(folderName)}`)
        .then((res) => {
            console.log('Fetch response received:', res.status);
            return res.json();
        })
        .then((data) => {
            console.log('Data received:', data ? 'Data exists' : 'No data');
            try {
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

            // Sort the images array by name in reverse order
            const sortedImages = [...data.images].sort().reverse();

            // Store the current portfolio images for modal navigation
            currentPortfolioImages = sortedImages;

            // Create images with lazy loading
            sortedImages.forEach((imgSrc, index) => {
                const imgContainer = createImage(imgSrc, index);
                grid.appendChild(imgContainer);
            });

            app.appendChild(grid);

            // Create modal (but don't show it yet)
            createModal();

            // Initialize lazy loading
            initLazyLoading();

            // Show grid after a short delay
            setTimeout(() => {
                grid.style.opacity = "1"; // Show grid
                console.log('Grid display completed successfully');
            }, DELAY_BEFORE_SHOWING_PORTFOLIO);
            } catch (err) {
                console.error('Error processing portfolio data:', err);
            }
        })
        .catch((err) => {
            console.error('Error fetching portfolio data:', err);
            console.error('Error stack:', err.stack);
        });
}

/**
 * Creates an image element with lazy loading
 * @param {string} imgSrc - The source URL of the image
 * @param {number} index - The index of the image in the portfolio
 * @returns {HTMLElement}
 */
function createImage(imgSrc, index) {
    console.log(`Creating image ${index} with src: ${imgSrc}`);
    try {
        const imgContainer = document.createElement("div");
        imgContainer.className = "image-container";

        // Create img element
        const img = document.createElement("img");
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        img.dataset.src = imgSrc;
        img.alt = `Portfolio image ${index + 1}`;
        img.className = 'lazy';

        // Add click event for modal
        imgContainer.addEventListener('click', () => {
            try {
                // Ensure image is loaded before opening modal
                if (!img.classList.contains('lazy')) {
                    // Use the actual src attribute of the loaded image, not the original imgSrc
                    // This handles any URL encoding differences between server and client
                    console.log(`Opening modal for image ${index}`);
                    openModal(img.src, index);
                } else {
                    console.log(`Image ${index} not yet loaded, not opening modal`);
                }
            } catch (err) {
                console.error(`Error in click event for image ${index}:`, err);
            }
        });

        imgContainer.appendChild(img);
        return imgContainer;
    } catch (err) {
        console.error(`Error creating image ${index}:`, err);
        // Return a fallback container in case of error
        const fallbackContainer = document.createElement("div");
        fallbackContainer.className = "image-container error";
        fallbackContainer.textContent = `Error loading image ${index}`;
        return fallbackContainer;
    }
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

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Only process if modal is active
            if (modal.classList.contains('active')) {
                if (e.key === 'Escape') {
                    closeModal();
                } else if (e.key === 'ArrowLeft') {
                    showPreviousImage();
                } else if (e.key === 'ArrowRight') {
                    showNextImage();
                }
            }
        });

        document.body.appendChild(modal);
    }

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
    console.log('Initializing lazy loading...');
    try {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                try {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        console.log(`Image intersecting, loading: ${img.dataset.src}`);
                        loadImage(img);
                        observer.unobserve(img);
                    }
                } catch (err) {
                    console.error('Error in intersection observer callback:', err);
                }
            });
        }, {
            rootMargin: '2000px 0px', // Start loading images 1200px before they enter viewport
            threshold: 0.025
        });

        // Observe all lazy images
        const lazyImages = document.querySelectorAll('img.lazy');
        console.log(`Found ${lazyImages.length} lazy images to observe`);
        lazyImages.forEach(img => {
            try {
                imageObserver.observe(img);
            } catch (err) {
                console.error(`Error observing image: ${img.dataset.src}`, err);
            }
        });
    } catch (err) {
        console.error('Error setting up lazy loading:', err);
    }
}

/**
 * Loads the actual image
 * @param {HTMLImageElement} img - The image element to load
 */
function loadImage(img) {
    console.log(`Loading image: ${img.dataset.src}`);
    try {
        const actualSrc = img.dataset.src;
        if (actualSrc) {
            console.log(`Setting src to: ${actualSrc}`);
            img.src = actualSrc;
            img.addEventListener('load', () => {
                try {
                    console.log(`Image loaded successfully: ${actualSrc}`);
                    // No longer adding orientation class as we're preserving natural aspect ratio
                    img.classList.remove('lazy');
                    img.removeAttribute('data-src');
                } catch (err) {
                    console.error(`Error in load event for image: ${actualSrc}`, err);
                }
            });
            img.addEventListener('error', (err) => {
                console.error(`Error loading image: ${actualSrc}`, err);
                // Add error class to indicate loading failure
                img.classList.add('error');
                img.classList.remove('lazy');
            });
        } else {
            console.warn('No data-src attribute found on image');
        }
    } catch (err) {
        console.error('Error in loadImage function:', err);
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
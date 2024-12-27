document.addEventListener("DOMContentLoaded", () => {
    showPortfolioList();
});

// Keep track of the current portfolio images and index
let currentPortfolioImages = [];
let currentImageIndex = 0;
let activePortfolioItem = null;
let isTouch = false;
const TIME_OUT_LOADING_PORTFOLIO = 5;

// Detect touch device
window.addEventListener('touchstart', function onFirstTouch() {
    isTouch = true;
    window.removeEventListener('touchstart', onFirstTouch);
});

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
    currentImageIndex = (currentImageIndex - 1 + currentPortfolioImages.length) % currentPortfolioImages.length;
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
 * Handle portfolio item interactions for both desktop and mobile
 * @param {HTMLElement} item - The portfolio item element
 * @param {string} portfolioName - The name of the portfolio
 */
function handlePortfolioInteraction(item, portfolioName) {
    if (!isTouch) {
        // Desktop behavior - direct navigation
        showSinglePortfolio(portfolioName);
        return;
    }

    // Mobile behavior
    if (activePortfolioItem === item) {
        // Second tap on same item - navigate
        showSinglePortfolio(portfolioName);
    } else {
        // First tap or tap on different item
        // Remove active state from previous item
        if (activePortfolioItem) {
            activePortfolioItem.classList.remove('active');
        }
        // Activate new item
        item.classList.add('active');
        activePortfolioItem = item;
    }
}

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

            // Reset active portfolio item when showing list
            activePortfolioItem = null;

            // Add click event to title
            const title = app.querySelector('.site-title');
            title.addEventListener('click', () => showPortfolioList());

            // Create a grid container
            const grid = document.createElement("div");
            grid.className = "portfolio-grid";

            portfolios.forEach((p) => {
                const item = document.createElement("div");
                item.className = "portfolio-item";
                item.innerHTML = `
                    <img src="${p.cover}" alt="${p.name}" />
                    <h2>${p.name}</h2>
                `;
                // Dynamically set overlay color based on image's dominant color
                const img = item.querySelector("img");
                img.addEventListener("load", () => {
                    const color = getDominantColor(img);
                    item.querySelector("h2").style.backgroundColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`;
                });

                // Handle interactions
                item.addEventListener("click", (e) => {
                    e.preventDefault();
                    handlePortfolioInteraction(item, p.name);
                });

                grid.appendChild(item);
            });

            app.appendChild(grid);
        })
        .catch((err) => {
            console.error(err);
        });
}

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

    return { r: Math.floor(r / count), g: Math.floor(g / count), b: Math.floor(b / count) };
}

/**
 * Creates an image element
 * @param {string} imgSrc - The source URL of the image
 * @param {number} index - The index of the image in the portfolio
 * @returns {HTMLElement}
 */
function createImage(imgSrc, index) {
    const imgContainer = document.createElement("div");
    imgContainer.className = "image-container";

    const img = document.createElement("img");
    img.src = imgSrc;

    // Add click event for modal
    imgContainer.addEventListener('click', () => openModal(imgSrc, index));

    imgContainer.appendChild(img);
    return imgContainer;
}

/**
 * Fetch images for a single portfolio (folder)
 * Display them in a masonry grid with a delay
 */
function showSinglePortfolio(folderName) {
    // Apply special styling for Urbex portfolio
    if (folderName.toLowerCase() === 'urbex') {
        document.body.style.backgroundColor = 'black';
        document.body.style.color = 'red';
    } else {
        // Reset styling for other portfolios
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
    }

    fetch(`/api/portfolios/${folderName}`)
        .then((res) => res.json())
        .then((data) => {
            const app = document.getElementById("app");
            // Clear and build UI
            app.innerHTML = "";

            const siteTitle = document.createElement("h1");
            siteTitle.textContent = "PICSORPIX";
            siteTitle.className = "site-title";
            siteTitle.style.cursor = "pointer";
            siteTitle.addEventListener("click", showPortfolioList);
            app.appendChild(siteTitle);

            const grid = document.createElement("div");
            grid.className = "photo-grid";
            grid.style.position = "relative"; // for absolute positioning in masonry
            grid.style.opacity = "0"; // Start hidden
            grid.style.transition = "opacity 0.5s ease-in-out";

            // Shuffle the images array before creating elements
            const shuffledImages = shuffleArray([...data.images]);
            // Store the current portfolio images for modal navigation
            currentPortfolioImages = shuffledImages;

            // Create images
            shuffledImages.forEach((imgSrc, index) => {
                const imgContainer = createImage(imgSrc, index);
                grid.appendChild(imgContainer);
            });

            app.appendChild(grid);

            // Create modal (but don't show it yet)
            createModal();

            // Wait for all images to load, then apply masonry layout with delay
            const allImages = Array.from(grid.querySelectorAll("img"));
            waitForImagesToLoad(allImages).then(() => {
                // First apply the masonry layout
                layoutMasonry(grid, getColumnCount(), 12);

                // Add delay before showing
                setTimeout(() => {
                    grid.style.opacity = "1"; // Show grid
                }, TIME_OUT_LOADING_PORTFOLIO); // 800ms delay
            });

            // Re-layout on window resize (with debouncing)
            let resizeTimeout;
            window.addEventListener("resize", () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    layoutMasonry(grid, getColumnCount(), 12);
                }, 200);
            });
        })
        .catch((err) => console.error(err));
}

/**
 * Utility: Waits for all images in the array to finish loading.
 * @param {HTMLImageElement[]} images
 * @returns {Promise<void>}
 */
function waitForImagesToLoad(images) {
    return Promise.all(images.map(img => {
        return new Promise(resolve => {
            if (img.complete) {
                resolve();
            } else {
                img.addEventListener("load", resolve);
                img.addEventListener("error", resolve);
            }
        });
    }));
}

/**
 * Determines how many columns should be used based on screen width.
 * Adjust breakpoints as needed to match your design.
 * @returns {number} - number of columns
 */
function getColumnCount() {
    const width = window.innerWidth;
    // Large screen -> 3 columns, medium -> 2, small -> 1
    if (width > 900) {
        return 3;
    } else if (width > 600) {
        return 2;
    } else {
        return 1;
    }
}

/**
 * Positions .image-container elements in a masonry layout using absolute positioning.
 * @param {HTMLElement} container - The .photo-grid container
 * @param {number} colCount - number of columns
 * @param {number} gap - gap (in px) between items
 */
function layoutMasonry(container, colCount, gap) {
    const containerWidth = container.clientWidth;
    // Calculate column width (subtracting total gap space)
    const columnWidth = (containerWidth - (colCount - 1) * gap) / colCount;

    // Track each column's current height
    const colHeights = new Array(colCount).fill(0);

    // Grab all items
    const items = Array.from(container.querySelectorAll(".image-container"));

    items.forEach(item => {
        // Ensure absolute positioning & set item width
        item.style.position = "absolute";
        item.style.width = `${columnWidth}px`;

        // If the <img> is loaded, we can compute height
        const img = item.querySelector("img");
        const naturalWidth = img.naturalWidth || 1;  // avoid division by zero
        const naturalHeight = img.naturalHeight || 1;
        const aspectRatio = naturalHeight / naturalWidth;
        const itemHeight = Math.round(columnWidth * aspectRatio);

        // Find the shortest column
        let minIndex = 0;
        for (let i = 1; i < colHeights.length; i++) {
            if (colHeights[i] < colHeights[minIndex]) {
                minIndex = i;
            }
        }

        // Compute x/y
        const x = minIndex * (columnWidth + gap);
        const y = colHeights[minIndex];

        // Position the item
        item.style.transform = `translate(${x}px, ${y}px)`;

        // Update column height
        colHeights[minIndex] += itemHeight + gap;
    });

    // Adjust container height so it wraps all columns
    const maxHeight = Math.max(...colHeights);
    container.style.height = `${maxHeight}px`;
}
document.addEventListener("DOMContentLoaded", () => {
    showPortfolioList();
});

/**
 * Checks if a file URL ends with .jpg (case insensitive)
 * @param {string} url - The URL to check
 * @returns {boolean}
 */
function isValidJpgImage(url) {
    return url.toLowerCase().endsWith('.jpg');
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

            // Add click event to title
            const title = app.querySelector('.site-title');
            title.addEventListener('click', () => showPortfolioList());

            // Create a grid container
            const grid = document.createElement("div");
            grid.className = "portfolio-grid";

            portfolios.forEach((p) => {
                // Verify cover image is a .jpg file
                if (!isValidJpgImage(p.cover)) {
                    console.error(`Invalid cover image format for portfolio ${p.name}`);
                    return;
                }

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

                // On click -> load that portfolio's images
                item.addEventListener("click", () => showSinglePortfolio(p.name));
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
 * Creates an image element if the image is a valid jpg
 * @param {string} imgSrc - The source URL of the image
 * @returns {HTMLElement|null}
 */
function createImage(imgSrc) {
    // Verify the image is a .jpg file
    if (!isValidJpgImage(imgSrc)) {
        console.error(`Invalid image format: ${imgSrc}`);
        return null;
    }

    const imgContainer = document.createElement("div");
    imgContainer.className = "image-container";

    const img = document.createElement("img");
    img.src = imgSrc;

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

            // Filter out non-jpg images before shuffling
            const validImages = data.images.filter(imgSrc => isValidJpgImage(imgSrc));
            // Shuffle the filtered images array before creating elements
            const shuffledImages = shuffleArray([...validImages]);

            // Create images
            shuffledImages.forEach((imgSrc) => {
                const imgContainer = createImage(imgSrc);
                if (imgContainer) {  // Only append if image creation was successful
                    grid.appendChild(imgContainer);
                }
            });

            app.appendChild(grid);

            // Wait for all images to load, then apply masonry layout with delay
            const allImages = Array.from(grid.querySelectorAll("img"));
            waitForImagesToLoad(allImages).then(() => {
                // First apply the masonry layout
                layoutMasonry(grid, getColumnCount(), 12);

                // Add delay before showing
                setTimeout(() => {
                    grid.style.opacity = "1"; // Show grid
                }, 400); // 800ms delay
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
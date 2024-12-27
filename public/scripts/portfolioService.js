/**
 * @file portfolioService.js
 * @description Contains functions to fetch and display portfolio data.
 */

/**
 * Fetches and displays the list of portfolios from /api/portfolios.
 * Displays them in a grid with a cover image and name.
 */
function showPortfolioList() {
    // Reset any special styling when showing the portfolio list
    document.body.style.backgroundColor = "";
    document.body.style.color = "";

    fetch("/api/portfolios")
        .then((res) => res.json())
        .then((portfolios) => {
            const app = document.getElementById("app");

            // Clear container and add clickable title
            app.innerHTML = `<h1 class="site-title" style="cursor: pointer;">PICSORPIX</h1>`;

            // Add click event to title
            const title = app.querySelector(".site-title");
            title.addEventListener("click", () => showPortfolioList());

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
                    item.querySelector("h2").style.backgroundColor =
                        `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`;
                });

                // On click, load that portfolio's images
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
 * Fetches images for a single portfolio (folder) from /api/portfolios/:folderName
 * and displays them in a masonry layout with a fade-in effect.
 * @param {string} folderName - The name of the portfolio/folder to load.
 */
function showSinglePortfolio(folderName) {
    // Apply special styling for 'Urbex' portfolio
    if (folderName.toLowerCase() === "urbex") {
        document.body.style.backgroundColor = "black";
        document.body.style.color = "red";
    } else {
        // Reset styling for other portfolios
        document.body.style.backgroundColor = "";
        document.body.style.color = "";
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
            grid.style.opacity = "0";        // start hidden
            grid.style.transition = "opacity 0.5s ease-in-out";

            // Shuffle the images array before creating elements
            const shuffledImages = shuffleArray([...data.images]);

            // Store the current portfolio images for modal navigation
            window.currentPortfolioImages = shuffledImages;

            // Create images
            shuffledImages.forEach((imgSrc, index) => {
                const imgContainer = createImage(imgSrc, index);
                grid.appendChild(imgContainer);
            });

            app.appendChild(grid);

            // Create (or ensure) the modal, but don't show it yet
            createModal();

            // Wait for all images to load, then apply masonry layout with a delay
            const allImages = Array.from(grid.querySelectorAll("img"));
            waitForImagesToLoad(allImages).then(() => {
                // First apply the masonry layout
                layoutMasonry(grid, getColumnCount(), window.MASONRY_GAP);

                // Add delay before showing
                setTimeout(() => {
                    grid.style.opacity = "1"; // fade in the grid
                }, window.SHOW_IMAGES_DELAY);
            });

            // Re-layout on window resize (with simple debouncing)
            let resizeTimeout;
            window.addEventListener("resize", () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    layoutMasonry(grid, getColumnCount(), window.MASONRY_GAP);
                }, 200);
            });
        })
        .catch((err) => console.error(err));
}

/**
 * Creates an image container element with a click event to open the modal.
 * @param {string} imgSrc - The source URL of the image.
 * @param {number} index - The index of the image in the current portfolio.
 * @returns {HTMLElement} The container element wrapping the <img>.
 */
function createImage(imgSrc, index) {
    const imgContainer = document.createElement("div");
    imgContainer.className = "image-container";

    const img = document.createElement("img");
    img.src = imgSrc;

    // On click, open modal
    imgContainer.addEventListener("click", () => openModal(imgSrc, index));

    imgContainer.appendChild(img);
    return imgContainer;
}
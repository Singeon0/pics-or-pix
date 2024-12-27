/**
 * @file layout.js
 * @description Contains functions related to the masonry layout.
 */

/**
 * Determines how many columns should be used based on screen width.
 * Adjust breakpoints as needed to match your design.
 * @returns {number} The number of columns to use in the layout.
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
 * @param {HTMLElement} container - The .photo-grid container.
 * @param {number} colCount - The number of columns to layout.
 * @param {number} gap - The gap (in px) between items.
 */
function layoutMasonry(container, colCount, gap) {
    const containerWidth = container.clientWidth;
    // Calculate column width (subtracting total gap space)
    const columnWidth = (containerWidth - (colCount - 1) * gap) / colCount;

    // Track each column's current height
    const colHeights = new Array(colCount).fill(0);

    // Grab all items
    const items = Array.from(container.querySelectorAll(".image-container"));

    items.forEach((item) => {
        // Ensure absolute positioning & set item width
        item.style.position = "absolute";
        item.style.width = `${columnWidth}px`;

        // If the <img> is loaded, we can compute height
        const img = item.querySelector("img");
        const naturalWidth = img.naturalWidth || 1;  // avoid division by zero
        const naturalHeight = img.naturalHeight || 1;
        const aspectRatio = naturalHeight / naturalWidth;
        const itemHeight = Math.round(columnWidth * aspectRatio);

        // Find the shortest column so far
        let minIndex = 0;
        for (let i = 1; i < colHeights.length; i++) {
            if (colHeights[i] < colHeights[minIndex]) {
                minIndex = i;
            }
        }

        // Compute X/Y
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
/**
 * @file utils.js
 * @description Utility functions used throughout the app.
 */

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Extracts the dominant color from an image by averaging all its pixels.
 * @param {HTMLImageElement} img - The image element.
 * @returns {{r: number, g: number, b: number}} The average RGB color.
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
        b: Math.floor(b / count),
    };
}

/**
 * Utility: Waits for all images in the array to finish loading.
 * @param {HTMLImageElement[]} images - Array of image elements.
 * @returns {Promise<void>} A promise that resolves when all images have loaded (or erred).
 */
function waitForImagesToLoad(images) {
    return Promise.all(
        images.map((img) => {
            return new Promise((resolve) => {
                if (img.complete) {
                    resolve();
                } else {
                    img.addEventListener("load", resolve);
                    img.addEventListener("error", resolve);
                }
            });
        })
    );
}
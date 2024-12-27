/**
 * @file modal.js
 * @description Contains functions related to the modal display and navigation.
 */

/**
 * Creates the modal structure if it doesn't exist.
 * @returns {HTMLElement} The modal element.
 */
function createModal() {
    let modal = document.querySelector(".modal-overlay");
    if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal-overlay";
        modal.innerHTML = `
      <button class="modal-nav prev" aria-label="Previous image"></button>
      <div class="modal-content">
          <img src="" alt="Modal image">
      </div>
      <button class="modal-nav next" aria-label="Next image"></button>
    `;

        // Close modal when clicking on the overlay
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        const prevBtn = modal.querySelector(".prev");
        const nextBtn = modal.querySelector(".next");

        prevBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showPreviousImage();
        });

        nextBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showNextImage();
        });

        document.body.appendChild(modal);
    }
    return modal;
}

/**
 * Opens the modal with the specified image.
 * @param {string} imgSrc - Source of the image to show.
 * @param {number} index - Index of the image in the current portfolio.
 */
function openModal(imgSrc, index) {
    const modal = createModal();
    const modalContent = modal.querySelector(".modal-content");
    const modalImg = modalContent.querySelector("img");

    window.currentImageIndex = index;
    modalImg.src = imgSrc;

    // Trigger the opening animation
    requestAnimationFrame(() => {
        modal.classList.add("active");
        setTimeout(() => {
            modalContent.classList.add("active");
        }, 10);
    });
}

/**
 * Closes the modal.
 */
function closeModal() {
    const modal = document.querySelector(".modal-overlay");
    if (!modal) return;

    const modalContent = modal.querySelector(".modal-content");

    modalContent.classList.remove("active");
    setTimeout(() => {
        modal.classList.remove("active");
    }, window.MODAL_TRANSITION_DURATION);
}

/**
 * Shows the next image in the portfolio modal.
 */
function showNextImage() {
    window.currentImageIndex = (window.currentImageIndex + 1) % window.currentPortfolioImages.length;
    updateModalImage();
}

/**
 * Shows the previous image in the portfolio modal.
 */
function showPreviousImage() {
    window.currentImageIndex = (window.currentImageIndex - 1 + window.currentPortfolioImages.length)
        % window.currentPortfolioImages.length;
    updateModalImage();
}

/**
 * Updates the modal image while maintaining the modal state.
 */
function updateModalImage() {
    const modalContent = document.querySelector(".modal-content");
    const modalImg = modalContent.querySelector("img");

    modalContent.classList.remove("active");

    setTimeout(() => {
        modalImg.src = window.currentPortfolioImages[window.currentImageIndex];
        modalContent.classList.add("active");
    }, window.MODAL_TRANSITION_DURATION);
}
// js/login.js

(function() {
    'use strict';

    console.log("FlexStudent: Login Script Loaded");

    function initLogin() {
        // 1. Check if we are actually on the login page by looking for the wrapper
        const loginWrapper = document.querySelector('.m-login__wrapper');
        const body = document.body;

        if (!loginWrapper) return; // Exit if not login page

        // 2. Activate Modern CSS Mode
        body.classList.add('modern-login-active');

        // 3. THE SURGERY: Move the login form out of the messy grid
        // We append it directly to body so it ignores all previous flex/grid parents
        body.appendChild(loginWrapper);

        // 4. THE CLEANUP: Hide or Remove the original sidebar and containers
        // This targets the specific element you pasted in the chat
        const originalSidebar = document.querySelector('.m-login__content');
        if (originalSidebar) {
            originalSidebar.style.display = 'none';
            // Optional: originalSidebar.remove(); // If you want to delete it from DOM
        }

        // Hide the original container that held everything
        const originalGrid = document.querySelector('.m-grid.m-grid--hor.m-grid--root.m-page');
        if (originalGrid) {
            originalGrid.style.display = 'none';
        }

        // 5. Placeholder Enhancements (Optional)
        // Add placeholders since we hid the labels
        const userInput = document.querySelector('input[name="username"]');
        const passInput = document.querySelector('input[name="password"]');

        if (userInput) userInput.setAttribute('placeholder', 'Roll Number (e.g., 20K-1234)');
        if (passInput) passInput.setAttribute('placeholder', 'Password');
    }

    // Run as soon as DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLogin);
    } else {
        initLogin();
    }

})();
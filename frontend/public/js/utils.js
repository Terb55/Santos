/**
 * utils.js
 * 
 * Utility functions used throughout the application.
 * Includes DOM helpers, formatters, and animation utilities.
 */

const Utils = {
    /**
     * Shorthand for document.querySelector
     * @param {string} selector - CSS selector
     * @param {Element} context - Optional context element
     * @returns {Element|null}
     */
    $(selector, context = document) {
        return context.querySelector(selector);
    },

    /**
     * Shorthand for document.querySelectorAll as array
     * @param {string} selector - CSS selector
     * @param {Element} context - Optional context element
     * @returns {Element[]}
     */
    $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    },

    /**
     * Format number as currency
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code
     * @returns {string}
     */
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    /**
     * Wait for specified duration
     * @param {number} ms - Duration in milliseconds
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Check if user prefers reduced motion
     * @returns {boolean}
     */
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * Map value from one range to another
     * @param {number} value - Value to map
     * @param {number} inMin - Input range minimum
     * @param {number} inMax - Input range maximum
     * @param {number} outMin - Output range minimum
     * @param {number} outMax - Output range maximum
     * @returns {number}
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },

    /**
     * Throttle function calls
     * @param {Function} fn - Function to throttle
     * @param {number} delay - Delay in milliseconds
     * @returns {Function}
     */
    throttle(fn, delay = 100) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return fn.apply(this, args);
            }
        };
    },

    /**
     * Create element with attributes
     * @param {string} tag - Element tag name
     * @param {Object} attrs - Attributes to set
     * @returns {Element}
     */
    createElement(tag, attrs = {}) {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'class') {
                el.className = value;
            } else if (key === 'style') {
                el.style.cssText = value;
            } else {
                el.setAttribute(key, value);
            }
        });
        return el;
    }
};

// Make Utils available globally
window.Utils = Utils;
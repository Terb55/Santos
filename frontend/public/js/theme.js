/**
 * theme.js
 * 
 * Theme management: light/dark mode toggle with system preference detection.
 * Persists user preference to localStorage.
 */

const ThemeManager = {
    // Storage key for persisted preference
    STORAGE_KEY: 'buildrAI-theme',
    
    // Current theme state
    currentTheme: 'light',
    
    /**
     * Initialize theme manager
     * Detects saved preference or system preference
     */
    init() {
        // Check for saved preference
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        }
        
        // Apply initial theme (no transition on load)
        this.applyTheme(false);
        
        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only auto-switch if user hasn't set a preference
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(true);
            }
        });
        
        // Bind toggle button
        this.bindToggle();
    },
    
    /**
     * Apply current theme to document
     * @param {boolean} animate - Whether to animate the transition
     */
    applyTheme(animate = true) {
        const root = document.documentElement;
        
        if (!animate) {
            // Disable transitions temporarily
            root.style.setProperty('--theme-transition', 'none');
        }
        
        root.setAttribute('data-theme', this.currentTheme);
        
        if (!animate) {
            // Re-enable transitions after a frame
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    root.style.removeProperty('--theme-transition');
                });
            });
        }
        
        // Update meta theme-color for mobile browsers
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', this.currentTheme === 'dark' ? '#0f0f10' : '#fafafa');
        }
    },
    
    /**
     * Toggle between light and dark themes
     */
    toggle() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(true);
        
        // Save preference
        localStorage.setItem(this.STORAGE_KEY, this.currentTheme);
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themechange', { 
            detail: { theme: this.currentTheme } 
        }));
    },
    
    /**
     * Bind click event to theme toggle button
     */
    bindToggle() {
        const toggleBtn = document.querySelector('#themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    },
    
    /**
     * Get current theme
     * @returns {string} 'light' or 'dark'
     */
    getTheme() {
        return this.currentTheme;
    }
};

// Make ThemeManager available globally
window.ThemeManager = ThemeManager;

// Auto-initialize only if app.js is not present (for standalone pages)
document.addEventListener('DOMContentLoaded', () => {
    // Check if App will handle initialization
    setTimeout(() => {
        if (typeof App === 'undefined') {
            ThemeManager.init();
        }
    }, 0);
});
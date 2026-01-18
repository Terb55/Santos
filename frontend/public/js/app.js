/**
 * app.js
 * 
 * Main application entry point.
 * Initializes all modules and handles global state.
 */

const App = {
    /**
     * Initialize the application
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bootstrap());
        } else {
            this.bootstrap();
        }
    },

    /**
     * Bootstrap all modules
     */
    bootstrap() {
        // Initialize modules in order
        this.initModules();

        // Set up global event listeners
        this.bindGlobalEvents();

        // Mark app as ready
        document.body.classList.add('app-ready');
    },

    /**
     * Initialize all modules
     */
    initModules() {
        // Theme must be first to prevent flash
        if (typeof ThemeManager !== 'undefined' && !ThemeManager._initialized) {
            ThemeManager._initialized = true;
            ThemeManager.init();
        }

        // Initialize animations
        if (typeof Animations !== 'undefined' && !Animations._initialized) {
            Animations._initialized = true;
            Animations.init();
        }

        // Initialize navigation
        if (typeof Navigation !== 'undefined' && !Navigation._initialized) {
            Navigation._initialized = true;
            Navigation.init();
        }

        // Initialize interactive components
        if (typeof Components !== 'undefined' && !Components._initialized) {
            Components._initialized = true;
            Components.init();
        }
    },

    /**
     * Bind global event listeners
     */
    bindGlobalEvents() {
        // Handle visibility change (pause animations when hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.body.classList.add('page-hidden');
            } else {
                document.body.classList.remove('page-hidden');
            }
        });

        // Handle resize events with throttle
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) return;
            window.dispatchEvent(new CustomEvent('appresize'));
            resizeTimeout = true;
            setTimeout(() => {
                resizeTimeout = false;
            }, 200);
        });

        // Handle section changes
        window.addEventListener('sectionchange', (e) => {
            this.onSectionChange(e.detail);
        });
    },

    /**
     * Handle section change events
     */
    onSectionChange(detail) {
        const { section } = detail;

        // Update page title based on section
        const titles = {
            sectionLanding: 'Buildr AI | Intelligent PC Recommendations',
            sectionUseCase: 'Choose Your Use Case | Buildr AI',
            sectionBudget: 'Set Your Budget | Buildr AI',
            sectionPriorities: 'Set Priorities | Buildr AI',
            sectionAnalyzing: 'Analyzing... | Buildr AI',
            sectionResults: 'Your Build | Buildr AI'
        };

        document.title = titles[section] || titles.sectionLanding;
    }
};

// Start the application
App.init();

// Make App available globally
window.App = App;

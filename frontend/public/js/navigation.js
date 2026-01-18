/**
 * navigation.js
 * 
 * Section navigation and wizard flow management.
 * Handles transitions between steps with proper animation sequencing.
 */

const Navigation = {
    // Current active section
    currentSection: 'sectionLanding',
    
    // Section order for wizard flow
    sectionOrder: [
        'sectionLanding',
        'sectionUseCase',
        'sectionBudget',
        'sectionPriorities',
        'sectionAnalyzing',
        'sectionResults'
    ],
    
    // Transition lock to prevent rapid navigation
    isTransitioning: false,
    
    /**
     * Initialize navigation
     */
    init() {
        // Detect initial active section from DOM
        const activeSection = document.querySelector('.section.active');
        if (activeSection && activeSection.id) {
            this.currentSection = activeSection.id;
        }
        
        this.bindNavigation();
        this.bindKeyboardNav();
    },
    
    /**
     * Bind click events to navigation buttons
     */
    bindNavigation() {
        // Start building button
        Utils.$('#btnStart')?.addEventListener('click', () => {
            this.goTo('sectionUseCase');
        });
        
        // Back to landing (if section exists, otherwise do nothing since it's a link)
        Utils.$('#btnBackToLanding')?.addEventListener('click', (e) => {
            // If sectionLanding doesn't exist, let the link handle navigation
            if (Utils.$('#sectionLanding')) {
                e.preventDefault();
                this.goTo('sectionLanding');
            }
        });
        
        // Step 1 -> Step 2
        Utils.$('#btnToStep2')?.addEventListener('click', () => {
            this.goTo('sectionBudget');
        });
        
        // Back to Step 1
        Utils.$('#btnBackToStep1')?.addEventListener('click', () => {
            this.goTo('sectionUseCase');
        });
        
        // Step 2 -> Step 3
        Utils.$('#btnToStep3')?.addEventListener('click', () => {
            this.goTo('sectionPriorities');
        });
        
        // Back to Step 2
        Utils.$('#btnBackToStep2')?.addEventListener('click', () => {
            this.goTo('sectionBudget');
        });
        
        // Analyze -> Results
        Utils.$('#btnAnalyze')?.addEventListener('click', async () => {
            await this.runAnalysis();
        });
        
        // Start over
        Utils.$('#btnStartOver')?.addEventListener('click', () => {
            this.startOver();
        });
        
        // Modify build (go back to step 1)
        Utils.$('#btnModify')?.addEventListener('click', () => {
            this.goTo('sectionUseCase');
        });
    },
    
    /**
     * Bind keyboard navigation
     */
    bindKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            // Escape to go back
            if (e.key === 'Escape' && this.currentSection !== 'sectionLanding') {
                const currentIndex = this.sectionOrder.indexOf(this.currentSection);
                if (currentIndex > 0 && currentIndex < this.sectionOrder.indexOf('sectionAnalyzing')) {
                    this.goTo(this.sectionOrder[currentIndex - 1]);
                }
            }
        });
    },
    
    /**
     * Navigate to a specific section
     * @param {string} sectionId - ID of target section
     * @param {boolean} skipAnimation - Skip transition animation
     */
    async goTo(sectionId, skipAnimation = false) {
        if (this.isTransitioning || this.currentSection === sectionId) return;
        
        const currentEl = Utils.$(`#${this.currentSection}`);
        const targetEl = Utils.$(`#${sectionId}`);
        
        if (!targetEl) {
            console.error(`Section not found: ${sectionId}`);
            return;
        }
        
        this.isTransitioning = true;
        
        // Determine direction for animation
        const currentIndex = this.sectionOrder.indexOf(this.currentSection);
        const targetIndex = this.sectionOrder.indexOf(sectionId);
        const isForward = targetIndex > currentIndex;
        
        // Transition out current section
        if (currentEl && !skipAnimation) {
            currentEl.classList.add(isForward ? 'slide-out-left' : 'slide-in-right');
            await Utils.sleep(300);
        }
        
        // Remove active from current
        currentEl?.classList.remove('active', 'slide-out-left', 'slide-in-right');
        
        // Prepare target section
        if (!skipAnimation) {
            targetEl.classList.add(isForward ? 'slide-in-right' : 'slide-out-left');
        }
        
        // Activate target
        targetEl.classList.add('active');
        
        if (!skipAnimation) {
            // Allow a frame for the class to apply
            await Utils.sleep(50);
            targetEl.classList.remove('slide-in-right', 'slide-out-left');
        }
        
        // Update current section
        this.currentSection = sectionId;
        
        // Dispatch navigation event
        window.dispatchEvent(new CustomEvent('sectionchange', {
            detail: { section: sectionId, direction: isForward ? 'forward' : 'back' }
        }));
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Release transition lock
        setTimeout(() => {
            this.isTransitioning = false;
        }, 400);
    },
    
    /**
     * Run analysis and navigate to results
     */
    async runAnalysis() {
        if (this.isTransitioning) return;
        
        // Navigate to analyzing section
        await this.goTo('sectionAnalyzing');
        
        // Reset and run analyzing animation
        Animations.resetAnalyzingSteps();
        await Animations.runAnalyzing();
        
        // Generate and display results
        if (typeof BuildEngine !== 'undefined') {
            await BuildEngine.generateBuild();
        }
        
        // Navigate to results
        await this.goTo('sectionResults');
        
        // Trigger result animations
        if (typeof Components !== 'undefined') {
            Components.animateResults();
        }
    },
    
    /**
     * Reset and start over
     */
    startOver() {
        // Reset all selections
        if (typeof Components !== 'undefined') {
            Components.resetSelections();
        }
        
        // Cancel any running animations
        Animations.cancelAnalyzing();
        
        // Navigate to first step (or landing if it exists)
        const firstSection = Utils.$('#sectionLanding') ? 'sectionLanding' : 'sectionUseCase';
        this.goTo(firstSection);
    },
    
    /**
     * Get current section ID
     * @returns {string}
     */
    getCurrentSection() {
        return this.currentSection;
    },
    
    /**
     * Check if on a specific section
     * @param {string} sectionId
     * @returns {boolean}
     */
    isOn(sectionId) {
        return this.currentSection === sectionId;
    }
};

// Make Navigation available globally
window.Navigation = Navigation;

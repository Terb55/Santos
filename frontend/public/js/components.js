/**
 * components.js
 * 
 * Interactive component handlers: option cards, budget slider, priority list.
 * Manages user selections and input state.
 */

const Components = {
    // Store user selections
    selections: {
        useCase: null,
        budget: 1500,
        priorities: ['performance', 'silence', 'aesthetics', 'upgradability', 'efficiency'],
        weights: {
            performance: 'high',
            silence: 'medium',
            aesthetics: 'low',
            upgradability: 'medium',
            efficiency: 'low'
        }
    },
    
    /**
     * Initialize all interactive components
     */
    init() {
        this.initOptionCards();
        this.initBudgetSlider();
        this.initPriorityList();
        this.initWeightButtons();
    },
    
    /**
     * Initialize use case option cards
     */
    initOptionCards() {
        const cards = Utils.$$('#useCaseOptions .option-card');
        const continueBtn = Utils.$('#btnToStep2');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove selection from all cards
                cards.forEach(c => c.classList.remove('selected'));
                
                // Select this card
                card.classList.add('selected');
                Animations.pulseSelection(card);
                
                // Store selection
                this.selections.useCase = card.dataset.value;
                
                // Enable continue button
                if (continueBtn) {
                    continueBtn.disabled = false;
                }
                
                // Update ambient background based on selection
                this.updateAmbientForUseCase(card.dataset.value);
            });
            
            // Keyboard support
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });
    },
    
    /**
     * Update ambient background orbs based on use case
     * Subtle visual feedback for selection
     */
    updateAmbientForUseCase(useCase) {
        const bg = Utils.$('#ambientBg');
        if (!bg) return;
        
        // Different color vibes for different use cases
        const colorMap = {
            gaming: 'var(--accent-violet)',
            creative: 'var(--accent-cyan)',
            development: 'var(--accent-emerald)',
            streaming: 'var(--accent-rose)',
            workstation: 'var(--primary-500)',
            general: 'var(--gray-400)'
        };
        
        const orb3 = Utils.$('.orb-3', bg);
        if (orb3) {
            orb3.style.background = `radial-gradient(circle, ${colorMap[useCase] || colorMap.general}, transparent 70%)`;
        }
    },
    
    /**
     * Initialize budget slider
     */
    initBudgetSlider() {
        const slider = Utils.$('#budgetSlider');
        const fill = Utils.$('#budgetFill');
        const amount = Utils.$('#budgetAmount');
        const tier = Utils.$('#budgetTier');
        const tierBtns = Utils.$$('.tier-btn');
        
        if (!slider) return;
        
        const updateBudget = (value) => {
            this.selections.budget = parseInt(value);
            
            // Update fill width
            const percent = ((value - 500) / (5000 - 500)) * 100;
            if (fill) fill.style.width = `${percent}%`;
            
            // Update display
            if (amount) amount.textContent = Utils.formatCurrency(value);
            
            // Update tier label
            if (tier) tier.textContent = this.getBudgetTier(value);
            
            // Update tier button states
            tierBtns.forEach(btn => {
                const btnBudget = parseInt(btn.dataset.budget);
                const isClose = Math.abs(btnBudget - value) < 200;
                btn.classList.toggle('active', isClose);
            });
        };
        
        // Slider input event
        slider.addEventListener('input', (e) => {
            updateBudget(e.target.value);
        });
        
        // Tier button clicks
        tierBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const budget = parseInt(btn.dataset.budget);
                slider.value = budget;
                updateBudget(budget);
                
                // Smooth animation feedback
                Animations.pulseSelection(btn);
            });
        });
        
        // Initialize with default value
        updateBudget(slider.value);
    },
    
    /**
     * Get budget tier name
     */
    getBudgetTier(budget) {
        if (budget < 700) return 'Budget Build';
        if (budget < 1200) return 'Entry Build';
        if (budget < 2000) return 'Performance Build';
        if (budget < 3000) return 'Enthusiast Build';
        if (budget < 4000) return 'High-End Build';
        return 'Ultimate Build';
    },
    
    /**
     * Initialize draggable priority list
     */
    initPriorityList() {
        const list = Utils.$('#priorityList');
        if (!list) return;
        
        let draggedItem = null;
        let draggedIndex = -1;
        
        const items = Utils.$$('.priority-item', list);
        
        items.forEach((item, index) => {
            // Drag start
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                draggedIndex = index;
                item.classList.add('dragging');
                
                // Required for Firefox
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', '');
            });
            
            // Drag end
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                Utils.$$('.priority-item', list).forEach(i => i.classList.remove('drag-over'));
                this.updatePriorityOrder();
            });
            
            // Drag over
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                if (item !== draggedItem) {
                    item.classList.add('drag-over');
                }
            });
            
            // Drag leave
            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });
            
            // Drop
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                
                if (draggedItem && item !== draggedItem) {
                    const allItems = Utils.$$('.priority-item', list);
                    const dropIndex = allItems.indexOf(item);
                    
                    if (dropIndex > draggedIndex) {
                        item.after(draggedItem);
                    } else {
                        item.before(draggedItem);
                    }
                    
                    this.updatePriorityOrder();
                }
            });
            
            // Touch support for mobile
            this.initTouchDrag(item, list);
        });
    },
    
    /**
     * Touch drag support for mobile devices
     */
    initTouchDrag(item, list) {
        let startY = 0;
        let currentY = 0;
        
        item.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            item.classList.add('dragging');
        }, { passive: true });
        
        item.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            item.style.transform = `translateY(${diff}px)`;
        }, { passive: true });
        
        item.addEventListener('touchend', () => {
            item.classList.remove('dragging');
            item.style.transform = '';
            this.updatePriorityOrder();
        });
    },
    
    /**
     * Update priority order after drag
     */
    updatePriorityOrder() {
        const items = Utils.$$('.priority-item', Utils.$('#priorityList'));
        
        this.selections.priorities = items.map(item => item.dataset.priority);
        
        // Update rank numbers
        items.forEach((item, index) => {
            const rankEl = Utils.$('.priority-rank', item);
            if (rankEl) rankEl.textContent = index + 1;
        });
    },
    
    /**
     * Initialize weight toggle buttons
     */
    initWeightButtons() {
        Utils.$$('.priority-item').forEach(item => {
            const buttons = Utils.$$('.weight-btn', item);
            const priority = item.dataset.priority;
            
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Update active state
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Store weight
                    this.selections.weights[priority] = btn.dataset.weight;
                });
            });
        });
    },
    
    /**
     * Get current selections
     */
    getSelections() {
        return { ...this.selections };
    },
    
    /**
     * Reset all selections to defaults
     */
    resetSelections() {
        // Reset use case
        this.selections.useCase = null;
        Utils.$$('#useCaseOptions .option-card').forEach(c => c.classList.remove('selected'));
        const continueBtn = Utils.$('#btnToStep2');
        if (continueBtn) continueBtn.disabled = true;
        
        // Reset budget
        this.selections.budget = 1500;
        const slider = Utils.$('#budgetSlider');
        if (slider) {
            slider.value = 1500;
            slider.dispatchEvent(new Event('input'));
        }
        
        // Reset priorities (would need to reorder DOM)
        this.selections.priorities = ['performance', 'silence', 'aesthetics', 'upgradability', 'efficiency'];
        
        // Reset weights
        this.selections.weights = {
            performance: 'high',
            silence: 'medium',
            aesthetics: 'low',
            upgradability: 'medium',
            efficiency: 'low'
        };
    },
    
    /**
     * Animate results section content
     */
    animateResults() {
        const specsContainer = Utils.$('#buildSpecs');
        const insightsContainer = Utils.$('#insightsList');
        const metricsContainer = Utils.$('#metricBars');
        
        // Animate component stack
        Animations.animateComponentStack();
        
        // Animate specs with stagger
        if (specsContainer) {
            Animations.animateSpecs(specsContainer);
        }
        
        // Animate insights
        if (insightsContainer) {
            Animations.animateInsights(insightsContainer);
        }
        
        // Animate metrics
        if (metricsContainer) {
            Animations.animateMetrics(metricsContainer);
        }
    }
};

// Make Components available globally
window.Components = Components;
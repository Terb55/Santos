/**
 * animations.js
 * 
 * Animation controllers for complex, multi-step animations.
 * Handles the "thinking" state, component assembly, and result reveals.
 */

const Animations = {
    // Track animation states
    isAnalyzing: false,
    
    /**
     * Initialize animation observers and listeners
     */
    init() {
        this.initNeuralNetwork();
        this.initAmbientBackground();
    },
    
    /**
     * Create SVG neural network for analyzing state
     * Nodes and connections that pulse to show "thinking"
     */
    initNeuralNetwork() {
        const svg = Utils.$('.neural-svg');
        if (!svg) return;
        
        // Define node positions in a network pattern
        const nodes = [
            // Input layer
            { x: 50, y: 75 }, { x: 50, y: 150 }, { x: 50, y: 225 },
            // Hidden layer 1
            { x: 150, y: 50 }, { x: 150, y: 112 }, { x: 150, y: 175 }, { x: 150, y: 237 },
            // Hidden layer 2
            { x: 250, y: 75 }, { x: 250, y: 150 }, { x: 250, y: 225 },
            // Output layer
            { x: 350, y: 112 }, { x: 350, y: 187 }
        ];
        
        // Define connections (from, to)
        const connections = [
            [0, 3], [0, 4], [1, 3], [1, 4], [1, 5], [2, 5], [2, 6],
            [3, 7], [4, 7], [4, 8], [5, 8], [5, 9], [6, 9],
            [7, 10], [8, 10], [8, 11], [9, 11]
        ];
        
        // Create SVG content
        let svgContent = '';
        
        // Draw connections first (behind nodes)
        connections.forEach(([from, to], i) => {
            const fromNode = nodes[from];
            const toNode = nodes[to];
            svgContent += `
                <line 
                    class="neural-connection" 
                    x1="${fromNode.x}" y1="${fromNode.y}" 
                    x2="${toNode.x}" y2="${toNode.y}"
                    stroke-dasharray="5,5"
                    style="animation-delay: ${i * 0.1}s"
                />
            `;
        });
        
        // Draw nodes
        nodes.forEach((node, i) => {
            svgContent += `
                <circle 
                    class="neural-node" 
                    cx="${node.x}" cy="${node.y}" r="5"
                    style="animation-delay: ${i * 0.08}s"
                />
            `;
        });
        
        svg.innerHTML = svgContent;
    },
    
    /**
     * Initialize ambient background response to interaction
     */
    initAmbientBackground() {
        const bg = Utils.$('#ambientBg');
        if (!bg) return;
        
        // Subtle mouse movement response
        document.addEventListener('mousemove', Utils.throttle((e) => {
            if (Utils.prefersReducedMotion()) return;
            
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            
            const orb1 = Utils.$('.orb-1', bg);
            const orb2 = Utils.$('.orb-2', bg);
            
            if (orb1) orb1.style.transform = `translate(${x}px, ${y}px)`;
            if (orb2) orb2.style.transform = `translate(${-x}px, ${-y}px)`;
        }, 50));
    },
    
    /**
     * Run the analyzing animation sequence
     * @returns {Promise} Resolves when animation is complete
     */
    async runAnalyzing() {
        this.isAnalyzing = true;
        
        const bg = Utils.$('#ambientBg');
        const steps = Utils.$$('.analyze-step');
        
        // Add analyzing class to background
        bg?.classList.add('analyzing');
        
        // Animate through each step
        for (let i = 0; i < steps.length; i++) {
            if (!this.isAnalyzing) break;
            
            const step = steps[i];
            
            // Mark step as active
            step.classList.add('active');
            
            // Simulate processing time (varying durations feel more natural)
            const duration = 800 + Math.random() * 600;
            await Utils.sleep(duration);
            
            // Mark step as complete
            step.classList.remove('active');
            step.classList.add('complete');
        }
        
        // Final pause before showing results
        await Utils.sleep(400);
        
        bg?.classList.remove('analyzing');
        this.isAnalyzing = false;
        
        return true;
    },
    
    /**
     * Cancel analyzing animation
     */
    cancelAnalyzing() {
        this.isAnalyzing = false;
        const bg = Utils.$('#ambientBg');
        bg?.classList.remove('analyzing');
        
        Utils.$$('.analyze-step').forEach(step => {
            step.classList.remove('active', 'complete');
        });
    },
    
    /**
     * Reset analyzing steps for re-run
     */
    resetAnalyzingSteps() {
        Utils.$$('.analyze-step').forEach(step => {
            step.classList.remove('active', 'complete');
        });
    },
    
    /**
     * Animate component stack in results
     * @param {Array} components - Component data to visualize
     */
    animateComponentStack(components) {
        const stack = Utils.$('#componentStack');
        if (!stack) return;
        
        stack.innerHTML = '';
        
        // Create visual component bars
        const heights = [80, 60, 40, 50, 30, 70, 45, 55];
        
        heights.forEach((height, i) => {
            const bar = Utils.createElement('div', {
                class: 'stack-component',
                'style': `height: ${height}px; transition-delay: ${i * 100}ms`
            });
            stack.appendChild(bar);
            
            // Trigger animation after append
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    bar.classList.add('visible');
                });
            });
        });
    },
    
    /**
     * Animate specs list reveal
     * @param {HTMLElement} container - Specs container
     */
    animateSpecs(container) {
        const items = Utils.$$('.spec-item', container);
        
        items.forEach((item, i) => {
            setTimeout(() => {
                item.classList.add('visible');
            }, 100 + i * 80);
        });
    },
    
    /**
     * Animate insights reveal
     * @param {HTMLElement} container - Insights container
     */
    animateInsights(container) {
        const items = Utils.$$('.insight-item', container);
        
        items.forEach((item, i) => {
            setTimeout(() => {
                item.classList.add('visible');
            }, 300 + i * 100);
        });
    },
    
    /**
     * Animate metric bars fill
     * @param {HTMLElement} container - Metrics container
     * @param {Object} metrics - Metric values
     */
    animateMetrics(container, metrics) {
        const items = Utils.$$('.metric-item', container);
        
        items.forEach((item, i) => {
            setTimeout(() => {
                item.classList.add('visible');
                
                const fill = Utils.$('.metric-fill', item);
                if (fill) {
                    const targetWidth = fill.dataset.value || '0';
                    setTimeout(() => {
                        fill.style.width = `${targetWidth}%`;
                    }, 100);
                }
            }, 500 + i * 100);
        });
    },
    
    /**
     * Selection feedback animation
     * @param {HTMLElement} element - Selected element
     */
    pulseSelection(element) {
        element.style.transform = 'scale(0.98)';
        setTimeout(() => {
            element.style.transform = '';
        }, 150);
    }
};

// Make Animations available globally
window.Animations = Animations;
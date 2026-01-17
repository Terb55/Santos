/**
 * build-data.js
 * 
 * Mock data and build generation logic.
 * Simulates AI recommendations based on user selections.
 */

const BuildData = {
    // Component database (mock data)
    components: {
        cpu: [
            { id: 'cpu-1', name: 'AMD Ryzen 5 7600X', price: 249, tier: 'entry', score: { gaming: 85, productivity: 75 } },
            { id: 'cpu-2', name: 'Intel Core i5-14600K', price: 319, tier: 'performance', score: { gaming: 90, productivity: 85 } },
            { id: 'cpu-3', name: 'AMD Ryzen 7 7800X3D', price: 449, tier: 'enthusiast', score: { gaming: 98, productivity: 82 } },
            { id: 'cpu-4', name: 'Intel Core i9-14900K', price: 589, tier: 'ultimate', score: { gaming: 95, productivity: 98 } }
        ],
        gpu: [
            { id: 'gpu-1', name: 'AMD Radeon RX 7600', price: 269, tier: 'entry', score: { gaming: 70, productivity: 60 } },
            { id: 'gpu-2', name: 'NVIDIA RTX 4070', price: 549, tier: 'performance', score: { gaming: 85, productivity: 80 } },
            { id: 'gpu-3', name: 'NVIDIA RTX 4070 Ti Super', price: 799, tier: 'enthusiast', score: { gaming: 92, productivity: 88 } },
            { id: 'gpu-4', name: 'NVIDIA RTX 4090', price: 1599, tier: 'ultimate', score: { gaming: 100, productivity: 98 } }
        ],
        ram: [
            { id: 'ram-1', name: '16GB DDR5-5200', price: 59, tier: 'entry', score: { gaming: 75, productivity: 65 } },
            { id: 'ram-2', name: '32GB DDR5-6000', price: 119, tier: 'performance', score: { gaming: 85, productivity: 85 } },
            { id: 'ram-3', name: '32GB DDR5-6400', price: 159, tier: 'enthusiast', score: { gaming: 90, productivity: 90 } },
            { id: 'ram-4', name: '64GB DDR5-6000', price: 229, tier: 'ultimate', score: { gaming: 85, productivity: 98 } }
        ],
        storage: [
            { id: 'storage-1', name: '1TB NVMe SSD', price: 79, tier: 'entry', score: { gaming: 80, productivity: 75 } },
            { id: 'storage-2', name: '2TB NVMe SSD', price: 149, tier: 'performance', score: { gaming: 85, productivity: 85 } },
            { id: 'storage-3', name: '2TB Gen4 NVMe SSD', price: 189, tier: 'enthusiast', score: { gaming: 90, productivity: 92 } },
            { id: 'storage-4', name: '4TB Gen4 NVMe SSD', price: 349, tier: 'ultimate', score: { gaming: 92, productivity: 98 } }
        ],
        motherboard: [
            { id: 'mb-1', name: 'B650 Gaming WiFi', price: 179, tier: 'entry', score: { gaming: 80, productivity: 75 } },
            { id: 'mb-2', name: 'Z790 Gaming Plus', price: 249, tier: 'performance', score: { gaming: 85, productivity: 85 } },
            { id: 'mb-3', name: 'X670E Aorus Master', price: 399, tier: 'enthusiast', score: { gaming: 90, productivity: 92 } },
            { id: 'mb-4', name: 'ROG Maximus Z790 Hero', price: 599, tier: 'ultimate', score: { gaming: 95, productivity: 95 } }
        ],
        cooling: [
            { id: 'cool-1', name: 'DeepCool AK400', price: 35, tier: 'entry', score: { gaming: 70, productivity: 70 } },
            { id: 'cool-2', name: 'Noctua NH-D15', price: 99, tier: 'performance', score: { gaming: 90, productivity: 90 } },
            { id: 'cool-3', name: 'Arctic Liquid Freezer II 280', price: 129, tier: 'enthusiast', score: { gaming: 92, productivity: 92 } },
            { id: 'cool-4', name: 'NZXT Kraken Z73', price: 279, tier: 'ultimate', score: { gaming: 95, productivity: 95 } }
        ],
        psu: [
            { id: 'psu-1', name: '650W 80+ Bronze', price: 69, tier: 'entry', score: { gaming: 75, productivity: 75 } },
            { id: 'psu-2', name: '750W 80+ Gold', price: 99, tier: 'performance', score: { gaming: 85, productivity: 85 } },
            { id: 'psu-3', name: '850W 80+ Gold', price: 139, tier: 'enthusiast', score: { gaming: 90, productivity: 90 } },
            { id: 'psu-4', name: '1000W 80+ Platinum', price: 199, tier: 'ultimate', score: { gaming: 95, productivity: 95 } }
        ],
        case: [
            { id: 'case-1', name: 'NZXT H5 Flow', price: 94, tier: 'entry', score: { gaming: 80, productivity: 80 } },
            { id: 'case-2', name: 'Fractal Design Meshify 2', price: 149, tier: 'performance', score: { gaming: 88, productivity: 88 } },
            { id: 'case-3', name: 'Lian Li O11 Dynamic', price: 169, tier: 'enthusiast', score: { gaming: 92, productivity: 90 } },
            { id: 'case-4', name: 'Phanteks Enthoo 719', price: 219, tier: 'ultimate', score: { gaming: 95, productivity: 95 } }
        ]
    },

    // Use case weights for component selection
    useCaseWeights: {
        gaming: { gpu: 1.5, cpu: 1.2, ram: 1.0, storage: 0.8 },
        creative: { gpu: 1.3, cpu: 1.4, ram: 1.3, storage: 1.2 },
        development: { cpu: 1.4, ram: 1.4, storage: 1.2, gpu: 0.8 },
        streaming: { cpu: 1.5, gpu: 1.3, ram: 1.2, storage: 1.0 },
        workstation: { cpu: 1.5, ram: 1.5, storage: 1.3, gpu: 1.2 },
        general: { cpu: 1.0, ram: 1.0, storage: 1.0, gpu: 0.8 }
    },

    // Insight templates
    insights: {
        gaming: [
            "GPU-heavy allocation maximizes frame rates in demanding titles",
            "DDR5 memory provides faster texture loading times",
            "NVMe storage eliminates loading screen bottlenecks"
        ],
        creative: [
            "High core count CPU accelerates render times significantly",
            "Ample RAM enables larger project files without slowdown",
            "Fast storage improves timeline scrubbing responsiveness"
        ],
        development: [
            "Multi-threaded CPU speeds up compilation times",
            "Extra RAM headroom for VMs and containers",
            "Fast SSD reduces IDE indexing time"
        ],
        streaming: [
            "Powerful CPU handles encoding without frame drops",
            "GPU NVENC provides hardware-accelerated streaming",
            "Fast storage allows simultaneous recording and streaming"
        ],
        workstation: [
            "ECC-compatible platform ensures data integrity",
            "High RAM capacity for complex simulations",
            "Professional GPU drivers for certified applications"
        ],
        general: [
            "Balanced build handles everyday tasks with ease",
            "Quiet cooling prioritized for comfortable use",
            "Room for future upgrades as needs evolve"
        ]
    },

    /**
     * Generate a build based on selections
     */
    generateBuild(selections) {
        const { useCase, budget, priorities, weights } = selections;
        const tier = this.getBudgetTier(budget);
        
        // Select components based on budget tier and use case
        const build = {
            cpu: this.selectComponent('cpu', tier, useCase),
            gpu: this.selectComponent('gpu', tier, useCase),
            ram: this.selectComponent('ram', tier, useCase),
            storage: this.selectComponent('storage', tier, useCase),
            motherboard: this.selectComponent('motherboard', tier, useCase),
            cooling: this.selectComponent('cooling', tier, useCase),
            psu: this.selectComponent('psu', tier, useCase),
            case: this.selectComponent('case', tier, useCase)
        };

        // Calculate total
        const total = Object.values(build).reduce((sum, comp) => sum + comp.price, 0);

        // Generate performance scores
        const scores = this.calculateScores(build, useCase);

        // Get relevant insights
        const buildInsights = this.insights[useCase] || this.insights.general;

        return {
            components: build,
            total,
            scores,
            insights: buildInsights,
            title: this.generateTitle(useCase, tier),
            summary: this.generateSummary(useCase, tier, total)
        };
    },

    /**
     * Select appropriate component based on tier and use case
     */
    selectComponent(type, tier, useCase) {
        const components = this.components[type];
        const tierMap = { entry: 0, performance: 1, enthusiast: 2, ultimate: 3 };
        const tierIndex = tierMap[tier] || 1;
        
        return components[tierIndex] || components[1];
    },

    /**
     * Get budget tier from amount
     */
    getBudgetTier(budget) {
        if (budget < 1000) return 'entry';
        if (budget < 2000) return 'performance';
        if (budget < 3500) return 'enthusiast';
        return 'ultimate';
    },

    /**
     * Calculate performance scores
     */
    calculateScores(build, useCase) {
        let gamingScore = 0;
        let productivityScore = 0;
        let count = 0;

        Object.values(build).forEach(component => {
            if (component.score) {
                gamingScore += component.score.gaming;
                productivityScore += component.score.productivity;
                count++;
            }
        });

        return {
            gaming: Math.round(gamingScore / count),
            productivity: Math.round(productivityScore / count),
            value: Math.round((gamingScore + productivityScore) / (count * 2) + 10)
        };
    },

    /**
     * Generate build title
     */
    generateTitle(useCase, tier) {
        const titles = {
            gaming: {
                entry: 'Budget Gaming Rig',
                performance: 'Gaming Powerhouse',
                enthusiast: 'Elite Gaming Station',
                ultimate: 'Ultimate Gaming Beast'
            },
            creative: {
                entry: 'Creative Starter',
                performance: 'Creative Workstation',
                enthusiast: 'Professional Creator',
                ultimate: 'Studio Powerhouse'
            },
            development: {
                entry: 'Dev Starter Kit',
                performance: 'Developer Workstation',
                enthusiast: 'Code Beast',
                ultimate: 'Enterprise Dev Machine'
            },
            streaming: {
                entry: 'Stream Starter',
                performance: 'Stream Machine',
                enthusiast: 'Pro Streamer Setup',
                ultimate: 'Broadcast Station'
            },
            workstation: {
                entry: 'Workstation Lite',
                performance: 'Professional Workstation',
                enthusiast: 'Power Workstation',
                ultimate: 'Enterprise Workstation'
            },
            general: {
                entry: 'Everyday Essentials',
                performance: 'Versatile Performer',
                enthusiast: 'All-Rounder Pro',
                ultimate: 'Do-It-All Machine'
            }
        };

        return titles[useCase]?.[tier] || 'Custom Build';
    },

    /**
     * Generate build summary
     */
    generateSummary(useCase, tier, total) {
        const summaries = {
            gaming: `Optimized for high-FPS gaming with excellent price-to-performance ratio at $${total.toLocaleString()}.`,
            creative: `Built for demanding creative workflows with powerful rendering capabilities at $${total.toLocaleString()}.`,
            development: `Configured for fast compile times and smooth multitasking at $${total.toLocaleString()}.`,
            streaming: `Ready for live broadcasting with hardware encoding support at $${total.toLocaleString()}.`,
            workstation: `Professional-grade reliability for mission-critical work at $${total.toLocaleString()}.`,
            general: `A well-balanced system for everyday computing needs at $${total.toLocaleString()}.`
        };

        return summaries[useCase] || summaries.general;
    }
};

// Build Engine - Connects UI with data
const BuildEngine = {
    currentBuild: null,

    generateBuild() {
        const selections = Components.getSelections();
        this.currentBuild = BuildData.generateBuild(selections);
        this.renderBuild();
    },

    renderBuild() {
        if (!this.currentBuild) return;

        const { components, total, scores, insights, title, summary } = this.currentBuild;

        // Update header
        const titleEl = Utils.$('#resultsTitle');
        const summaryEl = Utils.$('#resultsSummary');
        const priceEl = Utils.$('#totalPrice');

        if (titleEl) titleEl.textContent = title;
        if (summaryEl) summaryEl.textContent = summary;
        if (priceEl) priceEl.textContent = Utils.formatCurrency(total);

        // Render specs
        this.renderSpecs(components);

        // Render insights
        this.renderInsights(insights);

        // Render metrics
        this.renderMetrics(scores);
    },

    renderSpecs(components) {
        const container = Utils.$('#buildSpecs');
        if (!container) return;

        const componentIcons = {
            cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>',
            gpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="6" cy="12" r="2"/><path d="M14 10h4M14 14h4"/></svg>',
            ram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="8" width="20" height="8" rx="1"/><path d="M6 8v-2M10 8v-2M14 8v-2M18 8v-2"/></svg>',
            storage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>',
            motherboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="7" y="7" width="4" height="4"/><rect x="13" y="13" width="4" height="4"/><path d="M7 15h2M15 7h2"/></svg>',
            cooling: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>',
            psu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h2v4H7zM11 10h2v4h-2z"/><circle cx="17" cy="12" r="1"/></svg>',
            case: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="7" r="2"/><path d="M8 14h8M8 17h8"/></svg>'
        };

        const categoryNames = {
            cpu: 'Processor',
            gpu: 'Graphics Card',
            ram: 'Memory',
            storage: 'Storage',
            motherboard: 'Motherboard',
            cooling: 'Cooling',
            psu: 'Power Supply',
            case: 'Case'
        };

        container.innerHTML = Object.entries(components).map(([key, component]) => `
            <div class="spec-item">
                <div class="spec-icon">${componentIcons[key]}</div>
                <div class="spec-details">
                    <span class="spec-category">${categoryNames[key]}</span>
                    <span class="spec-name">${component.name}</span>
                </div>
                <span class="spec-price">${Utils.formatCurrency(component.price)}</span>
            </div>
        `).join('');
    },

    renderInsights(insights) {
        const container = Utils.$('#insightsList');
        if (!container) return;

        container.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <div class="insight-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <p class="insight-text">${insight}</p>
            </div>
        `).join('');
    },

    renderMetrics(scores) {
        const container = Utils.$('#metricBars');
        if (!container) return;

        const metrics = [
            { name: 'Gaming Performance', value: scores.gaming, class: 'gaming' },
            { name: 'Productivity', value: scores.productivity, class: 'productivity' },
            { name: 'Value Score', value: scores.value, class: 'value' }
        ];

        container.innerHTML = metrics.map(metric => `
            <div class="metric-item">
                <div class="metric-header">
                    <span class="metric-name">${metric.name}</span>
                    <span class="metric-value">${metric.value}%</span>
                </div>
                <div class="metric-bar">
                    <div class="metric-fill ${metric.class}" data-value="${metric.value}"></div>
                </div>
            </div>
        `).join('');
    }
};

// Make available globally
window.BuildData = BuildData;
window.BuildEngine = BuildEngine;

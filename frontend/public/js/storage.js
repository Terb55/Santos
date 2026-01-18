/**
 * storage.js
 *
 * Simple in-browser data store for Buildr AI.
 * Persists user selections, saved builds, price history, and preferences.
 */

const StorageManager = {
    STORAGE_KEY: 'buildrAI-data',
    VERSION: 1,
    _initialized: false,
    _available: true,
    _state: null,

    init() {
        if (this._initialized) return;
        this._state = this._load();
        this._initialized = true;
    },

    _defaults() {
        return {
            version: this.VERSION,
            preferences: {
                currency: 'USD',
                region: 'US'
            },
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
            savedBuilds: [],
            priceHistory: {},
            savedParts: {},
            comparisons: []
        };
    },

    _load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return this._defaults();
            const parsed = JSON.parse(raw);
            return { ...this._defaults(), ...parsed };
        } catch (e) {
            this._available = false;
            return this._defaults();
        }
    },

    _save() {
        if (!this._available) return;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._state));
        } catch (e) {
            this._available = false;
        }
    },

    getState() {
        return this._state;
    },

    getSelections() {
        return this._state?.selections || this._defaults().selections;
    },

    getSavedBuilds() {
        return Array.isArray(this._state?.savedBuilds) ? this._state.savedBuilds : [];
    },

    saveSelections(selections) {
        if (!this._state) return;
        this._state.selections = { ...this._state.selections, ...selections };
        this._save();
    },

    savePreferences(preferences) {
        if (!this._state) return;
        this._state.preferences = { ...this._state.preferences, ...preferences };
        this._save();
    },

    addBuild(build) {
        if (!this._state) return;
        const entry = {
            id: `build-${Date.now()}`,
            created_at: new Date().toISOString(),
            build
        };
        this._state.savedBuilds.unshift(entry);
        this._state.savedBuilds = this._state.savedBuilds.slice(0, 20);
        this._save();
        return entry.id;
    },

    removeBuild(buildId) {
        if (!this._state || !buildId) return;
        this._state.savedBuilds = this._state.savedBuilds.filter(entry => entry.id !== buildId);
        if (this._state.currentBuildId === buildId) {
            this._state.currentBuildId = null;
        }
        this._save();
    },

    addPriceHistory(partName, price, source = 'local') {
        if (!this._state) return;
        if (!partName || typeof price !== 'number') return;

        if (!this._state.priceHistory[partName]) {
            this._state.priceHistory[partName] = [];
        }
        this._state.priceHistory[partName].unshift({
            price,
            source,
            ts: new Date().toISOString()
        });
        this._state.priceHistory[partName] = this._state.priceHistory[partName].slice(0, 20);
        this._save();
    },

    saveParts(parts) {
        if (!this._state) return;
        if (!Array.isArray(parts)) return;
        parts.forEach(part => {
            if (!part?.name) return;
            this._state.savedParts[part.name] = part;
        });
        this._save();
    },

    setCurrentBuild(buildId) {
        if (!this._state) return;
        this._state.currentBuildId = buildId;
        this._save();
    },

    getCurrentBuild() {
        const id = this._state?.currentBuildId;
        if (!id) return null;
        const builds = this.getSavedBuilds();
        return builds.find(entry => entry.id === id) || null;
    },

    getBuildById(buildId) {
        if (!buildId) return null;
        const builds = this.getSavedBuilds();
        return builds.find(entry => entry.id === buildId) || null;
    }
};

window.StorageManager = StorageManager;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof App === 'undefined') {
            StorageManager.init();
        }
    }, 0);
});

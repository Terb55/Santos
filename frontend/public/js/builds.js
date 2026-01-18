/**
 * builds.js
 *
 * Render saved builds from local storage.
 */

const BuildsPage = {
    init() {
        if (typeof StorageManager !== 'undefined' && !StorageManager._initialized) {
            StorageManager.init();
        }
        this.render();
    },

    render() {
        const grid = Utils.$('.builds-grid');
        if (!grid) return;

        const builds = (typeof StorageManager !== 'undefined')
            ? StorageManager.getSavedBuilds()
            : [];

        grid.innerHTML = '';

        if (!builds.length) {
            grid.appendChild(this.renderEmptyCard());
            return;
        }

        builds.forEach(entry => {
            grid.appendChild(this.renderBuildCard(entry));
        });

        grid.appendChild(this.renderEmptyCard());
    },

    renderBuildCard(entry) {
        const build = entry?.build || {};
        const title = build.title || 'Custom Build';
        const components = build.components || {};
        const price = typeof build.total === 'number' ? build.total : null;
        const date = entry?.created_at ? new Date(entry.created_at) : null;

        const card = Utils.createElement('div', { class: 'build-preview-card' });
        card.addEventListener('click', (e) => {
            if (e.target && e.target.closest && e.target.closest('button')) {
                return;
            }
            if (typeof StorageManager !== 'undefined') {
                StorageManager.setCurrentBuild(entry.id);
            }
            window.location.href = `builder.html?build=${encodeURIComponent(entry.id)}`;
        });
        const image = Utils.createElement('div', { class: 'build-preview-image' });
        image.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 64px; height: 64px; color: var(--text-tertiary);">
                <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                <circle cx="12" cy="7" r="2"></circle>
                <path d="M8 14h8M8 17h8"></path>
            </svg>
            <span class="build-status saved">Saved</span>
        `;

        const content = Utils.createElement('div', { class: 'build-preview-content' });
        const titleEl = Utils.createElement('h3', { class: 'build-preview-title' });
        titleEl.textContent = title;

        const specs = Utils.createElement('p', { class: 'build-preview-specs' });
        specs.textContent = this.buildSpecLine(components);

        const footer = Utils.createElement('div', { class: 'build-preview-footer' });
        const priceEl = Utils.createElement('span', { class: 'build-price' });
        priceEl.textContent = price !== null ? Utils.formatCurrency(price) : '--';
        const dateEl = Utils.createElement('span', { class: 'build-date' });
        dateEl.textContent = date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

        const actions = Utils.createElement('div', { style: 'margin-left: auto;' });
        const unsaveBtn = Utils.createElement('button', {
            class: 'btn btn-ghost btn-small',
            style: 'padding: 4px 10px;',
            type: 'button'
        });
        unsaveBtn.textContent = 'Unsave';
        unsaveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            if (typeof StorageManager !== 'undefined') {
                StorageManager.removeBuild(entry.id);
            }
            this.render();
        });
        actions.appendChild(unsaveBtn);

        footer.appendChild(priceEl);
        footer.appendChild(dateEl);
        footer.appendChild(actions);
        content.appendChild(titleEl);
        content.appendChild(specs);
        content.appendChild(footer);

        card.appendChild(image);
        card.appendChild(content);
        return card;
    },

    buildSpecLine(components) {
        const cpu = components.cpu?.name;
        const gpu = components.gpu?.name;
        const ram = components.ram?.name;
        const storage = components.storage?.name;
        return [cpu, gpu, ram, storage].filter(Boolean).join(' • ');
    },

    renderEmptyCard() {
        const card = Utils.createElement('div', {
            class: 'build-preview-card',
            style: 'border-style: dashed; display: flex; align-items: center; justify-content: center; min-height: 280px;'
        });

        card.innerHTML = `
            <a href="builder.html" style="text-align: center; padding: var(--space-6);">
                <div style="width: 60px; height: 60px; margin: 0 auto var(--space-4); border-radius: 50%; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--primary-500);">
                        <path d="M12 5v14M5 12h14"></path>
                    </svg>
                </div>
                <p style="font-weight: var(--font-medium); color: var(--text-primary); margin-bottom: var(--space-1);">Create New Build</p>
                <p style="font-size: var(--text-sm); color: var(--text-tertiary);">Start with AI or manual builder</p>
            </a>
        `;
        return card;
    }
};

document.addEventListener('DOMContentLoaded', () => BuildsPage.init());
window.BuildsPage = BuildsPage;

/**
 * pricewatch.js
 *
 * Connects Price Watch search to the Pricetracking agent.
 */

const PriceWatch = {
    init() {
        const input = Utils.$('#pricewatchSearch');
        if (!input) return;
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.search(input.value.trim());
            }
        });
        this.renderOffers(Utils.$('#pricewatchTable'), this.sampleOffers());
    },

    async search(query) {
        if (!query) return;
        const table = Utils.$('#pricewatchTable');
        if (!table) return;

        this.clearRows(table);
        const loading = Utils.createElement('div', { class: 'table-row' });
        loading.innerHTML = '<div style="grid-column: 1 / -1; color: var(--text-tertiary); padding: var(--space-4);">Fetching prices...</div>';
        table.appendChild(loading);

        try {
            const prompt = [
                `Use serpapi_get_prices for: ${query}.`,
                'Return JSON only: {"offers":[{"title":string,"price_number":number,"price_text":string,"url":string}]}'
            ].join(' ');
            const text = await AgentAPI.sendMessage('Pricetracking', prompt);
            const parsed = AgentAPI.safeParseJson(text);
            const offers = Array.isArray(parsed?.offers) ? parsed.offers : [];
            this.renderOffers(table, offers.slice(0, 10));
        } catch (e) {
            this.renderError(table, e.message || 'Failed to fetch prices.');
        }
    },

    clearRows(table) {
        const rows = Utils.$$('.table-row', table);
        rows.forEach(row => row.remove());
    },

    renderOffers(table, offers) {
        this.clearRows(table);
        if (!offers.length) {
            this.renderError(table, 'No offers found.');
            return;
        }

        offers.forEach(offer => {
            const row = Utils.createElement('div', { class: 'table-row' });
            row.innerHTML = `
                <div class="product-cell">
                    <div class="product-image">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                            <rect x="9" y="9" width="6" height="6"></rect>
                        </svg>
                    </div>
                    <div>
                        <div class="product-name">${offer.title || 'Unknown'}</div>
                        <div style="font-size: var(--text-xs); color: var(--text-tertiary);">Price watch result</div>
                    </div>
                </div>
                <div class="price-cell price-current">${offer.price_text || Utils.formatCurrency(offer.price_number || 0)}</div>
                <div class="price-change"><span>--</span></div>
                <div class="price-change"><span>--</span></div>
                <div style="color: var(--text-secondary);">--</div>
                <div style="color: var(--text-tertiary); font-size: var(--text-sm);">Now</div>
            `;
            row.addEventListener('click', () => {
                if (offer.url) window.open(offer.url, '_blank');
            });
            table.appendChild(row);
        });
    },

    sampleOffers() {
        return [
            { title: 'NVIDIA RTX 4070 Ti Super', price_text: '$799', price_number: 799 },
            { title: 'AMD Ryzen 7 7800X3D', price_text: '$449', price_number: 449 },
            { title: 'Samsung 990 Pro 2TB', price_text: '$169', price_number: 169 },
            { title: 'Corsair Vengeance 32GB DDR5', price_text: '$119', price_number: 119 },
            { title: 'ASUS ROG Strix X670E', price_text: '$399', price_number: 399 }
        ];
    },

    renderError(table, message) {
        this.clearRows(table);
        const row = Utils.createElement('div', { class: 'table-row' });
        row.innerHTML = `<div style="grid-column: 1 / -1; color: var(--text-tertiary); padding: var(--space-4);">${message}</div>`;
        table.appendChild(row);
    }
};

document.addEventListener('DOMContentLoaded', () => PriceWatch.init());
window.PriceWatch = PriceWatch;

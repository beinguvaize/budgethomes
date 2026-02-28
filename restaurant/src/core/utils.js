// ── Utility helpers ─────────────────────────────────────────
export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatCurrency(cents) {
    return '$' + (cents / 100).toFixed(2);
}

export function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function elapsed(since) {
    const diff = Math.floor((Date.now() - new Date(since).getTime()) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export function elapsedMinutes(since) {
    return Math.floor((Date.now() - new Date(since).getTime()) / 60000);
}

export function today() {
    return new Date().toISOString().slice(0, 10);
}

export function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function $(sel, parent = document) {
    return parent.querySelector(sel);
}

export function $$(sel, parent = document) {
    return [...parent.querySelectorAll(sel)];
}

export function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'className') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'dataset' && typeof v === 'object') Object.assign(el.dataset, v);
        else if (k === 'innerHTML') el.innerHTML = v;
        else if (k === 'textContent') el.textContent = v;
        else el.setAttribute(k, v);
    }
    for (const c of children) {
        if (typeof c === 'string') el.appendChild(document.createTextNode(c));
        else if (c) el.appendChild(c);
    }
    return el;
}

export const h = createElement;

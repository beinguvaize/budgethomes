// ── Modal component ─────────────────────────────────────────
import { h } from '../core/utils.js';

export function showModal({ title, body, footer, large = false, onClose }) {
    const root = document.getElementById('modal-root');

    const overlay = h('div', { className: 'modal-overlay' });
    const modal = h('div', { className: `modal${large ? ' modal-lg' : ''}` });

    const closeBtn = h('div', {
        className: 'modal-close',
        innerHTML: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    });
    closeBtn.onclick = close;

    const header = h('div', { className: 'modal-header' }, [
        h('div', { className: 'modal-title', textContent: title }),
        closeBtn
    ]);

    const bodyEl = h('div', { className: 'modal-body' });
    if (typeof body === 'string') bodyEl.innerHTML = body;
    else if (body instanceof HTMLElement) bodyEl.appendChild(body);

    modal.appendChild(header);
    modal.appendChild(bodyEl);

    if (footer) {
        const footerEl = h('div', { className: 'modal-footer' });
        if (typeof footer === 'function') footer(footerEl, close);
        else if (footer instanceof HTMLElement) footerEl.appendChild(footer);
        modal.appendChild(footerEl);
    }

    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    root.appendChild(overlay);

    function close() {
        overlay.remove();
        if (onClose) onClose();
    }

    return { close, overlay, modal, bodyEl };
}

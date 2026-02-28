// ── Waiter: Table Selector ──────────────────────────────────
import { store } from '../../core/store.js';
import { auth } from '../../core/auth.js';
import { router } from '../../core/router.js';
import { events } from '../../core/events.js';
import { uid, formatTime } from '../../core/utils.js';
import { renderHeader, bindHeaderEvents } from '../../components/header.js';
import { showToast } from '../../components/toast.js';

export function waiterTablesView() {
    const app = document.getElementById('app');
    let cleanup;

    function render() {
        const tables = store.get('tables') || [];
        const sessions = store.get('sessions') || [];
        const user = auth.getCurrentUser();

        // Group by section
        const sections = {};
        for (const t of tables) {
            if (!sections[t.section]) sections[t.section] = [];
            sections[t.section].push(t);
        }

        app.innerHTML = `
      ${renderHeader()}
      <main class="app-main">
        <div class="view" id="tables-view">
          <div class="view-header">
            <div>
              <div class="view-title">Tables</div>
              <div class="view-subtitle">Tap a table to open or continue an order</div>
            </div>
          </div>
          ${Object.entries(sections).map(([section, sectionTables]) => `
            <div style="margin-bottom: var(--sp-6);">
              <h3 style="font-size: var(--fs-sm); color: var(--clr-text-muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: var(--sp-3);">${section}</h3>
              <div class="table-grid">
                ${sectionTables.map(t => {
            const session = t.sessionId ? sessions.find(s => s.id === t.sessionId) : null;
            const orders = session ? (store.get('orders') || []).filter(o => o.sessionId === session.id) : [];
            const hasReadyItems = orders.some(o => o.items && o.items.some(i => i.status === 'ready'));
            const statusClass = hasReadyItems ? 'needs-attention' : (t.status === 'occupied' ? 'occupied' : 'available');
            const itemCount = orders.reduce((sum, o) => sum + (o.items ? o.items.length : 0), 0);
            return `
                    <div class="table-card ${statusClass}" data-table-id="${t.id}">
                      <div class="table-number">${t.name.replace('Table ', '')}</div>
                      <div class="table-name">${t.name}</div>
                      ${t.status === 'occupied' ? `
                        <div class="table-info">${itemCount} items</div>
                        <div style="margin-top: var(--sp-2);">
                          <span class="badge ${hasReadyItems ? 'badge-ready' : 'badge-cooking'}">${hasReadyItems ? 'Ready' : 'Active'}</span>
                        </div>
                      ` : `
                        <div class="table-info">Seats ${t.capacity}</div>
                        <div style="margin-top: var(--sp-2);">
                          <span class="badge badge-open">Available</span>
                        </div>
                      `}
                    </div>
                  `;
        }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </main>
    `;

        bindHeaderEvents();
        bindTableEvents();
    }

    function bindTableEvents() {
        document.querySelectorAll('.table-card').forEach(card => {
            card.addEventListener('click', () => {
                const tableId = card.dataset.tableId;
                const table = store.findById('tables', tableId);
                if (!table) return;

                if (table.status === 'available') {
                    // Open new session
                    const session = {
                        id: uid(),
                        tableId: tableId,
                        openedAt: new Date().toISOString(),
                        closedAt: null,
                        waiterId: auth.getCurrentUser().id,
                        guestCount: table.capacity
                    };
                    store.push('sessions', session);
                    store.updateInArray('tables', tableId, {
                        status: 'occupied',
                        sessionId: session.id,
                        waiterId: auth.getCurrentUser().id
                    });

                    store.push('auditLog', {
                        id: uid(),
                        userId: auth.getCurrentUser().id,
                        action: 'TABLE_OPENED',
                        details: `Opened ${table.name}`,
                        timestamp: new Date().toISOString()
                    });

                    events.emit('table:opened', { tableId, sessionId: session.id });
                    showToast(`${table.name} opened`, 'success');
                }

                router.navigate(`waiter/order/${tableId}`);
            });
        });
    }

    render();

    // Listen for cross-tab updates
    const unsub = events.on('store:changed', () => {
        store.reload();
        render();
    });

    return () => {
        unsub();
    };
}

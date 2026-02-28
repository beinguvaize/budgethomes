// ── Waiter: Order Status Tracker ────────────────────────────
import { store } from '../../core/store.js';
import { auth } from '../../core/auth.js';
import { events } from '../../core/events.js';
import { formatTime, escapeHtml } from '../../core/utils.js';
import { renderHeader, bindHeaderEvents } from '../../components/header.js';
import { showToast } from '../../components/toast.js';

export function waiterStatusView() {
    const app = document.getElementById('app');
    let interval;

    function render() {
        const user = auth.getCurrentUser();
        const tables = store.get('tables') || [];
        const orders = store.get('orders') || [];
        const sessions = store.get('sessions') || [];

        // Get active tables assigned to this waiter (or all for now)
        const activeTables = tables.filter(t => t.status === 'occupied');
        const activeSessionIds = activeTables.map(t => t.sessionId).filter(Boolean);
        const activeOrders = orders.filter(o => activeSessionIds.includes(o.sessionId) && o.status === 'active');

        app.innerHTML = `
      ${renderHeader()}
      <main class="app-main">
        <div class="view">
          <div class="view-header">
            <div>
              <div class="view-title">Order Status</div>
              <div class="view-subtitle">Track live status of all active orders</div>
            </div>
          </div>
          ${activeOrders.length === 0 ? `
            <div class="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              <h3>No Active Orders</h3>
              <p>Orders will appear here once items are sent to the kitchen.</p>
            </div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:var(--sp-4);">
              ${activeOrders.map(order => {
            const table = tables.find(t => t.sessionId === order.sessionId);
            const tableName = table ? table.name : 'Unknown';
            return `
                  <div class="card">
                    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                      <span>${escapeHtml(tableName)} — Order ${formatTime(order.createdAt)}</span>
                      <span class="badge badge-open">${order.items.length} items</span>
                    </div>
                    <div class="card-body" style="padding:0;">
                      <table class="data-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${order.items.map(item => `
                            <tr>
                              <td>
                                <div class="fw-semibold">${escapeHtml(item.name)}</div>
                                ${item.mods.length ? `<div class="text-dim" style="font-size:var(--fs-xs);">${item.mods.map(m => m.name).join(', ')}</div>` : ''}
                                ${item.notes ? `<div style="color:var(--clr-warning);font-size:var(--fs-xs);font-style:italic;">📝 ${escapeHtml(item.notes)}</div>` : ''}
                              </td>
                              <td>${item.qty}</td>
                              <td><span class="badge badge-${item.status}">${item.status}</span></td>
                              <td>
                                ${item.status === 'ready' ? `
                                  <button class="btn btn-success btn-sm" data-order="${order.id}" data-item="${item.id}" data-action="serve">
                                    ✓ Serve
                                  </button>
                                ` : ''}
                              </td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                `;
        }).join('')}
            </div>
          `}
        </div>
      </main>
    `;

        bindHeaderEvents();

        // Bind serve buttons
        document.querySelectorAll('[data-action="serve"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.dataset.order;
                const itemId = btn.dataset.item;
                const orders = store.get('orders') || [];
                const order = orders.find(o => o.id === orderId);
                if (!order) return;
                const item = order.items.find(i => i.id === itemId);
                if (!item) return;

                item.status = 'served';
                item.statusLog.push({ status: 'served', at: new Date().toISOString() });
                store.set('orders', orders);

                events.emit('item:status-changed', { orderId, itemId, status: 'served' });
                showToast(`${item.name} marked as served`, 'success');
                render();
            });
        });
    }

    render();

    const unsub = events.on('store:changed', () => {
        store.reload();
        render();
    });

    interval = setInterval(render, 10000);

    return () => {
        unsub();
        clearInterval(interval);
    };
}

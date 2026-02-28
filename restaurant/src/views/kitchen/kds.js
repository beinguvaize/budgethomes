// ── Kitchen Display System (KDS) ────────────────────────────
import { store } from '../../core/store.js';
import { events } from '../../core/events.js';
import { elapsed, elapsedMinutes, escapeHtml } from '../../core/utils.js';
import { renderHeader, bindHeaderEvents } from '../../components/header.js';
import { showToast } from '../../components/toast.js';

export function kitchenView() {
  const app = document.getElementById('app');
  let interval;
  let chimeAudio;

  // Create audio chime for new orders
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const actx = new AudioContext();
    chimeAudio = () => {
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.value = 0.12;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.5);
      osc.stop(actx.currentTime + 0.5);
    };
  } catch (_) {
    chimeAudio = () => { };
  }

  function render() {
    const orders = store.get('orders') || [];
    const tables = store.get('tables') || [];

    // Get all active orders with kitchen-relevant items (queued or cooking)
    const kitchenOrders = orders.filter(o => {
      if (o.status !== 'active') return false;
      return o.items.some(i => i.status === 'queued' || i.status === 'cooking');
    }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Also show recently completed tickets (all items ready, last 5 min)
    const readyOrders = orders.filter(o => {
      if (o.status !== 'active') return false;
      return o.items.every(i => i.status === 'ready' || i.status === 'served') &&
        o.items.some(i => i.status === 'ready');
    });

    const allTickets = [...kitchenOrders, ...readyOrders];

    app.innerHTML = `
      ${renderHeader()}
      <main class="app-main" style="overflow:auto;background:var(--clr-bg);">
        ${allTickets.length === 0 ? `
          <div class="empty-state" style="height:100%;">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
            <h3>Kitchen is Clear</h3>
            <p>No active orders. New tickets will appear automatically.</p>
          </div>
        ` : `
          <div style="padding:var(--sp-4) var(--sp-4) 0; display:flex; justify-content:flex-end;">
            ${readyOrders.length > 0 ? `<button class="btn btn-secondary btn-sm" id="clear-all-ready-btn">🗑️ Clear All Ready</button>` : ''}
          </div>
          <div class="kds-board" id="kds-board">
            ${allTickets.map(order => {
      const table = tables.find(t => t.sessionId === order.sessionId || t.id === order.tableId);
      const tableName = order.tableName || table?.name || `Table ${order.tableId?.replace('t', '') || '???'}`;
      const mins = elapsedMinutes(order.createdAt);
      const timerClass = mins >= 15 ? 'timer-danger' : mins >= 8 ? 'timer-warning' : '';
      const isUrgent = mins >= 15;
      const allReady = order.items.every(i => i.status === 'ready' || i.status === 'served');
      const allItemsReadyOrServed = order.items.every(i => i.status === 'ready' || i.status === 'served'); // New check for dismiss button

      return `
                <div class="kds-ticket ${isUrgent ? 'urgent' : ''}" data-order-id="${order.id}">
                  <div class="kds-ticket-header">
                    <div>
                      <div class="kds-ticket-table">${escapeHtml(tableName)}</div>
                      <div style="font-size:var(--fs-xs);color:var(--clr-text-dim);">#${order.orderNumber || '...'} • ${order.items.length} items</div>
                    </div>
                    <div class="kds-ticket-time ${timerClass}" data-created="${order.createdAt}">
                      ${elapsed(order.createdAt)}
                    </div>
                  </div>
                  <div class="kds-ticket-items">
                    ${order.items.filter(i => i.status !== 'served').map(item => `
                      <div class="kds-item" data-order-id="${order.id}" data-item-id="${item.id}" data-status="${item.status}">
                        <div class="kds-item-status ${item.status}"></div>
                        <div class="kds-item-info">
                          <div class="kds-item-name">
                            ${item.qty > 1 ? `<span class="kds-item-qty">${item.qty}× </span>` : ''}
                            ${escapeHtml(item.name)}
                          </div>
                          ${item.mods.length ? `<div class="kds-item-mods">${item.mods.map(m => m.name).join(', ')}</div>` : ''}
                          ${item.notes ? `<div class="kds-item-note">📝 ${escapeHtml(item.notes)}</div>` : ''}
                          ${item.seat ? `<div style="font-size:var(--fs-xs);color:var(--clr-info);">Seat ${item.seat}</div>` : ''}
                        </div>
                        <span class="badge badge-${item.status}" style="font-size:9px;">${item.status}</span>
                      </div>
                    `).join('')}
                  </div>
                  <div class="kds-ticket-footer">
                    ${allItemsReadyOrServed ? `
                      <button class="btn btn-success btn-sm w-full dismiss-btn" data-order-num="${order.orderNumber}" data-order-id="${order.id}">Dismiss</button>
                    ` : `
                      <button class="btn btn-primary btn-sm" data-advance-all="${order.id}">Start All</button>
                      <button class="btn btn-success btn-sm" data-ready-all="${order.id}">All Ready</button>
                    `}
                  </div>
                </div>
              `;
    }).join('')}
          </div>
        `}
      </main>
    `;

    bindHeaderEvents();
    bindKitchenEvents();
  }

  function bindKitchenEvents() {
    document.querySelectorAll('.dismiss-btn').forEach(btn => {
      btn.onclick = () => {
        let orderNum = btn.dataset.orderNum;
        const orderId = btn.dataset.orderId;

        // Handle the case where orderNum is literally "undefined" or empty
        if (!orderNum || orderNum === 'undefined') orderNum = null;

        const targetId = orderNum || orderId;
        events.dismissOrder(targetId);
        showToast(`Order cleared`, 'info');
      };
    });

    const clearAllBtn = document.getElementById('clear-all-ready-btn');
    if (clearAllBtn) {
      clearAllBtn.onclick = () => {
        const orders = store.get('orders') || [];
        // For "Clear All Ready", we only target active orders where all items are ready/served
        const readyOrders = orders.filter(o => {
          if (o.status !== 'active') return false;
          return o.items.every(i => i.status === 'ready' || i.status === 'served');
        });

        if (readyOrders.length === 0) {
          showToast('No ready orders to clear', 'info');
          return;
        }

        readyOrders.forEach(o => {
          events.dismissOrder(o.orderNumber || o.id);
        });
        showToast(`Cleared ${readyOrders.length} orders`, 'success');
      };
    }

    // Toggle individual item status
    // Click individual item to advance status
    document.querySelectorAll('.kds-item').forEach(el => {
      el.addEventListener('click', () => {
        const orderId = el.dataset.orderId;
        const itemId = el.dataset.itemId;
        const currentStatus = el.dataset.status;

        const nextStatus = currentStatus === 'queued' ? 'cooking' : currentStatus === 'cooking' ? 'ready' : null;
        if (!nextStatus) return;

        updateItemStatus(orderId, itemId, nextStatus);
      });
    });

    // Start All button
    document.querySelectorAll('[data-advance-all]').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.dataset.advanceAll;
        const orders = store.get('orders') || [];
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        order.items.forEach(item => {
          if (item.status === 'queued') {
            item.status = 'cooking';
            item.statusLog.push({ status: 'cooking', at: new Date().toISOString() });
          }
        });
        store.set('orders', orders);
        events.emit('order:updated', { orderId });
        render();
      });
    });

    // All Ready button
    document.querySelectorAll('[data-ready-all]').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.dataset.readyAll;
        const orders = store.get('orders') || [];
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        order.items.forEach(item => {
          if (item.status !== 'served') {
            item.status = 'ready';
            item.statusLog.push({ status: 'ready', at: new Date().toISOString() });
          }
        });
        store.set('orders', orders);
        events.emit('order:updated', { orderId });
        showToast('All items marked ready!', 'success');
        render();
      });
    });

    // Bump (dismiss completed ticket)
    document.querySelectorAll('[data-bump]').forEach(btn => {
      btn.addEventListener('click', () => {
        // Just re-render to remove if all served
        showToast('Ticket bumped!', 'info');
        render();
      });
    });
  }

  function updateItemStatus(orderId, itemId, newStatus) {
    const orders = store.get('orders') || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const item = order.items.find(i => i.id === itemId);
    if (!item) return;

    item.status = newStatus;
    item.statusLog.push({ status: newStatus, at: new Date().toISOString() });
    store.set('orders', orders);

    events.emit('item:status-changed', { orderId, itemId, status: newStatus });
    render();
  }

  render();

  // Auto-refresh timers
  interval = setInterval(() => {
    document.querySelectorAll('.kds-ticket-time[data-created]').forEach(el => {
      const created = el.dataset.created;
      el.textContent = elapsed(created);
      const mins = elapsedMinutes(created);
      el.className = `kds-ticket-time ${mins >= 15 ? 'timer-danger' : mins >= 8 ? 'timer-warning' : ''}`;
    });
  }, 1000);

  // Listen for new orders
  const unsub1 = events.on('order:created', (payload, fromBroadcast) => {
    if (fromBroadcast) store.reload();
    chimeAudio();
    showToast('New order!', 'warning');
    render();
  });

  const unsub = events.on('store:changed', render);

  return () => {
    clearInterval(interval);
    unsub1();
    unsub();
  };
}

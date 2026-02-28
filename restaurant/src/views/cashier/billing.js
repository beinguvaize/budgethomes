// ── Cashier: Billing & Payments ──────────────────────────────
import { store } from '../../core/store.js';
import { auth } from '../../core/auth.js';
import { router } from '../../core/router.js';
import { events } from '../../core/events.js';
import { uid, formatCurrency, escapeHtml, formatTime } from '../../core/utils.js';
import { renderHeader, bindHeaderEvents } from '../../components/header.js';
import { showToast } from '../../components/toast.js';
import { showModal } from '../../components/modal.js';

export function cashierView() {
  const app = document.getElementById('app');
  let selectedTableId = null;

  function render() {
    const tables = store.get('tables') || [];
    const occupiedTables = tables.filter(t => t.status === 'occupied');

    const settings = store.get('settings') || {};
    const taxRate = settings.taxRate || 10;
    const serviceRate = settings.serviceChargeRate || 5;

    let billHtml = '';

    if (selectedTableId) {
      const table = tables.find(t => t.id === selectedTableId);
      if (table && table.sessionId) {
        const orders = (store.get('orders') || []).filter(o => o.sessionId === table.sessionId);
        const allItems = orders.flatMap(o => o.items || []);
        const subtotal = allItems.reduce((sum, i) => sum + i.price * i.qty, 0);
        const tax = Math.round(subtotal * taxRate / 100);
        const serviceCharge = Math.round(subtotal * serviceRate / 100);
        const total = subtotal + tax + serviceCharge;

        billHtml = `
          <div class="bill-layout">
            <div class="bill-items-list">
              <div style="padding:var(--sp-4);border-bottom:1px solid var(--clr-border);display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div class="fw-bold">${escapeHtml(table.name)}</div>
                  <div class="text-muted" style="font-size:var(--fs-xs);">${allItems.length} items</div>
                </div>
                <button class="btn btn-ghost btn-sm" id="deselect-table">← Back</button>
              </div>
              ${allItems.length === 0 ? `
                <div class="empty-state" style="padding:var(--sp-8);">
                  <h3>No items</h3>
                  <p>This table has no orders yet.</p>
                </div>
              ` : allItems.map(item => `
                <div class="bill-item-row">
                  <div>
                    <div class="fw-semibold">${escapeHtml(item.name)}</div>
                    ${item.mods.length ? `<div class="text-dim" style="font-size:var(--fs-xs);">${item.mods.map(m => m.name).join(', ')}</div>` : ''}
                    <span class="badge badge-${item.status}" style="margin-top:4px;">${item.status}</span>
                  </div>
                  <div class="text-muted">${item.qty}×</div>
                  <div class="fw-bold">${formatCurrency(item.price * item.qty)}</div>
                </div>
              `).join('')}
            </div>
            <div class="bill-summary">
              <h3 style="font-size:var(--fs-md);font-weight:var(--fw-bold);margin-bottom:var(--sp-2);">Bill Summary</h3>
              <div class="bill-line">
                <span>Subtotal</span>
                <span>${formatCurrency(subtotal)}</span>
              </div>
              <div class="bill-line">
                <span>Tax (${taxRate}%)</span>
                <span>${formatCurrency(tax)}</span>
              </div>
              <div class="bill-line">
                <span>Service (${serviceRate}%)</span>
                <span>${formatCurrency(serviceCharge)}</span>
              </div>
              <div id="discount-line"></div>
              <div class="bill-line total">
                <span>Total</span>
                <span id="bill-total">${formatCurrency(total)}</span>
              </div>

              <div style="display:flex;flex-direction:column;gap:var(--sp-2);margin-top:var(--sp-4);">
                <button class="btn btn-secondary btn-sm" id="discount-btn">Apply Discount</button>
                <button class="btn btn-secondary btn-sm" id="split-btn">Split Bill</button>
                <div style="display:flex;gap:var(--sp-2);margin-top:var(--sp-2);">
                  <button class="btn btn-primary w-full" data-pay="cash" ${allItems.length === 0 ? 'disabled' : ''}>💵 Cash</button>
                  <button class="btn btn-primary w-full" data-pay="card" ${allItems.length === 0 ? 'disabled' : ''}>💳 Card</button>
                </div>
                <button class="btn btn-ghost btn-sm" id="receipt-btn" ${allItems.length === 0 ? 'disabled' : ''}>🖨 View Receipt</button>
              </div>
            </div>
          </div>
        `;
      }
    }

    app.innerHTML = `
      ${renderHeader()}
      <main class="app-main">
        <div class="view">
          ${!selectedTableId ? `
            <div class="view-header">
              <div>
                <div class="view-title">Billing</div>
                <div class="view-subtitle">Select a table to view and process payment</div>
              </div>
            </div>
            ${occupiedTables.length === 0 ? `
              <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/>
                </svg>
                <h3>No Active Tables</h3>
                <p>Tables with orders will appear here for billing.</p>
              </div>
            ` : `
              <div class="table-grid">
                ${occupiedTables.map(t => {
      const orders = (store.get('orders') || []).filter(o => o.sessionId === t.sessionId);
      const itemCount = orders.reduce((sum, o) => sum + (o.items ? o.items.length : 0), 0);
      const subtotal = orders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + i.price * i.qty, 0), 0);
      return `
                    <div class="table-card occupied" data-table-id="${t.id}">
                      <div class="table-number">${t.name.replace('Table ', '')}</div>
                      <div class="table-name">${escapeHtml(t.name)}</div>
                      <div class="table-info">${itemCount} items</div>
                      <div style="margin-top:var(--sp-2);font-weight:var(--fw-bold);color:var(--clr-accent);">${formatCurrency(subtotal)}</div>
                    </div>
                  `;
    }).join('')}
              </div>
            `}
          ` : billHtml}
        </div>
      </main>
    `;

    bindHeaderEvents();
    bindCashierEvents();
  }

  function bindCashierEvents() {
    // Table selection
    document.querySelectorAll('.table-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedTableId = card.dataset.tableId;
        render();
      });
    });

    // Deselect
    const deselect = document.getElementById('deselect-table');
    if (deselect) deselect.onclick = () => { selectedTableId = null; render(); };

    // Payment buttons
    document.querySelectorAll('[data-pay]').forEach(btn => {
      btn.addEventListener('click', () => {
        const method = btn.dataset.pay;
        processPayment(method);
      });
    });

    // Discount
    const discountBtn = document.getElementById('discount-btn');
    if (discountBtn) discountBtn.onclick = showDiscountModal;

    // Split bill
    const splitBtn = document.getElementById('split-btn');
    if (splitBtn) splitBtn.onclick = showSplitModal;

    // Receipt
    const receiptBtn = document.getElementById('receipt-btn');
    if (receiptBtn) receiptBtn.onclick = showReceipt;
  }

  function processPayment(method) {
    const table = store.findById('tables', selectedTableId);
    if (!table) return;

    const orders = (store.get('orders') || []).filter(o => o.sessionId === table.sessionId);
    const allItems = orders.flatMap(o => o.items || []);
    const settings = store.get('settings') || {};
    const subtotal = allItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const tax = Math.round(subtotal * settings.taxRate / 100);
    const serviceCharge = Math.round(subtotal * settings.serviceChargeRate / 100);
    const total = subtotal + tax + serviceCharge;

    // Create bill
    const bill = {
      id: uid(),
      sessionId: table.sessionId,
      subtotal,
      tax,
      serviceCharge,
      discount: 0,
      total,
      payments: [{ id: uid(), method, amount: total }],
      closedAt: new Date().toISOString()
    };
    store.push('bills', bill);

    // Close session
    const sessions = store.get('sessions') || [];
    const session = sessions.find(s => s.id === table.sessionId);
    if (session) {
      session.closedAt = new Date().toISOString();
      store.set('sessions', sessions);
    }

    // Mark orders as completed
    const allOrders = store.get('orders') || [];
    orders.forEach(o => {
      const order = allOrders.find(ao => ao.id === o.id);
      if (order) order.status = 'completed';
    });
    store.set('orders', allOrders);

    // Free up table
    store.updateInArray('tables', selectedTableId, {
      status: 'available',
      sessionId: null,
      waiterId: null
    });

    store.push('auditLog', {
      id: uid(),
      userId: auth.getCurrentUser().id,
      action: 'PAYMENT',
      details: `${table.name} paid ${formatCurrency(total)} (${method})`,
      timestamp: new Date().toISOString()
    });

    events.emit('table:closed', { tableId: selectedTableId });
    showToast(`Payment of ${formatCurrency(total)} received (${method})!`, 'success');
    selectedTableId = null;
    render();
  }

  function showDiscountModal() {
    const bodyEl = document.createElement('div');
    bodyEl.innerHTML = `
      <div class="form-group">
        <label class="form-label">Discount Type</label>
        <select class="select" id="disc-type">
          <option value="percent">Percentage</option>
          <option value="fixed">Fixed Amount</option>
        </select>
      </div>
      <div class="form-group" style="margin-top:var(--sp-3);">
        <label class="form-label">Value</label>
        <input class="input" type="number" id="disc-value" placeholder="e.g. 10" min="0">
      </div>
    `;

    showModal({
      title: 'Apply Discount',
      body: bodyEl,
      footer: (footerEl, close) => {
        const applyBtn = document.createElement('button');
        applyBtn.className = 'btn btn-primary';
        applyBtn.textContent = 'Apply';
        applyBtn.onclick = () => {
          showToast('Discount feature applied!', 'info');
          close();
        };
        footerEl.appendChild(applyBtn);
      }
    });
  }

  function showSplitModal() {
    const bodyEl = document.createElement('div');
    bodyEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
        <button class="btn btn-secondary w-full split-opt" data-split="equal-2">Split Equally (2 ways)</button>
        <button class="btn btn-secondary w-full split-opt" data-split="equal-3">Split Equally (3 ways)</button>
        <button class="btn btn-secondary w-full split-opt" data-split="equal-4">Split Equally (4 ways)</button>
        <button class="btn btn-secondary w-full split-opt" data-split="seat">Split by Seat</button>
      </div>
    `;

    const modal = showModal({
      title: 'Split Bill',
      body: bodyEl,
      footer: null
    });

    bodyEl.querySelectorAll('.split-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.split;
        if (type === 'seat') {
          showToast('Split by seat — each seat can pay individually', 'info');
        } else {
          const ways = parseInt(type.split('-')[1]);
          showToast(`Bill split ${ways} ways`, 'info');
        }
        modal.close();
      });
    });
  }

  function showReceipt() {
    const table = store.findById('tables', selectedTableId);
    if (!table) return;

    const orders = (store.get('orders') || []).filter(o => o.sessionId === table.sessionId);
    const allItems = orders.flatMap(o => o.items || []);
    const settings = store.get('settings') || {};
    const subtotal = allItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const tax = Math.round(subtotal * settings.taxRate / 100);
    const serviceCharge = Math.round(subtotal * settings.serviceChargeRate / 100);
    const total = subtotal + tax + serviceCharge;

    const bodyEl = document.createElement('div');
    bodyEl.innerHTML = `
      <div class="receipt">
        <div class="receipt-header">
          <h2>RestroFlow</h2>
          <div>Restaurant & Kitchen</div>
          <div style="margin-top:8px;font-size:11px;">
            ${table.name} — ${new Date().toLocaleString()}
          </div>
        </div>
        <div class="receipt-divider"></div>
        ${allItems.map(item => `
          <div class="receipt-item">
            <span>${item.qty}× ${item.name}</span>
            <span>${formatCurrency(item.price * item.qty)}</span>
          </div>
        `).join('')}
        <div class="receipt-divider"></div>
        <div class="receipt-item"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
        <div class="receipt-item"><span>Tax (${settings.taxRate}%)</span><span>${formatCurrency(tax)}</span></div>
        <div class="receipt-item"><span>Service (${settings.serviceChargeRate}%)</span><span>${formatCurrency(serviceCharge)}</span></div>
        <div class="receipt-divider"></div>
        <div class="receipt-total"><span>TOTAL</span><span>${formatCurrency(total)}</span></div>
        <div class="receipt-footer">
          <div>Thank you for dining with us!</div>
          <div style="margin-top:4px;">★ ★ ★ ★ ★</div>
        </div>
      </div>
      <div style="text-align:center;margin-top:var(--sp-4);">
        <button class="btn btn-secondary btn-sm no-print" onclick="window.print()">🖨 Print</button>
      </div>
    `;

    showModal({
      title: 'Receipt Preview',
      body: bodyEl,
      large: true
    });
  }

  render();

  const unsub = events.on('store:changed', render);
  return unsub;
}

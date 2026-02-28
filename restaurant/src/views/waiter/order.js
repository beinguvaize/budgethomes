// ── Waiter: Order Capture ───────────────────────────────────
import { store } from '../../core/store.js';
import { auth } from '../../core/auth.js';
import { router } from '../../core/router.js';
import { events } from '../../core/events.js';
import { uid, formatCurrency, escapeHtml } from '../../core/utils.js';
import { renderHeader, bindHeaderEvents } from '../../components/header.js';
import { showToast } from '../../components/toast.js';
import { showModal } from '../../components/modal.js';

let cart = [];
let selectedCat = null;

export function waiterOrderView(tableId) {
  const app = document.getElementById('app');
  cart = [];
  selectedCat = null;

  const table = store.findById('tables', tableId);
  if (!table || table.status !== 'occupied') {
    router.navigate('waiter/tables');
    return;
  }

  const categories = (store.get('categories') || []).sort((a, b) => a.sortOrder - b.sortOrder);
  selectedCat = categories[0]?.id || null;

  // Load existing unsent items for this table's session
  const existingOrders = (store.get('orders') || []).filter(o => o.sessionId === table.sessionId);

  function render() {
    const menuItems = (store.get('menuItems') || []).filter(m => m.categoryId === selectedCat);
    const cartTotal = cart.reduce((sum, ci) => sum + ci.price * ci.qty, 0);
    const recentOrders = (store.get('orders') || [])
      .filter(o => o.tableId === tableId && o.status === 'active')
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    app.innerHTML = `
      ${renderHeader()}
      <main class="app-main">
        <div class="order-layout">
          <div class="menu-panel">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-3);">
              <div>
                <div class="view-title">${escapeHtml(table.name)}</div>
                <div class="view-subtitle">Add items to order</div>
              </div>
              <button class="btn btn-ghost btn-sm" id="back-btn">← Back</button>
            </div>
            <div class="category-tabs">
              ${categories.map(c => `
                <div class="cat-tab ${c.id === selectedCat ? 'active' : ''}" data-cat="${c.id}">
                  ${c.icon} ${c.name}
                </div>
              `).join('')}
            </div>
            <div class="menu-grid" id="menu-grid">
              ${menuItems.map(item => `
                <div class="menu-item ${item.available ? '' : 'unavailable'}" data-item-id="${item.id}">
                  <div class="item-name">${escapeHtml(item.name)}</div>
                  <div class="item-price">${formatCurrency(item.price)}</div>
                  ${item.description ? `<div class="item-desc">${escapeHtml(item.description)}</div>` : ''}
                </div>
              `).join('')}
              ${menuItems.length === 0 ? '<div class="empty-state" style="grid-column:1/-1;padding:var(--sp-8);"><h3>No items</h3><p>This category is empty.</p></div>' : ''}
            </div>
          </div>
          <div class="cart-panel">
            <div class="cart-header">
              <span>Order (${cart.length} items)</span>
              ${cart.length > 0 ? '<button class="btn btn-ghost btn-sm" id="clear-cart-btn">Clear</button>' : ''}
            </div>
            ${cart.length === 0 ? `
              <div class="cart-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                </svg>
                <p>Tap menu items to add</p>
              </div>
            ` : `
              <div class="cart-items" id="cart-items">
                ${cart.map((ci, idx) => `
                  <div class="cart-item" data-cart-idx="${idx}">
                    <div class="cart-item-info">
                      <div class="cart-item-name">${escapeHtml(ci.name)}</div>
                      ${ci.mods.length ? `<div class="cart-item-mods">${ci.mods.map(m => m.name).join(', ')}</div>` : ''}
                      ${ci.notes ? `<div class="cart-item-note">📝 ${escapeHtml(ci.notes)}</div>` : ''}
                      ${ci.seat ? `<div class="cart-item-seat">Seat ${ci.seat}</div>` : ''}
                    </div>
                    <div class="qty-control">
                      <div class="qty-btn" data-action="dec" data-idx="${idx}">−</div>
                      <div class="qty-num">${ci.qty}</div>
                      <div class="qty-btn" data-action="inc" data-idx="${idx}">+</div>
                    </div>
                    <div class="cart-item-price">${formatCurrency(ci.price * ci.qty)}</div>
                    <div class="qty-btn" data-action="edit" data-idx="${idx}" title="Edit" style="margin-left:4px">✎</div>
                  </div>
                `).join('')}
              </div>
              <div class="cart-footer">
                <div class="sidebar-section">
              <div class="sidebar-title">Recent Orders</div>
              <div class="recent-orders-list">
                ${recentOrders.map(o => `
                  <div class="recent-order-card">
                    <div style="display:flex;justify:space-between;margin-bottom:var(--sp-2);">
                      <div class="fw-bold">Order #${o.orderNumber || '...'}</div>
                      <div class="text-dim">${new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style="font-size:var(--fs-xs);">
                      ${o.items.map(item => `<div>${item.qty}x ${escapeHtml(item.name)}</div>`).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="cart-actions">
                <div class="cart-total">
                  <span>Subtotal</span>
                  <span>${formatCurrency(cartTotal)}</span>
                </div>
                <button class="btn btn-primary btn-lg w-full" id="send-btn">
                  🔥 Send to Kitchen
                </button>
              </div>
            `}
          </div>
        </div>
      </main>
    `;

    bindHeaderEvents();
    bindOrderEvents();
  }

  function bindOrderEvents() {
    // Category tabs
    document.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        selectedCat = tab.dataset.cat;
        render();
      });
    });

    // Menu items
    document.querySelectorAll('.menu-item:not(.unavailable)').forEach(item => {
      item.addEventListener('click', () => {
        const itemId = item.dataset.itemId;
        const menuItem = store.findById('menuItems', itemId);
        if (!menuItem) return;

        const modGroups = (menuItem.modifierGroups || [])
          .map(mgId => store.findById('modifierGroups', mgId))
          .filter(Boolean);

        if (modGroups.length > 0) {
          showModifierModal(menuItem, modGroups);
        } else {
          addToCart(menuItem, [], '');
        }
      });
    });

    // Back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.onclick = () => router.navigate('waiter/tables');

    // Clear cart
    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) clearBtn.onclick = () => { cart = []; render(); };

    // Quantity controls
    document.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        const action = btn.dataset.action;
        if (action === 'inc') {
          cart[idx].qty++;
        } else if (action === 'dec') {
          cart[idx].qty--;
          if (cart[idx].qty <= 0) cart.splice(idx, 1);
        } else if (action === 'edit') {
          showEditModal(idx);
        }
        render();
      });
    });

    // Send to kitchen
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
      sendBtn.onclick = () => {
        if (cart.length === 0) return;

        const user = auth.getCurrentUser();
        const order = {
          id: uid(),
          sessionId: table.sessionId,
          tableId,
          tableName: table ? table.name : 'Unknown',
          waiterId: user.id,
          waiterName: user.name,
          items: cart.map(item => ({
            id: uid(),
            menuItemId: item.menuItemId,
            name: item.name,
            mods: item.mods,
            seat: item.seat,
            notes: item.notes,
            qty: item.qty,
            price: item.price,
            status: 'queued',
            statusLog: [{ status: 'queued', at: new Date().toISOString() }],
            startTime: Date.now()
          })),
          status: 'active',
          createdAt: Date.now()
        };

        events.createOrder(order);
        events.emitRemote('order:created', { tableId, tableName: table.name });

        store.push('auditLog', {
          id: uid(),
          userId: user.id,
          userName: user.name,
          action: 'Order Sent',
          details: `Sent order #${order.id.slice(0, 8)} to KDS for ${table.name}`,
          timestamp: new Date().toISOString()
        });

        showToast('Order sent to kitchen', 'success');
        cart = [];
        saveCart();
        render();
      };
    }
  }

  function showModifierModal(menuItem, modGroups) {
    const selectedMods = {};
    let notes = '';
    let seat = '';

    const bodyEl = document.createElement('div');

    function renderModalBody() {
      bodyEl.innerHTML = `
        ${modGroups.map(mg => `
          <div style="margin-bottom:var(--sp-4);">
            <div class="form-label" style="margin-bottom:var(--sp-2);">
              ${mg.name} ${mg.required ? '<span class="text-danger">*</span>' : '<span class="text-dim">(optional)</span>'}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2);">
              ${mg.options.map(opt => {
        const isSelected = mg.multiSelect
          ? (selectedMods[mg.id] || []).includes(opt.id)
          : selectedMods[mg.id] === opt.id;
        return `
                  <button class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm"
                          data-mg="${mg.id}" data-opt="${opt.id}" data-multi="${mg.multiSelect}">
                    ${opt.name}${opt.price > 0 ? ` (+${formatCurrency(opt.price)})` : ''}
                  </button>
                `;
      }).join('')}
            </div>
          </div>
        `).join('')}
        <div class="form-group" style="margin-bottom:var(--sp-3);">
          <label class="form-label">Seat #</label>
          <input class="input" type="number" id="mod-seat" placeholder="Optional" value="${seat}" min="1" max="20" style="max-width:100px;">
        </div>
        <div class="form-group">
          <label class="form-label">Special Notes</label>
          <textarea class="textarea" id="mod-notes" placeholder="e.g. no onions, extra spicy...">${notes}</textarea>
        </div>
      `;

      bodyEl.querySelectorAll('[data-mg]').forEach(btn => {
        btn.addEventListener('click', () => {
          const mgId = btn.dataset.mg;
          const optId = btn.dataset.opt;
          const isMulti = btn.dataset.multi === 'true';

          if (isMulti) {
            if (!selectedMods[mgId]) selectedMods[mgId] = [];
            const idx = selectedMods[mgId].indexOf(optId);
            if (idx === -1) selectedMods[mgId].push(optId);
            else selectedMods[mgId].splice(idx, 1);
          } else {
            selectedMods[mgId] = selectedMods[mgId] === optId ? null : optId;
          }
          renderModalBody();
        });
      });
    }

    renderModalBody();

    const modal = showModal({
      title: menuItem.name,
      body: bodyEl,
      large: false,
      footer: (footerEl, close) => {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = close;

        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-primary';
        addBtn.textContent = `Add — ${formatCurrency(menuItem.price)}`;
        addBtn.onclick = () => {
          const noteEl = document.getElementById('mod-notes');
          const seatEl = document.getElementById('mod-seat');

          // Collect selected modifier details
          const mods = [];
          let modPrice = 0;
          for (const mg of modGroups) {
            const sel = selectedMods[mg.id];
            if (!sel) continue;
            if (mg.multiSelect && Array.isArray(sel)) {
              for (const optId of sel) {
                const opt = mg.options.find(o => o.id === optId);
                if (opt) { mods.push({ id: opt.id, name: opt.name, price: opt.price }); modPrice += opt.price; }
              }
            } else {
              const opt = mg.options.find(o => o.id === sel);
              if (opt) { mods.push({ id: opt.id, name: opt.name, price: opt.price }); modPrice += opt.price; }
            }
          }

          addToCart(menuItem, mods, noteEl?.value || '', seatEl?.value || '', modPrice);
          close();
        };

        footerEl.appendChild(cancelBtn);
        footerEl.appendChild(addBtn);
      }
    });
  }

  function addToCart(menuItem, mods = [], notes = '', seat = '', modPrice = 0) {
    cart.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price + modPrice,
      mods,
      notes,
      seat,
      qty: 1
    });
    render();
  }

  function showEditModal(idx) {
    const ci = cart[idx];
    const bodyEl = document.createElement('div');
    bodyEl.innerHTML = `
      <div class="form-group" style="margin-bottom:var(--sp-3);">
        <label class="form-label">Seat #</label>
        <input class="input" type="number" id="edit-seat" value="${ci.seat}" min="1" max="20" style="max-width:100px;">
      </div>
      <div class="form-group">
        <label class="form-label">Special Notes</label>
        <textarea class="textarea" id="edit-notes">${ci.notes}</textarea>
      </div>
    `;

    showModal({
      title: `Edit: ${ci.name}`,
      body: bodyEl,
      footer: (footerEl, close) => {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = 'Save';
        saveBtn.onclick = () => {
          cart[idx].notes = document.getElementById('edit-notes').value;
          cart[idx].seat = document.getElementById('edit-seat').value;
          close();
          render();
        };
        footerEl.appendChild(saveBtn);
      }
    });
  }

  render();

  const unsub = events.on('store:changed', render);
  return unsub;
}

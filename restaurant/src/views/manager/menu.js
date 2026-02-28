// ── Manager: Menu Editor ────────────────────────────────────
import { store } from '../../core/store.js';
import { events } from '../../core/events.js';
import { uid, formatCurrency, escapeHtml } from '../../core/utils.js';
import { renderHeader, bindHeaderEvents } from '../../components/header.js';
import { showModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';

export function managerMenuView() {
  const app = document.getElementById('app');
  let selectedCat = null;

  function render() {
    const categories = (store.get('categories') || []).sort((a, b) => a.sortOrder - b.sortOrder);
    if (!selectedCat && categories.length) selectedCat = categories[0].id;

    const menuItems = (store.get('menuItems') || []).filter(m => m.categoryId === selectedCat);

    app.innerHTML = `
      ${renderHeader()}
      <main class="app-main">
        <div class="view">
          <div class="view-header">
            <div>
              <div class="view-title">Menu Management</div>
              <div class="view-subtitle">Edit categories, items, and availability</div>
            </div>
            <div style="display:flex;gap:var(--sp-2);">
              <button class="btn btn-secondary btn-sm" id="add-cat-btn">+ Category</button>
              <button class="btn btn-primary btn-sm" id="add-item-btn">+ Menu Item</button>
            </div>
          </div>

          <div class="category-tabs">
            ${categories.map(c => `
              <div class="cat-tab ${c.id === selectedCat ? 'active' : ''}" data-cat="${c.id}">
                ${c.icon} ${c.name}
              </div>
            `).join('')}
          </div>

          ${menuItems.length === 0 ? `
            <div class="empty-state">
              <h3>No items in this category</h3>
              <p>Click "+ Menu Item" to add one.</p>
            </div>
          ` : `
            <div class="card" style="overflow:auto;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Modifiers</th>
                    <th>Available</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${menuItems.map(item => `
                    <tr>
                      <td>
                        <div class="fw-semibold">${escapeHtml(item.name)}</div>
                        ${item.description ? `<div class="text-dim" style="font-size:var(--fs-xs);">${escapeHtml(item.description)}</div>` : ''}
                      </td>
                      <td class="fw-bold text-accent">${formatCurrency(item.price)}</td>
                      <td class="text-dim">${(item.modifierGroups || []).length} groups</td>
                      <td>
                        <div class="toggle-wrap" data-toggle-item="${item.id}">
                          <div class="toggle ${item.available ? 'active' : ''}"></div>
                        </div>
                      </td>
                      <td>
                        <div style="display:flex;gap:var(--sp-2);">
                          <button class="btn btn-ghost btn-sm" data-edit-item="${item.id}">Edit</button>
                          <button class="btn btn-ghost btn-sm text-danger" data-delete-item="${item.id}">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </main>
    `;

    bindHeaderEvents();
    bindMenuEvents();
  }

  function bindMenuEvents() {
    // Category tabs
    document.querySelectorAll('.cat-tab').forEach(tab => {
      tab.onclick = () => { selectedCat = tab.dataset.cat; render(); };
    });

    // Toggle availability
    document.querySelectorAll('[data-toggle-item]').forEach(el => {
      el.onclick = () => {
        const itemId = el.dataset.toggleItem;
        const item = store.findById('menuItems', itemId);
        if (item) {
          store.updateInArray('menuItems', itemId, { available: !item.available });
          events.emit('menu:updated', { itemId });
          showToast(`${item.name} ${!item.available ? 'available' : '86\'d'}`, item.available ? 'warning' : 'success');
          render();
        }
      };
    });

    // Edit item
    document.querySelectorAll('[data-edit-item]').forEach(btn => {
      btn.onclick = () => {
        const item = store.findById('menuItems', btn.dataset.editItem);
        if (item) showItemModal(item);
      };
    });

    // Delete item
    document.querySelectorAll('[data-delete-item]').forEach(btn => {
      btn.onclick = () => {
        const itemId = btn.dataset.deleteItem;
        if (confirm('Delete this menu item?')) {
          store.removeFromArray('menuItems', itemId);
          events.emit('menu:updated', { itemId });
          showToast('Item deleted', 'info');
          render();
        }
      };
    });

    // Add item
    const addBtn = document.getElementById('add-item-btn');
    if (addBtn) addBtn.onclick = () => showItemModal(null);

    // Add category
    const addCatBtn = document.getElementById('add-cat-btn');
    if (addCatBtn) addCatBtn.onclick = () => showCategoryModal();
  }

  function showItemModal(existing) {
    const categories = store.get('categories') || [];
    const modGroups = store.get('modifierGroups') || [];
    const selectedMods = existing ? [...(existing.modifierGroups || [])] : [];

    const bodyEl = document.createElement('div');
    bodyEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input class="input" id="item-name" value="${existing ? escapeHtml(existing.name) : ''}" placeholder="Item name">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Price (cents)</label>
            <input class="input" id="item-price" type="number" value="${existing ? existing.price : ''}" placeholder="1400">
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="select" id="item-cat">
              ${categories.map(c => `<option value="${c.id}" ${existing && existing.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="textarea" id="item-desc" placeholder="Short description">${existing ? escapeHtml(existing.description || '') : ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Modifier Groups</label>
          <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2);">
            ${modGroups.map(mg => `
              <label style="display:flex;align-items:center;gap:var(--sp-1);cursor:pointer;font-size:var(--fs-sm);">
                <input type="checkbox" value="${mg.id}" ${selectedMods.includes(mg.id) ? 'checked' : ''} class="mod-check">
                ${mg.name}
              </label>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    showModal({
      title: existing ? `Edit: ${existing.name}` : 'New Menu Item',
      body: bodyEl,
      footer: (footerEl, close) => {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = close;

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = 'Save';
        saveBtn.onclick = () => {
          const name = document.getElementById('item-name').value.trim();
          const price = parseInt(document.getElementById('item-price').value) || 0;
          const catId = document.getElementById('item-cat').value;
          const desc = document.getElementById('item-desc').value.trim();
          const mods = [...document.querySelectorAll('.mod-check:checked')].map(c => c.value);

          if (!name) { showToast('Name is required', 'error'); return; }

          if (existing) {
            store.updateInArray('menuItems', existing.id, { name, price, categoryId: catId, description: desc, modifierGroups: mods });
            showToast(`${name} updated`, 'success');
          } else {
            store.push('menuItems', { id: uid(), name, price, categoryId: catId, description: desc, modifierGroups: mods, available: true });
            showToast(`${name} added`, 'success');
          }
          events.emit('menu:updated', {});
          close();
          render();
        };

        footerEl.appendChild(cancelBtn);
        footerEl.appendChild(saveBtn);
      }
    });
  }

  function showCategoryModal() {
    const bodyEl = document.createElement('div');
    bodyEl.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input class="input" id="cat-name" placeholder="e.g. Appetizers">
        </div>
        <div class="form-group">
          <label class="form-label">Icon (emoji)</label>
          <input class="input" id="cat-icon" placeholder="e.g. 🍕" maxlength="4">
        </div>
      </div>
    `;

    showModal({
      title: 'New Category',
      body: bodyEl,
      footer: (footerEl, close) => {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = 'Add';
        saveBtn.onclick = () => {
          const name = document.getElementById('cat-name').value.trim();
          const icon = document.getElementById('cat-icon').value.trim() || '📦';
          if (!name) { showToast('Name required', 'error'); return; }

          const cats = store.get('categories') || [];
          const maxSort = cats.reduce((m, c) => Math.max(m, c.sortOrder), 0);
          store.push('categories', { id: uid(), name, icon, sortOrder: maxSort + 1 });
          events.emit('menu:updated', {});
          showToast(`Category "${name}" added`, 'success');
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

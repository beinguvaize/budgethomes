// ── Manager: Staff Management ───────────────────────────────
import { store } from '../../core/store.js';
import { events } from '../../core/events.js';
import { uid, escapeHtml } from '../../core/utils.js';
import { renderHeader, bindHeaderEvents } from '../../components/header.js';
import { showModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';

export function managerStaffView() {
  const app = document.getElementById('app');

  function render() {
    const users = store.get('users') || [];

    app.innerHTML = `
      ${renderHeader()}
      <main class="app-main">
        <div class="view">
          <div class="view-header">
            <div>
              <div class="view-title">Staff Management</div>
              <div class="view-subtitle">Manage team members, roles, and PINs</div>
            </div>
            <button class="btn btn-primary btn-sm" id="add-staff-btn">+ Add Staff</button>
          </div>

          <div class="card" style="overflow:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>PIN</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:var(--sp-2);">
                        <div class="avatar" style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--clr-accent),var(--clr-accent-dark));display:flex;align-items:center;justify-content:center;color:#000;font-weight:var(--fw-bold);font-size:var(--fs-xs);">
                          ${u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span class="fw-semibold">${escapeHtml(u.name)}</span>
                      </div>
                    </td>
                    <td><span class="badge badge-${u.role === 'manager' ? 'ready' : u.role === 'waiter' ? 'open' : u.role === 'kitchen' ? 'cooking' : 'served'}">${u.role}</span></td>
                    <td class="text-muted" style="font-variant-numeric:tabular-nums;">${u.pin}</td>
                    <td>
                      <div class="toggle-wrap" data-toggle-user="${u.id}">
                        <div class="toggle ${u.active ? 'active' : ''}"></div>
                      </div>
                    </td>
                    <td>
                      <div style="display:flex;gap:var(--sp-2);">
                        <button class="btn btn-ghost btn-sm" data-edit-user="${u.id}">Edit</button>
                        <button class="btn btn-ghost btn-sm text-danger" data-delete-user="${u.id}">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    `;

    bindHeaderEvents();
    bindStaffEvents();
  }

  function bindStaffEvents() {
    document.getElementById('add-staff-btn').onclick = () => showStaffModal(null);

    document.querySelectorAll('[data-toggle-user]').forEach(el => {
      el.onclick = () => {
        const u = store.findById('users', el.dataset.toggleUser);
        if (u) {
          store.updateInArray('users', u.id, { active: !u.active });
          showToast(`${u.name} ${!u.active ? 'activated' : 'deactivated'}`, 'info');
          render();
        }
      };
    });

    document.querySelectorAll('[data-edit-user]').forEach(btn => {
      btn.onclick = () => {
        const u = store.findById('users', btn.dataset.editUser);
        if (u) showStaffModal(u);
      };
    });

    document.querySelectorAll('[data-delete-user]').forEach(btn => {
      btn.onclick = () => {
        if (confirm('Delete this staff member?')) {
          store.removeFromArray('users', btn.dataset.deleteUser);
          showToast('Staff removed', 'info');
          render();
        }
      };
    });
  }

  function showStaffModal(existing) {
    const bodyEl = document.createElement('div');
    bodyEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input class="input" id="staff-name" value="${existing ? escapeHtml(existing.name) : ''}" placeholder="Full name">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">PIN (4 digits)</label>
            <input class="input" id="staff-pin" maxlength="4" value="${existing ? existing.pin : ''}" placeholder="1234">
          </div>
          <div class="form-group">
            <label class="form-label">Role</label>
            <select class="select" id="staff-role">
              <option value="waiter" ${existing && existing.role === 'waiter' ? 'selected' : ''}>Waiter</option>
              <option value="kitchen" ${existing && existing.role === 'kitchen' ? 'selected' : ''}>Kitchen</option>
              <option value="cashier" ${existing && existing.role === 'cashier' ? 'selected' : ''}>Cashier</option>
              <option value="manager" ${existing && existing.role === 'manager' ? 'selected' : ''}>Manager</option>
            </select>
          </div>
        </div>
      </div>
    `;

    showModal({
      title: existing ? `Edit: ${existing.name}` : 'New Staff Member',
      body: bodyEl,
      footer: (footerEl, close) => {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = 'Save';
        saveBtn.onclick = () => {
          const name = document.getElementById('staff-name').value.trim();
          const pin = document.getElementById('staff-pin').value.trim();
          const role = document.getElementById('staff-role').value;
          if (!name || pin.length !== 4) { showToast('Name and 4-digit PIN required', 'error'); return; }

          if (existing) {
            store.updateInArray('users', existing.id, { name, pin, role });
            showToast(`${name} updated`, 'success');
          } else {
            store.push('users', { id: uid(), name, pin, role, active: true });
            showToast(`${name} added`, 'success');
          }
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

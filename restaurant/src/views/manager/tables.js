// ── Manager: Table Editor ───────────────────────────────────
import { store } from '../../core/store.js';
import { events } from '../../core/events.js';
import { uid, escapeHtml } from '../../core/utils.js';
import { renderHeader, bindHeaderEvents } from '../../components/header.js';
import { showModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';
import qrcode from 'qrcode-generator';

export function managerTablesView() {
  const app = document.getElementById('app');

  function render() {
    const tables = store.get('tables') || [];
    const sections = {};
    tables.forEach(t => {
      if (!sections[t.section]) sections[t.section] = [];
      sections[t.section].push(t);
    });

    app.innerHTML = `
      ${renderHeader()}
      <main class="app-main">
        <div class="view">
          <div class="view-header">
            <div>
              <div class="view-title">Table Management</div>
              <div class="view-subtitle">Add, edit, or remove tables and sections</div>
            </div>
            <button class="btn btn-primary btn-sm" id="add-table-btn">+ Add Table</button>
          </div>

          ${Object.entries(sections).map(([section, sTables]) => `
            <div style="margin-bottom:var(--sp-6);">
              <h3 style="font-size:var(--fs-sm);color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-3);">${escapeHtml(section)}</h3>
              <div class="card" style="overflow:auto;">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Table</th>
                      <th>Section</th>
                      <th>Capacity</th>
                      <th>Status</th>
                      <th>QR Code</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sTables.map(t => `
                      <tr>
                        <td class="fw-semibold">${escapeHtml(t.name)}</td>
                        <td class="text-muted">${escapeHtml(t.section)}</td>
                        <td>${t.capacity}</td>
                        <td><span class="badge badge-${t.status === 'occupied' ? 'cooking' : 'open'}">${t.status}</span></td>
                        <td>
                          <button class="btn btn-ghost btn-sm" data-qr="${t.id}">📱 QR</button>
                        </td>
                        <td>
                          <div style="display:flex;gap:var(--sp-2);">
                            <button class="btn btn-ghost btn-sm" data-edit-table="${t.id}">Edit</button>
                            <button class="btn btn-ghost btn-sm text-danger" data-delete-table="${t.id}">Delete</button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `).join('')}
        </div>
      </main>
    `;

    bindHeaderEvents();
    bindTableMgmtEvents();
  }

  function bindTableMgmtEvents() {
    const addBtn = document.getElementById('add-table-btn');
    if (addBtn) addBtn.onclick = () => showTableModal(null);

    document.querySelectorAll('[data-edit-table]').forEach(btn => {
      btn.onclick = () => {
        const t = store.findById('tables', btn.dataset.editTable);
        if (t) showTableModal(t);
      };
    });

    document.querySelectorAll('[data-delete-table]').forEach(btn => {
      btn.onclick = () => {
        if (confirm('Delete this table?')) {
          store.removeFromArray('tables', btn.dataset.deleteTable);
          events.emit('table:updated', {});
          showToast('Table deleted', 'info');
          render();
        }
      };
    });

    document.querySelectorAll('[data-qr]').forEach(btn => {
      btn.onclick = () => showQRModal(btn.dataset.qr);
    });
  }

  function showTableModal(existing) {
    const bodyEl = document.createElement('div');
    bodyEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
        <div class="form-group">
          <label class="form-label">Table Name</label>
          <input class="input" id="table-name" value="${existing ? escapeHtml(existing.name) : ''}" placeholder="e.g. Table 13">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Section</label>
            <input class="input" id="table-section" value="${existing ? escapeHtml(existing.section) : ''}" placeholder="e.g. Patio">
          </div>
          <div class="form-group">
            <label class="form-label">Capacity</label>
            <input class="input" id="table-capacity" type="number" value="${existing ? existing.capacity : 4}" min="1" max="20">
          </div>
        </div>
      </div>
    `;

    showModal({
      title: existing ? `Edit: ${existing.name}` : 'New Table',
      body: bodyEl,
      footer: (footerEl, close) => {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = 'Save';
        saveBtn.onclick = () => {
          const name = document.getElementById('table-name').value.trim();
          const section = document.getElementById('table-section').value.trim() || 'Main Floor';
          const capacity = parseInt(document.getElementById('table-capacity').value) || 4;
          if (!name) { showToast('Name required', 'error'); return; }

          if (existing) {
            store.updateInArray('tables', existing.id, { name, section, capacity });
            showToast(`${name} updated`, 'success');
          } else {
            store.push('tables', { id: uid(), name, section, capacity, status: 'available', sessionId: null, waiterId: null });
            showToast(`${name} added`, 'success');
          }
          events.emit('table:updated', {});
          close();
          render();
        };
        footerEl.appendChild(saveBtn);
      }
    });
  }

  function showQRModal(tableId) {
    const table = store.findById('tables', tableId);
    if (!table) return;

    // Persistent IP for mobile access
    let serverIp = localStorage.getItem('restroflow_server_ip') || location.hostname;
    if (serverIp === 'localhost') serverIp = ''; // Force user to enter real IP

    const bodyEl = document.createElement('div');
    bodyEl.innerHTML = `
      <div style="text-align:center;">
        <div class="form-group" style="margin-bottom:var(--sp-4);text-align:left;">
          <label class="form-label" style="font-size:var(--fs-xs);">Server Network IP (e.g. 192.168.1.5)</label>
          <div style="display:flex;gap:var(--sp-2);">
            <input class="input" id="qr-ip-input" value="${serverIp}" placeholder="Required for phone access">
            <button class="btn btn-secondary btn-sm" id="update-qr-btn">Update</button>
          </div>
          ${!serverIp ? `<p style="color:var(--clr-error);font-size:10px;margin-top:4px;">⚠️ Please enter your PC's Network IP so phones can connect!</p>` : ''}
        </div>
        <div id="qr-container" class="qr-card" style="display:inline-block;padding:var(--sp-4);background:white;border-radius:12px;">
            <!-- QR will be injected here -->
        </div>
        <div style="margin-top:var(--sp-4);">
          <div id="qr-url-display" class="text-dim" style="font-size:var(--fs-xs);word-break:break-all;"></div>
          <button class="btn btn-secondary btn-sm" style="margin-top:var(--sp-3);" onclick="window.print()">🖨 Print QR Card</button>
        </div>
      </div>
    `;

    function updateQR() {
      const ipInput = document.getElementById('qr-ip-input');
      const ip = ipInput ? ipInput.value.trim() : '';
      if (!ip) {
        showToast('Please enter a valid IP address', 'error');
        return;
      }
      localStorage.setItem('restroflow_server_ip', ip);

      const port = location.port ? `:${location.port}` : '';
      const url = `http://${ip}${port}${location.pathname}#/customer/table/${tableId}`;

      const qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();

      const qrContainer = document.getElementById('qr-container');
      const qrUrlDisplay = document.getElementById('qr-url-display');

      if (qrContainer) {
        qrContainer.innerHTML = `
                    ${qr.createSvgTag(5, 0)}
                    <p style="margin-top:var(--sp-3);color:#333;font-weight:var(--fw-bold);">${escapeHtml(table.name)}</p>
                    <p style="color:#666;font-size:var(--fs-xs);">Scan to view menu</p>
                `;
      }
      if (qrUrlDisplay) qrUrlDisplay.textContent = url;
      showToast('QR Code updated!', 'success');
    }

    const modal = showModal({
      title: `QR Code — ${table.name}`,
      body: bodyEl,
      large: false
    });

    // Bind events manually since showModal doesn't have onMount
    const updateBtn = modal.bodyEl.querySelector('#update-qr-btn');
    if (updateBtn) updateBtn.onclick = updateQR;
    if (serverIp) updateQR();
  }

  render();

  const unsub = events.on('store:changed', render);
  return () => unsub();
}

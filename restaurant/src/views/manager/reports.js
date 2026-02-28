// ── Manager: Reports ────────────────────────────────────────
import { store } from '../../core/store.js';
import { formatCurrency, formatDate, today } from '../../core/utils.js';
import { renderHeader, bindHeaderEvents } from '../../components/header.js';

export function managerReportsView() {
    const app = document.getElementById('app');
    let activeTab = 'sales';

    function render() {
        app.innerHTML = `
      ${renderHeader()}
      <main class="app-main">
        <div class="view">
          <div class="view-header">
            <div>
              <div class="view-title">Reports</div>
              <div class="view-subtitle">Sales analytics and operational data</div>
            </div>
          </div>

          <div class="tabs">
            <div class="tab ${activeTab === 'sales' ? 'active' : ''}" data-tab="sales">Sales</div>
            <div class="tab ${activeTab === 'items' ? 'active' : ''}" data-tab="items">Top Items</div>
            <div class="tab ${activeTab === 'staff' ? 'active' : ''}" data-tab="staff">Staff</div>
            <div class="tab ${activeTab === 'audit' ? 'active' : ''}" data-tab="audit">Audit Log</div>
          </div>

          <div id="report-content">
            ${renderTabContent()}
          </div>
        </div>
      </main>
    `;

        bindHeaderEvents();

        document.querySelectorAll('.tab').forEach(tab => {
            tab.onclick = () => { activeTab = tab.dataset.tab; render(); };
        });
    }

    function renderTabContent() {
        switch (activeTab) {
            case 'sales': return renderSalesReport();
            case 'items': return renderItemsReport();
            case 'staff': return renderStaffReport();
            case 'audit': return renderAuditLog();
            default: return '';
        }
    }

    function renderSalesReport() {
        const bills = store.get('bills') || [];
        const todayStr = today();

        // Group by date
        const byDate = {};
        bills.forEach(b => {
            const date = (b.closedAt || '').slice(0, 10);
            if (!byDate[date]) byDate[date] = { total: 0, count: 0 };
            byDate[date].total += b.total;
            byDate[date].count++;
        });

        const dates = Object.keys(byDate).sort().reverse().slice(0, 14);
        const todayData = byDate[todayStr] || { total: 0, count: 0 };

        return `
      <div class="stats-grid" style="margin-bottom:var(--sp-4);">
        <div class="stat-card amber">
          <div class="stat-label">Today</div>
          <div class="stat-value">${formatCurrency(todayData.total)}</div>
          <div class="stat-sub">${todayData.count} transactions</div>
        </div>
        <div class="stat-card green">
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value">${formatCurrency(bills.reduce((s, b) => s + b.total, 0))}</div>
          <div class="stat-sub">${bills.length} total transactions</div>
        </div>
      </div>

      <div class="card" style="overflow:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Transactions</th>
              <th>Revenue</th>
              <th>Avg Ticket</th>
            </tr>
          </thead>
          <tbody>
            ${dates.length === 0 ? '<tr><td colspan="4" class="text-center text-dim" style="padding:var(--sp-8);">No sales data yet</td></tr>' : ''}
            ${dates.map(d => `
              <tr>
                <td class="fw-semibold">${d === todayStr ? 'Today' : formatDate(d)}</td>
                <td>${byDate[d].count}</td>
                <td class="fw-bold text-accent">${formatCurrency(byDate[d].total)}</td>
                <td class="text-muted">${formatCurrency(Math.round(byDate[d].total / byDate[d].count))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    }

    function renderItemsReport() {
        const orders = store.get('orders') || [];
        const itemCounts = {};
        const itemRevenue = {};

        orders.forEach(o => {
            (o.items || []).forEach(i => {
                itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty;
                itemRevenue[i.name] = (itemRevenue[i.name] || 0) + i.price * i.qty;
            });
        });

        const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);

        return `
      <div class="card" style="overflow:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Qty Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.length === 0 ? '<tr><td colspan="4" class="text-center text-dim" style="padding:var(--sp-8);">No data yet</td></tr>' : ''}
            ${sorted.map(([name, count], idx) => `
              <tr>
                <td class="text-muted">${idx + 1}</td>
                <td class="fw-semibold">${name}</td>
                <td>${count}</td>
                <td class="fw-bold text-accent">${formatCurrency(itemRevenue[name] || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    }

    function renderStaffReport() {
        const users = store.get('users') || [];
        const orders = store.get('orders') || [];
        const bills = store.get('bills') || [];
        const sessions = store.get('sessions') || [];

        // Count orders per waiter
        const waiterStats = {};
        users.filter(u => u.role === 'waiter').forEach(u => {
            const waiterSessions = sessions.filter(s => s.waiterId === u.id);
            const sessionIds = waiterSessions.map(s => s.id);
            const waiterOrders = orders.filter(o => sessionIds.includes(o.sessionId));
            const totalItems = waiterOrders.reduce((sum, o) => sum + (o.items ? o.items.length : 0), 0);

            waiterStats[u.id] = {
                name: u.name,
                sessions: waiterSessions.length,
                orders: waiterOrders.length,
                items: totalItems
            };
        });

        return `
      <div class="card" style="overflow:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Tables Served</th>
              <th>Orders</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            ${Object.values(waiterStats).length === 0 ? '<tr><td colspan="4" class="text-center text-dim" style="padding:var(--sp-8);">No data</td></tr>' : ''}
            ${Object.values(waiterStats).map(s => `
              <tr>
                <td class="fw-semibold">${s.name}</td>
                <td>${s.sessions}</td>
                <td>${s.orders}</td>
                <td>${s.items}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    }

    function renderAuditLog() {
        const log = (store.get('auditLog') || []).slice().reverse();
        const users = store.get('users') || [];

        return `
      <div class="card" style="overflow:auto;max-height:500px;">
        <div style="padding:var(--sp-4);">
          ${log.length === 0 ? '<div class="text-center text-dim" style="padding:var(--sp-8);">No activity recorded yet</div>' : ''}
          ${log.map(entry => {
            const user = users.find(u => u.id === entry.userId);
            const time = new Date(entry.timestamp);
            return `
              <div class="log-entry">
                <span class="log-time">${time.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span class="log-action">${entry.action}</span>
                <span class="log-detail">${entry.details}${user ? ` (${user.name})` : ''}</span>
              </div>
            `;
        }).join('')}
        </div>
      </div>
    `;
    }

    render();
}

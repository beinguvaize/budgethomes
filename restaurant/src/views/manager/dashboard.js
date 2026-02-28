// ── Manager: Dashboard ──────────────────────────────────────
import { store } from '../../core/store.js';
import { events } from '../../core/events.js';
import { formatCurrency, today } from '../../core/utils.js';
import { renderHeader, bindHeaderEvents } from '../../components/header.js';

export function managerDashboardView() {
  const app = document.getElementById('app');
  let interval;

  function render() {
    const tables = store.get('tables') || [];
    const orders = store.get('orders') || [];
    const bills = store.get('bills') || [];
    const todayStr = today();

    const activeTables = tables.filter(t => t.status === 'occupied').length;
    const totalTables = tables.length;

    const activeOrders = orders.filter(o => o.status === 'active');
    const todayBills = bills.filter(b => b.closedAt && b.closedAt.startsWith(todayStr));
    const todayRevenue = todayBills.reduce((sum, b) => sum + b.total, 0);

    const todayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(todayStr));
    const totalItemsToday = todayOrders.reduce((sum, o) => sum + (o.items ? o.items.length : 0), 0);

    // Popular items today
    const itemCounts = {};
    todayOrders.forEach(o => {
      (o.items || []).forEach(i => {
        itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty;
      });
    });
    const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxItemCount = topItems.length > 0 ? topItems[0][1] : 1;

    // Recent audit log
    const auditLog = (store.get('auditLog') || []).slice(-10).reverse();

    app.innerHTML = `
      ${renderHeader()}
      <main class="app-main">
        <div class="view">
          <div class="view-header">
            <div>
              <div class="view-title">Dashboard</div>
              <div class="view-subtitle">Today's overview</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card amber">
              <div class="stat-label">Today's Revenue</div>
              <div class="stat-value">${formatCurrency(todayRevenue)}</div>
              <div class="stat-sub">${todayBills.length} bills closed</div>
            </div>
            <div class="stat-card green">
              <div class="stat-label">Active Tables</div>
              <div class="stat-value">${activeTables} / ${totalTables}</div>
              <div class="stat-sub">${Math.round(activeTables / totalTables * 100)}% occupied</div>
            </div>
            <div class="stat-card blue">
              <div class="stat-label">Active Orders</div>
              <div class="stat-value">${activeOrders.length}</div>
              <div class="stat-sub">${totalItemsToday} items today</div>
            </div>
            <div class="stat-card purple">
              <div class="stat-label">Avg Ticket</div>
              <div class="stat-value">${todayBills.length > 0 ? formatCurrency(Math.round(todayRevenue / todayBills.length)) : '$0.00'}</div>
              <div class="stat-sub">per table</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);">
            <div class="chart-container">
              <h3 style="font-size:var(--fs-sm);font-weight:var(--fw-bold);margin-bottom:var(--sp-4);">Top Items Today</h3>
              ${topItems.length === 0 ? `<div class="text-dim text-center" style="padding:var(--sp-8);">No orders yet today</div>` : `
                <div class="bar-chart" style="height:160px;">
                  ${topItems.map(([name, count]) => `
                    <div class="bar" style="height:${Math.max(8, (count / maxItemCount) * 100)}%;">
                      <div class="bar-value">${count}</div>
                      <div class="bar-label">${name.length > 10 ? name.slice(0, 10) + '…' : name}</div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>

            <div class="card">
              <div class="card-header">Recent Activity</div>
              <div class="card-body" style="max-height:260px;overflow:auto;padding:0 var(--sp-4);">
                ${auditLog.length === 0 ? `<div class="text-dim text-center" style="padding:var(--sp-6);">No activity yet</div>` : `
                  ${auditLog.map(entry => {
      const time = new Date(entry.timestamp);
      return `
                      <div class="log-entry">
                        <span class="log-time">${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span class="log-action"><b>${entry.userName || 'System'}</b>: ${entry.action}</span>
                        <span class="log-detail">${entry.details || ''}</span>
                      </div>
                    `;
    }).join('')}
                `}
              </div>
            </div>
          </div>
        </div>
      </main>
    `;

    bindHeaderEvents();
  }

  render();

  const unsub = events.on('store:changed', () => { store.reload(); render(); });
  interval = setInterval(render, 15000);

  return () => { unsub(); clearInterval(interval); };
}

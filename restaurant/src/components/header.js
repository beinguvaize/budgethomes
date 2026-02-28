// ── Header component (role-aware navigation) ───────────────
import { h } from '../core/utils.js';
import { auth, roleDefaultRoute } from '../core/auth.js';
import { router } from '../core/router.js';

const NAV_CONFIG = {
    waiter: [
        { path: 'waiter/tables', label: 'Tables', icon: 'grid' },
        { path: 'waiter/status', label: 'Orders', icon: 'list' },
    ],
    kitchen: [
        { path: 'kitchen', label: 'Kitchen', icon: 'flame' },
    ],
    cashier: [
        { path: 'cashier', label: 'Billing', icon: 'receipt' },
    ],
    manager: [
        { path: 'manager/dashboard', label: 'Dashboard', icon: 'chart' },
        { path: 'manager/menu', label: 'Menu', icon: 'book' },
        { path: 'manager/tables', label: 'Tables', icon: 'grid' },
        { path: 'manager/staff', label: 'Staff', icon: 'users' },
        { path: 'manager/reports', label: 'Reports', icon: 'bar-chart' },
    ],
};

const ICONS = {
    grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    list: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    flame: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    receipt: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>',
    chart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
    book: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    users: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'bar-chart': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
    logout: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
};

export function renderHeader() {
    const user = auth.getCurrentUser();
    if (!user) return '';

    const navLinks = NAV_CONFIG[user.role] || [];
    const currentPath = router.getCurrentPath();

    const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return `
    <header class="app-header">
      <div class="app-logo">
        <span>Restro</span>Flow
      </div>
      <nav class="app-nav" id="main-nav">
        ${navLinks.map(n => `
          <a href="#/${n.path}" class="${currentPath === n.path || currentPath.startsWith(n.path + '/') ? 'active' : ''}" data-path="${n.path}">
            ${ICONS[n.icon] || ''}
            <span>${n.label}</span>
          </a>
        `).join('')}
        <div style="width:1px;height:24px;background:var(--clr-border);margin:0 4px" class="hide-mobile"></div>
        <div class="user-badge hide-mobile">
          <div class="avatar">${initials}</div>
          ${user.name}
        </div>
        <button id="logout-btn" title="Logout">
          ${ICONS.logout}
        </button>
      </nav>
    </header>
  `;
}

export function bindHeaderEvents() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            auth.logout();
            router.navigate('login');
        };
    }
}

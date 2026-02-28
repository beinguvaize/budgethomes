// ── Authentication ──────────────────────────────────────────
import { store } from './store.js';
import { events } from './events.js';

const SESSION_KEY = 'restroflow_session';

export const auth = {
    getCurrentUser() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (raw) return JSON.parse(raw);
        } catch (_) { }
        return null;
    },

    login(pin) {
        const users = store.get('users') || [];
        const user = users.find(u => u.pin === pin && u.active);
        if (!user) return null;
        const session = { id: user.id, name: user.name, role: user.role };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        events.emit('auth:login', session, false);

        // Audit log
        store.push('auditLog', {
            id: Date.now().toString(36),
            userId: user.id,
            action: 'LOGIN',
            details: `${user.name} logged in`,
            timestamp: new Date().toISOString()
        });

        return session;
    },

    logout() {
        const user = this.getCurrentUser();
        if (user) {
            store.push('auditLog', {
                id: Date.now().toString(36),
                userId: user.id,
                action: 'LOGOUT',
                details: `${user.name} logged out`,
                timestamp: new Date().toISOString()
            });
        }
        sessionStorage.removeItem(SESSION_KEY);
        events.emit('auth:logout', null, false);
    },

    isLoggedIn() {
        return !!this.getCurrentUser();
    },

    hasRole(...roles) {
        const user = this.getCurrentUser();
        if (!user) return false;
        return roles.includes(user.role);
    },

    guard(roles) {
        if (!this.isLoggedIn()) return 'login';
        if (roles && !this.hasRole(...roles)) {
            // Redirect to their default view
            const user = this.getCurrentUser();
            return roleDefaultRoute(user.role);
        }
        return null;
    }
};

export function roleDefaultRoute(role) {
    switch (role) {
        case 'waiter': return 'waiter/tables';
        case 'kitchen': return 'kitchen';
        case 'cashier': return 'cashier';
        case 'manager': return 'manager/dashboard';
        default: return 'login';
    }
}

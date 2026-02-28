// ── Hash-based SPA Router ───────────────────────────────────
import { auth, roleDefaultRoute } from './auth.js';

const routes = {};
let currentCleanup = null;

export const router = {
    register(path, handler, roles = null) {
        routes[path] = { handler, roles };
    },

    navigate(path) {
        location.hash = '#/' + path;
    },

    getCurrentPath() {
        return (location.hash || '#/').slice(2) || 'login';
    },

    async resolve() {
        const path = this.getCurrentPath();

        // Customer view doesn't need auth
        if (path.startsWith('customer/')) {
            const isAnchor = location.hash.includes('#cat-');
            if (isAnchor) return; // Let browser handle anchors
            await this._mount(path);
            return;
        }

        // Check auth
        if (path !== 'login' && !auth.isLoggedIn()) {
            this.navigate('login');
            return;
        }

        // If logged in and going to login, redirect to default
        if (path === 'login' && auth.isLoggedIn()) {
            const user = auth.getCurrentUser();
            this.navigate(roleDefaultRoute(user.role));
            return;
        }

        await this._mount(path);
    },

    async _mount(path) {
        // Cleanup previous view
        if (currentCleanup) {
            try { currentCleanup(); } catch (_) { }
            currentCleanup = null;
        }

        // Find matching route
        let route = routes[path];

        // Try dynamic matching (e.g. waiter/order/:id)
        if (!route) {
            for (const [pattern, r] of Object.entries(routes)) {
                const regex = new RegExp('^' + pattern.replace(/:([^/]+)/g, '([^/]+)') + '$');
                const match = path.match(regex);
                if (match) {
                    route = r;
                    route._params = match.slice(1);
                    break;
                }
            }
        }

        if (!route) {
            // Fallback
            const user = auth.getCurrentUser();
            if (user) this.navigate(roleDefaultRoute(user.role));
            else this.navigate('login');
            return;
        }

        // Check role
        if (route.roles) {
            const redirect = auth.guard(route.roles);
            if (redirect) {
                this.navigate(redirect);
                return;
            }
        }

        // Mount
        const params = route._params || [];
        const cleanup = await route.handler(...params);
        if (typeof cleanup === 'function') {
            currentCleanup = cleanup;
        }
    },

    start() {
        window.addEventListener('hashchange', () => this.resolve());
        this.resolve();
    }
};

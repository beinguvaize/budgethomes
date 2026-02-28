// ── Centralized Store — Server-authoritative ────────────────
// The PC (WebSocket server) is the single source of truth.
// This client store syncs from the server and sends mutations to it.
import { events } from './events.js';
import { seedData } from '../data/seed.js';

const STORAGE_KEY = 'restroflow_data';

let _state = null;
let _serverConnected = false;

function loadLocal() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (_) { }
    return seedData();
}

function saveLocal() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
    } catch (_) { }
}

// Helper: set a deep path
function setPath(obj, pathStr, value) {
    const parts = pathStr.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]] == null) current[parts[i]] = {};
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

export const store = {
    init() {
        // Load local as fallback while waiting for server
        _state = loadLocal();

        // Listen for server state
        events.on('server:full-state', (serverState) => {
            console.log('[Store] Received full state from server');
            _state = serverState;
            saveLocal();
            _serverConnected = true;
            // Notify all views to re-render
            events.emit('store:changed', { path: '*', value: null }, true);
        });

        events.on('server:state-change', ({ path, value }) => {
            setPath(_state, path, value);
            saveLocal();
            // Notify all views to re-render
            events.emit('store:changed', { path, value }, true);
        });

        // Connect to WebSocket server
        events.connectWS();
    },

    get(path) {
        if (!path) return _state;
        const parts = path.split('.');
        let obj = _state;
        for (const p of parts) {
            if (obj == null) return undefined;
            obj = obj[p];
        }
        return obj;
    },

    set(path, value) {
        // Update local state immediately for responsiveness
        setPath(_state, path, value);
        saveLocal();

        // Send mutation to server (server will broadcast back to all clients)
        events.sendToServer(path, value);

        // Also emit locally for same-tab reactivity
        events.emit('store:changed', { path, value }, true);
    },

    push(path, item) {
        const arr = this.get(path) || [];
        arr.push(item);
        this.set(path, arr);
        return item;
    },

    updateInArray(path, id, updates) {
        const arr = this.get(path) || [];
        const idx = arr.findIndex(x => x.id === id);
        if (idx === -1) return null;
        arr[idx] = { ...arr[idx], ...updates };
        this.set(path, arr);
        return arr[idx];
    },

    removeFromArray(path, id) {
        const arr = this.get(path) || [];
        this.set(path, arr.filter(x => x.id !== id));
    },

    findById(path, id) {
        const arr = this.get(path) || [];
        return arr.find(x => x.id === id);
    },

    reset() {
        _state = seedData();
        saveLocal();
    },

    // No-op now — state is auto-synced from server
    reload() { }
};

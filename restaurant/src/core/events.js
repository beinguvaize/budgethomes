// ── Event system: in-tab + cross-tab + cross-device (server-authoritative) ──

class EventBus {
    constructor() {
        this._listeners = {};
        this._channel = null;
        this._ws = null;
        this._wsRetryTimer = null;
        this._wsReady = false;

        // BroadcastChannel for same-browser cross-tab sync
        try {
            this._channel = new BroadcastChannel('restroflow-sync');
            this._channel.onmessage = (e) => {
                if (e.data && e.data.__event) {
                    this._dispatch(e.data.__event, e.data.payload, true);
                }
            };
        } catch (_) { }

        // WebSocket for cross-device sync (connects in store.init)
    }

    connectWS() {
        try {
            const wsHost = location.hostname || 'localhost';
            this._ws = new WebSocket(`ws://${wsHost}:3001`);

            this._ws.onopen = () => {
                console.log('[WS] Connected to server');
                this._wsReady = true;
                this._dispatch('ws:connected', null, false);
            };

            this._ws.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);

                    if (msg.type === 'FULL_STATE') {
                        // Server sent full authoritative state
                        this._dispatch('server:full-state', msg.state, false);
                    } else if (msg.type === 'STATE_CHANGE') {
                        // Server broadcast a state change
                        this._dispatch('server:state-change', { path: msg.path, value: msg.value }, false);
                    } else if (msg.type === 'EVENT' && msg.event) {
                        // Custom event relayed from another device
                        this._dispatch(msg.event, msg.payload, true);
                    }
                } catch (_) { }
            };

            this._ws.onclose = () => {
                console.log('[WS] Disconnected — retrying in 3s');
                this._ws = null;
                this._wsReady = false;
                clearTimeout(this._wsRetryTimer);
                this._wsRetryTimer = setTimeout(() => this.connectWS(), 3000);
            };

            this._ws.onerror = () => { };
        } catch (_) {
            this._wsReady = false;
            clearTimeout(this._wsRetryTimer);
            this._wsRetryTimer = setTimeout(() => this.connectWS(), 5000);
        }
    }

    on(event, fn) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(fn);
        return () => this.off(event, fn);
    }

    off(event, fn) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(f => f !== fn);
    }

    // Send a state mutation to the server
    sendToServer(path, value) {
        if (this._ws && this._ws.readyState === WebSocket.OPEN) {
            this._ws.send(JSON.stringify({ type: 'SET', path, value }));
        }
    }

    // Send a custom event to other devices
    emitRemote(event, payload) {
        if (this._ws && this._ws.readyState === WebSocket.OPEN) {
            this._ws.send(JSON.stringify({ type: 'EVENT', event, payload }));
        }
    }

    createOrder(order) {
        if (this._ws && this._ws.readyState === WebSocket.OPEN) {
            this._ws.send(JSON.stringify({ type: 'CREATE_ORDER', order }));
        }
    }

    dismissOrder(orderNumber) {
        if (this._ws && this._ws.readyState === WebSocket.OPEN) {
            this._ws.send(JSON.stringify({ type: 'EVENT', event: 'order:dismissed', payload: { orderNumber } }));
        }
    }

    emit(event, payload, broadcast = true) {
        this._dispatch(event, payload, false);
        if (broadcast) {
            // BroadcastChannel (same-browser tabs)
            if (this._channel) {
                try { this._channel.postMessage({ __event: event, payload }); } catch (_) { }
            }
        }
    }

    _dispatch(event, payload, fromBroadcast) {
        const fns = this._listeners[event] || [];
        for (const fn of fns) {
            try { fn(payload, fromBroadcast); } catch (err) { console.error(`Event handler error [${event}]:`, err); }
        }
        const wildcards = this._listeners['*'] || [];
        for (const fn of wildcards) {
            try { fn({ event, payload }, fromBroadcast); } catch (_) { }
        }
    }
}

export const events = new EventBus();

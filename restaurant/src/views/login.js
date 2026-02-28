// ── Login View ──────────────────────────────────────────────
import { auth, roleDefaultRoute } from '../core/auth.js';
import { router } from '../core/router.js';
import { $ } from '../core/utils.js';
import { showToast } from '../components/toast.js';

export function loginView() {
    const app = document.getElementById('app');
    let pin = '';

    function render() {
        app.innerHTML = `
      <div class="login-screen">
        <div class="login-card">
          <h1><span>Restro</span>Flow</h1>
          <p>Enter your PIN to sign in</p>
          <div class="pin-display" id="pin-display">
            ${[0, 1, 2, 3].map(i => `<div class="pin-dot ${i < pin.length ? 'filled' : ''}"></div>`).join('')}
          </div>
          <div class="pin-pad" id="pin-pad">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<div class="pin-key" data-key="${n}">${n}</div>`).join('')}
            <div class="pin-key fn" data-key="clear">CLR</div>
            <div class="pin-key" data-key="0">0</div>
            <div class="pin-key fn" data-key="back">⌫</div>
          </div>
          <div id="login-error"></div>
          <div style="margin-top: var(--sp-6); color: var(--clr-text-dim); font-size: var(--fs-xs);">
            <div style="margin-bottom: var(--sp-2);">Demo PINs:</div>
            <div style="display:flex; gap: var(--sp-4); justify-content: center; flex-wrap: wrap;">
              <span>Manager: 1111</span>
              <span>Waiter: 2222</span>
              <span>Kitchen: 4444</span>
              <span>Cashier: 5555</span>
            </div>
          </div>
        </div>
      </div>
    `;
        bindEvents();
    }

    function bindEvents() {
        const pad = document.getElementById('pin-pad');
        pad.addEventListener('click', (e) => {
            const key = e.target.closest('[data-key]');
            if (!key) return;
            const val = key.dataset.key;

            if (val === 'clear') {
                pin = '';
            } else if (val === 'back') {
                pin = pin.slice(0, -1);
            } else if (pin.length < 4) {
                pin += val;
            }

            updateDots();

            if (pin.length === 4) {
                setTimeout(tryLogin, 200);
            }
        });
    }

    function updateDots() {
        const dots = document.querySelectorAll('.pin-dot');
        dots.forEach((d, i) => {
            d.classList.toggle('filled', i < pin.length);
        });
    }

    function tryLogin() {
        const user = auth.login(pin);
        if (user) {
            showToast(`Welcome, ${user.name}!`, 'success');
            router.navigate(roleDefaultRoute(user.role));
        } else {
            const errEl = document.getElementById('login-error');
            errEl.innerHTML = '<div class="login-error">Invalid PIN. Try again.</div>';
            pin = '';
            updateDots();
        }
    }

    render();
}

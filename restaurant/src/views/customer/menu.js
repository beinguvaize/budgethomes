// ── Customer: Premium Otter-Style Menu View ──────────────────
import { store } from '../../core/store.js';
import { events } from '../../core/events.js';
import { uid, formatCurrency, escapeHtml } from '../../core/utils.js';
import { showToast } from '../../components/toast.js';

export function customerTableView(tableId) {
  const app = document.getElementById('app');

  function render() {
    const table = store.findById('tables', tableId);
    const categories = (store.get('categories') || []).sort((a, b) => a.sortOrder - b.sortOrder);
    const menuItems = store.get('menuItems') || [];
    const settings = store.get('settings') || {};

    const featuredItems = menuItems.filter(m => m.featured && m.available);

    app.innerHTML = `
      <div class="customer-view">
        <!-- Sticky Header -->
        <header class="customer-header">
          <div class="brand">
            <span class="logo-icon">RF</span>
            <div>
              <h1>${escapeHtml(settings.restaurantName || 'RestroFlow')}</h1>
              <div style="display:flex;gap:var(--sp-2);align-items:center;">
                <p>${table ? escapeHtml(table.name) : 'Welcome'}</p>
                ${(() => {
        const activeOrder = (store.get('orders') || []).find(o => o.tableId === tableId && o.status === 'active');
        return activeOrder ? `<span class="badge badge-cooking" style="font-size:10px;">Order #${activeOrder.orderNumber}</span>` : '';
      })()}
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button class="call-btn" id="call-waiter-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
          </div>
        </header>

        <div class="customer-content">
          <!-- Promotions / Recommendations section -->
          ${featuredItems.length > 0 ? `
            <section class="featured-section">
              <div class="section-title">
                <h2>Specially for You</h2>
                <span>Top Deals</span>
              </div>
              <div class="featured-scroll">
                ${featuredItems.map(item => `
                  <div class="featured-card">
                    <img src="${item.image || '/images/vite.svg'}" alt="${escapeHtml(item.name)}" onerror="this.src='/images/vite.svg'">
                    <div class="featured-info">
                      <h3>${escapeHtml(item.name)}</h3>
                      <div class="price">${formatCurrency(item.price)}</div>
                    </div>
                    <div class="featured-tag">Highly Rated</div>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          <!-- Sticky Category Nav -->
          <nav class="sticky-cat-nav" id="cat-nav">
            ${categories.map((cat, i) => `
              <button class="cat-link ${i === 0 ? 'active' : ''}" data-section="cat-${cat.id}">${cat.name}</button>
            `).join('')}
          </nav>

          <!-- Menu Categories -->
          <div class="menu-sections">
            ${categories.map(cat => {
        const items = menuItems.filter(m => m.categoryId === cat.id && m.available);
        if (items.length === 0) return '';
        return `
                <section id="cat-${cat.id}" class="menu-section">
                  <h2 class="section-heading">${cat.icon} ${escapeHtml(cat.name)}</h2>
                  <div class="premium-grid">
                    ${items.map(item => `
                      <div class="premium-item">
                        <div class="item-details">
                          <div class="item-name">${escapeHtml(item.name)}</div>
                          <div class="item-desc">${escapeHtml(item.description || '')}</div>
                          <div class="item-price">${formatCurrency(item.price)}</div>
                        </div>
                        <div class="item-media">
                          <img src="${item.image || '/images/vite.svg'}" alt="${escapeHtml(item.name)}" onerror="this.src='/images/vite.svg'">
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </section>
              `;
      }).join('')}
          </div>

          <footer class="customer-footer">
            <p>Prices include taxes and charges</p>
            <p>© ${new Date().getFullYear()} ${escapeHtml(settings.restaurantName)}</p>
          </footer>
        </div>
      </div>
    `;

    setupInteractions();
  }

  function setupInteractions() {
    // Category navigation via buttons instead of anchors to avoid router conflicts
    document.querySelectorAll('.cat-link').forEach(btn => {
      btn.onclick = () => {
        const sectionId = btn.getAttribute('data-section');
        const section = document.getElementById(sectionId);
        const content = document.querySelector('.customer-view');
        if (section && content) {
          content.scrollTo({
            top: section.offsetTop - 110,
            behavior: 'smooth'
          });
        }
      };
    });

    const callBtn = document.getElementById('call-waiter-btn');
    if (callBtn) {
      callBtn.onclick = () => {
        const table = store.findById('tables', tableId);
        if (table) {
          events.emitRemote('call-waiter', { tableId, tableName: table.name });
          showToast('The waiter is on their way!', 'success');
          callBtn.classList.add('disabled');
          setTimeout(() => callBtn.classList.remove('disabled'), 30000);
        }
      };
    }

    // Scroll logic for category highlighing
    const sections = document.querySelectorAll('.menu-section');
    const navLinks = document.querySelectorAll('.cat-link');
    const content = document.querySelector('.customer-view');

    if (content) {
      content.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
          const sectionTop = section.offsetTop;
          if (content.scrollTop >= sectionTop - 120) {
            current = section.getAttribute('id');
          }
        });

        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('data-section') === current) {
            link.classList.add('active');
          }
        });
      });
    }
  }

  render();

  // Subscribe to store changes (centralized database sync)
  const unsub = events.on('store:changed', render);
  return unsub;
}

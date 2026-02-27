/**
 * Budget Homes – prices.js
 * ─────────────────────────────────────────────────────────
 * Include this script at the bottom of index.html (before </body>)
 * to have admin-saved prices AND gallery photos automatically
 * display on the site.
 *
 *   <script src="prices.js"></script>
 *
 * Works together with admin.html – data is stored in localStorage.
 * ─────────────────────────────────────────────────────────
 */

(function () {

  // ── PRICES ───────────────────────────────────────────────
  const STORAGE_KEY = 'bh_prices_v1';

  (function applyPrices() {
    let prices;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      prices = JSON.parse(raw);
    } catch (e) { return; }

    function fmt(n) {
      return '₹' + Number(n).toLocaleString('en-IN');
    }

    const roomKeys  = ['unit1', 'unit2', 'unit3', 'unit4', 'unit5'];
    const roomCards = document.querySelectorAll('.rooms-grid .room-card');

    roomKeys.forEach((key, idx) => {
      if (!prices[key]) return;
      const card = roomCards[idx];
      if (!card) return;
      const priceEl = card.querySelector('.room-price');
      if (priceEl) priceEl.innerHTML = fmt(prices[key].price) + '<span>/night</span>';
    });

    if (prices['pg']) {
      const pgCard = roomCards[roomCards.length - 1];
      if (pgCard) {
        const priceEl = pgCard.querySelector('.room-price');
        if (priceEl) priceEl.innerHTML = fmt(prices['pg'].price) + '<span>/month</span>';
      }
    }

    const sf = prices.startingFrom || (prices.unit1 && prices.unit1.price);
    if (sf) {
      const amtEl = document.querySelector('.price-tag .amt');
      if (amtEl) amtEl.textContent = fmt(sf);

      const heroSub = document.querySelector('.hero-sub');
      if (heroSub) {
        heroSub.innerHTML = heroSub.innerHTML.replace(/₹[\d,]+\/night/, fmt(sf) + '/night');
      }

      const aboutDesc = document.querySelector('.about-feat-desc');
      if (aboutDesc) {
        aboutDesc.innerHTML = aboutDesc.innerHTML.replace(/₹[\d,]+\/night/, fmt(sf) + '/night');
      }
    }
  })();

  // ── GALLERY ──────────────────────────────────────────────
  const GALLERY_KEY = 'bh_gallery_v1';

  (function applyGallery() {
    let photos;
    try {
      const raw = localStorage.getItem(GALLERY_KEY);
      if (!raw) return;
      photos = JSON.parse(raw);
    } catch (e) { return; }

    if (!Array.isArray(photos) || photos.length === 0) return;

    const galleryItems = document.querySelectorAll('.gallery-grid .gallery-item');

    // Update existing items
    galleryItems.forEach((item, idx) => {
      if (!photos[idx]) {
        // More items in HTML than in saved photos – hide extras
        item.style.display = 'none';
        return;
      }
      item.style.display = '';
      const img = item.querySelector('img');
      if (img) {
        img.src = photos[idx].src;
        img.alt = photos[idx].alt || '';
      }
    });

    // If saved gallery has MORE photos than original HTML items, inject new ones
    if (photos.length > galleryItems.length) {
      const grid = document.querySelector('.gallery-grid');
      if (!grid) return;
      for (let i = galleryItems.length; i < photos.length; i++) {
        const div = document.createElement('div');
        div.className = 'gallery-item reveal';
        div.innerHTML = `
          <img src="${photos[i].src}" alt="${photos[i].alt || ''}" loading="lazy" />
          <div class="gallery-overlay"><span class="gallery-zoom">View Photo</span></div>
        `;
        grid.appendChild(div);
      }
    }
  })();

})();

/**
 * Budget Homes – prices.js
 * ─────────────────────────────────────────────────────────
 * Include this script at the bottom of index.html (before </body>)
 * to have admin-saved prices automatically display on the site.
 *
 *   <script src="prices.js"></script>
 *
 * Works together with admin.html – prices are stored in localStorage
 * under the key "bh_prices_v1".
 * ─────────────────────────────────────────────────────────
 */

(function () {
  const STORAGE_KEY = 'bh_prices_v1';

  let prices;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return; // No saved prices – use HTML defaults
    prices = JSON.parse(raw);
  } catch (e) {
    return; // Parse error – use HTML defaults
  }

  // Helper: format Indian rupee number
  function fmt(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  // ── Map admin keys to room-card indices (0-based) ──
  // Room cards appear in DOM order: Unit1, Unit2, Unit3, Unit4, Unit5, PG
  const roomKeys = ['unit1', 'unit2', 'unit3', 'unit4', 'unit5'];
  const pgKey    = 'pg';

  const roomCards = document.querySelectorAll('.rooms-grid .room-card');

  // Update nightly room prices
  roomKeys.forEach((key, idx) => {
    if (!prices[key]) return;
    const card = roomCards[idx];
    if (!card) return;
    const priceEl = card.querySelector('.room-price');
    if (priceEl) {
      priceEl.innerHTML = fmt(prices[key].price) + '<span>/night</span>';
    }
  });

  // Update PG price (last card)
  if (prices[pgKey]) {
    const pgCard = roomCards[roomCards.length - 1];
    if (pgCard) {
      const priceEl = pgCard.querySelector('.room-price');
      if (priceEl) {
        priceEl.innerHTML = fmt(prices[pgKey].price) + '<span>/month</span>';
      }
    }
  }

  // ── Update "starting from" in booking section ──
  const sf = prices.startingFrom || (prices.unit1 && prices.unit1.price);
  if (sf) {
    // Booking section price tag
    const amtEl = document.querySelector('.price-tag .amt');
    if (amtEl) amtEl.textContent = fmt(sf);

    // Hero sub-heading (updates the ₹1,200 mention)
    const heroSub = document.querySelector('.hero-sub');
    if (heroSub) {
      heroSub.innerHTML = heroSub.innerHTML.replace(
        /₹[\d,]+\/night/,
        fmt(sf) + '/night'
      );
    }

    // About section "Starting from just ₹X/night"
    const aboutDesc = document.querySelector('.about-feat-desc');
    if (aboutDesc) {
      aboutDesc.innerHTML = aboutDesc.innerHTML.replace(
        /₹[\d,]+\/night/,
        fmt(sf) + '/night'
      );
    }
  }

})();

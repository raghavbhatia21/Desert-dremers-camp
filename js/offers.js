/* ============================================================
   ROYAL HERITAGE RESORT — Special Offers Dynamic Loader
   ============================================================
   Queries Firestore for active promotions. If none are found
   or database is offline, preserves hardcoded fallback cards.
   ============================================================ */

'use strict';

(() => {
  const grid = document.getElementById('offers-grid');
  if (!grid) return;

  // Render offer cards dynamically
  function renderOffers(offers) {
    grid.textContent = ''; // Clear default hardcoded offers
    
    offers.forEach(o => {
      // Determine badge class by type
      let badgeClass = 'badge-gold';
      const type = (o.type || '').toLowerCase();
      if (type.includes('honeymoon') || type.includes('romance')) badgeClass = 'badge-gold';
      else if (type.includes('family')) badgeClass = 'badge-emerald';
      else if (type.includes('wellness') || type.includes('spa')) badgeClass = 'badge-maroon';
      else if (type.includes('weekend')) badgeClass = 'badge-gold';

      const card = document.createElement('div');
      card.className = 'card reveal visible';
      card.style.border = 'var(--border-gold-thick)';

      const inner = document.createElement('div');
      inner.style.padding = 'var(--space-8)';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'flex-start';
      header.style.margin = '0 0 var(--space-4) 0';

      const badge = document.createElement('span');
      badge.className = `badge ${badgeClass}`;
      badge.textContent = o.type;

      const discount = document.createElement('span');
      discount.style.fontFamily = 'var(--font-display)';
      discount.style.fontSize = 'var(--fs-h3)';
      discount.style.color = 'var(--color-maroon)';
      discount.style.fontWeight = 'var(--fw-bold)';
      discount.textContent = o.discount;

      header.appendChild(badge);
      header.appendChild(discount);
      inner.appendChild(header);

      const title = document.createElement('h2');
      title.style.fontFamily = 'var(--font-display)';
      title.style.fontSize = 'var(--fs-h3)';
      title.style.margin = '0 0 var(--space-3) 0';
      title.textContent = o.title;
      inner.appendChild(title);

      const desc = document.createElement('p');
      desc.style.color = 'var(--text-secondary)';
      desc.style.margin = '0 0 var(--space-4) 0';
      desc.style.lineHeight = 'var(--lh-relaxed)';
      desc.textContent = o.desc;
      inner.appendChild(desc);

      if (o.features && o.features.length > 0) {
        const ul = document.createElement('ul');
        ul.style.display = 'grid';
        ul.style.gap = 'var(--space-2)';
        ul.style.margin = '0 0 var(--space-6) 0';
        ul.style.padding = '0';
        ul.style.listStyle = 'none';

        o.features.forEach(f => {
          const li = document.createElement('li');
          li.style.fontSize = 'var(--fs-small)';
          li.style.color = 'var(--text-secondary)';
          li.style.display = 'flex';
          li.style.alignItems = 'center';
          li.style.gap = 'var(--space-2)';

          const check = document.createElement('span');
          check.style.color = 'var(--color-gold)';
          check.textContent = '✓';

          const text = document.createElement('span');
          text.textContent = f;

          li.appendChild(check);
          li.appendChild(text);
          ul.appendChild(li);
        });
        inner.appendChild(ul);
      }

      const btn = document.createElement('a');
      const promoParam = o.code ? `?offer=${o.code.toLowerCase()}` : '';
      btn.href = `booking.html${promoParam}`;
      btn.className = 'btn btn-primary';
      btn.style.width = '100%';
      btn.textContent = 'Book This Package';
      inner.appendChild(btn);

      card.appendChild(inner);
      grid.appendChild(card);
    });
  }

  // Load from Firestore
  async function loadDynamicOffers() {
    try {
      if (typeof db !== 'undefined' && db) {
        const snap = await db.collection('offers').where('isActive', '==', true).get();
        if (!snap.empty) {
          const offers = [];
          snap.forEach(doc => {
            offers.push({ id: doc.id, ...doc.data() });
          });
          renderOffers(offers);
        } else {
          console.log('[Offers] No active database offers. Displaying default cards.');
        }
      }
    } catch (err) {
      console.warn('[Offers] Firestore load failed, using HTML defaults:', err);
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDynamicOffers);
  } else {
    loadDynamicOffers();
  }
})();

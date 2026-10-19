/* ============================================================
   ROYAL HERITAGE RESORT — Accommodations.js
   ============================================================
   Handles dynamic loading of accommodations from Firestore.
   Falls back to local mock data if Firestore is offline.
   ============================================================ */

'use strict';

const Accommodations = (() => {

  const localAccommodations = [
    {
      id: 'tent',
      name: 'Royal Safari Tent',
      type: 'tent',
      price: 8500,
      description: 'Step into a world of regal glamping. Our spacious canvas tents are adorned with heritage textiles, plush bedding, and brass accents. Each tent sits on a private wooden deck overlooking the rolling hills, with en-suite bathroom facilities.',
      image: '../assets/images/tent.png',
      badge: 'Most Popular',
      badgeClass: 'badge-gold',
      amenities: ['🛏️ King-size Bed', '🚿 En-suite Bathroom', '🌳 Private Deck', '📶 Free Wi-Fi', '☕ Tea/Coffee Maker', '🌅 Mountain View']
    },
    {
      id: 'cottage',
      name: 'Heritage Stone Cottage',
      type: 'cottage',
      price: 12000,
      description: 'Our hand-built stone cottages blend traditional architecture with modern comfort. Featuring a spacious living area, private garden, and a cozy fireplace, these cottages are ideal for families and extended stays.',
      image: '../assets/images/cottage.png',
      badge: 'Premium',
      badgeClass: 'badge-emerald',
      amenities: ['🛏️ Twin/King Bed', '🏡 Living Area', '🔥 Fireplace', '🌿 Private Garden', '🚿 Hot Shower', '📶 Free Wi-Fi']
    }
  ];

  const gridContainer = document.getElementById('all-accommodations');

  // Render list of accommodations
  function renderList(list) {
    if (!gridContainer) return;

    // Clear loading placeholder or existing items
    gridContainer.textContent = '';
    const containerDiv = document.createElement('div');
    containerDiv.className = 'container';
    
    list.forEach((item, index) => {
      const splitDiv = document.createElement('div');
      splitDiv.className = `split reveal visible ${index % 2 !== 0 ? 'reverse' : ''}`;
      splitDiv.style.marginBottom = 'var(--space-20)';

      const imgDiv = document.createElement('div');
      imgDiv.className = 'split-image img-zoom';
      const img = document.createElement('img');
      img.src = item.image || 'assets/images/tent.png';
      img.alt = item.name;
      img.loading = 'lazy';
      img.width = 800;
      img.height = 600;
      imgDiv.appendChild(img);

      const contentDiv = document.createElement('div');
      contentDiv.className = 'split-content';

      if (item.badge) {
        const badge = document.createElement('span');
        badge.className = `badge ${item.badgeClass || 'badge-gold'}`;
        badge.textContent = item.badge;
        contentDiv.appendChild(badge);
      }

      const h2 = document.createElement('h2');
      h2.className = 'section-title';
      h2.style.marginTop = 'var(--space-3)';
      h2.textContent = item.name;
      contentDiv.appendChild(h2);

      const ornament = document.createElement('div');
      ornament.className = 'ornament';
      ornament.style.justifyContent = 'flex-start';
      const oIcon = document.createElement('span');
      oIcon.className = 'ornament-icon';
      oIcon.textContent = '✦';
      ornament.appendChild(oIcon);
      contentDiv.appendChild(ornament);

      const pDesc1 = document.createElement('p');
      pDesc1.textContent = item.description;
      contentDiv.appendChild(pDesc1);

      const amGrid = document.createElement('div');
      amGrid.style.margin = 'var(--space-6) 0';
      amGrid.style.padding = 'var(--space-4) 0';
      amGrid.style.borderTop = 'var(--border-thin)';
      amGrid.style.borderBottom = 'var(--border-thin)';
      
      const amInner = document.createElement('div');
      amInner.style.display = 'grid';
      amInner.style.gridTemplateColumns = 'repeat(2, 1fr)';
      amInner.style.gap = 'var(--space-3)';

      item.amenities.forEach(am => {
        const tag = document.createElement('span');
        tag.className = 'amenity-tag';
        tag.style.background = 'var(--color-cream)';
        tag.style.padding = 'var(--space-2) var(--space-3)';
        tag.style.borderRadius = 'var(--radius-full)';
        tag.style.fontSize = 'var(--fs-xs)';
        tag.style.color = 'var(--text-secondary)';
        tag.textContent = am;
        amInner.appendChild(tag);
      });
      
      amGrid.appendChild(amInner);
      contentDiv.appendChild(amGrid);

      const footerDiv = document.createElement('div');
      footerDiv.style.display = 'flex';
      footerDiv.style.alignItems = 'center';
      footerDiv.style.gap = 'var(--space-6)';
      footerDiv.style.marginTop = 'var(--space-6)';

      const priceDiv = document.createElement('div');
      const pPrice = document.createElement('p');
      pPrice.style.fontFamily = 'var(--font-display)';
      pPrice.style.fontSize = 'var(--fs-h3)';
      pPrice.style.color = 'var(--color-maroon)';
      pPrice.style.fontWeight = 'var(--fw-bold)';
      pPrice.style.margin = '0';
      pPrice.textContent = `₹${item.price.toLocaleString()}`;
      
      const pTax = document.createElement('p');
      pTax.style.fontSize = 'var(--fs-xs)';
      pTax.style.color = 'var(--text-muted)';
      pTax.style.margin = '0';
      pTax.textContent = 'per night · taxes extra';

      priceDiv.appendChild(pPrice);
      priceDiv.appendChild(pTax);
      footerDiv.appendChild(priceDiv);

      const btn = document.createElement('a');
      btn.href = `booking.html?type=${item.id}`;
      btn.className = 'btn btn-primary';
      btn.textContent = 'Book Now';

      footerDiv.appendChild(btn);
      contentDiv.appendChild(footerDiv);

      splitDiv.appendChild(imgDiv);
      splitDiv.appendChild(contentDiv);
      containerDiv.appendChild(splitDiv);
    });

    gridContainer.appendChild(containerDiv);
  }

  // Load from Firestore
  async function loadAccommodations() {
    try {
      if (db) {
        const snapshot = await db.collection('accommodations').where('isActive', '==', true).orderBy('sortOrder', 'asc').get();
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            const mockRef = data.type === 'tent' ? localAccommodations[0] : localAccommodations[1];
            items.push({
              id: doc.id,
              name: data.name,
              type: data.type,
              price: data.basePrice,
              description: data.description || mockRef.description,
              image: data.images && data.images[0] ? data.images[0] : mockRef.image,
              badge: data.type === 'tent' ? 'Most Popular' : 'Premium',
              badgeClass: data.type === 'tent' ? 'badge-gold' : 'badge-emerald',
              amenities: data.amenities && data.amenities.length ? data.amenities : mockRef.amenities
            });
          });
          renderList(items);
          return;
        }
      }
    } catch (err) {
      console.warn("Firestore accommodations load failed, falling back to static config:", err);
    }
    
    // Fallback to static
    renderList(localAccommodations);
  }

  // Init
  function init() {
    if (gridContainer) {
      loadAccommodations();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    localAccommodations
  };

})();

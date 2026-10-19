/* ============================================================
   ROYAL HERITAGE RESORT — Schema.js
   ============================================================
   Dynamically generates and injects JSON-LD structured data 
   for SEO/GEO/AEO engine optimizations.
   ============================================================ */

'use strict';

const SchemaHelper = (() => {

  // Helper to inject JSON-LD into the head
  function injectSchema(schemaData) {
    try {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schemaData, null, 2);
      document.head.appendChild(script);
    } catch (err) {
      console.error("[SchemaHelper] Failed to inject schema:", err);
    }
  }

  // Generate dynamic Breadcrumbs based on location
  function generateBreadcrumbs() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(s => s && !s.endsWith('.html'));
    const currentPage = path.split('/').pop() || 'index.html';
    
    if (currentPage === 'index.html' || currentPage === '') return;

    const items = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://royalheritageresort.com/index.html"
      }
    ];

    let name = '';
    let url = 'https://royalheritageresort.com/pages/';

    if (currentPage.includes('accommodations')) {
      name = 'Accommodations';
      url += 'accommodations.html';
    } else if (currentPage.includes('accommodation')) {
      name = 'Accommodation Detail';
      url += 'accommodation.html';
    } else if (currentPage.includes('amenities')) {
      name = 'Amenities';
      url += 'amenities.html';
    } else if (currentPage.includes('dining')) {
      name = 'Dining';
      url += 'dining.html';
    } else if (currentPage.includes('gallery')) {
      name = 'Gallery';
      url += 'gallery.html';
    } else if (currentPage.includes('offers')) {
      name = 'Special Offers';
      url += 'offers.html';
    } else if (currentPage.includes('blog')) {
      name = 'The Journal';
      url += 'blog.html';
    } else if (currentPage.includes('contact')) {
      name = 'Contact';
      url += 'contact.html';
    } else if (currentPage.includes('booking')) {
      name = 'Booking';
      url += 'booking.html';
    }

    if (name) {
      items.push({
        "@type": "ListItem",
        "position": 2,
        "name": name,
        "item": url
      });

      const breadcrumbList = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items
      };

      injectSchema(breadcrumbList);
    }
  }

  // Initialize
  function init() {
    generateBreadcrumbs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    injectSchema
  };

})();

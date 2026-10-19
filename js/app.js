/* ============================================================
   ROYAL HERITAGE RESORT — App.js
   ============================================================
   Global: Navigation, scroll effects, mobile menu, 
   lazy loading, date picker defaults, utility functions.
   ============================================================ */

'use strict';

const App = (() => {

  /* ─── DOM Cache ─── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const header   = $('#site-header');
  const hamburger = $('#hamburger');
  const mobileNav = $('#mobile-nav');
  const mobileOverlay = $('#mobile-nav-overlay');


  /* ─── Header Scroll Effect ─── */
  function initHeaderScroll() {
    if (!header) return;

    const onScroll = () => {
      const scrolled = window.scrollY > 60;
      header.classList.toggle('scrolled', scrolled);
      header.classList.toggle('transparent', !scrolled);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Set initial state
  }


  /* ─── Mobile Navigation ─── */
  function initMobileNav() {
    if (!hamburger || !mobileNav) return;

    const toggle = () => {
      const isOpen = hamburger.classList.toggle('active');
      mobileNav.classList.toggle('active', isOpen);
      if (mobileOverlay) mobileOverlay.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    const close = () => {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('active');
      if (mobileOverlay) mobileOverlay.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    hamburger.addEventListener('click', toggle);
    if (mobileOverlay) mobileOverlay.addEventListener('click', close);

    // Close on back button click
    const closeBtn = $('#mobile-nav-close', mobileNav);
    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }

    // Close on nav link click
    $$('.mobile-nav-link', mobileNav).forEach(link => {
      link.addEventListener('click', close);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
        close();
      }
    });
  }


  /* ─── Active Nav Link ─── */
  function initActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    $$('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.endsWith(currentPage)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    $$('.mobile-nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.endsWith(currentPage)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }


  /* ─── Booking Widget Date Defaults ─── */
  function initBookingWidget() {
    const checkinInput = $('#widget-checkin');
    const checkoutInput = $('#widget-checkout');

    if (!checkinInput || !checkoutInput) return;

    // Set min dates to today
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const formatDate = (d) => d.toISOString().split('T')[0];

    checkinInput.min = formatDate(today);
    checkinInput.value = formatDate(tomorrow);
    checkoutInput.min = formatDate(tomorrow);
    checkoutInput.value = formatDate(dayAfter);

    // Sync checkout when checkin changes
    checkinInput.addEventListener('change', () => {
      const checkin = new Date(checkinInput.value);
      const nextDay = new Date(checkin);
      nextDay.setDate(nextDay.getDate() + 1);
      checkoutInput.min = formatDate(nextDay);
      
      if (new Date(checkoutInput.value) <= checkin) {
        checkoutInput.value = formatDate(nextDay);
      }
    });

    // Pass dates to booking page via URL params
    const bookingForm = $('#booking-widget');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const params = new URLSearchParams({
          checkin: checkinInput.value,
          checkout: checkoutInput.value,
          guests: ($('#widget-guests') || {}).value || '2'
        });
        window.location.href = `pages/booking.html?${params.toString()}`;
      });
    }
  }


  /* ─── Smooth Scroll for Anchor Links ─── */
  function initSmoothScroll() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const targetId = link.getAttribute('href');
      if (targetId === '#') return;

      const target = $(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }


  /* ─── Lazy Load Images ─── */
  function initLazyLoad() {
    // Uses native loading="lazy" attribute in HTML
    // This is a progressive enhancement for browsers that support it
    // No JS polyfill needed for modern browsers
    
    // Add loaded class for fade-in effect on images
    $$('img[loading="lazy"]').forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });
      }
    });
  }


  /* ─── Parallax (subtle, for hero bg) ─── */
  function initParallax() {
    const heroBg = $('.hero-bg img');
    if (!heroBg) return;

    // Disable parallax on mobile viewports for performance and layout stability
    if (window.innerWidth <= 768) return;

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = $('.hero')?.offsetHeight || 800;
      
      if (scrollY < heroHeight) {
        heroBg.style.transform = `translateY(${scrollY * 0.3}px) scale(1.1)`;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    heroBg.style.transform = 'scale(1.1)'; // Initial scale for parallax room
  }


  /* ─── Utility: Safe Text Content ─── */
  // SECURITY: Never use innerHTML with user data. Use this helper instead.
  function safeSetText(element, text) {
    if (element) {
      element.textContent = text;
    }
  }

  // SECURITY: Create DOM elements safely
  function createElement(tag, attrs = {}, textContent = '') {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        el.className = value;
      } else if (key.startsWith('data')) {
        el.setAttribute(key, value);
      } else {
        el.setAttribute(key, value);
      }
    });
    if (textContent) {
      el.textContent = textContent;
    }
    return el;
  }


  /* ─── Initialize ─── */
  function init() {
    initHeaderScroll();
    initMobileNav();
    initActiveNav();
    initBookingWidget();
    initSmoothScroll();
    initLazyLoad();
    initParallax();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return {
    safeSetText,
    createElement,
    $,
    $$
  };

})();

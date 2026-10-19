/* ============================================================
   ROYAL HERITAGE RESORT — Animations.js
   ============================================================
   IntersectionObserver-based scroll reveal animations.
   Respects prefers-reduced-motion.
   ============================================================ */

'use strict';

const Animations = (() => {

  // Respect user preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Scroll Reveal Observer ─── */
  function initScrollReveal() {
    const revealElements = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    );

    if (revealElements.length === 0) return;

    // If reduced motion, show everything immediately
    if (prefersReducedMotion) {
      revealElements.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Animate only once
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    revealElements.forEach(el => observer.observe(el));
  }


  /* ─── Stagger Children ─── */
  function initStaggerReveal() {
    const staggerContainers = document.querySelectorAll('.reveal-stagger');

    if (staggerContainers.length === 0) return;

    if (prefersReducedMotion) {
      staggerContainers.forEach(container => {
        Array.from(container.children).forEach(child => {
          child.classList.add('visible');
        });
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const children = entry.target.querySelectorAll(
              '.reveal, .reveal-left, .reveal-right, .reveal-scale'
            );
            children.forEach((child, index) => {
              setTimeout(() => {
                child.classList.add('visible');
              }, index * 120);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -30px 0px'
      }
    );

    staggerContainers.forEach(container => observer.observe(container));
  }


  /* ─── Counter Animation ─── */
  function animateCounter(element, target, duration = 2000) {
    if (prefersReducedMotion) {
      element.textContent = target.toLocaleString();
      return;
    }

    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }


  /* ─── Initialize ─── */
  function init() {
    initScrollReveal();
    initStaggerReveal();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return {
    animateCounter
  };

})();

/* ============================================================
   ROYAL HERITAGE RESORT — Utilities
   ============================================================
   Shared UI helpers, validation functions, sanitization, and 
   string operations.
   ============================================================ */

'use strict';

const Utils = (() => {

  // DOM Selection Helpers
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // Format currency value as INR
  function formatPrice(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Format Date object to human readable (e.g. 5th July, 2026)
  function formatDate(dateObj) {
    if (!dateObj) return '';
    const date = new Date(dateObj);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // Get query parameter by name from URL
  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  // Basic email validation
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  // Basic phone validation (10 digit minimum requirement)
  function validatePhone(phone) {
    const cleanPhone = String(phone).replace(/\D/g, '');
    return cleanPhone.length >= 10;
  }

  // Show a toast message to the user
  function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = document.createElement('span');
    icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    
    const text = document.createElement('span');
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);

    // Trigger reflow for slide in transition
    toast.offsetHeight;
    toast.classList.add('visible');

    // Remove toast after duration
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }

  // Parse check-in and check-out to calculate duration in nights
  function calculateNights(checkinStr, checkoutStr) {
    const start = new Date(checkinStr);
    const end = new Date(checkoutStr);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    $,
    $$,
    formatPrice,
    formatDate,
    getQueryParam,
    validateEmail,
    validatePhone,
    showToast,
    calculateNights
  };

})();

/* ============================================================
   ROYAL HERITAGE RESORT — Firebase Configuration
   ============================================================
   Initializes Firebase SDKs (compat version) and App Check.
   Enforces secure sanitization helpers (XSS protection).
   ============================================================ */

'use strict';

const firebaseConfig = {
  apiKey: "AIzaSyDXKVSnfGqkguZCf7m5YXXOC56TWbqON6w",
  authDomain: "resort-e7f7b.firebaseapp.com",
  projectId: "resort-e7f7b",
  storageBucket: "resort-e7f7b.firebasestorage.app",
  messagingSenderId: "389832491877",
  appId: "1:389832491877:web:e6e52e5dde92bed03bd78c"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// References
const db = (typeof firebase !== 'undefined') ? firebase.firestore() : null;
const auth = (typeof firebase !== 'undefined') ? firebase.auth() : null;

// Initialize Firebase App Check (reCAPTCHA v3 protection)
if (typeof firebase !== 'undefined' && firebase.appCheck) {
  const recaptchaKey = '6Ld_PLACEHOLDER_RECAPTCHA_KEY';
  
  if (recaptchaKey && recaptchaKey !== '6Ld_PLACEHOLDER_RECAPTCHA_KEY') {
    const appCheck = firebase.appCheck();
    appCheck.activate(
      new firebase.appCheck.ReCaptchaV3Provider(recaptchaKey),
      true // isTokenAutoRefreshEnabled
    );
    console.log('[AppCheck] Initialized successfully.');
  } else {
    console.warn('[AppCheck] Skip activation: Using default placeholder reCAPTCHA key.');
  }
}

// Global Sanitization Helper to prevent XSS (VULN-01 hardening requirement)
window.sanitize = (str) => {
  if (str === null || str === undefined) return '';
  const el = document.createElement('div');
  el.textContent = String(str);
  return el.innerHTML;
};

// SHA-256 password hashing helper for admin password checks
window.hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Auth State synchronization cookie helper (HttpOnly token helper)
if (typeof firebase !== 'undefined' && firebase.auth) {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const idToken = await user.getIdToken();
        fetch('/api/set-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', idToken })
        }).catch(err => console.error("[CookieSync] Failed to sync cookie:", err));
      } catch (err) {
        console.error("[CookieSync] Error retrieving token:", err);
      }
    } else {
      fetch('/api/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      }).catch(err => console.error("[CookieSync] Failed to sync cookie:", err));
    }
  });
}

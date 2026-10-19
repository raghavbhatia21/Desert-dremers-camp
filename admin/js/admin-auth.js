/* ============================================================
   ROYAL HERITAGE RESORT — Admin Authentication Controller
   ============================================================
   Validates custom claims token and controls auth redirects.
   ============================================================ */

'use strict';

const AdminAuth = (() => {

  const isLoginPage = window.location.pathname.endsWith('login.html');

  // Watch Auth State Changes
  function watchAuth() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.warn("Firebase Auth SDK is not available.");
      return;
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Force refresh token to pull latest custom claims (VULN-02 security claim validation)
          const idTokenResult = await user.getIdTokenResult(true);
          const role = idTokenResult.claims.role;

          if (role === 'admin' || role === 'staff') {
            if (isLoginPage) {
              window.location.href = 'index.html';
            }
          } else {
            // Unauthorized role check
            console.warn(`User ${user.email} is not authorized for Admin Console.`);
            Utils.showToast("Access Denied: Insufficient permissions.", "error");
            
            // Sign out immediately to clear local credentials
            await firebase.auth().signOut();
            if (!isLoginPage) {
              window.location.href = 'login.html?error=unauthorized';
            }
          }
        } catch (err) {
          console.error("Token verification failed:", err);
          if (!isLoginPage) {
            window.location.href = 'login.html?error=session_error';
          }
        }
      } else {
        // Logged out redirects
        if (!isLoginPage) {
          window.location.href = 'login.html';
        }
      }
    });
  }

  // Handle manual login submit
  function handleLogin() {
    const form = document.getElementById('admin-login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('login-btn');
      
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Authenticating...';

      try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        // Auth state listener handles redirect after verifying claims
      } catch (err) {
        console.error("Login attempt failed:", err);
        Utils.showToast(err.message || "Invalid credentials.", "error");
        btn.disabled = false;
        btn.textContent = origText;
      }
    });
  }

  // Handle Logout
  async function logout() {
    try {
      if (firebase.auth) {
        await firebase.auth().signOut();
        window.location.href = 'login.html';
      }
    } catch (err) {
      console.error("Logout failure:", err);
    }
  }

  // Check URL parameters for login errors
  function checkParams() {
    const error = Utils.getQueryParam('error');
    if (error === 'unauthorized') {
      Utils.showToast("Your account does not have management credentials.", "error");
    } else if (error === 'session_error') {
      Utils.showToast("Session authentication failure. Please log in again.", "error");
    }
  }

  // Init
  function init() {
    watchAuth();
    if (isLoginPage) {
      handleLogin();
      checkParams();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    logout
  };

})();

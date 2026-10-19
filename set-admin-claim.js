/**
 * Setup Admin Claims Bootstrapper
 * ------------------------------------------------------------
 * Run this script locally to assign the 'admin' role to your user
 * in Firebase Authentication, bypassing the un-privileged user restrictions.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'service-account.json');

// Check if credentials file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error('\n❌ ERROR: service-account.json not found!');
  console.log('\nTo get this file:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate new private key" and download the JSON file.');
  console.log('3. Save it as "service-account.json" at the root of this project:');
  console.log(`   ${serviceAccountPath}\n`);
  process.exit(1);
}

// Load service account key
const serviceAccount = require(serviceAccountPath);

// Initialize Admin SDK
initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();

// Get arguments
const emailArg = process.argv[2];

if (!emailArg) {
  console.log('\n👉 Usage: node set-admin-claim.js <your-email@example.com>');
  console.log('Example:  node set-admin-claim.js admin@royalresort.com\n');
  process.exit(1);
}

const targetEmail = emailArg.trim().toLowerCase();

console.log(`\n⏳ Fetching user info for: ${targetEmail}...`);

auth.getUserByEmail(targetEmail)
  .then(user => {
    console.log(`🔑 Setting role claims { role: "admin" } for UID: ${user.uid}...`);
    return auth.setCustomUserClaims(user.uid, { role: 'admin' });
  })
  .then(() => {
    console.log(`\n✅ SUCCESS: Custom claims set! User "${targetEmail}" is now an Admin.`);
    console.log('You can now log in to the admin panel.\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ ERROR:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.log('Make sure this user is added under the "Users" tab in your Firebase Auth Console.\n');
    }
    process.exit(1);
  });

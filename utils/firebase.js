const admin = require('firebase-admin');

let serviceAccount;

try {
  if (admin.apps.length === 0) {
    // Always use environment variable (both production and development)
    if (process.env.FIREBASE_CONFIG) {
      serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized from environment variables');
    } else {
      // Fallback for development without environment variable
      console.error('FIREBASE_CONFIG environment variable is not set');
      console.log('Firebase Admin not initialized - running in development mode without Firebase');
    }
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

module.exports = admin;
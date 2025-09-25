const admin = require('firebase-admin');

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    // For Render environment variables
    if (process.env.FIREBASE_CONFIG) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      console.log('Firebase Admin initialized successfully from environment variables');
    } else {
      console.warn('FIREBASE_CONFIG environment variable not set');
      console.log('Firebase notifications will not work');
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

module.exports = admin;
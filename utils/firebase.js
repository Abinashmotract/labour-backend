const admin = require('firebase-admin');

let serviceAccount;

if (process.env.NODE_ENV === 'production') {
  // For production - use the FIREBASE_CONFIG environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
} else {
  // For development - use the local JSON file
  serviceAccount = require('../labour-1ae3e-firebase-adminsdk-fbsvc-6e8c9ece64.json');
}

try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

module.exports = admin;
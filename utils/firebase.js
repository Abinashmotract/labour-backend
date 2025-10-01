const admin = require('firebase-admin');

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    let serviceAccount = null;

    // Preferred: full JSON in FIREBASE_CONFIG
    if (process.env.FIREBASE_CONFIG) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
      } catch (error) {
        console.error('Error parsing FIREBASE_CONFIG JSON:', error.message);
        console.error('FIREBASE_CONFIG value (first 100 chars):', process.env.FIREBASE_CONFIG.substring(0, 100));
        throw new Error(`Invalid JSON in FIREBASE_CONFIG: ${error.message}`);
      }
    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      // Alternate: individual env vars
      serviceAccount = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY,
      };
    } else if (process.env.FIREBASE_CONFIG_BASE64) {
      // Base64-encoded full JSON
      try {
        const json = Buffer.from(process.env.FIREBASE_CONFIG_BASE64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(json);
      } catch (error) {
        console.error('Error parsing FIREBASE_CONFIG_BASE64:', error.message);
        throw new Error(`Invalid JSON in FIREBASE_CONFIG_BASE64: ${error.message}`);
      }
    } else if (process.env.FIREBASE_PRIVATE_KEY_BASE64 && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
      // Base64-encoded private key with separate fields
      const privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
      serviceAccount = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: privateKey,
      };
    }

    if (serviceAccount) {
      // Fix escaped newlines in private key
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log('Firebase Admin initialized successfully');
    } else {
      // Fallback: GOOGLE_APPLICATION_CREDENTIALS or default creds
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        console.log('Firebase Admin initialized with application default credentials');
      } catch (e) {
        console.warn('Firebase credentials not set; notifications disabled');
      }
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

module.exports = admin;
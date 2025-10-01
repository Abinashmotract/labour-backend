const admin = require('firebase-admin');

function validateFirebaseConfig() {
  console.log('🔍 Validating Firebase Configuration...');
  console.log('');

  // Check environment variables
  const envVars = {
    FIREBASE_CONFIG: process.env.FIREBASE_CONFIG ? 'Set' : 'Not set',
    FIREBASE_CONFIG_BASE64: process.env.FIREBASE_CONFIG_BASE64 ? 'Set' : 'Not set',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not set',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Not set',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Not set',
    FIREBASE_PRIVATE_KEY_BASE64: process.env.FIREBASE_PRIVATE_KEY_BASE64 ? 'Set' : 'Not set',
  };

  console.log('Environment Variables Status:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log('');

  // Test JSON parsing
  if (process.env.FIREBASE_CONFIG) {
    try {
      const config = JSON.parse(process.env.FIREBASE_CONFIG);
      console.log('✅ FIREBASE_CONFIG JSON is valid');
      console.log('  Project ID:', config.project_id || 'Not found');
      console.log('  Client Email:', config.client_email || 'Not found');
      console.log('  Private Key Length:', config.private_key ? config.private_key.length : 'Not found');
    } catch (error) {
      console.log('❌ FIREBASE_CONFIG JSON is invalid:', error.message);
      console.log('  First 100 characters:', process.env.FIREBASE_CONFIG.substring(0, 100));
    }
  }

  if (process.env.FIREBASE_CONFIG_BASE64) {
    try {
      const json = Buffer.from(process.env.FIREBASE_CONFIG_BASE64, 'base64').toString('utf8');
      const config = JSON.parse(json);
      console.log('✅ FIREBASE_CONFIG_BASE64 JSON is valid');
      console.log('  Project ID:', config.project_id || 'Not found');
      console.log('  Client Email:', config.client_email || 'Not found');
      console.log('  Private Key Length:', config.private_key ? config.private_key.length : 'Not found');
    } catch (error) {
      console.log('❌ FIREBASE_CONFIG_BASE64 JSON is invalid:', error.message);
    }
  }

  // Test Firebase initialization
  console.log('');
  console.log('Testing Firebase initialization...');
  
  try {
    // Clear any existing apps
    if (admin.apps.length > 0) {
      admin.apps.forEach(app => app.delete());
    }

    let serviceAccount = null;

    if (process.env.FIREBASE_CONFIG) {
      serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
    } else if (process.env.FIREBASE_CONFIG_BASE64) {
      const json = Buffer.from(process.env.FIREBASE_CONFIG_BASE64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(json);
    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      serviceAccount = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    } else if (process.env.FIREBASE_PRIVATE_KEY_BASE64 && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
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

      console.log('✅ Firebase Admin initialized successfully');
      console.log('  Project ID:', serviceAccount.project_id);
      console.log('  Client Email:', serviceAccount.client_email);
    } else {
      console.log('❌ No valid Firebase configuration found');
      console.log('  Please set one of the following:');
      console.log('    - FIREBASE_CONFIG (full JSON)');
      console.log('    - FIREBASE_CONFIG_BASE64 (base64 encoded JSON)');
      console.log('    - FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY');
      console.log('    - FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY_BASE64');
    }
  } catch (error) {
    console.log('❌ Firebase initialization failed:', error.message);
  }
}

// Run validation
validateFirebaseConfig();

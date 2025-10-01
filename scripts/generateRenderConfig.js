const fs = require('fs');

// Example Firebase service account JSON structure
// Replace the values below with your actual Firebase service account credentials
const firebaseConfig = {
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

console.log('🔧 Firebase Configuration Generator for Render.com');
console.log('================================================');
console.log('');
console.log('⚠️  IMPORTANT: This script contains placeholder values!');
console.log('');
console.log('To use this script:');
console.log('1. Replace the placeholder values in the firebaseConfig object above');
console.log('2. Run this script to generate the properly formatted JSON');
console.log('3. Copy the output and use it as your FIREBASE_CONFIG environment variable on Render');
console.log('');
console.log('Example output (with your actual values):');
console.log('');
console.log('FIREBASE_CONFIG=' + JSON.stringify(firebaseConfig));
console.log('');
console.log('Alternative (if the above doesn\'t work, try this single-line version):');
console.log('');
console.log('FIREBASE_CONFIG=\'' + JSON.stringify(firebaseConfig) + '\'');
console.log('');
console.log('Base64 encoded version (if you prefer):');
console.log('');
const base64Config = Buffer.from(JSON.stringify(firebaseConfig)).toString('base64');
console.log('FIREBASE_CONFIG_BASE64=' + base64Config);
console.log('');
console.log('✅ All three options should work on Render.com');
console.log('   Choose the one that works best for your setup.');
console.log('');
console.log('📝 Note: Never commit actual private keys to version control!');

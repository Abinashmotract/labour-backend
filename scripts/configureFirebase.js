const fs = require('fs');
const path = require('path');

function configureFirebase() {
  console.log('🔧 Firebase Configuration Helper');
  console.log('');
  console.log('This script helps you configure Firebase for production deployment.');
  console.log('');
  console.log('For Render.com or similar platforms, set these environment variables:');
  console.log('');
  console.log('FIREBASE_PROJECT_ID=labour-1ae3e');
  console.log('FIREBASE_PRIVATE_KEY_ID=4011b2ec958e5d04ff73a9417fbaac3db0058ea7');
  console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"');
  console.log('FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@labour-1ae3e.iam.gserviceaccount.com');
  console.log('FIREBASE_CLIENT_ID=109605107935054675640');
  console.log('FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40labour-1ae3e.iam.gserviceaccount.com');
  console.log('');
  console.log('Or use a single FIREBASE_CONFIG environment variable with the full JSON.');
  console.log('');
  console.log('See PRODUCTION_DEPLOYMENT.md for detailed instructions.');
}

// Run the configuration helper
configureFirebase();

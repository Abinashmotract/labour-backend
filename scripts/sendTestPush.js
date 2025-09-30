require('dotenv').config();
const admin = require('../utils/firebase');

async function main() {
  const token = process.argv[2] || process.env.TEST_FCM_TOKEN;
  if (!token) {
    console.error('Usage: node scripts/sendTestPush.js <FCM_TOKEN>  (or set TEST_FCM_TOKEN env var)');
    process.exit(1);
  }
  if (!admin || !admin.apps || !admin.apps.length) {
    console.error('Firebase Admin is not initialized. Ensure FIREBASE_CONFIG is set in environment.');
    process.exit(2);
  }
  const message = {
    token,
    notification: {
      title: 'Test Notification',
      body: 'This is a test push from labour-backend.',
    },
    data: {
      type: 'TEST_PUSH',
    },
  };
  try {
    const res = await admin.messaging().send(message);
    console.log('Push sent. Message ID:', res);
  } catch (err) {
    console.error('Failed to send push:', err);
    process.exit(3);
  }
}

main();



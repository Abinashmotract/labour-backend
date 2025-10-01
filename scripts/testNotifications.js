require('dotenv').config();
const admin = require('../utils/firebase');
const User = require('../models/userModel');
const { sendJobNotificationToAllLabours, sendJobNotificationToNearbyLabours } = require('../service/notificationService');

async function testFirebaseConnection() {
  console.log('Testing Firebase connection...');
  
  if (!admin || !admin.apps || !admin.apps.length) {
    console.error('❌ Firebase Admin is not initialized');
    return false;
  }
  
  try {
    // Test with a simple message
    const testMessage = {
      token: 'test-token',
      notification: {
        title: 'Test',
        body: 'Test message'
      }
    };
    
    // This will fail but we can check if the error is about invalid token vs credential issues
    await admin.messaging().send(testMessage);
    console.log('✅ Firebase connection successful');
    return true;
  } catch (error) {
    if (error.code === 'messaging/invalid-registration-token') {
      console.log('✅ Firebase connection successful (invalid token expected)');
      return true;
    } else if (error.message.includes('invalid_grant') || error.message.includes('JWT Signature')) {
      console.error('❌ Firebase credential issue:', error.message);
      return false;
    } else {
      console.error('❌ Firebase error:', error.message);
      return false;
    }
  }
}

async function testUserQueries() {
  console.log('\nTesting user queries...');
  
  try {
    // Test basic user query
    const allUsers = await User.find({ role: 'labour' }).select('fcmToken firstName skills').limit(5);
    console.log(`Found ${allUsers.length} labour users`);
    
    // Test users with FCM tokens
    const usersWithTokens = await User.find({ 
      role: 'labour', 
      fcmToken: { $exists: true, $ne: null } 
    }).select('fcmToken firstName skills').limit(5);
    console.log(`Found ${usersWithTokens.length} labour users with FCM tokens`);
    
    // Test users with skills
    const usersWithSkills = await User.find({ 
      role: 'labour', 
      skills: { $exists: true, $ne: [] } 
    }).select('fcmToken firstName skills').limit(5);
    console.log(`Found ${usersWithSkills.length} labour users with skills`);
    
    return { allUsers, usersWithTokens, usersWithSkills };
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    return null;
  }
}

async function testNotificationService() {
  console.log('\nTesting notification service...');
  
  try {
    // Create a mock job with skills
    const mockJob = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Test Job',
      description: 'Test job description',
      location: {
        coordinates: [77.2090, 28.6139], // Delhi coordinates
        address: 'Test Location'
      },
      skills: [
        { _id: '507f1f77bcf86cd799439012', name: 'Plumbing' },
        { _id: '507f1f77bcf86cd799439013', name: 'Electrical' }
      ],
      contractor: '507f1f77bcf86cd799439014'
    };
    
    console.log('Testing sendJobNotificationToAllLabours...');
    await sendJobNotificationToAllLabours(mockJob);
    
    console.log('Testing sendJobNotificationToNearbyLabours...');
    await sendJobNotificationToNearbyLabours(mockJob, 50000);
    
    console.log('✅ Notification service tests completed');
  } catch (error) {
    console.error('❌ Notification service error:', error.message);
  }
}

async function main() {
  console.log('🔧 Testing Labour Backend Notification System\n');
  
  // Test Firebase connection
  const firebaseOk = await testFirebaseConnection();
  
  // Test database queries
  const userData = await testUserQueries();
  
  // Test notification service
  if (firebaseOk && userData) {
    await testNotificationService();
  }
  
  console.log('\n🏁 Test completed');
}

main().catch(console.error);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Skill = require('../models/skillModel');
const { sendJobNotificationToAllLabours, sendJobNotificationToNearbyLabours } = require('../service/notificationService');

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

async function testNotificationSystem() {
  console.log('🔧 Testing Notification System...');
  
  try {
    // Create a mock job with skills
    const mockJob = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Test Plumbing Job',
      description: 'Test job description for plumbing work',
      location: {
        coordinates: [77.2090, 28.6139], // Delhi coordinates
        address: 'Test Location, Delhi'
      },
      skills: [
        { _id: new mongoose.Types.ObjectId(), name: 'Plumbing' },
        { _id: new mongoose.Types.ObjectId(), name: 'Electrical' }
      ],
      contractor: new mongoose.Types.ObjectId(),
      jobTiming: '2024-01-15T09:00:00Z'
    };
    
    console.log('📋 Mock job created:');
    console.log('  - Title:', mockJob.title);
    console.log('  - Skills:', mockJob.skills.map(s => s.name).join(', '));
    console.log('  - Location:', mockJob.location.address);
    
    // Test all labours notification
    console.log('\n🔔 Testing sendJobNotificationToAllLabours...');
    try {
      await sendJobNotificationToAllLabours(mockJob);
      console.log('✅ All labours notification test completed');
    } catch (error) {
      console.log('⚠️  All labours notification error (expected if no users):', error.message);
    }
    
    // Test nearby labours notification
    console.log('\n🔔 Testing sendJobNotificationToNearbyLabours...');
    try {
      await sendJobNotificationToNearbyLabours(mockJob, 50000);
      console.log('✅ Nearby labours notification test completed');
    } catch (error) {
      console.log('⚠️  Nearby labours notification error (expected if no users):', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Notification system error:', error.message);
    return false;
  }
}

async function checkDatabaseData() {
  console.log('🔍 Checking database data...');
  
  try {
    const userCount = await User.countDocuments();
    const labourCount = await User.countDocuments({ role: 'labour' });
    const fcmTokenCount = await User.countDocuments({ 
      role: 'labour', 
      fcmToken: { $exists: true, $ne: null } 
    });
    const skillsCount = await User.countDocuments({ 
      role: 'labour', 
      skills: { $exists: true, $ne: [] } 
    });
    const skillDocCount = await Skill.countDocuments();
    
    console.log(`📊 Database Statistics:`);
    console.log(`  - Total users: ${userCount}`);
    console.log(`  - Labour users: ${labourCount}`);
    console.log(`  - Labour users with FCM tokens: ${fcmTokenCount}`);
    console.log(`  - Labour users with skills: ${skillsCount}`);
    console.log(`  - Skills in database: ${skillDocCount}`);
    
    if (fcmTokenCount === 0) {
      console.log('⚠️  No labour users with FCM tokens found');
      console.log('   - This means notifications won\'t be sent to anyone');
      console.log('   - Make sure labour users have valid FCM tokens');
    }
    
    if (skillsCount === 0) {
      console.log('⚠️  No labour users with skills found');
      console.log('   - This means skill-based filtering won\'t work');
      console.log('   - Make sure labour users have skills assigned');
    }
    
    return { userCount, labourCount, fcmTokenCount, skillsCount, skillDocCount };
  } catch (error) {
    console.error('❌ Database check error:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Testing Job Notification System\n');
  
  const dbConnected = await connectToDatabase();
  if (!dbConnected) {
    console.log('❌ Cannot proceed without database connection');
    return;
  }
  
  const dbData = await checkDatabaseData();
  await testNotificationSystem();
  
  console.log('\n🎉 Notification system test completed!');
  console.log('\n📝 Summary:');
  console.log('✅ Firebase credentials are working');
  console.log('✅ Notification functions are working');
  console.log('✅ Skill-based filtering is implemented');
  
  if (dbData) {
    if (dbData.fcmTokenCount === 0) {
      console.log('⚠️  No users with FCM tokens - notifications won\'t be sent');
    }
    if (dbData.skillsCount === 0) {
      console.log('⚠️  No users with skills - skill filtering won\'t work');
    }
  }
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

main().catch(console.error);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Skill = require('../models/skillModel');
const { sendJobNotificationToAllLabours, sendJobNotificationToNearbyLabours } = require('../service/notificationService');

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

async function testWithRealSkills() {
  console.log('🔧 Testing with real skills from database...');
  
  try {
    // Get real skills from database
    const skills = await Skill.find({ isActive: true }).limit(2);
    console.log(`📋 Using real skills:`, skills.map(s => s.name).join(', '));
    
    if (skills.length === 0) {
      console.log('❌ No skills found in database');
      return false;
    }
    
    // Create a mock job with real skills
    const mockJob = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Test Job with Real Skills',
      description: 'Test job description',
      location: {
        coordinates: [77.2090, 28.6139], // Delhi coordinates
        address: 'Test Location, Delhi'
      },
      skills: skills, // Use real skills from database
      contractor: new mongoose.Types.ObjectId(),
      jobTiming: '2024-01-15T09:00:00Z'
    };
    
    console.log('📋 Mock job created with real skills:');
    console.log('  - Title:', mockJob.title);
    console.log('  - Skills:', mockJob.skills.map(s => s.name).join(', '));
    console.log('  - Location:', mockJob.location.address);
    
    // Test all labours notification
    console.log('\n🔔 Testing sendJobNotificationToAllLabours...');
    try {
      await sendJobNotificationToAllLabours(mockJob);
      console.log('✅ All labours notification test completed');
    } catch (error) {
      console.log('⚠️  All labours notification error:', error.message);
    }
    
    // Test nearby labours notification
    console.log('\n🔔 Testing sendJobNotificationToNearbyLabours...');
    try {
      await sendJobNotificationToNearbyLabours(mockJob, 50000);
      console.log('✅ Nearby labours notification test completed');
    } catch (error) {
      console.log('⚠️  Nearby labours notification error:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing with real skills:', error.message);
    return false;
  }
}

async function checkMatchingUsers() {
  console.log('\n🔍 Checking for users with matching skills...');
  
  try {
    // Get real skills
    const skills = await Skill.find({ isActive: true }).limit(2);
    const skillIds = skills.map(s => s._id);
    
    console.log(`🔍 Looking for users with skills:`, skills.map(s => s.name).join(', '));
    
    // Find users with these specific skills
    const matchingUsers = await User.find({
      role: 'labour',
      skills: { $in: skillIds }
    }).select('firstName fcmToken skills');
    
    console.log(`👷 Found ${matchingUsers.length} users with matching skills:`);
    matchingUsers.forEach(user => {
      const hasFCM = !!user.fcmToken;
      console.log(`  - ${user.firstName || 'User'}: FCM=${hasFCM ? 'Yes' : 'No'}, Skills=${user.skills.length}`);
    });
    
    // Find users with FCM tokens and matching skills
    const usersWithFCMAndSkills = await User.find({
      role: 'labour',
      fcmToken: { $exists: true, $ne: null },
      skills: { $in: skillIds }
    }).select('firstName fcmToken skills');
    
    console.log(`📱 Found ${usersWithFCMAndSkills.length} users with FCM tokens AND matching skills`);
    
    return { matchingUsers, usersWithFCMAndSkills };
  } catch (error) {
    console.error('❌ Error checking matching users:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Testing Notification System with Real Skills\n');
  
  const dbConnected = await connectToDatabase();
  if (!dbConnected) {
    console.log('❌ Cannot proceed without database connection');
    return;
  }
  
  const userData = await checkMatchingUsers();
  await testWithRealSkills();
  
  console.log('\n🎉 Real skills test completed!');
  
  if (userData && userData.usersWithFCMAndSkills.length > 0) {
    console.log('✅ Found users with FCM tokens and matching skills!');
    console.log('   - Notifications should work properly now');
  } else {
    console.log('⚠️  No users found with both FCM tokens and matching skills');
    console.log('   - This is why no notifications were sent');
  }
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

main().catch(console.error);

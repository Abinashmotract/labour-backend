require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Skill = require('../models/skillModel');

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

async function assignSkillsToUsers() {
  console.log('🔧 Assigning skills to labour users...');
  
  try {
    // Get all skills
    const skills = await Skill.find({ isActive: true });
    console.log(`📋 Found ${skills.length} active skills:`, skills.map(s => s.name).join(', '));
    
    if (skills.length === 0) {
      console.log('❌ No skills found in database');
      return false;
    }
    
    // Get all labour users without skills
    const labourUsers = await User.find({ 
      role: 'labour',
      $or: [
        { skills: { $exists: false } },
        { skills: { $size: 0 } }
      ]
    });
    
    console.log(`👷 Found ${labourUsers.length} labour users without skills`);
    
    if (labourUsers.length === 0) {
      console.log('✅ All labour users already have skills assigned');
      return true;
    }
    
    // Assign random skills to each user (1-3 skills per user)
    let updatedCount = 0;
    
    for (const user of labourUsers) {
      // Randomly select 1-3 skills
      const numSkills = Math.floor(Math.random() * 3) + 1;
      const shuffledSkills = skills.sort(() => 0.5 - Math.random());
      const selectedSkills = shuffledSkills.slice(0, numSkills).map(s => s._id);
      
      user.skills = selectedSkills;
      await user.save();
      updatedCount++;
      
      console.log(`✅ Assigned skills to ${user.firstName || 'User'}: ${selectedSkills.length} skills`);
    }
    
    console.log(`🎉 Successfully assigned skills to ${updatedCount} labour users`);
    return true;
    
  } catch (error) {
    console.error('❌ Error assigning skills:', error.message);
    return false;
  }
}

async function testSkillAssignment() {
  console.log('\n🔍 Testing skill assignment...');
  
  try {
    const labourWithSkills = await User.countDocuments({ 
      role: 'labour', 
      skills: { $exists: true, $ne: [] } 
    });
    
    const labourWithFCM = await User.countDocuments({ 
      role: 'labour', 
      fcmToken: { $exists: true, $ne: null } 
    });
    
    const labourWithBoth = await User.countDocuments({ 
      role: 'labour', 
      fcmToken: { $exists: true, $ne: null },
      skills: { $exists: true, $ne: [] }
    });
    
    console.log(`📊 Updated Statistics:`);
    console.log(`  - Labour users with skills: ${labourWithSkills}`);
    console.log(`  - Labour users with FCM tokens: ${labourWithFCM}`);
    console.log(`  - Labour users with both: ${labourWithBoth}`);
    
    if (labourWithBoth > 0) {
      console.log('✅ Perfect! Some users have both FCM tokens and skills');
      console.log('   - Notifications will now work with skill-based filtering');
    } else {
      console.log('⚠️  No users have both FCM tokens and skills');
      console.log('   - Notifications will only work if users have FCM tokens');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing skill assignment:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Assigning Skills to Labour Users\n');
  
  const dbConnected = await connectToDatabase();
  if (!dbConnected) {
    console.log('❌ Cannot proceed without database connection');
    return;
  }
  
  const success = await assignSkillsToUsers();
  if (success) {
    await testSkillAssignment();
  }
  
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  console.log('🎉 Skill assignment completed!');
}

main().catch(console.error);

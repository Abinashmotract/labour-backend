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
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

async function assignSkillsToUsers() {
  
  try {
    // Get all skills
    const skills = await Skill.find({ isActive: true });
    
    if (skills.length === 0) {
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
    
    if (labourUsers.length === 0) {
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
    }
    return true;
    
  } catch (error) {
    console.error('❌ Error assigning skills:', error.message);
    return false;
  }
}

async function testSkillAssignment() {
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
    
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const dbConnected = await connectToDatabase();
  if (!dbConnected) {
    return;
  }
  const success = await assignSkillsToUsers();
  if (success) {
    await testSkillAssignment();
  }
  await mongoose.disconnect();
}

main().catch(console.error);

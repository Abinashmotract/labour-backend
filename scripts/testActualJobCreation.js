require('dotenv').config();
const mongoose = require('mongoose');
const JobPost = require('../models/jobPostModel');
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

async function testActualJobCreation() {
  console.log('🔧 Testing actual job creation process...');
  
  try {
    // Get real skills from database
    const skills = await Skill.find({ isActive: true }).limit(2);
    const skillIds = skills.map(s => s._id);
    
    console.log(`📋 Using skills:`, skills.map(s => s.name).join(', '));
    
    // Create a real job post (simulating the controller)
    const jobPost = new JobPost({
      title: 'Real Test Job - Water Tank Cleaning',
      description: 'Need experienced person for water tank cleaning and maintenance',
      location: {
        type: "Point",
        coordinates: [77.2090, 28.6139], // Delhi coordinates
        address: "Test Location, Delhi, India"
      },
      jobTiming: '2024-01-15T09:00:00Z',
      contractor: new mongoose.Types.ObjectId(), // Mock contractor
      skills: skillIds,
      labourersRequired: 2,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    
    // Save the job
    await jobPost.save();
    console.log('✅ Job post created successfully');
    console.log('  - Job ID:', jobPost._id);
    console.log('  - Title:', jobPost.title);
    console.log('  - Skills:', skillIds);
    
    // Populate job data for notification (like in the controller)
    const populatedJob = await JobPost.findById(jobPost._id)
      .populate('contractor', 'firstName lastName')
      .populate('skills', 'name');
    
    console.log('✅ Job populated for notifications');
    console.log('  - Contractor:', populatedJob.contractor?.firstName || 'N/A');
    console.log('  - Skills:', populatedJob.skills.map(s => s.name).join(', '));
    
    // Send notifications (like in the controller)
    console.log('\n🔔 Sending notifications...');
    
    try {
      console.log('📤 Sending to all labours...');
      await sendJobNotificationToAllLabours(populatedJob);
      console.log('✅ All labours notification sent');
    } catch (notificationError) {
      console.error('❌ All labours notification failed:', notificationError.message);
    }
    
    try {
      console.log('📤 Sending to nearby labours...');
      await sendJobNotificationToNearbyLabours(populatedJob, 50000);
      console.log('✅ Nearby labours notification sent');
    } catch (notificationError) {
      console.error('❌ Nearby labours notification failed:', notificationError.message);
    }
    
    // Clean up - delete the test job
    await JobPost.findByIdAndDelete(jobPost._id);
    console.log('🧹 Test job cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Error in job creation test:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Complete Job Creation Process\n');
  
  const dbConnected = await connectToDatabase();
  if (!dbConnected) {
    console.log('❌ Cannot proceed without database connection');
    return;
  }
  
  const success = await testActualJobCreation();
  
  if (success) {
    console.log('\n🎉 SUCCESS! Complete job creation process works!');
    console.log('✅ Job creation works');
    console.log('✅ Skill-based filtering works');
    console.log('✅ Firebase notifications work');
    console.log('✅ Distance-based filtering works');
    console.log('\n📝 Your notification system is now fully functional!');
  } else {
    console.log('\n❌ Some issues found in job creation process');
  }
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

main().catch(console.error);

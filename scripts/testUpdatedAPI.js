const mongoose = require('mongoose');
const argon2 = require('argon2');
const User = require('../models/userModel');
const LabourAvailability = require('../models/labourAvailabilityModel');
const Skill = require('../models/skillModel');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/labour-backend', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testUpdatedAPI() {
  try {
    console.log('Testing updated Labour Availability API...');
    
    // Get skills
    const skills = await Skill.find({});
    console.log('Found skills:', skills.map(s => s.name));
    
    if (skills.length === 0) {
      console.log('No skills found. Please run populateSkillsWithHindi.js first.');
      return;
    }
    
    // Create a test labour user with proper password hashing
    const hashedPassword = await argon2.hash('Test@123');
    
    const labourUser = new User({
      fullName: 'Test Labour User',
      email: 'test.labour@example.com',
      phoneNumber: '9876543210',
      password: hashedPassword,
      role: 'labour',
      addressLine1: 'Test Address, Test City',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139], // Delhi coordinates
        address: 'New Delhi, India'
      },
      skills: skills.slice(0, 3).map(skill => skill._id) // Take first 3 skills
    });
    
    await labourUser.save();
    console.log('Created test labour user:', labourUser.fullName);
    
    // Test single date submission
    console.log('\n=== Testing Single Date Submission ===');
    const singleDateResponse = await fetch('http://localhost:3512/api/labour-availability/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${labourUser._id}` // Using user ID as token for testing
      },
      body: JSON.stringify({
        availabilityDate: '2024-01-20'
      })
    });
    
    const singleDateResult = await singleDateResponse.json();
    console.log('Single Date Response:', JSON.stringify(singleDateResult, null, 2));
    
    // Test multiple dates submission
    console.log('\n=== Testing Multiple Dates Submission ===');
    const multipleDatesResponse = await fetch('http://localhost:3512/api/labour-availability/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${labourUser._id}` // Using user ID as token for testing
      },
      body: JSON.stringify({
        availabilityDate: ['2024-01-21', '2024-01-22', '2024-01-23']
      })
    });
    
    const multipleDatesResult = await multipleDatesResponse.json();
    console.log('Multiple Dates Response:', JSON.stringify(multipleDatesResult, null, 2));
    
    // Test duplicate date submission (should skip)
    console.log('\n=== Testing Duplicate Date Submission ===');
    const duplicateDateResponse = await fetch('http://localhost:3512/api/labour-availability/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${labourUser._id}` // Using user ID as token for testing
      },
      body: JSON.stringify({
        availabilityDate: ['2024-01-20', '2024-01-24'] // 2024-01-20 should be skipped
      })
    });
    
    const duplicateDateResult = await duplicateDateResponse.json();
    console.log('Duplicate Date Response:', JSON.stringify(duplicateDateResult, null, 2));
    
    console.log('\n✅ API testing completed successfully!');
    
  } catch (error) {
    console.error('Error testing API:', error);
  } finally {
    mongoose.connection.close();
  }
}

testUpdatedAPI();
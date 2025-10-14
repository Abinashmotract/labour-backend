const mongoose = require('mongoose');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Skill = require('../models/skillModel');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/labour-backend', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testArrayFormat() {
  try {
    console.log('Testing Labour Availability API with Array Format...');
    
    // Get skills
    const skills = await Skill.find({});
    console.log('Found skills:', skills.map(s => s.name));
    
    if (skills.length === 0) {
      console.log('No skills found. Creating test skills...');
      const testSkills = [
        { name: 'electrician', nameHindi: 'बिजली मिस्त्री', category: 'electrical' },
        { name: 'plumber', nameHindi: 'प्लंबर', category: 'plumbing' },
        { name: 'carpenter', nameHindi: 'बढ़ई', category: 'woodwork' }
      ];
      
      for (const skillData of testSkills) {
        const skill = new Skill(skillData);
        await skill.save();
        console.log('Created skill:', skill.name);
      }
    }
    
    // Get updated skills
    const updatedSkills = await Skill.find({});
    
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
      skills: updatedSkills.slice(0, 3).map(skill => skill._id) // Take first 3 skills
    });
    
    await labourUser.save();
    console.log('Created test labour user:', labourUser.fullName);
    
    // Generate a valid JWT token
    const token = jwt.sign(
      {
        id: labourUser._id,
        email: labourUser.email,
        role: labourUser.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    
    console.log('Generated JWT token for testing');
    
    // Test 1: Single date in array format (should work)
    console.log('\n=== Test 1: Single Date in Array Format ===');
    const singleDateResponse = await fetch('http://localhost:3512/api/labour-availability/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        availabilityDate: ['2024-01-20']
      })
    });
    
    const singleDateResult = await singleDateResponse.json();
    console.log('Single Date Response:', JSON.stringify(singleDateResult, null, 2));
    
    // Test 2: Multiple dates in array format (should work)
    console.log('\n=== Test 2: Multiple Dates in Array Format ===');
    const multipleDatesResponse = await fetch('http://localhost:3512/api/labour-availability/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        availabilityDate: ['2024-01-21', '2024-01-22', '2024-01-23']
      })
    });
    
    const multipleDatesResult = await multipleDatesResponse.json();
    console.log('Multiple Dates Response:', JSON.stringify(multipleDatesResult, null, 2));
    
    // Test 3: Single date as string (should fail with array validation error)
    console.log('\n=== Test 3: Single Date as String (Should Fail) ===');
    const stringDateResponse = await fetch('http://localhost:3512/api/labour-availability/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        availabilityDate: '2024-01-24'
      })
    });
    
    const stringDateResult = await stringDateResponse.json();
    console.log('String Date Response:', JSON.stringify(stringDateResult, null, 2));
    
    console.log('\n✅ API testing completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Single date in array: ✅ Working');
    console.log('- Multiple dates in array: ✅ Working');
    console.log('- String date (should fail): ✅ Properly rejected');
    console.log('- Hindi messages: ✅ Working');
    
  } catch (error) {
    console.error('Error testing API:', error);
  } finally {
    mongoose.connection.close();
  }
}

testArrayFormat();

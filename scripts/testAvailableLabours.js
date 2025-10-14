const mongoose = require('mongoose');
const LabourAvailability = require('../models/labourAvailabilityModel');
const Skill = require('../models/skillModel');
const User = require('../models/userModel');

// Register the User model
require('../models/userModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/labour-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

async function testAvailableLabours() {
  try {
    console.log('Testing getAvailableLabours logic...');

    const skills = 'electrician';
    const skillNames = Array.isArray(skills) ? skills : skills.split(',');
    console.log('Skill names:', skillNames);
    
    // Find skill ObjectIds by names
    const skillObjects = await Skill.find({ 
      name: { $in: skillNames }, 
      isActive: true 
    });
    console.log('Found skills:', skillObjects.map(s => ({ name: s.name, id: s._id })));
    
    if (skillObjects.length === 0) {
      console.log('No valid skills found');
      return;
    }
    
    const skillIds = skillObjects.map(skill => skill._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('Today:', today.toISOString());

    let query = {
      status: 'active',
      availabilityDate: { $gte: today },
      skills: { $in: skillIds }
    };
    console.log('Query:', JSON.stringify(query, null, 2));

    // Test without populate first
    const availableLabours = await LabourAvailability.find(query)
      .sort({ availabilityDate: 1, createdAt: -1 });

    console.log(`Found ${availableLabours.length} available labourers`);
    if (availableLabours.length > 0) {
      console.log('Sample result:', JSON.stringify(availableLabours[0], null, 2));
    }

  } catch (error) {
    console.error('Error testing getAvailableLabours:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAvailableLabours();

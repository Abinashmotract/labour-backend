const mongoose = require('mongoose');
const User = require('../models/userModel');
const Skill = require('../models/skillModel');
const LabourAvailability = require('../models/labourAvailabilityModel');
const argon2 = require('argon2');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/labour-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

async function createRealLabourAvailability() {
  try {
    console.log('Creating real labour user and availability request...');

    // First, get some skills
    const skills = await Skill.find({ isActive: true }).limit(3);
    if (skills.length === 0) {
      console.log('No skills found. Creating basic skills...');
      const basicSkills = [
        { name: 'electrician', nameHindi: 'बिजली मिस्त्री', category: 'Electrical' },
        { name: 'plumber', nameHindi: 'प्लंबर', category: 'Plumbing' },
        { name: 'carpenter', nameHindi: 'बढ़ई', category: 'Woodwork' }
      ];
      for (const skillData of basicSkills) {
        const skill = new Skill(skillData);
        await skill.save();
      }
      const newSkills = await Skill.find({ isActive: true }).limit(3);
      skills.push(...newSkills);
    }

    console.log(`Found ${skills.length} skills:`, skills.map(s => s.name));

    // Create a real labour user
    const hashedPassword = await argon2.hash('password123');
    
    const labourUser = new User({
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phoneNumber: '9876543210',
      password: hashedPassword,
      role: 'labour',
      skills: skills.map(skill => skill._id),
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139], // New Delhi coordinates
        address: 'New Delhi, India'
      },
      isApproved: true
    });

    await labourUser.save();
    console.log('Created labour user:', labourUser.firstName, labourUser.lastName);

    // Create availability request for tomorrow (15-10-2025)
    const tomorrow = new Date('2025-10-15');
    tomorrow.setHours(0, 0, 0, 0);

    const availabilityRequest = new LabourAvailability({
      labour: labourUser._id,
      availabilityDate: tomorrow,
      availabilityType: 'specific_date',
      skills: labourUser.skills,
      location: labourUser.location,
      status: 'active'
    });

    await availabilityRequest.save();
    console.log('Created availability request for tomorrow (15-10-2025)');

    // Verify the data was created (without populate to avoid model registration issue)
    const createdRequest = await LabourAvailability.findById(availabilityRequest._id);

    console.log('Created availability request:', {
      id: createdRequest._id,
      labour: createdRequest.labour,
      availabilityDate: createdRequest.availabilityDate,
      skills: createdRequest.skills,
      status: createdRequest.status
    });

    console.log('Real labour availability data created successfully!');

  } catch (error) {
    console.error('Error creating real labour availability:', error);
  } finally {
    mongoose.connection.close();
  }
}

createRealLabourAvailability();

const mongoose = require('mongoose');
const User = require('../models/userModel');
const LabourAvailability = require('../models/labourAvailabilityModel');
const Skill = require('../models/skillModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/labour-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestAvailabilityData() {
  try {
    console.log('Creating test availability data...');

    // Get some skills
    const skills = await Skill.find({ isActive: true }).limit(5);
    console.log(`Found ${skills.length} skills`);
    
    if (skills.length === 0) {
      console.log('No skills found. Creating some basic skills...');
      
      // Create some basic skills
      const basicSkills = [
        { name: 'electrician', nameHindi: 'बिजली मिस्त्री', category: 'Electrical' },
        { name: 'plumber', nameHindi: 'प्लंबर', category: 'Plumbing' },
        { name: 'carpenter', nameHindi: 'बढ़ई', category: 'Woodwork' },
        { name: 'mason', nameHindi: 'राज मिस्त्री', category: 'Construction' },
        { name: 'painter', nameHindi: 'पेंटर', category: 'Painting' }
      ];

      for (const skillData of basicSkills) {
        const skill = new Skill(skillData);
        await skill.save();
        console.log(`Created skill: ${skillData.name}`);
      }

      // Get the created skills
      const createdSkills = await Skill.find({ isActive: true }).limit(5);
      skills.push(...createdSkills);
    }

    // Get labour users
    const labourers = await User.find({ role: 'labour' }).limit(3);
    if (labourers.length === 0) {
      console.log('No labourers found. Creating test labourers...');
      
      // Create test labourers
      const testLabourers = [
        {
          firstName: 'Rajesh',
          lastName: 'Kumar',
          phoneNumber: '9876543210',
          role: 'labour',
          skills: [skills[0]._id, skills[1]._id],
          location: {
            type: 'Point',
            coordinates: [77.2090, 28.6139],
            address: 'New Delhi, India'
          }
        },
        {
          firstName: 'Suresh',
          lastName: 'Singh',
          phoneNumber: '9876543211',
          role: 'labour',
          skills: [skills[1]._id, skills[2]._id],
          location: {
            type: 'Point',
            coordinates: [77.2100, 28.6140],
            address: 'New Delhi, India'
          }
        },
        {
          firstName: 'Amit',
          lastName: 'Sharma',
          phoneNumber: '9876543212',
          role: 'labour',
          skills: [skills[0]._id, skills[2]._id, skills[3]._id],
          location: {
            type: 'Point',
            coordinates: [77.2110, 28.6150],
            address: 'New Delhi, India'
          }
        }
      ];

      for (const labourer of testLabourers) {
        const newLabourer = new User(labourer);
        await newLabourer.save();
        console.log(`Created labourer: ${labourer.firstName} ${labourer.lastName}`);
      }

      // Get the created labourers
      const createdLabourers = await User.find({ role: 'labour' }).limit(3);
      labourers.push(...createdLabourers);
    }

    // Create availability requests for different dates
    const dates = [
      new Date('2024-01-20'),
      new Date('2024-01-21'),
      new Date('2024-01-22'),
      new Date('2024-01-23'),
      new Date('2024-01-24')
    ];

    // Clear existing test data
    await LabourAvailability.deleteMany({});

    for (let i = 0; i < labourers.length; i++) {
      const labourer = labourers[i];
      
      // Create availability for 2-3 random dates
      const numDates = Math.floor(Math.random() * 2) + 2; // 2-3 dates
      const selectedDates = dates.sort(() => 0.5 - Math.random()).slice(0, numDates);

      for (const date of selectedDates) {
        const availabilityRequest = new LabourAvailability({
          labour: labourer._id,
          availabilityDate: date,
          availabilityType: 'specific_date',
          skills: labourer.skills, // These are already ObjectIds from the User model
          location: labourer.location,
          status: 'active'
        });

        await availabilityRequest.save();
        console.log(`Created availability for ${labourer.firstName} on ${date.toDateString()}`);
      }
    }

    console.log('Test availability data created successfully!');
    console.log(`Created ${await LabourAvailability.countDocuments()} availability requests`);

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestAvailabilityData();

const mongoose = require('mongoose');
const User = require('../models/userModel');
const LabourAvailability = require('../models/labourAvailabilityModel');
const Skill = require('../models/skillModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/labour-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkTestData() {
  try {
    console.log('Checking test data...');

    // Check skills
    const skills = await Skill.find({ isActive: true });
    console.log(`\nFound ${skills.length} skills:`);
    skills.slice(0, 5).forEach(skill => {
      console.log(`- ${skill.name} (${skill.nameHindi})`);
    });

    // Check labourers
    const labourers = await User.find({ role: 'labour' }).populate('skills', 'name nameHindi');
    console.log(`\nFound ${labourers.length} labourers:`);
    labourers.forEach(labourer => {
      console.log(`- ${labourer.firstName} ${labourer.lastName}`);
      console.log(`  Skills: ${labourer.skills.map(s => s.name).join(', ')}`);
    });

    // Check availability requests
    const availabilityRequests = await LabourAvailability.find({ status: 'active' })
      .populate('labour', 'firstName lastName')
      .populate('skills', 'name nameHindi');
    
    console.log(`\nFound ${availabilityRequests.length} availability requests:`);
    availabilityRequests.forEach(req => {
      console.log(`- ${req.labour.firstName} ${req.labour.lastName} on ${req.availabilityDate.toDateString()}`);
      console.log(`  Skills: ${req.skills.map(s => s.name).join(', ')}`);
    });

  } catch (error) {
    console.error('Error checking test data:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkTestData();

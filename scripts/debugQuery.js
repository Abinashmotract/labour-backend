const mongoose = require('mongoose');
const LabourAvailability = require('../models/labourAvailabilityModel');
const Skill = require('../models/skillModel');
const User = require('../models/userModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/labour-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugQuery() {
  try {
    console.log('Debugging query...');

    const skillNames = ['electrician', 'plumber', 'carpenter'];
    
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

    console.log('Today:', today);
    console.log('Skill IDs:', skillIds);

    let query = {
      status: 'active',
      availabilityDate: { $gte: today },
      skills: { $in: skillIds }
    };

    console.log('Query:', JSON.stringify(query, null, 2));

    const availableLabours = await LabourAvailability.find(query);
    console.log(`Found ${availableLabours.length} available labourers`);

    // Also check without date filter
    const allRequests = await LabourAvailability.find({ status: 'active' });
    
    console.log(`\nAll active requests (${allRequests.length}):`);
    allRequests.forEach(req => {
      console.log(`- Labour ID: ${req.labour} on ${req.availabilityDate.toDateString()}`);
      console.log(`  Skills: ${req.skills.join(', ')}`);
      console.log(`  Date >= today: ${req.availabilityDate >= today}`);
    });

  } catch (error) {
    console.error('Error debugging query:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugQuery();

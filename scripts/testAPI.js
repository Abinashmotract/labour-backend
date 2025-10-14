const mongoose = require('mongoose');
const LabourAvailability = require('../models/labourAvailabilityModel');
const Skill = require('../models/skillModel');
const User = require('../models/userModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/labour-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testAPI() {
  try {
    console.log('Testing API logic...');

    // Test the exact same logic as the API
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

    let query = {
      status: 'active',
      availabilityDate: { $gte: today },
      skills: { $in: skillIds }
    };

    console.log('Query:', JSON.stringify(query, null, 2));

    // Test without populate first
    const rawResults = await LabourAvailability.find(query);
    console.log(`Raw results: ${rawResults.length}`);

    // Test with populate
    const availableLabours = await LabourAvailability.find(query)
      .populate({
        path: 'labour',
        model: 'User',
        select: 'firstName lastName phoneNumber profilePicture'
      })
      .populate('skills', 'name nameHindi')
      .sort({ availabilityDate: 1, createdAt: -1 });

    console.log(`Populated results: ${availableLabours.length}`);
    
    if (availableLabours.length > 0) {
      console.log('Sample result:');
      console.log(JSON.stringify(availableLabours[0], null, 2));
    }

  } catch (error) {
    console.error('Error testing API:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAPI();

const mongoose = require('mongoose');
const LabourAvailability = require('../models/labourAvailabilityModel');
const Skill = require('../models/skillModel');
const User = require('../models/userModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/labour-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testAdminAPI() {
  try {
    console.log('Testing admin API logic...');

    // Test the exact same logic as the admin API
    const query = { status: 'active' };
    console.log('Query:', JSON.stringify(query, null, 2));

    // Test without populate first
    const rawResults = await LabourAvailability.find(query);
    console.log(`Raw results: ${rawResults.length}`);

    if (rawResults.length > 0) {
      console.log('Sample raw result:');
      console.log(JSON.stringify(rawResults[0], null, 2));
    }

    // Test with populate
    const availabilityRequests = await LabourAvailability.find(query)
      .populate({
        path: 'labour',
        model: 'User',
        select: 'firstName lastName phoneNumber profilePicture'
      })
      .populate('skills', 'name nameHindi category')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`Populated results: ${availabilityRequests.length}`);
    
    if (availabilityRequests.length > 0) {
      console.log('Sample populated result:');
      console.log(JSON.stringify(availabilityRequests[0], null, 2));
    }

  } catch (error) {
    console.error('Error testing admin API:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAdminAPI();

const mongoose = require('mongoose');
const LabourAvailability = require('../models/labourAvailabilityModel');
const Skill = require('../models/skillModel');
const User = require('../models/userModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/labour-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

async function verifyData() {
  try {
    console.log('=== Verifying Data ===');
    
    // Check skills
    const skills = await Skill.find({ isActive: true });
    console.log(`Found ${skills.length} skills:`, skills.map(s => s.name));
    
    // Check users
    const users = await User.find({ role: 'labour' });
    console.log(`Found ${users.length} labour users:`, users.map(u => `${u.firstName} ${u.lastName}`));
    
    // Check availability requests
    const availabilityRequests = await LabourAvailability.find({ status: 'active' });
    console.log(`Found ${availabilityRequests.length} availability requests`);
    
    if (availabilityRequests.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log('Today:', today.toISOString());
      
      const futureRequests = availabilityRequests.filter(req => req.availabilityDate >= today);
      console.log(`Found ${futureRequests.length} future availability requests`);
      
      if (futureRequests.length > 0) {
        console.log('Sample future request:', {
          id: futureRequests[0]._id,
          labour: futureRequests[0].labour,
          availabilityDate: futureRequests[0].availabilityDate,
          skills: futureRequests[0].skills,
          status: futureRequests[0].status
        });
        
        // Test the exact query that the API uses
        const skillNames = ['electrician', 'plumber', 'carpenter'];
        const skillObjects = await Skill.find({ 
          name: { $in: skillNames }, 
          isActive: true 
        });
        console.log('Skills for query:', skillObjects.map(s => ({ name: s.name, id: s._id })));
        
        const skillIds = skillObjects.map(skill => skill._id);
        const query = {
          status: 'active',
          availabilityDate: { $gte: today },
          skills: { $in: skillIds }
        };
        console.log('Query:', JSON.stringify(query, null, 2));
        
        const results = await LabourAvailability.find(query);
        console.log(`Query results: ${results.length} matches`);
      }
    }
    
  } catch (error) {
    console.error('Error verifying data:', error);
  } finally {
    mongoose.connection.close();
  }
}

verifyData();

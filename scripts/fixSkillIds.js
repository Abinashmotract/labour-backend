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

async function fixSkillIds() {
  try {
    console.log('=== Fixing Skill IDs ===');
    
    // Get the skills that the API is finding
    const apiSkills = await Skill.find({ 
      name: { $in: ['electrician', 'plumber', 'carpenter'] }, 
      isActive: true 
    });
    console.log('API Skills:', apiSkills.map(s => ({ name: s.name, id: s._id })));
    
    // Get all availability requests
    const availabilityRequests = await LabourAvailability.find({ status: 'active' });
    console.log(`Found ${availabilityRequests.length} availability requests`);
    
    // Update each availability request to use the correct skill IDs
    for (const request of availabilityRequests) {
      const newSkills = [];
      
      // Find the corresponding skill IDs from the API skills
      for (const skillId of request.skills) {
        const oldSkill = await Skill.findById(skillId);
        if (oldSkill) {
          const newSkill = apiSkills.find(s => s.name === oldSkill.name);
          if (newSkill) {
            newSkills.push(newSkill._id);
          }
        }
      }
      
      if (newSkills.length > 0) {
        request.skills = newSkills;
        await request.save();
        console.log(`Updated request ${request._id} with skills:`, newSkills);
      }
    }
    
    // Also update the user skills
    const users = await User.find({ role: 'labour' });
    for (const user of users) {
      const newSkills = [];
      
      for (const skillId of user.skills) {
        const oldSkill = await Skill.findById(skillId);
        if (oldSkill) {
          const newSkill = apiSkills.find(s => s.name === oldSkill.name);
          if (newSkill) {
            newSkills.push(newSkill._id);
          }
        }
      }
      
      if (newSkills.length > 0) {
        user.skills = newSkills;
        await user.save();
        console.log(`Updated user ${user.firstName} with skills:`, newSkills);
      }
    }
    
    console.log('Skill IDs fixed successfully!');
    
    // Verify the fix
    const testQuery = {
      status: 'active',
      availabilityDate: { $gte: new Date() },
      skills: { $in: apiSkills.map(s => s._id) }
    };
    
    const results = await LabourAvailability.find(testQuery);
    console.log(`Test query now returns ${results.length} results`);
    
  } catch (error) {
    console.error('Error fixing skill IDs:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixSkillIds();

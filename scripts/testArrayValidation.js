const mongoose = require('mongoose');
const LabourAvailability = require('../models/labourAvailabilityModel');
const User = require('../models/userModel');
const Skill = require('../models/skillModel');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/labour-backend', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import the controller function directly
const { submitAvailabilityRequest } = require('../controllers/labourAvailabilityController');

async function testArrayValidation() {
  try {
    console.log('Testing Array Validation Logic...');
    
    // Create mock request and response objects
    const mockReq = {
      body: {
        availabilityDate: '2024-01-20' // This should fail - not an array
      },
      user: {
        id: '507f1f77bcf86cd799439011' // Mock user ID
      }
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log('Response Status:', code);
          console.log('Response Data:', JSON.stringify(data, null, 2));
          return mockRes;
        }
      })
    };
    
    console.log('\n=== Test 1: Single Date as String (Should Fail) ===');
    await submitAvailabilityRequest(mockReq, mockRes);
    
    // Test with array format
    mockReq.body.availabilityDate = ['2024-01-20'];
    
    console.log('\n=== Test 2: Single Date in Array (Should Work) ===');
    await submitAvailabilityRequest(mockReq, mockRes);
    
    // Test with multiple dates
    mockReq.body.availabilityDate = ['2024-01-20', '2024-01-21', '2024-01-22'];
    
    console.log('\n=== Test 3: Multiple Dates in Array (Should Work) ===');
    await submitAvailabilityRequest(mockReq, mockRes);
    
    console.log('\n✅ Array validation testing completed!');
    
  } catch (error) {
    console.error('Error testing array validation:', error);
  } finally {
    mongoose.connection.close();
  }
}

testArrayValidation();

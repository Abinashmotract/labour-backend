const mongoose = require('mongoose');
const LabourAvailability = require('../models/labourAvailabilityModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/labour-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateTestDataDates() {
  try {
    console.log('Updating test data dates to future dates...');

    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create future dates
    const futureDates = [
      new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    ];

    // Get all availability requests
    const requests = await LabourAvailability.find({ status: 'active' });
    console.log(`Found ${requests.length} availability requests to update`);

    // Update each request with a random future date
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      const randomDate = futureDates[i % futureDates.length];
      request.availabilityDate = randomDate;
      await request.save();
      console.log(`Updated request ${i + 1} to ${randomDate.toDateString()}`);
    }

    console.log('Test data dates updated successfully!');

  } catch (error) {
    console.error('Error updating test data dates:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateTestDataDates();

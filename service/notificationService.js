const admin = require('../utils/firebase');
const User = require('../models/userModel');

// Send notification to all labours
const sendJobNotificationToAllLabours = async (jobData) => {
  try {
    console.log('Sending job notification to all labours...');
    
    // Get all labour users with FCM tokens
    const labours = await User.find({ 
      role: 'labour', 
      fcmToken: { $exists: true, $ne: null } 
    }).select('fcmToken firstName');
    
    if (labours.length === 0) {
      console.log('No labours with FCM tokens found');
      return;
    }

    const fcmTokens = labours.map(labour => labour.fcmToken).filter(token => token);
    
    if (fcmTokens.length === 0) {
      console.log('No valid FCM tokens found');
      return;
    }

    const message = {
      notification: {
        title: 'Nayi Job Available! 🛠️',
        body: `${jobData.title} - ${jobData.location.address || jobData.jobTiming}`,
      },
      data: {
        jobId: jobData._id.toString(),
        type: 'NEW_JOB_POST',
        title: jobData.title,
        description: jobData.description,
        contractorId: jobData.contractor.toString()
      },
      tokens: fcmTokens, // Send to multiple tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Notification sent successfully to ${response.successCount} labours`);
    
    if (response.failureCount > 0) {
      console.log(`Failed to send to ${response.failureCount} labours`);
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.log(`Failed for token: ${fcmTokens[idx]}, error: ${resp.error}`);
        }
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Send notification to nearby labours based on location
const sendJobNotificationToNearbyLabours = async (jobData, maxDistance = 50000) => {
  try {
    console.log('Sending job notification to nearby labours...');
    
    if (!jobData.location || !jobData.location.coordinates) {
      console.log('Job location data missing');
      return;
    }

    const [longitude, latitude] = jobData.location.coordinates;
    
    // Find labours within specified distance
    const nearbyLabours = await User.find({
      role: 'labour',
      fcmToken: { $exists: true, $ne: null },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance
        }
      }
    }).select('fcmToken firstName');

    if (nearbyLabours.length === 0) {
      console.log('No nearby labours with FCM tokens found');
      return;
    }

    const fcmTokens = nearbyLabours.map(labour => labour.fcmToken).filter(token => token);
    
    const message = {
      notification: {
        title: 'Paas Mein Nayi Job! 📍',
        body: `${jobData.title} - ${jobData.location.address || 'Aapke area mein'}`,
      },
      data: {
        jobId: jobData._id.toString(),
        type: 'NEARBY_JOB_POST',
        title: jobData.title,
        location: jobData.location.address || '',
        distance: 'Near you'
      },
      tokens: fcmTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Notification sent successfully to ${response.successCount} nearby labours`);
    
    return response;
  } catch (error) {
    console.error('Error sending notification to nearby labours:', error);
    throw error;
  }
};

module.exports = {
  sendJobNotificationToAllLabours,
  sendJobNotificationToNearbyLabours
};
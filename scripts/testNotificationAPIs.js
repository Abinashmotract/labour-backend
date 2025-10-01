require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const { sendAndSaveNotification } = require('../controllers/notificationController');

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

async function testNotificationCreation() {
  console.log('🔧 Testing notification creation...');
  
  try {
    // Get a test user
    const testUser = await User.findOne({ role: 'labour' });
    if (!testUser) {
      console.log('❌ No labour user found for testing');
      return false;
    }
    
    console.log(`📱 Testing with user: ${testUser.firstName || 'Test User'}`);
    
    // Create a test notification
    const notification = await sendAndSaveNotification(testUser._id, {
      title: 'Test Notification 🧪',
      body: 'This is a test notification for API testing',
      type: 'SYSTEM',
      data: {
        testId: 'test-123',
        message: 'Testing notification system'
      }
    });
    
    console.log('✅ Notification created successfully');
    console.log('  - ID:', notification._id);
    console.log('  - Title:', notification.title);
    console.log('  - Type:', notification.type);
    console.log('  - Recipient:', notification.recipient);
    
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error.message);
    return null;
  }
}

async function testNotificationQueries() {
  console.log('\n🔧 Testing notification queries...');
  
  try {
    // Get a test user
    const testUser = await User.findOne({ role: 'labour' });
    if (!testUser) {
      console.log('❌ No labour user found for testing');
      return false;
    }
    
    // Test getAllNotifications query
    const notifications = await Notification.find({
      recipient: testUser._id,
      isDeleted: false
    })
    .populate('sender', 'firstName lastName')
    .populate('job', 'title')
    .sort({ createdAt: -1 })
    .limit(10);
    
    console.log(`📊 Found ${notifications.length} notifications for user`);
    
    // Test unread count
    const unreadCount = await Notification.countDocuments({
      recipient: testUser._id,
      isDeleted: false,
      isRead: false
    });
    
    console.log(`📈 Unread notifications: ${unreadCount}`);
    
    // Test by type
    const byType = await Notification.aggregate([
      {
        $match: {
          recipient: testUser._id,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('📋 Notifications by type:');
    byType.forEach(item => {
      console.log(`  - ${item._id}: ${item.count}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error testing notification queries:', error.message);
    return false;
  }
}

async function testNotificationOperations() {
  console.log('\n🔧 Testing notification operations...');
  
  try {
    // Get a test user
    const testUser = await User.findOne({ role: 'labour' });
    if (!testUser) {
      console.log('❌ No labour user found for testing');
      return false;
    }
    
    // Get a notification to test with
    const notification = await Notification.findOne({
      recipient: testUser._id,
      isDeleted: false
    });
    
    if (!notification) {
      console.log('❌ No notifications found for testing');
      return false;
    }
    
    console.log(`📱 Testing with notification: ${notification.title}`);
    
    // Test mark as read
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
      console.log('✅ Marked notification as read');
    }
    
    // Test soft delete
    notification.isDeleted = true;
    await notification.save();
    console.log('✅ Soft deleted notification');
    
    // Restore for further testing
    notification.isDeleted = false;
    await notification.save();
    console.log('✅ Restored notification');
    
    return true;
  } catch (error) {
    console.error('❌ Error testing notification operations:', error.message);
    return false;
  }
}

async function createSampleNotifications() {
  console.log('\n🔧 Creating sample notifications...');
  
  try {
    // Get test users
    const labourUsers = await User.find({ role: 'labour' }).limit(3);
    const contractorUsers = await User.find({ role: 'contractor' }).limit(2);
    
    if (labourUsers.length === 0) {
      console.log('❌ No labour users found');
      return false;
    }
    
    // Create various types of notifications
    const notificationTypes = [
      {
        title: 'New Job Posted! 🛠️',
        body: 'A new plumbing job is available in your area',
        type: 'JOB_POST'
      },
      {
        title: 'Job Application Accepted ✅',
        body: 'Your application for the electrical job has been accepted',
        type: 'JOB_ACCEPTED'
      },
      {
        title: 'Payment Received 💰',
        body: 'Payment of ₹1500 has been credited to your account',
        type: 'PAYMENT'
      },
      {
        title: 'Job Completed 🎉',
        body: 'Great work! The water tank cleaning job has been completed',
        type: 'JOB_COMPLETED'
      },
      {
        title: 'System Update 📱',
        body: 'New features have been added to the app',
        type: 'SYSTEM'
      }
    ];
    
    let createdCount = 0;
    
    for (const labour of labourUsers) {
      for (const notifType of notificationTypes) {
        try {
          await sendAndSaveNotification(labour._id, {
            ...notifType,
            data: {
              testData: true,
              createdAt: new Date().toISOString()
            }
          });
          createdCount++;
        } catch (error) {
          console.log(`⚠️  Failed to create notification for ${labour.firstName}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Created ${createdCount} sample notifications`);
    return true;
  } catch (error) {
    console.error('❌ Error creating sample notifications:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Notification APIs\n');
  
  const dbConnected = await connectToDatabase();
  if (!dbConnected) {
    console.log('❌ Cannot proceed without database connection');
    return;
  }
  
  // Test notification creation
  const notification = await testNotificationCreation();
  
  // Test notification queries
  await testNotificationQueries();
  
  // Test notification operations
  await testNotificationOperations();
  
  // Create sample notifications
  await createSampleNotifications();
  
  console.log('\n🎉 Notification API testing completed!');
  console.log('\n📝 API Endpoints available:');
  console.log('  GET    /api/notifications - Get all notifications');
  console.log('  GET    /api/notifications/stats - Get notification statistics');
  console.log('  GET    /api/notifications/:id - Get notification by ID');
  console.log('  PATCH  /api/notifications/:id/read - Mark as read');
  console.log('  PATCH  /api/notifications/read-all - Mark all as read');
  console.log('  DELETE /api/notifications/:id - Delete notification');
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

main().catch(console.error);

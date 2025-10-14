const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const JobPost = require('../models/jobPostModel');
const JobApplication = require('../models/jobApplicationModel');

// Get all notifications for a user (labour or contractor)
const getAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, isRead } = req.query;
    
    // Build filter query
    const filter = {
      recipient: userId,
      isDeleted: false
    };
    
    if (type) {
      filter.type = type;
    }
    
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get notifications with pagination
    const notifications = await Notification.find(filter)
      .populate('sender', 'firstName lastName profilePicture')
      .populate('job', 'title location')
      .populate('jobApplication', 'status coverLetter')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalCount = await Notification.countDocuments(filter);
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isDeleted: false,
      isRead: false
    });
    
    return res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: skip + notifications.length < totalCount,
          hasPrev: parseInt(page) > 1
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'आंतरिक सर्वर त्रुटि'
    });
  }
};

// Get notification by ID
const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOne({
      _id: id,
      recipient: userId,
      isDeleted: false
    })
    .populate('sender', 'firstName lastName profilePicture')
    .populate('job', 'title description location jobTiming')
    .populate('jobApplication', 'status coverLetter');
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'सूचना नहीं मिली'
      });
    }
    
    // Mark as read if not already read
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }
    
    return res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error getting notification by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'आंतरिक सर्वर त्रुटि'
    });
  }
};

// Delete notification by ID
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOne({
      _id: id,
      recipient: userId,
      isDeleted: false
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'सूचना नहीं मिली'
      });
    }
    
    // Soft delete
    notification.isDeleted = true;
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'सूचना सफलतापूर्वक हटाई गई'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'आंतरिक सर्वर त्रुटि'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOne({
      _id: id,
      recipient: userId,
      isDeleted: false
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'सूचना नहीं मिली'
      });
    }
    
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }
    
    return res.status(200).json({
      success: true,
      message: 'सूचना पढ़ा गया के रूप में चिह्नित'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'आंतरिक सर्वर त्रुटि'
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Notification.updateMany(
      {
        recipient: userId,
        isDeleted: false,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'सभी सूचनाएं पढ़ा गया के रूप में चिह्नित'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'आंतरिक सर्वर त्रुटि'
    });
  }
};

// Get notification statistics
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await Notification.aggregate([
      {
        $match: {
          recipient: userId,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          },
          byType: {
            $push: {
              type: '$type',
              isRead: '$isRead'
            }
          }
        }
      }
    ]);
    
    if (stats.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          total: 0,
          unread: 0,
          byType: {}
        }
      });
    }
    
    // Process type statistics
    const byType = {};
    stats[0].byType.forEach(item => {
      if (!byType[item.type]) {
        byType[item.type] = { total: 0, unread: 0 };
      }
      byType[item.type].total++;
      if (!item.isRead) {
        byType[item.type].unread++;
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        total: stats[0].total,
        unread: stats[0].unread,
        byType
      }
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return res.status(500).json({
      success: false,
      message: 'आंतरिक सर्वर त्रुटि'
    });
  }
};

// Create notification (internal function)
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Send FCM notification and save to database
const sendAndSaveNotification = async (recipientId, notificationData, fcmToken = null) => {
  try {
    // Get recipient's FCM token if not provided
    if (!fcmToken) {
      const recipient = await User.findById(recipientId).select('fcmToken');
      fcmToken = recipient?.fcmToken;
    }
    
    // Create notification in database
    const notification = await createNotification({
      ...notificationData,
      recipient: recipientId,
      fcmToken
    });
    
    // Send FCM notification if token exists
    if (fcmToken) {
      try {
        const admin = require('../utils/firebase');
        const message = {
          token: fcmToken,
          notification: {
            title: notificationData.title,
            body: notificationData.body
          },
          data: {
            notificationId: notification._id.toString(),
            type: notificationData.type,
            ...notificationData.data
          }
        };
        
        const response = await admin.messaging().send(message);
        notification.responseId = response;
        notification.sentAt = new Date();
        await notification.save();
      } catch (fcmError) {
        console.error('FCM send error:', fcmError);
        // Don't fail the whole operation if FCM fails
      }
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending and saving notification:', error);
    throw error;
  }
};

module.exports = {
  getAllNotifications,
  getNotificationById,
  deleteNotification,
  markAsRead,
  markAllAsRead,
  getNotificationStats,
  createNotification,
  sendAndSaveNotification
};

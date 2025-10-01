const express = require('express');
const router = express.Router();
const {
  getAllNotifications,
  getNotificationById,
  deleteNotification,
  markAsRead,
  markAllAsRead,
  getNotificationStats
} = require('../controllers/notificationController');
const { verifyUser } = require('../middleware/verifyToken');

// Apply authentication middleware to all routes
router.use(verifyUser);

// Get all notifications for the authenticated user
router.get('/', getAllNotifications);

// Get notification statistics
router.get('/stats', getNotificationStats);

// Get notification by ID
router.get('/:id', getNotificationById);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete notification by ID
router.delete('/:id', deleteNotification);

module.exports = router;

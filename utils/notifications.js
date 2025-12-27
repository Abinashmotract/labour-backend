// utils/notifications.js
const admin = require("./firebase");

/**
 * Send FCM notification
 * @param {string} token - Firebase device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} imageUrl - Optional image URL for notification
 */
const sendNotification = async (token, title, body, imageUrl = null) => {
  if (!token) return;
  const message = {
    token,
    notification: { 
      title, 
      body,
      ...(imageUrl && { image: imageUrl })
    },
  };
  try {
    await admin.messaging().send(message);
  } catch (err) {
    console.error("Error sending notification:", err);
  }
};

module.exports = { sendNotification };

// utils/notifications.js
const admin = require("./firebase");

/**
 * Send FCM notification
 * @param {string} token - Firebase device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
const sendNotification = async (token, title, body) => {
  if (!token) return;
  const message = {
    token,
    notification: { title, body },
  };
  try {
    await admin.messaging().send(message);
  } catch (err) {
    console.error("Error sending notification:", err);
  }
};

module.exports = { sendNotification };

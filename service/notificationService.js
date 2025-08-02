const admin = require("../config/firebaseConfig");
const Notification = require("../models/notificationModel");

  const sendNotification = async (deviceToken, title, body, userId = null) => {
    const message = {
      notification: {
        title,
        body,
      },
      token: deviceToken,
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
            badge: 1,
          },
        },
        headers: {
          'apns-priority': '10',
        },
      },
    };
    try {
      const response = await admin.messaging().send(message);
      console.log("Notification sent successfully:", response);

      const savedNotification = await Notification.create({
        title,
        body,
        token: deviceToken,
        user: userId,
        responseId: response,
      });

      return savedNotification;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  };

module.exports = { sendNotification };

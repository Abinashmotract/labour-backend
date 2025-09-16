// // cron.js
// const cron = require("node-cron");
// const { sendJobNotifications } = require("./controllers/jobApplicationController");

// // Run daily at 8 AM
// cron.schedule("0 8 * * *", async () => {
//   console.log("Running daily FCM notification job...");
//   await sendJobNotifications({ user: { id: "adminId" } }, { status: () => {}, json: console.log });
// });

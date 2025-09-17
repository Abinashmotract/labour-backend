const cron = require("node-cron");
const JobApplication = require("../models/jobApplicationModel");
const JobPost = require("../models/jobPostModel");
const User = require("../models/userModel");
const { sendNotification } = require("../utils/notifications");

// Runs every day at 8:00 AM
cron.schedule("0 8 * * *", async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

    const applications = await JobApplication.find({
      status: "accepted",
      notificationsSent: true, // Already accepted
    }).populate("job labour");

    for (let app of applications) {
      const jobDate = new Date(app.job.jobTiming);
      if (jobDate >= tomorrow && jobDate < dayAfterTomorrow) {
        const labour = app.labour;
        const contractor = await User.findById(app.job.contractor);

        if (labour.fcmToken) {
          await sendNotification(
            labour.fcmToken,
            "Job Reminder",
            `Reminder: You have a job "${app.job.title}" tomorrow (${jobDate.toDateString()}).`
          );
        }

        if (contractor.fcmToken) {
          await sendNotification(
            contractor.fcmToken,
            "Labour Reminder",
            `Reminder: Labour ${labour.firstName} ${labour.lastName} will work on "${app.job.title}" tomorrow (${jobDate.toDateString()}).`
          );
        }
      }
    }
    console.log("Job reminders sent successfully!");
  } catch (err) {
    console.error("Error sending job reminders:", err);
  }
});

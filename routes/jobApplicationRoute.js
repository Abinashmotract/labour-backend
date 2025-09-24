const express = require("express");
const router = express.Router();
const { verifyAllToken } = require("../middleware/verifyToken");
const {
  applyJob,
  myApplications,
  getJobApplicationsForContractor,
  updateApplicationStatus,
  getJobLabourStats,
  getContractorJobStats,
  // sendJobNotifications
} = require("../controllers/jobApplicationController");

// Labour applies for a job
router.post("/apply/:jobId", verifyAllToken(["labour"]), applyJob);

// Get logged-in labour applications
router.get("/my-applications", verifyAllToken(["labour"]), myApplications);
// router.get("/send-job-notifications", verifyAllToken(["admin"]), sendJobNotifications);

// Contractor Routes
router.get("/contractor/applications", verifyAllToken(["contractor"]), getJobApplicationsForContractor);
router.patch("/contractor/application/:applicationId", verifyAllToken(["contractor"]), updateApplicationStatus);
router.get("/contractor/job-stats/:jobId", verifyAllToken(["contractor"]), getJobLabourStats);
router.get("/contractor/dashboard-stats", verifyAllToken(["contractor"]), getContractorJobStats);

module.exports = router;
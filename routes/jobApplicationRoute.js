const express = require("express");
const router = express.Router();
const { verifyAllToken } = require("../middleware/verifyToken");
const {
  applyJob,
  myApplications,
  getJobApplicationsForContractor,
  updateApplicationStatus,
  getJobLabourStats
} = require("../controllers/jobApplicationController");

// Labour applies for a job
router.post("/apply/:jobId", verifyAllToken(["labour"]), applyJob);

// Get logged-in labour applications
router.get("/my-applications", verifyAllToken(["labour"]), myApplications);

// Contractor Routes
router.get("/contractor/applications", verifyAllToken(["contractor"]), getJobApplicationsForContractor);
router.patch("/contractor/application/:applicationId", verifyAllToken(["contractor"]), updateApplicationStatus);
router.get("/contractor/job-stats/:jobId", verifyAllToken(["contractor"]), getJobLabourStats);

module.exports = router;